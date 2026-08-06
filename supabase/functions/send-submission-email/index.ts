// Sends the "your app is live" confirmation email for Vibe Coded It submissions.
// HTML is built with string concatenation on purpose (no multi-line template literals).

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SITE = 'https://vibecodedit.com';
const LOGO = SITE + '/vibecodedit-logo.png';
const FROM = 'Alex at Vibe Coded It <alex@vibecodedit.com>';

const esc = (v: unknown) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildHtml = (opts: {
  founderName: string;
  appName: string;
  launchUrl: string;
}) => {
  const name = esc(opts.founderName);
  const app = esc(opts.appName);
  const launchUrl = esc(opts.launchUrl);

  let html = '';
  html += '<!DOCTYPE html><html><head><meta charset="utf-8" />';
  html += '<meta name="viewport" content="width=device-width, initial-scale=1" />';
  html += '<title>' + app + ' is live on Vibe Coded It</title></head>';
  html += '<body style="margin:0;padding:0;background-color:#f7f8fa;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Helvetica,Arial,sans-serif;">';
  html += '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f7f8fa;padding:40px 16px;">';
  html += '<tr><td align="center">';
  html += '<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border:1px solid #e8eaee;border-radius:12px;">';

  // Header with logo
  html += '<tr><td align="center" style="padding:36px 32px;border-bottom:1px solid #e8eaee;">';
  html += '<img src="' + LOGO + '" alt="Vibe Coded It" width="220" style="display:block;width:220px;max-width:80%;height:auto;" />';
  html += '</td></tr>';

  // Body
  html += '<tr><td style="padding:40px 40px 44px 40px;">';
  html += '<h1 style="margin:0 0 20px 0;font-size:28px;line-height:1.25;font-weight:700;color:#111827;">' + app + ' is live! \uD83D\uDE80</h1>';
  html += '<p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;color:#374151;">Hi ' + name + ', thanks for adding your app. ';
  html += '<strong>' + app + '</strong> is now on the Vibe Coded It wall for everyone to discover.</p>';
  html += '<p style="margin:0 0 28px 0;font-size:16px;line-height:1.6;color:#374151;">Want more reach? List it on Launch to get in front of thousands of founders, appear in the daily leaderboard, and earn a permanent product page.</p>';
  html += '<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:#2f5fe0;border-radius:8px;">';
  html += '<a href="' + launchUrl + '" style="display:inline-block;padding:15px 28px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;">List it on Launch</a>';
  html += '</td></tr></table>';
  html += '<p style="margin:28px 0 0 0;font-size:15px;line-height:1.6;color:#374151;">';
  html += '<a href="' + SITE + '" style="color:#2f5fe0;text-decoration:none;">See your tile on Vibe Coded It \u2192</a></p>';
  html += '</td></tr>';

  // Footer
  html += '<tr><td align="center" style="padding:24px 32px;border-top:1px solid #e8eaee;">';
  html += '<p style="margin:0;font-size:14px;line-height:1.5;color:#9ca3af;">You received this because you submitted an app to Vibe Coded It.</p>';
  html += '</td></tr>';

  html += '</table></td></tr></table></body></html>';
  return html;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) throw new Error('RESEND_API_KEY is not configured');

    const body = await req.json();
    const email = String(body?.founder_email ?? '').trim().toLowerCase();
    const appName = String(body?.app_name ?? '').trim();
    const founderName = String(body?.founder_name ?? '').trim() || 'there';

    if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email) || !appName) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const params = new URLSearchParams({ campaign: 'vibe_code_your_future', source: 'vibecodedit' });
    params.set('name', appName);
    if (body?.website_url) params.set('website', String(body.website_url));
    if (body?.description) params.set('tagline', String(body.description));
    if (body?.category) params.set('category', String(body.category));
    const launchUrl = 'https://trylaunch.ai/submit?' + params.toString();

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        from: FROM,
        to: [email],
        subject: appName + ' is live on Vibe Coded It \uD83D\uDE80',
        html: buildHtml({ founderName, appName, launchUrl }),
      }),
    });

    if (!res.ok) {
      const details = await res.text();
      console.error('Resend send failed [' + res.status + ']: ' + details);
      return new Response(JSON.stringify({ error: 'Email send failed', status: res.status, details }), {
        status: res.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ sent: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-submission-email error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
