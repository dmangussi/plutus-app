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

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                     React 19 + Vite + TypeScript                    │  │
│   │                         (Vercel CDN)                                │  │
│   │                                                                     │  │
│   │  ┌─────────────┐  ┌──────────────┐  ┌───────────┐  ┌───────────┐  │  │
│   │  │  Dashboard  │  │ Transactions │  │  Import   │  │  Profile  │  │  │
│   │  │    Page     │  │    Page      │  │   Page    │  │   Page    │  │  │
│   │  └──────┬──────┘  └──────┬───────┘  └─────┬─────┘  └─────┬─────┘  │  │
│   │         │                │                 │               │        │  │
│   │  ┌──────▼────────────────▼─────────────────▼───────────────▼─────┐ │  │
│   │  │              Shared State & Hooks                              │ │  │
│   │  │   useAuth (Context)  │  useCategories (module cache)          │ │  │
│   │  └──────────────────────┬─────────────────────────────────────────┘ │  │
│   │                         │                                           │  │
│   │  ┌──────────────────────▼─────────────────────────────────────────┐ │  │
│   │  │           lib/api.ts → apiFetch()                              │ │  │
│   │  │        Authorization: Bearer {JWT} (sessionStorage)            │ │  │
│   │  └──────────────────────────────────────────────────────────────── │  │
│   │                                                                     │  │
│   │  ┌────────────────────────┐                                        │  │
│   │  │  utils/csv.ts          │  ← Itaú CSV parsed entirely in-browser │  │
│   │  │  parseCSV()            │    (no file upload to server)          │  │
│   │  │  normalizeDescription()│                                        │  │
│   │  └────────────────────────┘                                        │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │  HTTPS / REST
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                      │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │              Node.js + Express 5 + TypeScript                       │  │
│   │                  (Google Cloud Run — Docker)                        │  │
│   │                                                                     │  │
│   │  ┌──────────────────────────────────────────────────────────────┐  │  │
│   │  │                    Middleware Pipeline                        │  │  │
│   │  │   CORS  →  JSON parser  →  auth.ts (JWT verify)  →  Routes   │  │  │
│   │  └──────────────────────────────────────────────────────────────┘  │  │
│   │                                                                     │  │
│   │  ┌────────────┐  ┌──────────────────┐  ┌────────────┐             │  │
│   │  │ /api/auth  │  │ /api/transactions │  │ /api/dash- │             │  │
│   │  │ signin     │  │ GET  (list+dedup) │  │ board      │             │  │
│   │  │ signup     │  │ POST (create)     │  │            │             │  │
│   │  │ signout    │  │ PATCH (update)    │  │ GET summary│             │  │
│   │  │ change-pwd │  │ DELETE            │  │ (RPC)      │             │  │
│   │  │ /me        │  │ POST /batch       │  └─────┬──────┘             │  │
│   │  └─────┬──────┘  │ GET /history-cat  │        │                    │  │
│   │        │         └────────┬──────────┘        │                    │  │
│   │        │                  │                    │                    │  │
│   │  ┌─────▼──────────────────▼────────────────────▼────────────────┐  │  │
│   │  │            lib/schemas.ts (Zod validation)                   │  │  │
│   │  │   SignIn │ TransactionCreate │ TransactionUpdate │ Dashboard  │  │  │
│   │  └────────────────────────────────────────────────────────────── │  │  │
│   │                                                                   │  │  │
│   │  ┌────────────────────────────────────────────────────────────┐  │  │  │
│   │  │          lib/supabase.ts                                   │  │  │  │
│   │  │  createAuthedClient(jwt) → RLS enforced per request        │  │  │  │
│   │  │  createAnonClient()      → auth operations only            │  │  │  │
│   │  └────────────────────────────────────────────────────────────┘  │  │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │  HTTPS / REST (Supabase SDK)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER  (Supabase)                            │
│                                                                             │
│   ┌──────────────────────────┐      ┌──────────────────────────────────┐  │
│   │      Supabase Auth        │      │         PostgreSQL (RLS)          │  │
│   │                          │      │                                  │  │
│   │  JWT issuance/validation │      │  ┌────────────┐ ┌─────────────┐ │  │
│   │  signInWithPassword()    │      │  │ categories │ │transactions │ │  │
│   │  PUT /auth/v1/user       │      │  │            │ │             │ │  │
│   │   (REST — no session)    │      │  │ id         │ │ id          │ │  │
│   └──────────────────────────┘      │  │ name       │ │ user_id     │ │  │
│                                     │  │ emoji      │ │ description │ │  │
│                                     │  │ color      │ │ amount      │ │  │
│                                     │  └────────────┘ │ date        │ │  │
│                                     │                  │ billing_prd │ │  │
│                                     │  ┌────────────┐  │ category_id │ │  │
│                                     │  │  RPCs      │  │ installments│ │  │
│                                     │  │ dashboard_ │  └─────────────┘ │  │
│                                     │  │ summary()  │                  │  │
│                                     │  └────────────┘                  │  │
│                                     └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           CI / CD LAYER                                     │
│                                                                             │
│   git push origin <branch>                                                  │
│         │                                                                   │
│         ├──→ GitHub Actions (ci.yml)                                        │
│         │       frontend: typecheck → lint → vitest                         │
│         │       backend:  tsc --noEmit                                      │
│         │       e2e:      Playwright (real Supabase test project)           │
│         │                                                                   │
│         ├──→ GitHub Actions (auto-merge.yml)                                │
│         │       gh pr merge --auto --squash --delete-branch                 │
│         │                                                                   │
│         ├──→ Vercel               → frontend deploy (on merge to main)      │
│         └──→ Cloud Build trigger  → Docker build → Cloud Run deploy         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Explanation

| Component | Responsibility |
|---|---|
| **React Pages** | Each view is an independent component; no router — `App.tsx` controls navigation via `view` state |
| **apiFetch** | Single HTTP wrapper for all API calls — injects JWT and centralises error handling |
| **utils/csv.ts** | Itaú CSV parsing and description normalisation runs entirely in the browser (no file upload) |
| **Express Routes** | Stateless API — each request creates a Supabase client scoped to the user's JWT |
| **Zod Schemas** | Input validation on every route before touching the database |
| **createAuthedClient** | Per-request Supabase client with JWT; database RLS is enforced transparently |
| **Supabase Auth** | Issues JWTs; password change calls `PUT /auth/v1/user` directly via REST (SDK requires a full session) |
| **PostgreSQL RLS** | Row-Level Security enforces per-user data isolation at the database level — no manual filtering in backend |
| **CI/CD** | Three-job pipeline (frontend, backend, e2e); auto-merge + auto-delete-branch after CI passes |
