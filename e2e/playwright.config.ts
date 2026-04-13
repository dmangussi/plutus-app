import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // avoid race conditions on shared test DB
  retries: 1,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'cd ../backend && npm run dev',
      port: 3001,
      reuseExistingServer: true,
      env: {
        SUPABASE_URL:      process.env.SUPABASE_URL_TEST ?? '',
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY_TEST ?? '',
        FRONTEND_URL:      'http://localhost:5173',
      },
    },
    {
      command: 'cd ../frontend && VITE_API_URL=http://localhost:3001 npm run dev',
      port: 5173,
      reuseExistingServer: true,
    },
  ],
})
