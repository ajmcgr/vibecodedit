import { supabase } from '@/integrations/supabase/client';

const sb: any = supabase;

export const SUBMISSIONS_BUCKET = 'vibecodedit-uploads';

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

export const FIELD_LIMITS = {
  app_name: 80,
  website_url: 300,
  description: 500,
  founder_name: 80,
  founder_username: 40,
  founder_email: 160,
} as const;

export interface SubmissionInput {
  app_name: string;
  website_url: string;
  description: string;
  category: string;
  founder_name: string;
  founder_email: string;
  founder_username?: string;
}

export interface PublicSubmission {
  id: string;
  app_name: string;
  website_url: string;
  description: string;
  category: string;
  founder_name: string;
  founder_username: string | null;
  screenshot_url: string;
  logo_url: string | null;
  created_at: string;
  launch_product_id: string | null;
  promoted_to_launch: boolean;
}

/* ------------------------------------------------------------------ *
 * Validation
 * ------------------------------------------------------------------ */

const EMAIL_RE = /^[^@\s]+@[^@\s.]+\.[^@\s]+$/;
const SCRIPT_RE = /(<\s*script|javascript:|data:text\/html|on\w+\s*=)/i;
const SPAM_RE =
  /(viagra|casino|porn|crypto\s*giveaway|free\s*money|seo\s*backlinks?|escort|loan\s*approval|\b(bit\.ly|tinyurl\.com|t\.co)\b)/i;

/** Normalises a URL for duplicate comparison. */
export const normalizeUrl = (url: string) => url.trim().replace(/\/+$/, '').toLowerCase();

const isSafeUrl = (raw: string) => {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase();
    if (!host.includes('.') || host.endsWith('.')) return false;
    // block local / internal targets
    if (
      host === 'localhost' ||
      host.endsWith('.local') ||
      /^\d{1,3}(\.\d{1,3}){3}$/.test(host) ||
      host.startsWith('[')
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

export type FieldErrors = Partial<Record<keyof SubmissionInput | 'screenshot' | 'logo' | 'form', string>>;

export const validateSubmission = (
  input: SubmissionInput,
  files: { screenshot: File | null; logo: File | null }
): FieldErrors => {
  const errors: FieldErrors = {};
  const text = (v: string) => (v ?? '').trim();

  const name = text(input.app_name);
  if (name.length < 2) errors.app_name = 'App name must be at least 2 characters.';
  else if (name.length > FIELD_LIMITS.app_name) errors.app_name = `Keep the app name under ${FIELD_LIMITS.app_name} characters.`;
  else if (SCRIPT_RE.test(name) || SPAM_RE.test(name)) errors.app_name = 'That app name isn\u2019t allowed.';

  const url = text(input.website_url);
  if (!url) errors.website_url = 'A website URL is required.';
  else if (url.length > FIELD_LIMITS.website_url) errors.website_url = 'That URL is too long.';
  else if (!isSafeUrl(url)) errors.website_url = 'Enter a valid public http(s) URL.';

  const description = text(input.description);
  if (description.length < 20) errors.description = 'Give us at least 20 characters.';
  else if (description.length > FIELD_LIMITS.description) errors.description = `Keep it under ${FIELD_LIMITS.description} characters.`;
  else if (SCRIPT_RE.test(description) || SPAM_RE.test(description)) errors.description = 'That description looks like spam.';

  if (!text(input.category)) errors.category = 'Pick a category.';

  const founder = text(input.founder_name);
  if (founder.length < 2) errors.founder_name = 'Your name is required.';
  else if (founder.length > FIELD_LIMITS.founder_name) errors.founder_name = 'That name is too long.';
  else if (SCRIPT_RE.test(founder)) errors.founder_name = 'That name isn\u2019t allowed.';

  const email = text(input.founder_email);
  if (!EMAIL_RE.test(email) || email.length > FIELD_LIMITS.founder_email) {
    errors.founder_email = 'Enter a valid email address.';
  }

  const username = text(input.founder_username ?? '');
  if (username && !/^[a-zA-Z0-9_.-]{2,40}$/.test(username)) {
    errors.founder_username = 'Letters, numbers, dots, dashes and underscores only.';
  }

  if (!files.screenshot) errors.screenshot = 'A screenshot is required.';
  else if (!ACCEPTED_IMAGE_TYPES.includes(files.screenshot.type)) errors.screenshot = 'Use a PNG, JPG, WEBP or GIF.';
  else if (files.screenshot.size > MAX_UPLOAD_BYTES) errors.screenshot = 'Screenshots must be under 5MB.';

  if (files.logo) {
    if (!ACCEPTED_IMAGE_TYPES.includes(files.logo.type)) errors.logo = 'Use a PNG, JPG, WEBP or GIF.';
    else if (files.logo.size > MAX_UPLOAD_BYTES) errors.logo = 'Logos must be under 5MB.';
  }

  return errors;
};

/* ------------------------------------------------------------------ *
 * Duplicate checks
 * ------------------------------------------------------------------ */

export const findDuplicate = async (appName: string, websiteUrl: string) => {
  const { data } = await sb
    .from('vibecodedit_submissions_public')
    .select('id, app_name, website_url')
    .limit(2000);

  const rows: PublicSubmission[] = data ?? [];
  const url = normalizeUrl(websiteUrl);
  const name = appName.trim().toLowerCase();

  if (rows.some((r) => normalizeUrl(r.website_url) === url)) {
    return 'That website has already been added to Vibe Coded It.';
  }
  if (rows.some((r) => r.app_name.trim().toLowerCase() === name)) {
    return 'An app with that name is already on Vibe Coded It.';
  }
  return null;
};

/* ------------------------------------------------------------------ *
 * Uploads + insert
 * ------------------------------------------------------------------ */

const slugify = (v: string) =>
  v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40) || 'app';

const uploadImage = async (file: File, appName: string, kind: 'screenshot' | 'logo') => {
  const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${slugify(appName)}/${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from(SUBMISSIONS_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  const { data } = supabase.storage.from(SUBMISSIONS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
};

export const createSubmission = async (
  input: SubmissionInput,
  files: { screenshot: File; logo: File | null }
) => {
  const [screenshot_url, logo_url] = await Promise.all([
    uploadImage(files.screenshot, input.app_name, 'screenshot'),
    files.logo ? uploadImage(files.logo, input.app_name, 'logo') : Promise.resolve(null),
  ]);

  const payload = {
    app_name: input.app_name.trim(),
    website_url: input.website_url.trim(),
    description: input.description.trim(),
    category: input.category.trim(),
    founder_name: input.founder_name.trim(),
    founder_email: input.founder_email.trim().toLowerCase(),
    founder_username: input.founder_username?.trim() || null,
    screenshot_url,
    logo_url,
  };

  const { error } = await sb.from('vibecodedit_submissions').insert(payload);
  if (error) {
    if (error.code === '23505' || error.code === '23514' || /duplicate/i.test(error.message)) {
      throw new Error('That app or website is already on Vibe Coded It.');
    }
    throw new Error(error.message);
  }

  return payload;
};

/** Prefilled Launch submission URL, preserving campaign attribution. */
export const launchSubmitUrl = (input?: Partial<SubmissionInput>) => {
  const params = new URLSearchParams({ campaign: 'vibe_code_your_future', source: 'vibecodedit' });
  if (input?.app_name) params.set('name', input.app_name);
  if (input?.website_url) params.set('website', input.website_url);
  if (input?.description) params.set('tagline', input.description);
  if (input?.category) params.set('category', input.category);
  return `https://trylaunch.ai/submit?${params.toString()}`;
};

/** Fire-and-forget Beehiiv newsletter enrollment for a submitter. */
export const subscribeSubmitterToNewsletter = async (input: SubmissionInput) => {
  try {
    await supabase.functions.invoke('subscribe-to-newsletter', {
      body: {
        email: input.founder_email.trim().toLowerCase(),
        source: 'vibecodedit_submit',
        tags: ['vibecodedit', 'submitter'],
      },
    });
  } catch (err) {
    console.error('Newsletter enrollment failed', err);
  }
};

/** Fire-and-forget confirmation email for a new submission. */
export const sendSubmissionEmail = async (input: SubmissionInput) => {
  try {
    await supabase.functions.invoke('send-submission-email', {
      body: {
        founder_email: input.founder_email.trim().toLowerCase(),
        founder_name: input.founder_name.trim(),
        app_name: input.app_name.trim(),
        website_url: input.website_url.trim(),
        description: input.description.trim(),
        category: input.category.trim(),
      },
    });
  } catch (err) {
    console.error('Confirmation email failed', err);
  }
};
