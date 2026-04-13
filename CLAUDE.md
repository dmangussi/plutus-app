# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Plutus is a family finance tracker (Brazilian Portuguese UI). React 18 + Vite + TypeScript frontend communicating with a Node.js + Express backend, which proxies all Supabase (PostgreSQL + Auth) operations. The browser never sees database credentials. CSV import parses Itaú bank exports; users assign categories manually.

## Commands

```bash
# Backend (from backend/)
npm install
npm run dev        # Express API on http://localhost:3001

# Frontend (from frontend/)
npm install
npm run dev        # Vite dev server on http://localhost:5173
npm run build      # TypeScript check + Vite production build
npm run preview    # Preview production build

# Quality checks (from frontend/) — run before committing
npm run typecheck  # TypeScript type-check without emitting files
npm run lint       # ESLint (TypeScript + React Hooks rules)
npm run test       # Vitest unit tests

# Deploy
vercel --prod      # from repo root
```

## Testing

**Unit tests — Runner:** Vitest (`npm run test` from `frontend/`). Executes in ~400ms.

**Scope — what is tested:**
- Pure utility functions in `src/utils/`: `parseCSV`, `formatCurrency`, `periodKey`, `periodLabel`
- Test files: colocated `*.test.ts` alongside each source file

**Scope — intentionally not tested:**
- React components — no jsdom configured (YAGNI: bugs are immediately visible in the browser)
- Backend routes — exercised by E2E tests against a real Supabase test project
- Hooks (`useAuth`, `useCategories`, etc.) — depend on API fetch context

**E2E tests — Runner:** Playwright (`npm test` from `e2e/`).
- Requires backend + frontend running (auto-started via `webServer` config)
- Uses a dedicated Supabase test project (credentials in `e2e/.env.test`)

**Rules:**
- Before committing, all three must pass: `npm run test`, `npm run lint`, `npm run typecheck`
- Each `it` block tests one behavior. Use real Itaú-format strings in description tests.
- When modifying an exported utility function, update its JSDoc in the same commit.
- If a test reveals a bug in source, fix the source — never adjust the test to hide the bug.
- Do not test unexported helpers directly; test them via the exported function they belong to.

## Architecture

### Frontend routing
No React Router. `App.tsx` holds a `view` state (`'dashboard' | 'transactions' | 'import'`) and conditionally renders the matching page component. Bottom nav bar switches views.

### Data layer
All data access goes through the Express backend at `/api/*`. Frontend uses `lib/api.ts` (`apiFetch`) for every request — credentials never reach the browser. `useAuth` is a global Context provider (session token stored in `sessionStorage`). `useCategories` is a local hook with a module-level cache. Each page calls `apiFetch` directly — no shared transaction state. After mutations, pages refetch their own data.

### Authentication
`useAuth()` calls `/api/auth/*`. On mount it reads the token from `sessionStorage` and validates it via `GET /api/auth/me`. On sign-in, the backend returns `{access_token, user}` which is stored in `sessionStorage`. All subsequent requests include `Authorization: Bearer {token}`. The backend creates a Supabase client scoped to that JWT, so RLS policies are enforced transparently.

### CSV Import
1. `parseCSV()` in `utils/csv.ts` parses Itaú bank CSV format
2. User reviews all parsed transactions and assigns categories manually
3. Duplicate detection uses `raw_description|amount|date` scoped to the selected `billing_period`
4. Confirmed transactions are batch-inserted via `POST /api/transactions/batch`

### Backend (Express)
Routes in `backend/src/routes/`: `auth`, `categories`, `transactions`, `dashboard`. All data routes require a Bearer token (`middleware/auth.ts`). The Supabase client is created per-request with the user's JWT (`lib/supabase.ts`), preserving RLS. The backend exports the Express app as default — Vercel runs it as serverless; locally it binds to port 3001.

### Database
Schema in `db/migrations/001_initial_schema.sql`. Active tables: `categories`, `transactions`. RPC in `db/migrations/002_dashboard_rpcs.sql`: `dashboard_summary(p_period)`. Migrations are applied manually via Supabase SQL Editor. Types mirror the schema in `src/types/database.ts`.

### Styling
Inline styles only (no CSS framework). Dark theme with shared tokens in `styles/theme.ts` (colors, fonts) and `styles/common.ts` (base input/button/label styles). Fonts: Lora (headings), Inter (body) loaded from Google Fonts in `index.html`.

### Shared components
Reusable UI primitives in `components/`: `PageHeader`, `Modal`, `ErrorMessage`, `LoadingPlaceholder`, `EmptyState`. Always prefer these over inlining the same pattern.

## Extreme Programming Guidelines

These rules apply to **every** code change in this repo. Treat violations as bugs.

### DRY — Don't Repeat Yourself
- Never duplicate color values, font families, or style objects. Use `styles/theme.ts` and `styles/common.ts`.
- If the same UI pattern appears in 2+ places, extract it to `components/`.
- If the same data derivation appears in 2+ hooks/pages, extract a shared utility or hook.

### YAGNI — You Ain't Gonna Need It
- Do not add features, parameters, config flags, or abstractions "just in case".
- Do not create wrapper functions, helper files, or indirection layers for one-time operations.
- Three similar lines of code is better than a premature abstraction.

### Simple Design
- Each function/component does one thing. If a component exceeds ~150 lines, look for extraction opportunities.
- Prefer flat code over deeply nested callbacks or ternaries.
- No dead code, unused imports, or commented-out blocks. Delete instead of commenting.

### Continuous Refactoring
- Before adding new code, check if existing shared components/styles cover the need.
- After finishing a feature, review the diff for new duplication introduced and eliminate it.
- Keep `styles/theme.ts` as the single source of truth for visual tokens (colors, fonts, spacing).

### Type Safety
- No `as any`. Use `as never` only at API response boundaries where types mismatch.
- No `eslint-disable` comments. Fix the root cause instead.
- All new components must have typed props (no implicit `any`).

### Small Releases
- Each commit should be a single cohesive change that builds successfully (`npm run build`).
- Verify the build passes before considering work done.

## Environment Variables

```bash
# frontend/.env (dev only — not committed)
VITE_API_URL=http://localhost:3001

# backend/.env (dev only — not committed)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
FRONTEND_URL=http://localhost:5173
PORT=3001

# Vercel (production) — set in Vercel dashboard
SUPABASE_URL
SUPABASE_ANON_KEY
FRONTEND_URL
```
