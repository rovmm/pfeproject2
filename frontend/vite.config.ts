import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (_proxyReq, req) => {
            console.log(`[proxy] --> ${req.method} ${req.url}`)
          })
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log(`[proxy] <-- ${proxyRes.statusCode} ${req.method} ${req.url}`)
          })
          proxy.on('error', (err, req) => {
            console.log(`[proxy] ERROR ${req.method} ${req.url}: ${err.message}`)
          })
        },
      },
    },
  },
})
