# SPE UMaT Supabase backend

The backend follows `SPE_UMaT_Website_Backend_Guide.pdf` and uses Supabase Postgres, Row Level Security, Storage, and Deno Edge Functions.

## Local development

Install the Supabase CLI and Docker Desktop. From this folder, run:

```sh
supabase start
supabase db reset
supabase functions serve
```

`supabase db reset` applies the migrations in order and loads `supabase/seed/seed.sql`. The seed adds example public content for local development. Don't use it as live chapter information in production.

The CLI prints local API keys and database connection details. Edge Functions read `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` from the local Supabase runtime. Copy `.env.example` to `.env` for the additional values below; `.env` is ignored by Git.

## Required function secrets

Set these in the local `.env` for local functions, and in the Supabase project secrets for hosted functions:

- `RESEND_API_KEY` and `EMAIL_FROM` for registration codes, member IDs, and contact notifications. The existing `Resend_API` secret is also accepted.
- `CAPTCHA_SECRET_KEY` for Cloudflare Turnstile server-side validation.
- `CODE_HASH_PEPPER` and `DEVICE_HASH_PEPPER` as long random values used for one-way hashes. `CODE_HASH_PEPPER` is required by member email verification.
- `SITE_URL` and `ALLOWED_ORIGINS` for email links and browser CORS. `ALLOWED_ORIGINS` is a comma-separated origin list.
- `WEBHOOK_SECRET` for the internal contact notification function.

Set the Turnstile site key as `VITE_CAPTCHA_SITE_KEY` in the frontend environment. It is public and belongs in the frontend; `CAPTCHA_SECRET_KEY` stays in Supabase. Allow the site hostname in the Turnstile widget settings, including `localhost` for local development.

Member registration first sends a six-digit code through Resend. The member record and membership ID are created only after `verify_email` accepts that code. Set `EMAIL_FROM` to an email address on a domain verified in Resend. A configured API key alone is not enough to send registration emails.

The contact trigger also reads `SUPABASE_URL` and `WEBHOOK_SECRET` from Supabase Vault. Configure both there for the hosted project; keep the Edge Function copy of `WEBHOOK_SECRET` in Supabase Function secrets. Never expose the service-role key, Resend key, CAPTCHA secret, webhook secret, or peppers to frontend code.

## First admin setup

Create the initial technical-head user in Supabase Auth, then add the user's UUID to `public.user_roles` with the `technical_head` role in the SQL editor. A technical head is needed to invite admins and change their roles. Use the invite flow for additional admins; this repository does not store admin accounts or passwords.

The Auth settings in `config.toml` enable `public.custom_access_token_hook`, which adds admin roles to login tokens, and disable public Auth sign-ups. Keep the hook enabled so the admin app can identify each user's roles.

## Implementation map

- `supabase/migrations/0001_schema.sql` through `0008_checkin_token_state.sql`: schema, security-definer transactions, RLS, views, storage, scheduled cleanup, contact notification trigger, and admin check-in state access.
- `supabase/functions/`: public member, lookup, check-in and contact endpoints plus admin endpoints from the guide.
- `supabase/functions/_shared/`: request validation, authentication, rate limits, email, CAPTCHA, QR signing and response envelopes.
- `supabase/seed/seed.sql`: example public content for local development.

Public functions return `{ "ok": true, "data": ... }` on success and the documented error envelope on failure. Admin functions validate the Supabase Auth bearer token and check `user_roles` on every request. RLS defaults to deny direct access to private records; the QR signing secret is accessible only through server-side function logic.

## Deploying

This repo is linked to the SPE Supabase project (`jjscvssnmvqqdvyicare`). Migrations 0001–0008 and all Edge Functions are deployed. To deploy future changes, run `supabase db push` and `supabase functions deploy` from this folder.

The current Auth Site URL and redirect paths are set for local development at `http://localhost:5173`. Update them to the deployed frontend URL before using hosted invite or password-reset links. Configure custom SMTP and the production email, CAPTCHA, webhook, and allowed-origin values before enabling email-dependent flows. The Home and About hero images and event covers use files in the `site-media` bucket.
