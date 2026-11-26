-- DermSystems privacy hardening patch
-- Run this in Supabase SQL Editor after the main enhancement migration.
-- The booking notification recipient is read by the Edge Function using its
-- existing service-role secret, so it does not need to be publicly readable.

drop policy if exists "Public can read website settings" on public.site_settings;
create policy "Public can read website settings" on public.site_settings
  for select to anon, authenticated
  using (key in ('social_links', 'homepage_content'));
