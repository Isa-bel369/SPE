# SPE UMaT Student Chapter website

React + Vite website for the Society of Petroleum Engineers, University of Mines and Technology (Tarkwa) student chapter. The frontend lives in `frontend/`; the Supabase backend is in `backend/`.

## Frontend

Install dependencies from this directory with `npm install`.

- `npm run dev` starts the frontend (usually `http://localhost:5173`).
- `npm run build` builds the frontend.
- `npm run lint` lints the frontend.

For backend setup, install the Supabase CLI and follow [backend/README.md](backend/README.md). The backend implementation follows `backend/SPE_UMaT_Website_Backend_Guide.pdf`.

## Paystack

Copy `.env.example` to `.env` and set `VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_key`. Amounts are charged in GHS. A live secret-key verification step belongs on a server before production. Replace placeholder contact and social URLs in `.env` as well.

## Pages

- `/` Home
- `/about` Chapter overview
- `/membership` Membership information
- `/join-committee` Committee interest form
- `/newsfile` Chapter news
- `/media` Calendar, photos and recordings
- `/dues` Payments
- `/dashboard` Member tools
- `/admin` Office-specific tools

Some frontend flows still use local demo data. Integrate them against the endpoint contracts in the backend guide and `backend/supabase/functions/`.
