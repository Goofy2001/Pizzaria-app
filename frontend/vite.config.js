/**
 * VITE CONFIGURATION
 * Auteur: GitHub Copilot
 * Doel: Frontend build tool configuratie
 * Features: React plugin, SSL support, local IP exposure
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import os from 'node:os'

function getLocalIp() {
  const interfaces = os.networkInterfaces()

  for (const networkGroup of Object.values(interfaces)) {
    for (const network of networkGroup || []) {
      if (network.family === 'IPv4' && !network.internal) {
        return network.address
      }
    }
  }

  return 'localhost'
}

// https://vite.dev/config/
// Vite setup: React plugin + dev proxy to backend API and Socket.IO.
export default defineConfig({
  plugins: [
    basicSsl(),
    react(),
    {
      name: 'phone-url-logger',
      configureServer(server) {
        server.httpServer?.once('listening', () => {
          const address = server.httpServer?.address()
          const port = typeof address === 'object' && address ? address.port : 5174
          const ip = getLocalIp()
          console.log(`\n📱 Phone URL: https://${ip}:${port}\n`)
        })
      },
    },
  ],
  server: {
    host: '0.0.0.0',
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:8000',
        ws: true,
      },
    },
  },
})
