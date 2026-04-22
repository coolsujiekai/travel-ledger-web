import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Travel Ledger - 旅游记账',
        short_name: 'Travel Ledger',
        description: '简单的旅行记账工具',
        theme_color: '#000000',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/'
      }
    })
  ],
  server: {
    host: true
  }
})
