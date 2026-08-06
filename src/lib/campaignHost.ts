/**
 * This project is the standalone Vibe Coded It site.
 * Every host (vibecodedit.com, *.lovable.app, localhost) serves the
 * campaign page at "/" with no redirects.
 */

export const CAMPAIGN_HOSTS = ['vibecodedit.com', 'www.vibecodedit.com'];
export const CAMPAIGN_ORIGIN = 'https://vibecodedit.com';

/** Always true here — this deployment is the campaign site itself. */
export function isCampaignHost(_hostname?: string): boolean {
  return true;
}

