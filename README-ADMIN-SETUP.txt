RENuka Darbar - Private Temple Associate Management

1) In Supabase SQL Editor, run prasad-schema.sql.
2) In Supabase Authentication settings, disable public sign-ups. Create only the temple-associate users you want to access admin.html.
3) Edit supabase-config.js and enter the Supabase Project URL and PUBLIC anon key. NEVER put a service_role key in this file.
4) Upload the whole website folder to your hosting.
5) Public visitors use the normal website. They do NOT see the management table or admin link.
6) Temple associates open /admin.html and sign in with their Supabase email/password.
7) The admin page defaults to today's registrations and supports date, donation/service/both, and prasad-status filters.
8) Public visitors can submit donation/service records, but RLS prevents them from reading the table. Authenticated temple associates can read/update prasad status and tracking number.
9) The current browser-local records remain as a fallback for receipt flow; the central Supabase records are the source for the private admin page.
