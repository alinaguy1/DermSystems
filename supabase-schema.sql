-- DermSystems database setup (run in Supabase SQL Editor)
create extension if not exists pgcrypto;
create table if not exists public.site_content (
 id uuid primary key default gen_random_uuid(),
 content_type text not null check (content_type in ('testimonial','service','resource','faq','article','video','link','announcement')),
 title text not null,
 body text default '',
 image_url text,
 link_url text,
 metadata jsonb not null default '{}'::jsonb,
 published boolean not null default false,
 sort_order integer not null default 0,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
 key text primary key,
 value text not null,
 updated_at timestamptz not null default now()
);

create table if not exists public.consultation_requests (
 id uuid primary key default gen_random_uuid(),
 full_name text not null,
 contact_info text not null,
 concern text not null,
 other_details text default '',
 preferred_date date,
 preferred_time text,
 contact_method text default 'Video Call',
 created_at timestamptz not null default now()
);
alter table public.site_content enable row level security;
alter table public.consultation_requests enable row level security;
alter table public.site_settings enable row level security;
-- Public visitors can only read published content.
create policy "Public can view published content" on public.site_content for select using (published = true);
-- Signed-in dashboard users can manage all website content.
create policy "Authenticated users manage content" on public.site_content for all to authenticated using (true) with check (true);
-- Public can read the small set of public-facing settings; only signed-in admins can edit them.
drop policy if exists "Public can read website settings" on public.site_settings;
create policy "Public can read website settings" on public.site_settings for select to anon, authenticated using (key in ('booking_notification_email','social_links'));
drop policy if exists "Authenticated users manage website settings" on public.site_settings;
create policy "Authenticated users manage website settings" on public.site_settings for all to authenticated using (true) with check (true);
insert into public.site_settings (key,value) values
 ('booking_notification_email','alinaguy1@gmail.com'),
 ('social_links','[{"platform":"Instagram","url":"https://www.instagram.com/dermsystems/"}]')
on conflict (key) do nothing;
-- Visitors can submit a consultation request; no public read access is granted.
create policy "Anyone can submit consultation request" on public.consultation_requests for insert to anon, authenticated with check (true);
create policy "Authenticated users view requests" on public.consultation_requests for select to authenticated using (true);
create policy "Authenticated users manage requests" on public.consultation_requests for delete to authenticated using (true);
-- Create a PUBLIC storage bucket for assets that the public website must display/download.
insert into storage.buckets (id,name,public) values ('dermsystems-assets','dermsystems-assets',true) on conflict (id) do update set public=true;
create policy "Public can view DermSystems assets" on storage.objects for select using (bucket_id='dermsystems-assets');
create policy "Signed-in users upload DermSystems assets" on storage.objects for insert to authenticated with check (bucket_id='dermsystems-assets');
create policy "Signed-in users update DermSystems assets" on storage.objects for update to authenticated using (bucket_id='dermsystems-assets') with check (bucket_id='dermsystems-assets');
create policy "Signed-in users delete DermSystems assets" on storage.objects for delete to authenticated using (bucket_id='dermsystems-assets');
