import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: Number(process.env.PORT) || 3000,
    allowedHosts: ['localhost', '127.0.0.1']
  },
  preview: {
    host: true,
    port: Number(process.env.PORT) || 3000,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'iat-cursor-lex-production.up.railway.app',
      '.railway.app'
    ]
  }
})
