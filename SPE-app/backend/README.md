# SPE UMaT Supabase backend

This folder contains the backend implementation for `SPE_UMaT_Website_Backend_Guide.pdf`. It uses Supabase Postgres, Row Level Security, Storage and Deno Edge Functions. It replaces the earlier Node health-check stub; there is no Express server here.

## Local development

Install the Supabase CLI and Docker Desktop. From this folder, run:

```sh
supabase start
supabase db reset
supabase functions serve
```

`supabase db reset` applies the migrations in order and loads `supabase/seed/seed.sql`. The seed contains synthetic development members and sample public content. Do not copy its records into production.

The CLI prints local API keys and database connection details. Edge Functions read `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` from the local Supabase runtime. Copy `.env.example` to `.env` for the additional values below; `.env` is ignored by Git.

## Required function secrets

Set these in the local `.env` for local functions, and with `supabase secrets set NAME=value` for a hosted project:

- `RESEND_API_KEY` and `EMAIL_FROM` for registration codes, member codes, and contact notifications.
- `CAPTCHA_SECRET_KEY` for Cloudflare Turnstile validation.
- `CODE_HASH_PEPPER` and `DEVICE_HASH_PEPPER` as long random values used for one-way hashes.
- `SITE_URL` and `ALLOWED_ORIGINS` for email links and browser CORS. `ALLOWED_ORIGINS` is a comma-separated origin list.
- `WEBHOOK_SECRET` for the internal contact notification function.

The contact trigger also reads `SUPABASE_URL` and `WEBHOOK_SECRET` from Supabase Vault. Configure both there for the hosted project; keep the Edge Function copy of `WEBHOOK_SECRET` in Supabase Function secrets. Never expose the service-role key, Resend key, CAPTCHA secret, webhook secret, or peppers to frontend code.

## First admin setup

Create the initial technical-head user in Supabase Auth, then insert that user's UUID into `public.user_roles` with role `technical_head` using the SQL editor or a controlled setup script. This bootstrap is required once because only a technical head can invite or change admin roles. Create staging admins through the documented invite flow; no passwords or admin accounts are stored in this repository.

## Implementation map

- `supabase/migrations/0001_schema.sql` through `0007_contact_webhook.sql`: schema, security-definer transactions, RLS, views, storage, scheduled cleanup, and contact notification trigger.
- `supabase/functions/`: public member, lookup, check-in and contact endpoints plus admin endpoints from the guide.
- `supabase/functions/_shared/`: request validation, authentication, rate limits, email, CAPTCHA, QR signing and response envelopes.
- `supabase/seed/seed.sql`: local sample content and synthetic records.

Public functions return `{ "ok": true, "data": ... }` on success and the documented error envelope on failure. Admin functions validate the Supabase Auth bearer token and check `user_roles` on every request. RLS defaults to deny direct access to private records; the QR signing secret is accessible only through server-side function logic.

## Deploying

Link this project to the intended Supabase project, set production secrets and Vault values, then apply migrations with `supabase db push` and deploy the functions with `supabase functions deploy`. The project reference, verified Resend sender domain, Turnstile keys, and production URLs must be supplied by the project owner. Do not apply schema changes manually in the dashboard.

Frontend API integration and production deployment are separate follow-up steps; some current frontend flows still use local demo data.
