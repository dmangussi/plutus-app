# Plutus — Frontend

React 18 + Vite + TypeScript. Deployed on Vercel.

## Dev

```bash
cp .env.example .env   # set VITE_API_URL=http://localhost:3001
npm install
npm run dev            # http://localhost:5173
```

## Build

```bash
npm run build      # TypeScript check + Vite production build
npm run typecheck  # type-check only
npm run lint       # ESLint
npm run test       # Vitest unit tests
```
