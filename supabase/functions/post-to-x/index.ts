// Vibe Coded It -> X auto-poster.
// Posts the newest not-yet-tweeted app (Launch product or vibecodedit.com
// submission) to https://x.com/vibecodedit. Idempotent via vibecodedit_x_posts.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const API_URL = 'https://api.x.com/2/tweets';
const SITE = 'https://vibecodedit.com';

const CONSUMER_KEY = Deno.env.get('TWITTER_CONSUMER_KEY') ?? '';
const CONSUMER_SECRET = Deno.env.get('TWITTER_CONSUMER_SECRET') ?? '';
const ACCESS_TOKEN = Deno.env.get('TWITTER_ACCESS_TOKEN') ?? '';
const ACCESS_TOKEN_SECRET = Deno.env.get('TWITTER_ACCESS_TOKEN_SECRET') ?? '';

const enc = (v: string) =>
  encodeURIComponent(v).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());

async function hmacSha1(key: string, msg: string) {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(key),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(msg));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

/** OAuth 1.0a header. IMPORTANT: JSON body params are NOT part of the signature. */
async function oauthHeader(method: string, url: string) {
  const params: Record<string, string> = {
    oauth_consumer_key: CONSUMER_KEY,
    oauth_nonce: crypto.randomUUID().replace(/-/g, ''),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: ACCESS_TOKEN,
    oauth_version: '1.0',
  };
  const base = [
    method.toUpperCase(),
    enc(url),
    enc(Object.keys(params).sort().map((k) => `${enc(k)}=${enc(params[k])}`).join('&')),
  ].join('&');
  const signingKey = `${enc(CONSUMER_SECRET)}&${enc(ACCESS_TOKEN_SECRET)}`;
  const signature = await hmacSha1(signingKey, base);
  const all = { ...params, oauth_signature: signature };
  return (
    'OAuth ' +
    Object.keys(all)
      .sort()
      .map((k) => `${enc(k)}="${enc((all as any)[k])}"`)
      .join(', ')
  );
}

const firstSentence = (text: string) => {
  const m = (text || '').match(/^[^.!?]*[.!?]/);
  return (m ? m[0] : text || '').trim();
};

const clamp = (s: string, max: number) => (s.length <= max ? s : s.slice(0, max - 1).trimEnd() + '…');

function buildTweet(name: string, tagline: string, url: string, maker?: string | null) {
  const by = maker ? ` by @${maker.replace(/^@/, '')}` : '';
  const head = `🎱 ${name}${by}`;
  const tail = `\n\n${url}`;
  const room = 270 - head.length - tail.length;
  const body = room > 20 ? `\n\n${clamp(firstSentence(tagline), room)}` : '';
  return `${head}${body}${tail}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    if (!CONSUMER_KEY || !CONSUMER_SECRET || !ACCESS_TOKEN || !ACCESS_TOKEN_SECRET) {
      return json({ error: 'X credentials are not configured' }, 500);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    let limit = 1;
    let dryRun = false;
    try {
      const body = await req.json();
      if (typeof body?.limit === 'number') limit = Math.min(Math.max(1, body.limit), 5);
      dryRun = body?.dryRun === true;
    } catch {
      /* empty body is fine */
    }

    const { data: posted } = await supabase
      .from('vibecodedit_x_posts')
      .select('source, source_id')
      .eq('status', 'sent');
    const seen = new Set((posted ?? []).map((p: any) => `${p.source}:${p.source_id}`));

    // Candidates: newest vibecodedit submissions + newest launched Launch products.
    const [subs, prods] = await Promise.all([
      supabase
        .from('vibecodedit_submissions_public')
        .select('id, app_name, website_url, description, founder_username, created_at')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('products')
        .select('id, name, tagline, slug, launch_date')
        .eq('status', 'launched')
        .order('launch_date', { ascending: false })
        .limit(20),
    ]);

    type Candidate = {
      source: 'launch' | 'vibecodedit';
      source_id: string;
      at: string;
      text: string;
    };

    const candidates: Candidate[] = [
      ...((subs.data ?? []) as any[]).map((s) => ({
        source: 'vibecodedit' as const,
        source_id: String(s.id),
        at: s.created_at,
        text: buildTweet(s.app_name, s.description, s.website_url, s.founder_username),
      })),
      ...((prods.data ?? []) as any[]).map((p) => ({
        source: 'launch' as const,
        source_id: String(p.id),
        at: p.launch_date ?? new Date(0).toISOString(),
        text: buildTweet(p.name, p.tagline ?? '', `${SITE}/`),
      })),
    ]
      .filter((c) => !seen.has(`${c.source}:${c.source_id}`))
      .sort((a, b) => (a.at < b.at ? 1 : -1))
      .slice(0, limit);

    if (!candidates.length) return json({ posted: 0, message: 'Nothing new to post' });
    if (dryRun) return json({ dryRun: true, candidates });

    const results: unknown[] = [];
    for (const c of candidates) {
      const authorization = await oauthHeader('POST', API_URL);
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { Authorization: authorization, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: c.text }),
      });
      const raw = await res.text();
      if (!res.ok) {
        console.error(`X post failed [${res.status}]: ${raw}`);
        await supabase.from('vibecodedit_x_posts').upsert(
          {
            source: c.source,
            source_id: c.source_id,
            tweet_text: c.text,
            status: 'failed',
            error: `[${res.status}] ${raw}`.slice(0, 1000),
          },
          { onConflict: 'source,source_id' },
        );
        results.push({ source_id: c.source_id, ok: false, status: res.status, details: raw });
        continue;
      }
      const tweetId = (() => {
        try {
          return JSON.parse(raw)?.data?.id ?? null;
        } catch {
          return null;
        }
      })();
      await supabase.from('vibecodedit_x_posts').upsert(
        { source: c.source, source_id: c.source_id, tweet_id: tweetId, tweet_text: c.text, status: 'sent', error: null },
        { onConflict: 'source,source_id' },
      );
      results.push({ source_id: c.source_id, ok: true, tweet_id: tweetId });
    }

    return json({ posted: results.filter((r: any) => r.ok).length, results });
  } catch (err: any) {
    console.error('post-to-x error', err);
    return json({ error: err?.message ?? 'Unexpected error' }, 500);
  }
});
