// Fetches a product URL, extracts metadata + assets, and uses OpenAI to write
// a clean name / description / category for the Vibe Coded It submit form.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

const isSafeUrl = (raw: string) => {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase();
    if (!host.includes('.') || host.endsWith('.')) return false;
    if (host === 'localhost' || host.endsWith('.local')) return false;
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false;
    if (host.startsWith('[')) return false;
    return true;
  } catch {
    return false;
  }
};

const meta = (html: string, key: string) => {
  const patterns = [
    new RegExp('<meta[^>]+(?:property|name)=["\']' + key + '["\'][^>]*content=["\']([^"\']+)["\']', 'i'),
    new RegExp('<meta[^>]+content=["\']([^"\']+)["\'][^>]*(?:property|name)=["\']' + key + '["\']', 'i'),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return '';
};

const linkHref = (html: string, relMatch: RegExp) => {
  const tags = html.match(/<link[^>]+>/gi) || [];
  for (const tag of tags) {
    const rel = tag.match(/rel=["\']([^"\']+)["\']/i)?.[1] || '';
    if (!relMatch.test(rel)) continue;
    const href = tag.match(/href=["\']([^"\']+)["\']/i)?.[1];
    if (href) return href;
  }
  return '';
};

const textFromHtml = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 6000);

const fetchImageDataUrl = async (raw: string, base: string) => {
  try {
    const abs = new URL(raw, base).toString();
    if (!isSafeUrl(abs)) return null;
    const res = await fetch(abs, { redirect: 'follow' });
    if (!res.ok) return null;
    const type = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!ALLOWED_IMAGE_TYPES.includes(type)) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    if (!buf.byteLength || buf.byteLength > MAX_IMAGE_BYTES) return null;
    let binary = '';
    for (let i = 0; i < buf.length; i += 8192) {
      binary += String.fromCharCode(...buf.subarray(i, i + 8192));
    }
    return { dataUrl: 'data:' + type + ';base64,' + btoa(binary), type };
  } catch {
    return null;
  }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) return json({ error: 'AI autofill is not configured.' }, 500);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  let url = String(body?.url ?? '').trim();
  if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url;
  if (!url || url.length > 300 || !isSafeUrl(url)) {
    return json({ error: 'Enter a valid public http(s) URL.' }, 400);
  }

  const categories: string[] = Array.isArray(body?.categories)
    ? body.categories.map((c: unknown) => String(c)).filter(Boolean).slice(0, 60)
    : [];

  // 1. Fetch the page
  let html = '';
  let finalUrl = url;
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': 'VibeCodedItBot/1.0 (+https://vibecodedit.com)' },
    });
    if (!res.ok) return json({ error: 'Could not load that site (HTTP ' + res.status + ').' }, 400);
    finalUrl = res.url || url;
    html = (await res.text()).slice(0, 400000);
  } catch {
    return json({ error: 'Could not reach that URL. Check it and try again.' }, 400);
  }

  const title =
    meta(html, 'og:site_name') ||
    meta(html, 'og:title') ||
    (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').trim();
  const metaDescription = meta(html, 'og:description') || meta(html, 'description');
  const ogImage = meta(html, 'og:image') || meta(html, 'twitter:image');
  const icon =
    linkHref(html, /apple-touch-icon/i) ||
    linkHref(html, /(^|\s)icon(\s|$)/i) ||
    linkHref(html, /shortcut icon/i) ||
    '/favicon.ico';

  // 2. Ask OpenAI to clean it up
  let ai: any = {};
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You extract product listing details from website content and reply with JSON only. ' +
              'Keys: app_name (short product name, max 60 chars), description (2 sentences, ' +
              'max 400 chars, plain text, says what it does and who it is for), category (must be ' +
              'exactly one of the provided categories). Never invent facts not supported by the content.',
          },
          {
            role: 'user',
            content:
              'URL: ' + finalUrl + '\n' +
              'Title: ' + title + '\n' +
              'Meta description: ' + metaDescription + '\n' +
              'Allowed categories: ' + (categories.join(', ') || 'AI, Productivity, Other') + '\n\n' +
              'Page text:\n' + textFromHtml(html),
          },
        ],
      }),
    });

    if (res.status === 429) return json({ error: 'AI is rate limited. Try again shortly.' }, 429);
    if (!res.ok) {
      const detail = await res.text();
      console.error('OpenAI error', res.status, detail.slice(0, 500));
      return json({ error: 'AI could not analyse that site. Fill the form manually.' }, 502);
    }

    const data = await res.json();
    ai = JSON.parse(data?.choices?.[0]?.message?.content || '{}');
  } catch (err) {
    console.error('AI autofill failed', err);
    return json({ error: 'AI could not analyse that site. Fill the form manually.' }, 502);
  }

  // 3. Grab assets
  const [screenshot, logo] = await Promise.all([
    ogImage ? fetchImageDataUrl(ogImage, finalUrl) : Promise.resolve(null),
    icon ? fetchImageDataUrl(icon, finalUrl) : Promise.resolve(null),
  ]);

  const category =
    categories.find((c) => c.toLowerCase() === String(ai?.category ?? '').toLowerCase()) || '';

  return json({
    website_url: finalUrl,
    app_name: String(ai?.app_name ?? title ?? '').trim().slice(0, 80),
    description: String(ai?.description ?? metaDescription ?? '').trim().slice(0, 500),
    category,
    screenshot,
    logo,
  });
});
