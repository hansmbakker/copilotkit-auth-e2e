import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
