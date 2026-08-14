import { useEffect } from 'react';
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
        .limit(8);

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

export type AdView = 'grid' | 'semi-compact' | 'list' | 'compact';

const VARIANT = {
  grid: { card: 'p-5', icon: 'h-9 w-9', screenshot: 'mt-3', tagline: 'line-clamp-2', footer: 'mt-auto pt-4' },
  'semi-compact': { card: 'p-3', icon: 'h-9 w-9', screenshot: 'mt-2', tagline: 'line-clamp-1', footer: 'mt-2' },
} as const;

const CARD =
  'group/card flex h-full flex-col rounded-xl border bg-card text-left transition-shadow hover:shadow-md';

const ROW_CARD =
  'group/card flex w-full items-center gap-3 rounded-xl border bg-card text-left transition-shadow hover:shadow-md';

const SponsorCard = ({ slot, view = 'grid' }: { slot: SponsorSlot; view?: AdView }) => {
  if (view === 'list' || view === 'compact') {
    const dense = view === 'compact';
    return (
      <button
        type="button"
        onClick={() => open(slot.href, slot.id)}
        className={`${ROW_CARD} cursor-pointer ${dense ? 'p-3' : 'p-4'}`}
      >
        <img
          src={slot.iconUrl || defaultProductIcon}
          alt=""
          width={40}
          height={40}
          loading="lazy"
          className={`${dense ? 'h-8 w-8' : 'h-10 w-10'} flex-shrink-0 rounded-lg bg-background object-cover`}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-base font-semibold leading-tight">{slot.name}</span>
          {!dense && slot.tagline && (
            <span className="block truncate text-sm text-muted-foreground">{slot.tagline}</span>
          )}
        </span>
        <span className="flex-shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
          Sponsored
        </span>
        <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
      </button>
    );
  }

  const v = VARIANT[view === 'semi-compact' ? 'semi-compact' : 'grid'];
  return (
    <button
      type="button"
      onClick={() => open(slot.href, slot.id)}
      className={`${CARD} ${v.card} cursor-pointer`}
    >
      <span className="flex items-start gap-2.5">
        <img
          src={slot.iconUrl || defaultProductIcon}
          alt=""
          width={36}
          height={36}
          loading="lazy"
          className={`${v.icon} flex-shrink-0 rounded-lg bg-background object-cover`}
        />
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold leading-tight line-clamp-2">{slot.name}</span>
        </span>
        <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
      </span>

      {slot.screenshotUrl && (
        <span className={`relative ${v.screenshot} block aspect-video w-full overflow-hidden rounded-lg bg-muted`}>
          <img
            src={slot.screenshotUrl}
            alt={`${slot.name} screenshot`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover/card:scale-105"
          />
        </span>
      )}

      {slot.tagline && (
        <span className={`mt-2 block ${v.tagline} text-sm text-muted-foreground`}>{slot.tagline}</span>
      )}

      <span className={`${v.footer} flex items-center gap-2`}>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">Sponsored</span>
      </span>
    </button>
  );
};

/** Empty ad slot styled to match the product cards. */
const AdPlaceholder = ({ view = 'grid' }: { view?: AdView }) => {
  const link = { href: ADVERTISE_URL, target: '_blank', rel: 'noopener noreferrer' } as const;

  if (view === 'list' || view === 'compact') {
    const dense = view === 'compact';
    return (
      <a {...link} className={`${ROW_CARD} border-dashed hover:border-foreground/30 ${dense ? 'p-3' : 'p-4'}`}>
        <span
          className={`${dense ? 'h-8 w-8' : 'h-10 w-10'} flex flex-shrink-0 items-center justify-center rounded-lg bg-muted`}
        >
          <Plus className="h-4 w-4 text-muted-foreground" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-base font-semibold leading-tight">Your ad here</span>
          {!dense && (
            <span className="block truncate text-sm text-muted-foreground">
              Reach vibe coders launching every day.
            </span>
          )}
        </span>
        <span className="flex-shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
          Advertise
        </span>
        <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
      </a>
    );
  }

  const v = VARIANT[view === 'semi-compact' ? 'semi-compact' : 'grid'];
  return (
    <a {...link} className={`${CARD} ${v.card} border-dashed hover:border-foreground/30`}>
      <span className="flex items-start gap-2.5">
        <span className={`${v.icon} flex flex-shrink-0 items-center justify-center rounded-lg bg-muted`}>
          <Plus className="h-4 w-4 text-muted-foreground" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold leading-tight">Your ad here</span>
        </span>
        <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
      </span>

      <span className={`${v.screenshot} block aspect-video w-full rounded-lg bg-muted/50`} />

      <span className={`mt-2 block ${v.tagline} text-sm text-muted-foreground`}>
        Reach vibe coders launching every day.
      </span>

      <span className={`${v.footer} flex items-center gap-2`}>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">Advertise</span>
      </span>
    </a>
  );
};


/** Pill-shaped ad chip for the mobile marquees. */
const AdChip = ({ slot }: { slot: SponsorSlot }) => (
  <button
    type="button"
    onClick={() => open(slot.href, slot.id)}
    className="flex shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-left"
  >
    <img
      src={slot.iconUrl || defaultProductIcon}
      alt=""
      width={22}
      height={22}
      loading="lazy"
      className="h-[22px] w-[22px] shrink-0 rounded-full object-cover"
    />
    <span className="whitespace-nowrap text-sm font-semibold text-foreground">{slot.name}</span>
  </button>
);

/** Empty slot chip with the advertise CTA. */
const AdChipPlaceholder = () => (
  <a
    href={ADVERTISE_URL}
    target="_blank"
    rel="noopener noreferrer"
    className="flex shrink-0 items-center gap-1.5 rounded-xl border border-dashed border-border bg-background px-3.5 py-2"
  >
    <Plus className="h-4 w-4 text-muted-foreground" />
    <span className="whitespace-nowrap text-sm text-muted-foreground">Your ad here</span>
  </a>
);

/** Horizontally scrolling ad marquee used in the mobile header and footer bars. */
export const AdBanner = ({
  reverse = false,
  className = '',
}: {
  reverse?: boolean;
  className?: string;
}) => {
  const { data: slots = [] } = useSponsorSlots();
  const items: Array<SponsorSlot | null> = [...slots.slice(0, 5), null];
  const loop = [...items, ...items];

  return (
    <div className={`overflow-hidden lg:hidden ${className}`}>
      <div className={`ad-marquee-track gap-2 ${reverse ? 'is-reverse' : ''}`}>
        {loop.map((item, i) =>
          item ? (
            <AdChip key={`chip-${item.id}-${i}`} slot={item} />
          ) : (
            <AdChipPlaceholder key={`chip-empty-${i}`} />
          ),
        )}
      </div>
    </div>
  );
};

/** Full-width horizontal ad row, interleaved into the product wall. */
export const AdRow = ({
  startIndex = 0,
  view = 'grid',
  perRow,
}: {
  startIndex?: number;
  view?: AdView;
  perRow?: number;
}) => {
  const { data: slots = [] } = useSponsorSlots();
  const rowCapacity = perRow ?? (view === 'grid' ? 4 : view === 'semi-compact' ? 4 : 8);
  const count = Math.min(6, rowCapacity);
  const rowSlots = slots.slice(startIndex, startIndex + count);
  const placeholders = Math.max(0, count - rowSlots.length);

  const gridClass =
    view === 'grid'
      ? 'grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      : view === 'semi-compact'
        ? 'grid grid-cols-1 sm:grid-cols-2 gap-3'
        : view === 'list'
          ? 'flex flex-col gap-3'
          : 'flex flex-col gap-2';

  return (
    <div className="w-full">
      <p className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">AD</p>
      <div className={gridClass}>
        {rowSlots.map((slot) => (
          <SponsorCard key={slot.id} slot={slot} view={view} />
        ))}
        {Array.from({ length: placeholders }).map((_, i) => (
          <AdPlaceholder key={`ad-placeholder-${startIndex}-${i}`} view={view} />
        ))}
      </div>
    </div>
  );
};


/** Fixed scrolling ad bars pinned to the top and bottom on mobile, like Launch. */
const AdRail = () => {
  useEffect(() => {
    document.documentElement.classList.add('has-mobile-marquee');
    return () => document.documentElement.classList.remove('has-mobile-marquee');
  }, []);

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[60] border-b border-border bg-background/95 pt-[calc(0.5rem+env(safe-area-inset-top))] pb-2 backdrop-blur lg:hidden">
        <AdBanner />
      </div>
      <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-border bg-background/95 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <AdBanner reverse />
      </div>
    </>
  );
};

export default AdRail;
