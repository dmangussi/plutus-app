import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
/// <reference types="vitest" />

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      watch: {
        usePolling: true,
      },
      proxy: {
        '/api/anthropic': {
          target: 'https://api.anthropic.com',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api\/anthropic/, ''),
          headers: {
            'x-api-key': env.ANTHROPIC_API_KEY ?? '',
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
        },
      },
    },
    test: {
      environment: 'node',
    },
  }
})