# SPE App

This repository is organized as a small full-stack workspace:

- `frontend/` contains the React application built with Vite.
- `backend/` contains a Node.js HTTP server and API routes.

## Development

Install dependencies from the repository root with `npm install`.

- `npm run dev` starts the frontend.
- `npm run dev:backend` starts the backend at `http://localhost:3000`.
- `npm run build` builds the frontend.
- `npm run lint` lints the frontend.

The backend currently exposes `GET /api/health` and returns `{ "status": "ok" }`.
