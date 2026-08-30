/**
 * Manual media overrides for submissions whose stored assets need replacing.
 * Keyed by submission id -> { screenshotUrl?, iconUrl? }.
 */
export const SUBMISSION_MEDIA_OVERRIDES: Record<
  string,
  { screenshotUrl?: string; iconUrl?: string }
> = {
  // Morph Systems
  '3793ef31-7927-4494-9ef1-dad3feff856a': {
    screenshotUrl:
      'https://gzpypxgdkxdynovploxn.supabase.co/storage/v1/object/public/vibecodedit-uploads/morph-systems/screenshot-1788051670-new.png',
  },
};
