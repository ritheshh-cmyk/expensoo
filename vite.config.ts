import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/expensoo/' : '/',
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api': {
        target: 'https://positive-kodiak-friendly.ngrok-free.app',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [react()],
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
