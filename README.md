# ⚡ Plutus

Family finance tracker — CSV import, spending dashboards, category management.

## Structure

| Folder | What it is |
|--------|-----------|
| `db/` | Database migrations (SQL scripts for Supabase) |
| `frontend/` | React + Vite + TypeScript SPA |
| `backend/` | Node.js + Express API (proxies Supabase) |
| `e2e/` | Playwright end-to-end tests |

## Stack

- **Database**: PostgreSQL via Supabase (with Row-Level Security)
- **Auth**: Supabase Auth (proxied through backend)
- **Frontend**: React 19 + Vite 8 + TypeScript
- **Backend**: Node.js + Express 5 (credentials never reach the browser)
- **Deploy**: Vercel (frontend) + Google Cloud Run (backend)

## Getting started

```bash
# Backend
cd backend && cp .env.example .env  # fill in SUPABASE_URL and SUPABASE_ANON_KEY
npm install && npm run dev           # http://localhost:3001

# Frontend (separate terminal)
cd frontend && cp .env.example .env # VITE_API_URL=http://localhost:3001
npm install && npm run dev           # http://localhost:5173
```

See `CLAUDE.md` for full architecture details and contribution guidelines.
