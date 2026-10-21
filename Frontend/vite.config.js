import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['sigmagpt-qag5.onrender.com'],
  },
  preview: {
    allowedHosts: ['sigmagpt-qag5.onrender.com'],
  },
})