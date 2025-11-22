import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import checker from 'vite-plugin-checker'
import compression from 'vite-plugin-compression'
import { visualizer } from 'rollup-plugin-visualizer'
import { VitePWA } from 'vite-plugin-pwa'
import webfontDownload from 'vite-plugin-webfont-dl'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),

    // Import SVGs as React components
    svgr(),

    // TypeScript error overlay in browser
    checker({
      typescript: true,
    }),

    // Gzip compression for production builds
    compression({
      algorithm: 'gzip',
      ext: '.gz',
    }),

    // Brotli compression (better compression ratio)
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),

    // Bundle analyzer (generates stats.html after build)
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),

    // PWA support
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['t2h_logo.png'],
      manifest: {
        name: 'Toast2Host - Alumni Connect',
        short_name: 'Toast2Host',
        description: 'Find and connect with university alumni in your area',
        theme_color: '#ffc510',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/t2h_logo.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/t2h_logo.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),

    // Download Google Fonts locally for better privacy/performance
    webfontDownload([
      'https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700;800;900&display=swap',
    ]),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
