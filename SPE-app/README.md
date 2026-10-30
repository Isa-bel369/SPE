# SPE UMaT Student Chapter website

React + Vite JavaScript frontend and Supabase backend for the SPE UMaT Student Chapter. The implementation follows the guides in `frontend/` and `backend/` while keeping the frontend in JavaScript.

## Run locally

From this directory, install packages with `npm install`. Copy `.env.example` to `frontend/.env.local`, then run `npm run dev`.

Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SITE_URL`, and `VITE_CAPTCHA_SITE_KEY`. Only the public Supabase URL, anon key, site URL, and CAPTCHA site key belong in the frontend environment. Never place service-role or other backend secrets here.

Use `npm run build` to build the site and `npm run lint` to lint it. Backend setup is documented in [backend/README.md](backend/README.md).

## Implemented routes

Public pages: `/`, `/about`, `/events`, `/events/:slug`, `/news`, `/news/:slug`, `/media`, `/leaderboard`.

Member flows without member accounts: `/register`, `/register/verify`, `/register/success`, `/merit`, `/checkin/:eventToken`, `/checkin`.

Admin routes use Supabase Auth and RLS: `/admin/login`, `/admin`, `/admin/registrations`, `/admin/events`, `/admin/attendance`, `/admin/merit`, `/admin/news`, `/admin/media`, `/admin/messages`, `/admin/audit`, `/admin/admins`.
