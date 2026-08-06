-- ============================================================================
-- Vibe Coded It: lightweight submission staging layer
-- Run ONCE in the Launch Supabase project (Dashboard -> SQL Editor).
-- Does NOT touch the existing Launch `products` table.
-- ============================================================================

create table if not exists public.vibecodedit_submissions (
  id uuid primary key default gen_random_uuid(),
  app_name text not null,
  website_url text not null,
  description text not null,
  category text not null,
  founder_name text not null,
  founder_email text not null,
  founder_username text,
  screenshot_url text not null,
  logo_url text,
  source text not null default 'vibecodedit',
  launch_product_id uuid,
  promoted_to_launch boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint vibecodedit_app_name_len check (char_length(app_name) between 2 and 80),
  constraint vibecodedit_description_len check (char_length(description) between 20 and 500),
  constraint vibecodedit_category_len check (char_length(category) between 2 and 60),
  constraint vibecodedit_founder_name_len check (char_length(founder_name) between 2 and 80),
  constraint vibecodedit_username_len check (founder_username is null or char_length(founder_username) <= 40),
  constraint vibecodedit_email_shape check (founder_email ~* '^[^@\s]+@[^@\s.]+\.[^@\s]+$'),
  constraint vibecodedit_url_shape check (website_url ~* '^https?://[^\s]+\.[^\s]+$'),
  constraint vibecodedit_screenshot_shape check (screenshot_url ~* '^https?://'),
  constraint vibecodedit_logo_shape check (logo_url is null or logo_url ~* '^https?://')
);

-- Duplicate guards (case/host-insensitive enough for our purposes).
create unique index if not exists vibecodedit_submissions_url_uniq
  on public.vibecodedit_submissions (lower(regexp_replace(website_url, '/+$', '')));
create unique index if not exists vibecodedit_submissions_name_uniq
  on public.vibecodedit_submissions (lower(app_name));
create index if not exists vibecodedit_submissions_created_idx
  on public.vibecodedit_submissions (created_at desc);

-- keep updated_at fresh
create or replace function public.vibecodedit_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists vibecodedit_submissions_touch on public.vibecodedit_submissions;
create trigger vibecodedit_submissions_touch
  before update on public.vibecodedit_submissions
  for each row execute function public.vibecodedit_touch_updated_at();

-- ---------------------------------------------------------------------------
-- Grants: anonymous visitors may INSERT specific columns only.
-- No select/update/delete for anon or authenticated on the base table,
-- so founder_email is never readable and launch_product_id /
-- promoted_to_launch can never be set or changed from the client.
-- ---------------------------------------------------------------------------
revoke all on public.vibecodedit_submissions from anon, authenticated;

grant insert (
  app_name, website_url, description, category,
  founder_name, founder_email, founder_username,
  screenshot_url, logo_url
) on public.vibecodedit_submissions to anon, authenticated;

grant all on public.vibecodedit_submissions to service_role;

alter table public.vibecodedit_submissions enable row level security;

drop policy if exists "Anyone can submit a vibe coded app" on public.vibecodedit_submissions;
create policy "Anyone can submit a vibe coded app"
  on public.vibecodedit_submissions
  for insert
  to anon, authenticated
  with check (
    source = 'vibecodedit'
    and promoted_to_launch = false
    and launch_product_id is null
  );

drop policy if exists "Service role manages submissions" on public.vibecodedit_submissions;
create policy "Service role manages submissions"
  on public.vibecodedit_submissions
  for all
  to service_role
  using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Safe public view: no founder_email.
-- security_invoker stays OFF so the view reads as its owner (bypasses the
-- base-table RLS) while exposing only the whitelisted columns.
-- ---------------------------------------------------------------------------
drop view if exists public.vibecodedit_submissions_public;
create view public.vibecodedit_submissions_public as
select
  id,
  app_name,
  website_url,
  description,
  category,
  founder_name,
  founder_username,
  screenshot_url,
  logo_url,
  created_at,
  launch_product_id,
  promoted_to_launch
from public.vibecodedit_submissions;

grant select on public.vibecodedit_submissions_public to anon, authenticated;
grant select on public.vibecodedit_submissions_public to service_role;

-- ---------------------------------------------------------------------------
-- Storage bucket for screenshots / logos (public read, anonymous upload).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vibecodedit-uploads', 'vibecodedit-uploads', true, 5242880,
  array['image/png','image/jpeg','image/webp','image/gif']
)
on conflict (id) do update
  set public = true,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/png','image/jpeg','image/webp','image/gif'];

drop policy if exists "vibecodedit uploads are public" on storage.objects;
create policy "vibecodedit uploads are public"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'vibecodedit-uploads');

drop policy if exists "anyone can upload vibecodedit assets" on storage.objects;
create policy "anyone can upload vibecodedit assets"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'vibecodedit-uploads');
