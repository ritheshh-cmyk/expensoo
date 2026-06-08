import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:10000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifestFilename: 'manifest.webmanifest',
      manifest: {
        name: 'CallMeMobiles Professional',
        short_name: 'CallMeMobiles',
        theme_color: '#d97757',
        background_color: '#09090b',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icons/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/backendmobile-4swg\.onrender\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 5 * 60 // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
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
  optimizeDeps: {
    include: ['react-joyride'],
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        interop: 'auto',
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
          ],
          charts: ['recharts'],
          realtime: ['socket.io-client'],
          utils: ['clsx', 'class-variance-authority', 'tailwind-merge'],
        },
      },
    },
    commonjsOptions: {
      include: [/react-joyride/, /node_modules/],
    },
    assetsInlineLimit: 0,
  },
  // define: {
  //   'process.env': {},
  // },
});
