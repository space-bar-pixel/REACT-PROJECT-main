import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      'joshua-cerebellar-unspitefully.ngrok-free.dev',
      '.ngrok-free.dev' 
    ],
    proxy: {
      '/api': {
        target: 'http://backend:4000', // <-- CHANGE 'localhost' TO 'backend'
        changeOrigin: true,
        secure: false,
      }
    }
  },
})
