import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from 'vite-plugin-pwa';
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/',
  server: {
    host: "::",
    port: 5173,
    // Proxy disabled - using remote Digital Ocean backend
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:10000',
    //     changeOrigin: true,
    //     secure: false,
    //   },
    // },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false, // We'll register manually
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw.js',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'safari-pinned-tab.svg'],
      manifest: {
        name: 'Expensoo - Smart Expense Tracker',
        short_name: 'Expensoo',
        description: 'Auto-switching expense tracker that adapts to your device',
        theme_color: '#000000',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.svg',
            sizes: '192x192', 
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: '/pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml', 
            purpose: 'any maskable'
          },
          {
            src: '/pwa-64x64.svg',
            sizes: '64x64',
            type: 'image/svg+xml'
          },
          {
            src: '/pwa-144x144.svg',
            sizes: '144x144', 
            type: 'image/svg+xml'
          }
        ],
        categories: ['finance', 'productivity', 'utilities'],
        screenshots: [
          {
            src: '/screenshot-mobile.png',
            sizes: '390x844',
            type: 'image/png',
            form_factor: 'narrow'
          },
          {
            src: '/screenshot-desktop.png', 
            sizes: '1920x1080',
            type: 'image/png',
            form_factor: 'wide'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          utils: ['date-fns', 'clsx', 'class-variance-authority'],
        },
      },
    },
    // Ensure service worker is copied to build output
    assetsInlineLimit: 0,
  },
  // PWA specific configuration
  define: {
    'process.env': {},
  },
}));
