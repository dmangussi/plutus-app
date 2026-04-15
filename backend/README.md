# Plutus — Backend

Express 5 API that proxies all Supabase operations. Database credentials never reach the browser. Deployed on Google Cloud Run.

## Dev

```bash
cp .env.example .env   # fill in SUPABASE_URL, SUPABASE_ANON_KEY, FRONTEND_URL
npm install
npm run dev            # http://localhost:3001
```

## Deploy (Google Cloud Run)

Auto-deployed via Cloud Build trigger on push to `main`. The Dockerfile in `backend/` runs a multi-stage build.

- **Region:** us-central1
- **Env vars:** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `FRONTEND_URL`

## Routes

```
GET    /api/auth/me
POST   /api/auth/signin       { email, password }
POST   /api/auth/signup       { email, password }
DELETE /api/auth/signout

GET    /api/categories

GET    /api/dashboard?period=YYYY-MM

GET    /api/transactions?period=YYYY-MM[&category=uuid][&dedup=true]
POST   /api/transactions      { user_id, description, amount, date, billing_period, ... }
POST   /api/transactions/batch  [ ...transactions ]
PATCH  /api/transactions/:id  { description?, amount?, category_id? }
DELETE /api/transactions/:id
```

All routes except `/api/auth/*` require `Authorization: Bearer {token}`.
