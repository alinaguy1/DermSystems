# DermSystems website redesign

A responsive, redesigned static website plus a Supabase-powered admin dashboard. Original DermSystems image assets are retained. The interactive 7-point skincare checklist and original service/pricing/resource copy are included.

## Files
- `index.html`, `style.css`, `app.js`: public website
- `admin.html`, `admin.css`, `admin.js`: content dashboard at `/admin.html`
- `supabase-schema.sql`: database tables, row-level security policies and storage bucket
- `supabase-config.example.js`, `email-config.example.js`: configuration templates
- `images/`: supplied image and logo assets

## Important: connect the live services
The supplied ZIP did not contain PDF files, Supabase credentials, or an email service configuration. The two original free resource cards are retained; upload the actual PDFs in Admin → File library, then add them as Resources in Website content.

### 1. Supabase (dashboard, content and file uploads)
1. Create a project at https://supabase.com.
2. Open SQL Editor and run all of `supabase-schema.sql`.
3. In Authentication → Users, create the administrator account(s). Do not make public sign-up available.
4. Copy Project URL and anon/public key from Project Settings → API.
5. Copy `supabase-config.example.js` to `supabase-config.js`, then replace the two placeholder values.
6. Copy `email-config.example.js` to `email-config.js` and configure it as described below.
7. Deploy the whole folder to your hosting provider. Keep the config files beside `index.html`.

The dashboard uses Supabase Auth. Only users you create in Supabase Authentication can sign in. The SQL policies permit authenticated users to manage the dashboard content and files. For a production deployment with multiple staff roles, tighten these policies with an explicit admin-role table.

### 2. Email notifications for form submissions
This version supports EmailJS for sending an email notification when the consultation form is submitted.
1. Create an EmailJS account at https://www.emailjs.com and connect the mailbox that should receive consultation enquiries.
2. Create an email template. Suggested subject: `New DermSystems consultation request — {{fullName}}`. Include these template variables in the message: `{{fullName}}`, `{{contactInfo}}`, `{{concern}}`, `{{otherDetails}}`, `{{prefDate}}`, `{{prefTime}}`, `{{contactMethod}}`, `{{submittedAt}}`.
3. In the EmailJS template, set the **To Email** field to `{{to_email}}` (or set the recipient directly to `alinaguy1@gmail.com`).
4. Copy the EmailJS Public Key, Service ID and Template ID into `email-config.js`. The notification recipient is already set to `alinaguy1@gmail.com` in this package.
5. Test with a real submission and verify delivery and spam-folder handling.

When Supabase is configured, each form submission is also saved in the `consultation_requests` table and appears in Admin → Consultation requests. Email delivery is not considered configured until valid EmailJS credentials are supplied. The browser displays an error rather than falsely claiming an email was sent.

### 3. Add PDFs and other content
1. Sign in at `/admin.html`.
2. Open File library and upload a PDF, image or video. Copy its public URL.
3. Open Website content → Add content. Select Resource / PDF, add a title and description, paste the URL into Link / PDF URL, and publish.
4. Testimonials, services, FAQs, articles, videos, links and announcements can be added from Website content. Published testimonials, services and resources appear in their matching public sections. Other content types are stored and managed in the dashboard and can be expanded into dedicated public sections later.

### 4. Local preview
Serve the folder with a local web server (for example VS Code Live Server). Do not open the HTML file directly with `file://`, because Supabase auth and browser modules need an HTTP origin.

## Notes
- Existing original copy, pricing ($45), checklist statements, audience groups, founder story, service descriptions, resource descriptions and three sample testimonial statements are preserved.
- The existing image files and logo SVGs are retained.
- No PDF documents were present in the uploaded archive, so no PDF has been silently invented or substituted.
- The existing Google Apps Script form endpoint was not retained because the old script displayed a success state independently of the email result. This implementation provides explicit Supabase storage and EmailJS notification setup instead.
- The website is a front-end deliverable. Supabase and EmailJS must be configured with the account credentials and recipient email before the dashboard and email delivery can operate on the live domain.


### Manage social media icons and booking email
Run the current `supabase-schema.sql` in your Supabase SQL Editor. Sign in to `/admin.html`, then open **Settings**. Update the booking notification email and save it. To manage social accounts, choose a platform (Instagram, Facebook, TikTok, LinkedIn, YouTube, X, Pinterest, WhatsApp, Threads, Snapchat or Website), paste its profile URL, and save. The matching icon is generated automatically and the links appear in the website footer. Add as many links as you need or remove any row before saving.

For booking email delivery, set the EmailJS template's **To Email** field to `{{to_email}}`; the form passes the current email saved in Admin as that variable.
