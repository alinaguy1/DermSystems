# DermSystems — existing-site upgrade

This is the existing static HTML/CSS/vanilla-JavaScript website, upgraded in place. It is not a framework migration or a replacement Supabase project.

## Project structure

- `index.html`, `style.css`, `app.js` — public website.
- `admin.html`, `admin.css`, `admin.js` — Supabase-authenticated admin dashboard.
- `images/` — original brand and content images.
- `documents/` — original downloadable PDF resources.
- `supabase-config.js` — existing browser Supabase URL and anon key configuration. Keep this file out of public issue reports; the anon key is intended for browser use but must rely on correct RLS.
- `supabase/functions/send-booking-email/index.ts` — existing Resend-backed booking notification Edge Function. This upgrade does not replace or rewrite it.
- `supabase-schema.sql` — original database setup reference.
- `supabase-enhancements.sql` — additive migration for homepage content, advertisements, private gallery and explicit admin access.

## Existing booking workflow — preserved

The public consultation form still:
1. Inserts the request into the existing `consultation_requests` table.
2. Invokes the existing Supabase Edge Function `send-booking-email`.
3. Relies on the existing Resend configuration held in Supabase Edge Function secrets.

Do not replace the Edge Function, rotate its secrets, or configure EmailJS. The README in the original archive described EmailJS, but the actual `app.js` and deployed function source use the Resend-backed Edge Function. This README reflects the code in this upgraded archive.

The new success dialog appears only after the existing form code reports success. No email provider or booking database schema has been replaced.

## Admin features

- Existing website content manager for services, testimonials, resources, FAQs, articles, videos, links and announcements.
- Homepage editor for key headings, descriptions, CTA text/destination and hero/founder images.
- Social media links with platform-specific SVG marks and visibility controls.
- Advertisement Manager with image, destination, placement, active state and optional start/end dates. Dismissal is remembered in the visitor's browser for seven days.
- Private Gallery Manager with multi-image upload, category filtering, search, replacement and deletion. Gallery images are not public by default. Use **Publish copy** to deliberately copy an image to the existing public `dermsystems-assets` bucket and copy its public URL for use in a public section.
- Custom booking success dialog.

## Before deploying: inspect and back up the live Supabase project

The ZIP includes the project's supplied schema file, not a live database export. I cannot confirm the deployed project's actual tables, columns, policies, users, storage buckets or Edge Function secrets from these local files. Before applying SQL:
1. In Supabase, take a database backup.
2. Compare the live tables, columns, RLS policies and storage buckets with `supabase-schema.sql` and `supabase-enhancements.sql`.
3. Confirm that the live `consultation_requests` columns match the existing booking insert.
4. Confirm that `send-booking-email` is deployed and that its existing Resend secrets are present.

Do not re-run the original `supabase-schema.sql` against an established production database without reviewing it first. It is a bootstrap schema, not a production migration.

## Apply the enhancement migration

After reviewing the live database, run `supabase-enhancements.sql` in Supabase SQL Editor.

The migration creates:
- `dermsystems_admins` — explicit allow-list for admin privileges.
- `site_ads` — advertisement records.
- `gallery_assets` — private gallery metadata.
- `dermsystems-private-gallery` — private Supabase Storage bucket.
- `homepage_content` key in the existing `site_settings` table, without overwriting an existing value.

It also replaces the original broad authenticated-user management policies with policies that check `dermsystems_admins`. This is a security improvement, but it means you must register your administrator user before expecting dashboard data editing to work:

1. Open Supabase → Authentication → Users.
2. Copy the UUID of the existing administrator account.
3. In SQL Editor, run the following statement with that UUID:

```sql
insert into public.dermsystems_admins (user_id)
values ('PASTE-EXISTING-ADMIN-USER-UUID-HERE')
on conflict (user_id) do nothing;
```

Never use a service-role key in the browser. The dashboard uses the existing anon key and Supabase Auth session; RLS enforces administrator permissions.

The migration intentionally does not modify `send-booking-email` or its environment secrets. If your live policy names differ from the original supplied schema, review and adapt the migration before applying it. Do not run it blindly.

## Configuration and deployment

- Keep the existing `supabase-config.js` and Vercel project configuration.
- Do not commit Supabase service-role keys, Resend API keys or other secrets.
- The public browser configuration should contain only the Supabase project URL and anon/public key.
- Upload the updated files to the existing GitHub repository, preserving its existing project root and Vercel settings.
- Vercel should redeploy the existing project from the configured branch; do not create a second Vercel project.

## Testing checklist

Local source checks can verify syntax and markup, but they cannot prove the live Supabase policies, deployed Edge Function, Resend delivery or Vercel deployment. After applying the migration and deploying, test:

- Public page, navigation and responsive layout.
- Existing consultation form database insert and Edge Function invocation.
- A real booking notification received through the existing Resend setup.
- Admin sign-in and administrator-only CRUD.
- Homepage copy and image changes.
- Social link visibility and destinations.
- Advertisement scheduling, placements and dismissal.
- Private gallery upload, replacement, deletion and publish-copy action.
- Form success dialog on successful submission and no success dialog on failure.

Do not treat an email notification as tested until the real notification has been received.


## Additional privacy hardening before deployment

Run `supabase-privacy-hardening.sql` in the existing Supabase SQL Editor. It removes public read access to the `booking_notification_email` setting. The existing `send-booking-email` Edge Function reads that setting with its existing service-role secret, and the authenticated admin dashboard continues to manage it through the admin-only RLS policy. The public website now fetches only the social-links setting.

The admin page also verifies `is_dermsystems_admin()` after sign-in before displaying the dashboard. RLS remains the actual database security boundary; this client-side check is an additional access-control and usability measure, not a substitute for RLS.
