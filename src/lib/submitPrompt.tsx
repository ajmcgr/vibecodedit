import { toast } from 'sonner';
import { CAMPAIGN_SLUG, setCampaignIntent, trackCampaignEvent } from '@/lib/campaign';

const LAUNCH_SUBMIT_URL = `https://trylaunch.ai/submit?campaign=${CAMPAIGN_SLUG}&source=vibecodedit`;

/**
 * Every "Submit Your App" CTA opens this choice toast: full Launch listing, or
 * the quick Vibe Coded It tile form at /submit.
 */
export const promptSubmitChoice = (goToQuickForm: () => void) => {
  trackCampaignEvent('campaign_cta_clicked');

  toast.custom(
    (id) => (
      <div className="w-[340px] max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-background p-4 shadow-lg">
        <p className="text-sm font-semibold text-foreground">How do you want to add your app?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          List it on Launch for the full launch experience, or add a quick tile that appears on Vibe
          Coded It right away.
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <button
            type="button"
            className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            onClick={() => {
              setCampaignIntent(CAMPAIGN_SLUG);
              window.open(LAUNCH_SUBMIT_URL, '_blank', 'noopener,noreferrer');
              toast.dismiss(id);
            }}
          >
            Submit on Launch
          </button>
          <button
            type="button"
            className="h-9 rounded-md border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            onClick={() => {
              goToQuickForm();
              toast.dismiss(id);
            }}
          >
            Add a tile on Vibe Coded It
          </button>
        </div>
      </div>
    ),
    { duration: 15000 }
  );
};
