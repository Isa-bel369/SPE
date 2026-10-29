# SPE UMaT Student Chapter website

React + Vite site for the Society of Petroleum Engineers, University of Mines and Technology (Tarkwa) student chapter. The project keeps the website in `frontend/` and the Node.js API in `backend/`.

## Run locally

Install dependencies from the repository root with `npm install`.

- `npm run dev` starts the frontend (usually `http://localhost:5173`).
- `npm run dev:backend` starts the backend at `http://localhost:3000`.
- `npm run build` builds the frontend.
- `npm run lint` lints the frontend.

The backend currently exposes `GET /api/health` and returns `{ "status": "ok" }`.

## Paystack

Copy `.env.example` to `.env` and set:

```
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_key
```

Amounts are charged in GHS. Without a public key, **Pay with Paystack** still records a labelled demo payment in the browser so the flow can be reviewed. A live secret-key verification step should be added on a server before production.

Also replace placeholder contact and social URLs in `.env` (`VITE_CONTACT_EMAIL`, `VITE_WHATSAPP_URL`, and related keys).

## Demo logins

| Role | Email | Password |
| --- | --- | --- |
| Member | `member@speumat.edu.gh` | `demo-member` |
| Communications Head | `comms@speumat.edu.gh` | `demo-comms` |
| Organization Head | `org@speumat.edu.gh` | `demo-org` |
| Technical Head | `tech@speumat.edu.gh` | `demo-tech` |

Sample member attendance code: `24018321` (Ama Boateng). Organization can check this in from **Admin → Attendance desk**.

## Pages

- `/` Homepage: SPE intro, chapter overview, gallery, upcoming events, contact
- `/about` Mission, vision, chapter story, membership benefits
- `/membership` How to join
- `/join-committee` Committee interest form
- `/newsfile` Chapter news
- `/media` Calendar, photos, YouTube/workshop recordings
- `/dues` Membership and other payments (Paystack)
- `/dashboard` Stats, QR/code, merit history, leaderboard
- `/admin` Office-specific tools (news/media, events/attendance, members/merit)

Chapter data (events, news, media, attendance, merit, payments) is stored in `localStorage` under `spe-umat-store-v1` so the demo works without a database.
