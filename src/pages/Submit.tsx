import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, Loader2, Rocket } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import CampaignHeader from '@/components/campaign/CampaignHeader';
import CampaignSideNav from '@/components/campaign/CampaignSideNav';
import { supabase } from '@/integrations/supabase/client';
import { CAMPAIGN_ORIGIN } from '@/lib/campaignHost';
import { trackCampaignEvent } from '@/lib/campaign';
import {
  ACCEPTED_IMAGE_TYPES,
  FIELD_LIMITS,
  createSubmission,
  findDuplicate,
  launchSubmitUrl,
  sendSubmissionEmail,
  validateSubmission,
  type FieldErrors,
  type SubmissionInput,
} from '@/lib/vibecodeditSubmissions';

const FALLBACK_CATEGORIES = [
  'AI', 'Productivity', 'Developer Tools', 'Design', 'Marketing', 'Finance',
  'Education', 'Health', 'Social', 'E-commerce', 'Other',
];

const emptyForm: SubmissionInput = {
  app_name: '',
  website_url: '',
  description: '',
  category: '',
  founder_name: '',
  founder_email: '',
  founder_username: '',
};

const Field = ({
  id, label, error, hint, children,
}: { id: string; label: string; error?: string; hint?: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label htmlFor={id}>{label}</Label>
    {children}
    {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
);

const Submit = () => {
  const [form, setForm] = useState<SubmissionInput>(emptyForm);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<SubmissionInput | null>(null);
  const [categories, setCategories] = useState<string[]>(FALLBACK_CATEGORIES);

  const pageUrl = `${CAMPAIGN_ORIGIN}/submit`;

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('product_categories').select('name').order('name');
      const names = (data as any[] | null)?.map((c) => c.name).filter(Boolean) ?? [];
      if (names.length) setCategories(names);
    })();
  }, []);

  const set = (key: keyof SubmissionInput) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const accept = useMemo(() => ACCEPTED_IMAGE_TYPES.join(','), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateSubmission(form, { screenshot, logo }, consent);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      const duplicate = await findDuplicate(form.app_name, form.website_url);
      if (duplicate) {
        setErrors({ website_url: duplicate });
        return;
      }
      await createSubmission(form, { screenshot: screenshot as File, logo });
      void sendSubmissionEmail(form);
      trackCampaignEvent('campaign_submission_completed');
      setDone(form);
      window.scrollTo(0, 0);
    } catch (err: any) {
      setErrors({ form: err?.message || 'Something went wrong. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Submit Your App — Vibe Coded It</title>
        <meta
          name="description"
          content="Add your vibe coded app to Vibe Coded It in under a minute. It goes live on the wall instantly — no account needed."
        />
        <link rel="canonical" href={pageUrl} />
        <link rel="icon" href="/favicon-vibecodedit.png" type="image/png" />
      </Helmet>

      <CampaignHeader />
      <CampaignSideNav />

      <main className="lg:pl-20">
        <div className="mx-auto w-full max-w-6xl px-4 pt-8 pb-24">
          {done ? (
            <div className="rounded-xl border bg-card p-8 text-center">
              <Rocket className="mx-auto h-10 w-10 text-primary" />
              <h1 className="mt-4 text-2xl font-bold tracking-tight">
                Your app is now live on Vibe Coded It 🚀
              </h1>
              <p className="mt-3 text-muted-foreground">
                Want more founders to discover your startup?
              </p>
              <div className="mt-6 flex flex-col items-center gap-3">
                <Button asChild size="lg" className="gap-2">
                  <a
                    href={launchSubmitUrl(done)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    List it on Launch <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <a href="/" className="text-sm text-muted-foreground hover:text-primary">
                  See it on the wall
                </a>
              </div>
            </div>
          ) : (
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
              <div>
              <h1 className="text-2xl font-bold tracking-tight">Submit Your App</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Add your app to the Vibe Coded It wall. No account needed — it publishes instantly.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
                <Field id="app_name" label="App name" error={errors.app_name}>
                  <Input id="app_name" value={form.app_name} onChange={set('app_name')} maxLength={FIELD_LIMITS.app_name} placeholder="Acme AI" />
                </Field>

                <Field id="website_url" label="Website URL" error={errors.website_url}>
                  <Input id="website_url" type="url" value={form.website_url} onChange={set('website_url')} placeholder="https://acme.ai" />
                </Field>

                <Field
                  id="description"
                  label="Description"
                  error={errors.description}
                  hint={`${form.description.trim().length}/${FIELD_LIMITS.description} characters`}
                >
                  <Textarea id="description" rows={4} value={form.description} onChange={set('description')} maxLength={FIELD_LIMITS.description} placeholder="What does your app do, and who is it for?" />
                </Field>

                <Field id="category" label="Category" error={errors.category}>
                  <select
                    id="category"
                    value={form.category}
                    onChange={set('category')}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Select a category…</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </Field>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field id="founder_name" label="Your name" error={errors.founder_name}>
                    <Input id="founder_name" value={form.founder_name} onChange={set('founder_name')} maxLength={FIELD_LIMITS.founder_name} />
                  </Field>
                  <Field id="founder_email" label="Email" error={errors.founder_email} hint="Never shown publicly.">
                    <Input id="founder_email" type="email" value={form.founder_email} onChange={set('founder_email')} maxLength={FIELD_LIMITS.founder_email} />
                  </Field>
                </div>

                <Field id="founder_username" label="Username (optional)" error={errors.founder_username}>
                  <Input id="founder_username" value={form.founder_username} onChange={set('founder_username')} maxLength={FIELD_LIMITS.founder_username} placeholder="yourhandle" />
                </Field>

                <Field id="screenshot" label="Screenshot" error={errors.screenshot} hint="PNG, JPG, WEBP or GIF. Max 5MB.">
                  <Input
                    id="screenshot"
                    type="file"
                    accept={accept}
                    onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)}
                    className="cursor-pointer file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs"
                  />
                </Field>

                <Field id="logo" label="Logo (optional)" error={errors.logo} hint="Square works best. Max 5MB.">
                  <Input
                    id="logo"
                    type="file"
                    accept={accept}
                    onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
                    className="cursor-pointer file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs"
                  />
                </Field>

                <div className="flex items-start gap-3 rounded-lg bg-muted/30 p-4">
                  <Checkbox
                    id="consent"
                    checked={consent}
                    onCheckedChange={(v) => setConsent(v === true)}
                    className="mt-0.5"
                  />
                  <Label htmlFor="consent" className="text-sm font-normal leading-5 text-muted-foreground">
                    I agree for my app, name, description and uploaded images to appear publicly on
                    Vibe Coded It.
                  </Label>
                </div>
                {errors.consent && <p className="text-xs text-destructive">{errors.consent}</p>}
                {errors.form && <p className="text-sm text-destructive">{errors.form}</p>}

                <Button type="submit" size="lg" className="w-full gap-2" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Submit Your App
                </Button>

              </form>
              </div>

              <aside className="lg:sticky lg:top-24 lg:self-start">
                <div className="rounded-xl border border-border bg-card p-6">
                  <h2 className="text-lg font-semibold text-foreground">Ready for the full launch experience?</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    List on Launch to get upvotes, founder feedback, a public profile, and rankings
                    in front of the world’s largest vibe coding community.
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                    {[
                      'Appear on Launch rankings and newsletters',
                      'Build a founder profile and collect reviews',
                      'Earn a permanent, SEO-friendly product page',
                      'Get in front of thousands of founders',
                    ].map((benefit) => (
                      <li key={benefit} className="flex items-start gap-2">
                        <span className="text-primary">✓</span> {benefit}
                      </li>
                    ))}
                  </ul>
                  <Button asChild size="lg" className="mt-6 h-12 w-full gap-2 text-base">
                    <a href={launchSubmitUrl()} target="_blank" rel="noopener noreferrer">
                      List it on Launch <ArrowRight className="h-5 w-5" />
                    </a>
                  </Button>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>

      <div className="h-[64px] lg:hidden" aria-hidden />
    </>
  );
};

export default Submit;
