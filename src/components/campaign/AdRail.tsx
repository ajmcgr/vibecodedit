import { useQuery } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';

import defaultProductIcon from '@/assets/default-product-icon.png';
import { supabase } from '@/integrations/supabase/client';
import { trackCampaignEvent } from '@/lib/campaign';

const ADVERTISE_URL = 'https://trylaunch.ai/advertise?source=vibecodedit';

export interface SponsorSlot {
  id: string;
  name: string;
  tagline: string | null;
  href: string;
  iconUrl?: string;
  screenshotUrl?: string;
}

/** Active web sponsorships, resolved against the shared Launch product data. */
const useSponsorSlots = () =>
  useQuery({
    queryKey: ['campaign-sponsor-slots'],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<SponsorSlot[]> => {
      const today = new Date().toISOString().slice(0, 10);

      const { data: slots } = await supabase
        .from('sponsored_products')
        .select('id, product_id, position, start_date, end_date')
        .lte('start_date', today)
        .gte('end_date', today)
        .order('position', { ascending: true })
        .limit(4);

      const ids = ((slots as any[]) || []).map((s) => s.product_id).filter(Boolean);
      if (!ids.length) return [];

      const { data: products } = await supabase
        .from('products')
        .select('id, name, tagline, slug, product_media(url, type)')
        .in('id', ids)
        .eq('status', 'launched');

      const byId = new Map<string, any>(((products as any[]) || []).map((p) => [p.id, p]));

      return ((slots as any[]) || [])
        .map((slot) => byId.get(slot.product_id))
        .filter(Boolean)
        .map((p: any) => ({
          id: p.id,
          name: p.name,
          tagline: p.tagline,
          href: `https://trylaunch.ai/launch/${p.slug}?source=vibecodedit&utm_medium=sponsor`,
          iconUrl: p.product_media?.find((m: any) => m.type === 'icon')?.url,
          screenshotUrl:
            p.product_media?.find((m: any) => m.type === 'screenshot')?.url ||
            p.product_media?.find((m: any) => m.type === 'thumbnail')?.url,
        }));
    },
  });

const open = (href: string, id: string) => {
  trackCampaignEvent('sponsor_slot_clicked', id);
  window.open(href, '_blank', 'noopener,noreferrer');
};

const SponsorCard = ({ slot }: { slot: SponsorSlot }) => (
  <button
    type="button"
    onClick={() => open(slot.href, slot.id)}
    className="w-full rounded-lg bg-muted/30 p-3 text-left transition-colors hover:bg-muted/60"
  >
    {slot.screenshotUrl && (
      <img
        src={slot.screenshotUrl}
        alt={`${slot.name} screenshot`}
        width={180}
        height={101}
        loading="lazy"
        className="mb-2 aspect-video w-full rounded-md object-cover"
      />
    )}
    <div className="flex items-center gap-2">
      <img
        src={slot.iconUrl || defaultProductIcon}
        alt=""
        width={24}
        height={24}
        loading="lazy"
        className="h-6 w-6 shrink-0 rounded"
      />
      <span className="truncate text-sm font-medium text-foreground">{slot.name}</span>
    </div>
    {slot.tagline && (
      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{slot.tagline}</p>
    )}
  </button>
);

const AdvertisePromo = ({ compact = false }: { compact?: boolean }) => (
  <a
    href={ADVERTISE_URL}
    target="_blank"
    rel="noopener noreferrer"
    className={`block rounded-lg bg-muted/30 text-left transition-colors hover:bg-muted/60 ${
      compact ? 'px-3 py-2' : 'p-3'
    }`}
  >
    <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
      Advertise here <ExternalLink className="h-3.5 w-3.5" />
    </span>
    <span className="mt-0.5 block text-xs text-muted-foreground">
      Reach founders shipping vibe coded startups.
    </span>
  </a>
);

/** Slim sponsor banner for mobile — used under the header and above the bottom nav. */
export const AdBanner = ({ className = '' }: { className?: string }) => {
  const { data: slots = [] } = useSponsorSlots();
  const slot = slots[0];

  return (
    <div className={`lg:hidden ${className}`}>
      <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        Sponsored
      </p>
      {slot ? (
        <button
          type="button"
          onClick={() => open(slot.href, slot.id)}
          className="flex w-full items-center gap-2.5 rounded-lg bg-muted/30 px-3 py-2 text-left transition-colors hover:bg-muted/60"
        >
          <img
            src={slot.iconUrl || defaultProductIcon}
            alt=""
            width={28}
            height={28}
            loading="lazy"
            className="h-7 w-7 shrink-0 rounded"
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-foreground">{slot.name}</span>
            {slot.tagline && (
              <span className="block truncate text-xs text-muted-foreground">{slot.tagline}</span>
            )}
          </span>
          <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      ) : (
        <AdvertisePromo compact />
      )}
    </div>
  );
};

/** Fixed right-hand sponsor rail on wide screens. */
const AdRail = () => {
  const { data: slots = [] } = useSponsorSlots();

  return (
    <aside
      aria-label="Sponsored"
      className="fixed right-0 top-16 bottom-0 hidden w-[220px] overflow-y-auto border-l border-border/60 px-4 py-5 min-[1500px]:block"
    >
      <p className="mb-3 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        Sponsored
      </p>
      <div className="space-y-3">
        {slots.map((slot) => (
          <SponsorCard key={slot.id} slot={slot} />
        ))}
        <AdvertisePromo />
      </div>
    </aside>
  );
};

export default AdRail;
