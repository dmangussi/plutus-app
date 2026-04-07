# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Plutus is a family finance tracker (Brazilian Portuguese UI). React 18 + Vite + TypeScript frontend talking directly to Supabase (PostgreSQL + Auth). AI-powered CSV import classifies transactions via Anthropic Claude API. No backend server yet.

## Commands

```bash
# Development (from frontend/)
npm run dev          # Vite dev server on http://localhost:5173
npm run build        # TypeScript check + Vite production build
npm run preview      # Preview production build

# Docker alternative (from frontend/)
docker-compose up    # Runs dev server in container on port 5173
```

No test framework is configured. No linter is configured.

## Architecture

### Frontend routing
No React Router. `App.tsx` holds a `view` state (`'dashboard' | 'transactions' | 'import'`) and conditionally renders the matching page component. Bottom nav bar switches views.

### Data layer
All data access goes through Supabase client (`lib/supabase.ts`) using typed queries. `useAuth` is a global Context provider (session). `useCategories` is a local hook (fetches on mount per page). Each page queries Supabase directly — no shared transaction state. Dashboard uses RPCs (`dashboard_summary`, `monthly_evolution`) for server-side aggregation instead of `SELECT *`. Transactions page uses server-side filters (`.eq()`). Import page fetches only deduplication columns (`description, amount, date`). All `useEffect` fetches use a `cancelled` flag to prevent StrictMode double-fetch. After mutations, pages refetch their own data.

### Authentication
`useAuth()` hook wraps Supabase Auth (email/password). All database tables have Row-Level Security policies scoped to `auth.uid()`. If no session exists, `App.tsx` renders the `<Auth />` page.

### CSV Import + AI Classification
1. `parseCSV()` in `utils/csv.ts` parses Itaú bank CSV format
2. `classify()` routes to real AI or mock based on `USE_MOCK_AI` flag in `utils/mockClassification.ts`
3. Real AI calls `/api/anthropic/v1/messages` — Vite proxies this to `https://api.anthropic.com` (configured in `vite.config.ts`) adding auth headers
4. User reviews AI suggestions, edits categories, then confirms insert to Supabase

### Database
Schema in `db/migrations/001_initial_schema.sql`. Tables: `family_members`, `cards`, `categories`, `transactions`, `category_memory`, `budgets`. RPCs in `db/migrations/002_dashboard_rpcs.sql`: `dashboard_summary(p_period)`, `monthly_evolution()`. Migrations are applied manually via Supabase SQL Editor. Types mirror the schema in `src/types/database.ts`.

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
- No `as any`. Use `as never` only at Supabase query boundaries where the generated types mismatch.
- No `eslint-disable` comments. Fix the root cause instead.
- All new components must have typed props (no implicit `any`).

### Small Releases
- Each commit should be a single cohesive change that builds successfully (`npm run build`).
- Verify the build passes before considering work done.

## Environment Variables

Required in `frontend/.env`:
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anonymous key
- `ANTHROPIC_API_KEY` — For AI classification (server-side proxy only)
