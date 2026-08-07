import { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';
import defaultProductIcon from '@/assets/default-product-icon.png';
import CampaignHeader from '@/components/campaign/CampaignHeader';
import CampaignSideNav from '@/components/campaign/CampaignSideNav';
import { useCampaignProducts, type BuilderWallProduct } from '@/hooks/use-campaign-products';
import { CAMPAIGN_ORIGIN } from '@/lib/campaignHost';
import { trackCampaignEvent } from '@/lib/campaign';

const PRODUCTS_LIMIT = 500;

export const categorySlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

interface Collection {
  name: string;
  slug: string;
  products: BuilderWallProduct[];
}

const productHref = (p: BuilderWallProduct) =>
  p.slug ? `https://trylaunch.ai/launch/${p.slug}?source=vibecodedit` : p.url || '#';

const IdeaCard = ({ product }: { product: BuilderWallProduct }) => {
  const href = productHref(product);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackCampaignEvent('builder_wall_card_clicked', product.id)}
      className="group/card flex h-full flex-col rounded-xl border bg-card p-5 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start gap-2.5">
        <img
          src={product.iconUrl || defaultProductIcon}
          alt={`${product.name} icon`}
          width={36}
          height={36}
          loading="lazy"
          decoding="async"
          className="h-9 w-9 flex-shrink-0 rounded-lg bg-background object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = defaultProductIcon;
          }}
        />
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-base font-semibold leading-tight">{product.name}</h3>
          {product.founder && (
            <p className="truncate text-sm text-muted-foreground">@{product.founder}</p>
          )}
        </div>
        <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/card:opacity-100" />
      </div>

      {product.screenshotUrl && (
        <div className="relative mt-3 aspect-video w-full overflow-hidden rounded-lg bg-muted">
          <img
            src={product.screenshotUrl}
            alt={`${product.name} screenshot`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover/card:scale-105"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      {product.tagline && (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{product.tagline}</p>
      )}
    </a>
  );
};

const useCollections = () => {
  const { data: products, isLoading } = useCampaignProducts(PRODUCTS_LIMIT);

  const collections = useMemo<Collection[]>(() => {
    const map = new Map<string, Collection>();
    (products || []).forEach((p) => {
      if (!p.category) return;
      const slug = categorySlug(p.category);
      if (!slug) return;
      if (!map.has(slug)) map.set(slug, { name: p.category, slug, products: [] });
      map.get(slug)!.products.push(p);
    });
    return [...map.values()].sort((a, b) => b.products.length - a.products.length);
  }, [products]);

  return { collections, isLoading };
};

const SkeletonGrid = ({ count = 9 }: { count?: number }) => (
  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-xl border bg-card p-5">
        <div className="h-5 w-1/2 animate-pulse rounded bg-muted/60" />
        <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-muted/50" />
        <div className="mt-4 flex gap-2">
          {Array.from({ length: 4 }).map((__, j) => (
            <div key={j} className="h-9 w-9 animate-pulse rounded-lg bg-muted/50" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

const Shell = ({ children }: { children: React.ReactNode }) => (
  <>
    <CampaignHeader />
    <CampaignSideNav />
    <main className="lg:pl-20">
      <div className="w-full px-4 pt-6 pb-12">{children}</div>
    </main>
    <div className="h-[200px] lg:hidden" aria-hidden />
  </>
);

const Ideas = () => {
  const { slug } = useParams();
  const { collections, isLoading } = useCollections();

  const active = slug ? collections.find((c) => c.slug === slug) : undefined;
  const pageUrl = slug ? `${CAMPAIGN_ORIGIN}/ideas/${slug}` : `${CAMPAIGN_ORIGIN}/ideas`;

  if (slug) {
    return (
      <>
        <Helmet>
          <title>{`${active?.name || 'Ideas'} apps — Vibe Coded It`}</title>
          <meta
            name="description"
            content={`Browse vibe coded ${active?.name || 'startup'} apps built and launched by indie founders.`}
          />
          <link rel="canonical" href={pageUrl} />
          <link rel="icon" href="/favicon-vibecodedit.png" type="image/png" />
        </Helmet>

        <Shell>
          <Link
            to="/ideas"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            All ideas
          </Link>

          <h1 className="mt-4 text-2xl font-bold tracking-tight">
            {active?.name || (isLoading ? 'Loading…' : 'Collection not found')}
          </h1>
          {active && (
            <p className="mt-2 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{active.products.length.toLocaleString()}</span>{' '}
              vibe coded {active.products.length === 1 ? 'app' : 'apps'} in this collection
            </p>
          )}

          <div className="mt-8">
            {isLoading ? (
              <SkeletonGrid />
            ) : active ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {active.products.map((p) => (
                  <IdeaCard key={`${p.id}-${p.slug}`} product={p} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                We couldn’t find that collection.{' '}
                <Link to="/ideas" className="text-primary underline-offset-4 hover:underline">
                  Browse all ideas
                </Link>
                .
              </p>
            )}
          </div>
        </Shell>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Ideas — collections of vibe coded apps by category</title>
        <meta
          name="description"
          content="Explore vibe coded apps grouped into collections by category — find your next idea across AI, productivity, developer tools and more."
        />
        <link rel="canonical" href={pageUrl} />
        <link rel="icon" href="/favicon-vibecodedit.png" type="image/png" />
      </Helmet>

      <Shell>
        <h1 className="text-2xl font-bold tracking-tight">Ideas</h1>
        <p className="mt-2 text-sm leading-5 text-muted-foreground">
          {isLoading ? (
            'Grouping vibe coded apps into collections…'
          ) : (
            <>
              <span className="font-semibold text-foreground">{collections.length.toLocaleString()}</span>{' '}
              collections of vibe coded apps, grouped by category
            </>
          )}
        </p>

        <div className="mt-8">
          {isLoading ? (
            <SkeletonGrid />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {collections.map((c) => (
                <Link
                  key={c.slug}
                  to={`/ideas/${c.slug}`}
                  className="group flex flex-col rounded-xl border bg-card p-5 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold leading-tight">{c.name}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {c.products.length.toLocaleString()} {c.products.length === 1 ? 'app' : 'apps'}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    {c.products.slice(0, 5).map((p) => (
                      <img
                        key={`${c.slug}-${p.id}`}
                        src={p.iconUrl || defaultProductIcon}
                        alt={`${p.name} icon`}
                        width={36}
                        height={36}
                        loading="lazy"
                        decoding="async"
                        className="h-9 w-9 rounded-lg bg-background object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = defaultProductIcon;
                        }}
                      />
                    ))}
                  </div>

                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                    {c.products
                      .slice(0, 4)
                      .map((p) => p.name)
                      .join(' · ')}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </Shell>
    </>
  );
};

export default Ideas;
