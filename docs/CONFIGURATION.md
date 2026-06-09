# Configuration Reference

This document provides details on configuring Expensoo for local development and production deployments.

## 🔑 Environment Variables
The application relies on environment variables loaded at build time via Vite:

- **`.env`** (Local Development):
  ```env
  VITE_PRODUCTION_BACKEND_URL=https://backendmobile-4swg.onrender.com
  VITE_PRODUCTION_WEBSOCKET_URL=https://backendmobile-4swg.onrender.com
  ```
- **`.env.production`** (Production Builds):
  ```env
  VITE_PRODUCTION_BACKEND_URL=https://backendmobile-4swg.onrender.com
  VITE_PRODUCTION_WEBSOCKET_URL=https://backendmobile-4swg.onrender.com
  ```

*Note: In local development, if no env variables are specified, the API client automatically falls back to `https://backendmobile-4swg.onrender.com`.*

## ⚡ Webpack & Vite Settings (`vite.config.ts`)
The build configuration optimizes dependencies and configures the Progressive Web App (PWA):

1. **Vite PWA Plugin**:
   - `injectRegister: 'auto'`: Automatically registers the Service Worker in the browser.
   - `manifest`: Generates `manifest.webmanifest` defining the app icon, theme color (`#0c0c14`), and display mode (`standalone`).
   - `precache`: Precaches HTML, JS, CSS, and SVG assets for offline capabilities.
2. **Rollup Interop**:
   - Configures CommonJS fallback options for third-party libraries (e.g. `react-joyride` and `react-confetti`) to guarantee successful rollup bundling.
