import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
/// <reference types="vitest" />

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true,
    },
  },
  test: {
    environment: 'node',
  },
})
