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
All data access goes through Supabase client (`lib/supabase.ts`) using typed queries. Custom hooks (`useAuth`, `useTransactions`, `useCategories`) wrap Supabase calls. No global state management — hooks + local component state only. Mutations trigger `window.location.reload()` to resync.

### Authentication
`useAuth()` hook wraps Supabase Auth (email/password). All database tables have Row-Level Security policies scoped to `auth.uid()`. If no session exists, `App.tsx` renders the `<Auth />` page.

### CSV Import + AI Classification
1. `parseCSV()` in `utils/csv.ts` parses Itaú bank CSV format
2. `classify()` routes to real AI or mock based on `USE_MOCK_AI` flag in `utils/mockClassification.ts`
3. Real AI calls `/api/anthropic/v1/messages` — Vite proxies this to `https://api.anthropic.com` (configured in `vite.config.ts`) adding auth headers
4. User reviews AI suggestions, edits categories, then confirms insert to Supabase

### Database
Schema in `db/migrations/001_initial_schema.sql`. Tables: `family_members`, `cards`, `categories`, `transactions`, `category_memory`, `budgets`. Migrations are applied manually via Supabase SQL Editor. Types mirror the schema in `src/types/database.ts`.

### Styling
Inline styles only (no CSS framework). Dark theme with color constants defined per component. Fonts: Lora (headings), Inter (body) loaded from Google Fonts in `index.html`.

## Environment Variables

Required in `frontend/.env`:
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anonymous key
- `ANTHROPIC_API_KEY` — For AI classification (server-side proxy only)
