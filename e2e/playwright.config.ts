import { defineConfig } from '@playwright/test'
import * as dotenv from 'dotenv'
import { join } from 'path'

dotenv.config({ path: join(__dirname, '.env.test') })

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // tests share a single Supabase test user — run sequentially to avoid DB races
  workers: 1,
  retries: 0,
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
      command: 'cd ../frontend && npm run dev',
      port: 5173,
      reuseExistingServer: true,
      env: {
        VITE_API_URL: 'http://localhost:3001',
      },
    },
  ],
})
