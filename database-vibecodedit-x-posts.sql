-- ============================================================================
-- Vibe Coded It: X (Twitter) auto-posting log
-- Run ONCE in the Launch Supabase project (Dashboard -> SQL Editor).
-- Service-role only: nothing is exposed to the browser.
-- ============================================================================

create table if not exists public.vibecodedit_x_posts (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('launch', 'vibecodedit')),
  source_id text not null,
  tweet_id text,
  tweet_text text,
  status text not null default 'sent' check (status in ('sent', 'failed')),
  error text,
  created_at timestamptz not null default now(),
  unique (source, source_id)
);

create index if not exists vibecodedit_x_posts_created_idx
  on public.vibecodedit_x_posts (created_at desc);

revoke all on public.vibecodedit_x_posts from anon, authenticated;
grant all on public.vibecodedit_x_posts to service_role;

alter table public.vibecodedit_x_posts enable row level security;

drop policy if exists "Service role manages x posts" on public.vibecodedit_x_posts;
create policy "Service role manages x posts"
  on public.vibecodedit_x_posts
  for all
  to service_role
  using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Optional: run the poster every 30 minutes (requires pg_cron + pg_net).
-- Replace <ANON_KEY> before running.
-- ---------------------------------------------------------------------------
-- select cron.schedule(
--   'vibecodedit-post-to-x',
--   '*/30 * * * *',
--   $$
--   select net.http_post(
--     url := 'https://gzpypxgdkxdynovploxn.supabase.co/functions/v1/post-to-x',
--     headers := '{"Content-Type":"application/json","Authorization":"Bearer <ANON_KEY>"}'::jsonb,
--     body := '{}'::jsonb
--   );
--   $$
-- );
