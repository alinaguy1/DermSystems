-- DermSystems enhancement migration
-- Apply this AFTER reviewing the existing live schema and backup.
-- This migration is additive to application data and tables, but it intentionally
-- replaces selected broad RLS policies. It does not modify booking rows or the
-- send-booking-email Edge Function. Review it against the live policy set first.

-- Explicit administrator allow-list for dashboard writes.
create table if not exists public.dermsystems_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Register the existing DermSystems administrator supplied by the project owner.
-- The foreign key will stop the migration if this UID is not present in auth.users.
insert into public.dermsystems_admins (user_id)
values ('9f6c8407-7d9c-4de5-87a0-97a53fad20ec'::uuid)
on conflict (user_id) do nothing;
alter table public.dermsystems_admins enable row level security;
drop policy if exists "Admins can read their own admin record" on public.dermsystems_admins;
create policy "Admins can read their own admin record" on public.dermsystems_admins
  for select to authenticated using (user_id = auth.uid());

create or replace function public.is_dermsystems_admin()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.dermsystems_admins a where a.user_id = auth.uid());
$$;
revoke all on function public.is_dermsystems_admin() from public;
grant execute on function public.is_dermsystems_admin() to authenticated;

-- Tighten the original broad authenticated-user policies to the explicit admin allow-list.
drop policy if exists "Authenticated users manage content" on public.site_content;
create policy "DermSystems admins manage content" on public.site_content
  for all to authenticated using (public.is_dermsystems_admin())
  with check (public.is_dermsystems_admin());

drop policy if exists "Authenticated users manage website settings" on public.site_settings;
drop policy if exists "Public can read website settings" on public.site_settings;
create policy "Public can read website settings" on public.site_settings
  for select to anon, authenticated
  using (key in ('booking_notification_email','social_links','homepage_content'));
create policy "DermSystems admins manage website settings" on public.site_settings
  for all to authenticated using (public.is_dermsystems_admin())
  with check (public.is_dermsystems_admin());

drop policy if exists "Authenticated users view requests" on public.consultation_requests;
drop policy if exists "Authenticated users manage requests" on public.consultation_requests;
create policy "DermSystems admins view requests" on public.consultation_requests
  for select to authenticated using (public.is_dermsystems_admin());
create policy "DermSystems admins delete requests" on public.consultation_requests
  for delete to authenticated using (public.is_dermsystems_admin());

drop policy if exists "Signed-in users upload DermSystems assets" on storage.objects;
drop policy if exists "Signed-in users update DermSystems assets" on storage.objects;
drop policy if exists "Signed-in users delete DermSystems assets" on storage.objects;
create policy "DermSystems admins upload public assets" on storage.objects
  for insert to authenticated with check (bucket_id='dermsystems-assets' and public.is_dermsystems_admin());
create policy "DermSystems admins update public assets" on storage.objects
  for update to authenticated using (bucket_id='dermsystems-assets' and public.is_dermsystems_admin())
  with check (bucket_id='dermsystems-assets' and public.is_dermsystems_admin());
create policy "DermSystems admins delete public assets" on storage.objects
  for delete to authenticated using (bucket_id='dermsystems-assets' and public.is_dermsystems_admin());

create table if not exists public.site_ads (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  image_url text not null,
  destination_url text not null default '',
  display_type text not null default 'bottom'
    check (display_type in ('bottom','top','corner','modal')),
  active boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.site_ads enable row level security;
drop policy if exists "Public can view active current ads" on public.site_ads;
create policy "Public can view active current ads" on public.site_ads
  for select to anon, authenticated
  using (active = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now()));
drop policy if exists "Authenticated users manage ads" on public.site_ads;
create policy "Authenticated users manage ads" on public.site_ads
  for all to authenticated using (public.is_dermsystems_admin()) with check (public.is_dermsystems_admin());

create table if not exists public.gallery_assets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null default 'Uncategorised',
  tags text[] not null default '{}',
  storage_path text not null unique,
  mime_type text,
  file_size bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.gallery_assets enable row level security;
drop policy if exists "Authenticated users manage gallery metadata" on public.gallery_assets;
create policy "Authenticated users manage gallery metadata" on public.gallery_assets
  for all to authenticated using (public.is_dermsystems_admin()) with check (public.is_dermsystems_admin());

-- Homepage copy and image URLs are stored as JSON text under one existing settings key.
-- Do not overwrite a value if one has already been created.
insert into public.site_settings (key, value)
select 'homepage_content', '{}'
where not exists (
  select 1 from public.site_settings where key = 'homepage_content'
);

-- Private media library: images remain private until deliberately copied into the
-- existing public dermsystems-assets bucket for use on the public website.
insert into storage.buckets (id, name, public)
values ('dermsystems-private-gallery', 'dermsystems-private-gallery', false)
on conflict (id) do nothing;

drop policy if exists "Authenticated users read private gallery files" on storage.objects;
create policy "Authenticated users read private gallery files"
  on storage.objects for select to authenticated
  using (bucket_id = 'dermsystems-private-gallery' and public.is_dermsystems_admin());
drop policy if exists "Authenticated users upload private gallery files" on storage.objects;
create policy "Authenticated users upload private gallery files"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'dermsystems-private-gallery' and public.is_dermsystems_admin());
drop policy if exists "Authenticated users update private gallery files" on storage.objects;
create policy "Authenticated users update private gallery files"
  on storage.objects for update to authenticated
  using (bucket_id = 'dermsystems-private-gallery' and public.is_dermsystems_admin())
  with check (bucket_id = 'dermsystems-private-gallery' and public.is_dermsystems_admin());
drop policy if exists "Authenticated users delete private gallery files" on storage.objects;
create policy "Authenticated users delete private gallery files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'dermsystems-private-gallery' and public.is_dermsystems_admin());

-- Existing public bucket and public-read policy remain in place. Only admin
-- accounts registered in dermsystems_admins can now upload/update/delete assets.
