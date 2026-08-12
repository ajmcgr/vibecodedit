// Per-product social sharing cards for Vibe Coded It.
//
// Crawlers (Twitter/X, Slack, LinkedIn, Facebook, Discord, WhatsApp...) get a tiny
// HTML document whose og:image is the product's first screenshot. Humans get a 302
// straight to the product destination, so the URL behaves like a normal link.

const DEFAULT_IMAGE = 'https://vibecodedit.com/social-card.png';
const SITE = 'https://vibecodedit.com';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const ANON_KEY =
  Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? '';

const BOT_RE =
  /(bot|crawler|spider|preview|facebookexternalhit|twitterbot|slackbot|linkedinbot|discordbot|whatsapp|telegrambot|embedly|quora link preview|pinterest|redditbot|vkshare|skypeuripreview|iframely|bluesky|mastodon|google-inspectiontool)/i;

const esc = (v: unknown) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const rest = async (path: string) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
  });
  if (!res.ok) return [];
  try {
    return (await res.json()) as any[];
  } catch {
    return [];
  }
};

const isUuid = (v: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

const httpsOnly = (url?: string | null) =>
  url && /^https?:\/\//i.test(url) ? url : undefined;

interface Card {
  name: string;
  description: string;
  image: string;
  destination: string;
}

const fromLaunchProduct = async (p: any): Promise<Card> => {
  const media = await rest(
    `product_media?product_id=eq.${p.id}&select=url,type&limit=20`
  );
  const pick = (type: string) => media.find((m: any) => m.type === type)?.url;
  return {
    name: p.name,
    description: p.tagline || 'Vibe coded and shipped on Launch.',
    image:
      httpsOnly(pick('screenshot')) ||
      httpsOnly(pick('thumbnail')) ||
      httpsOnly(pick('icon')) ||
      DEFAULT_IMAGE,
    destination: p.slug
      ? `https://trylaunch.ai/launch/${p.slug}?source=vibecodedit`
      : SITE,
  };
};

const resolve = async (id: string, slug: string): Promise<Card | null> => {
  if (slug) {
    const [p] = await rest(
      `products?slug=eq.${encodeURIComponent(slug)}&select=id,name,tagline,slug&limit=1`
    );
    if (p) return await fromLaunchProduct(p);
  }

  if (id && isUuid(id)) {
    const [s] = await rest(
      `vibecodedit_submissions_public?id=eq.${id}&select=id,app_name,description,website_url,screenshot_url,logo_url&limit=1`
    );
    if (s) {
      return {
        name: s.app_name,
        description: s.description || 'Vibe coded and shipped.',
        image: httpsOnly(s.screenshot_url) || httpsOnly(s.logo_url) || DEFAULT_IMAGE,
        destination: httpsOnly(s.website_url) || SITE,
      };
    }

    const [p] = await rest(`products?id=eq.${id}&select=id,name,tagline,slug&limit=1`);
    if (p) return await fromLaunchProduct(p);
  }

  return null;
};

const html = (card: Card, canonical: string) => {
  const title = `${card.name} — Vibe Coded It`;
  const description = card.description.slice(0, 200);
  return (
    '<!doctype html><html lang="en"><head><meta charset="utf-8" />' +
    `<title>${esc(title)}</title>` +
    `<meta name="description" content="${esc(description)}" />` +
    `<link rel="canonical" href="${esc(canonical)}" />` +
    '<meta property="og:type" content="website" />' +
    '<meta property="og:site_name" content="Vibe Coded It" />' +
    `<meta property="og:title" content="${esc(title)}" />` +
    `<meta property="og:description" content="${esc(description)}" />` +
    `<meta property="og:url" content="${esc(canonical)}" />` +
    `<meta property="og:image" content="${esc(card.image)}" />` +
    `<meta property="og:image:alt" content="${esc(card.name)} screenshot" />` +
    '<meta name="twitter:card" content="summary_large_image" />' +
    `<meta name="twitter:title" content="${esc(title)}" />` +
    `<meta name="twitter:description" content="${esc(description)}" />` +
    `<meta name="twitter:image" content="${esc(card.image)}" />` +
    `</head><body><p><a href="${esc(card.destination)}" rel="nofollow">${esc(card.name)}</a></p></body></html>`
  );
};

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const id = (url.searchParams.get('id') || '').trim();
  const slug = (url.searchParams.get('slug') || '').trim().slice(0, 120);

  const card = await resolve(id, slug);
  if (!card) {
    return Response.redirect(SITE, 302);
  }

  const ua = req.headers.get('user-agent') || '';
  if (!BOT_RE.test(ua)) {
    return new Response(null, {
      status: 302,
      headers: { Location: card.destination, 'Cache-Control': 'no-store' },
    });
  }

  return new Response(html(card, url.toString()), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=600',
    },
  });
});
