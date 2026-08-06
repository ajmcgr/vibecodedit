import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Plus } from 'lucide-react';

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

const CARD =
  'group/card flex h-full flex-col rounded-xl border bg-card p-5 text-left transition-shadow hover:shadow-md';

const SponsorCard = ({ slot }: { slot: SponsorSlot }) => (
  <button type="button" onClick={() => open(slot.href, slot.id)} className={`${CARD} cursor-pointer`}>
    <span className="flex items-start gap-2.5">
      <img
        src={slot.iconUrl || defaultProductIcon}
        alt=""
        width={36}
        height={36}
        loading="lazy"
        className="h-9 w-9 flex-shrink-0 rounded-lg bg-background object-cover"
      />
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold leading-tight line-clamp-2">{slot.name}</span>
      </span>
      <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
    </span>

    {slot.screenshotUrl && (
      <span className="relative mt-3 block aspect-video w-full overflow-hidden rounded-lg bg-muted">
        <img
          src={slot.screenshotUrl}
          alt={`${slot.name} screenshot`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover/card:scale-105"
        />
      </span>
    )}

    {slot.tagline && (
      <span className="mt-2 block line-clamp-2 text-sm text-muted-foreground">{slot.tagline}</span>
    )}

    <span className="mt-auto flex items-center gap-2 pt-4">
      <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">Sponsored</span>
    </span>
  </button>
);

/** Empty ad slot styled to match the product cards. */
const AdPlaceholder = () => (
  <a
    href={ADVERTISE_URL}
    target="_blank"
    rel="noopener noreferrer"
    className={`${CARD} border-dashed hover:border-foreground/30`}
  >
    <span className="flex items-start gap-2.5">
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
        <Plus className="h-4 w-4 text-muted-foreground" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold leading-tight">Your ad here</span>
      </span>
      <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
    </span>

    <span className="mt-3 block aspect-video w-full rounded-lg bg-muted/50" />

    <span className="mt-2 block line-clamp-2 text-sm text-muted-foreground">
      Reach vibe coders launching every day.
    </span>

    <span className="mt-auto flex items-center gap-2 pt-4">
      <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">Advertise</span>
    </span>
  </a>
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

/** Full-width horizontal ad row, interleaved into the product wall. */
export const AdRow = ({ startIndex = 0 }: { startIndex?: number }) => {
  const { data: slots = [] } = useSponsorSlots();
  const rowSlots = slots.slice(startIndex, startIndex + 4);
  const placeholders = Math.max(0, 4 - rowSlots.length);

  return (
    <div className="w-full">
      <p className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">AD</p>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {rowSlots.map((slot) => (
          <SponsorCard key={slot.id} slot={slot} />
        ))}
        {Array.from({ length: placeholders }).map((_, i) => (
          <AdPlaceholder key={`ad-placeholder-${startIndex}-${i}`} />
        ))}
      </div>
    </div>
  );
};

/** Slim fixed sponsor banner on mobile. */
const AdRail = () => (
  <div className="fixed inset-x-0 bottom-[calc(120px+env(safe-area-inset-bottom))] z-40 border-y border-border/60 bg-background/95 px-4 py-2 backdrop-blur lg:hidden">
    <AdBanner />
  </div>
);

export default AdRail;
