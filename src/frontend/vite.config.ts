import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        // MSAL v5 redirect bridge page for popup flows
        authRedirect: resolve(import.meta.dirname, 'auth-redirect.html'),
      },
    },
  },
  server: {
    proxy: {
      // Proxy API calls to the app service
      '/copilotkit': {
        target: process.env.COPILOT_RUNTIME_HTTPS || process.env.COPILOT_RUNTIME_HTTP,
        changeOrigin: true
      }
    }
  }
})
