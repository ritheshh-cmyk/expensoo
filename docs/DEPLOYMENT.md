# Deployment Guide

This document outlines the deployment process and hosting configurations for the Expensoo frontend application.

## ☁️ Vercel Deployment
The application is pre-configured to build and host on **Vercel**.

### 📄 Configuration (`vercel.json`)
Since Expensoo uses React Router client-side routing, the hosting environment must route all path requests to `index.html`:
```json
{
  "cleanUrls": true,
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### ⚙️ Build Settings
When setting up a project in Vercel:
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## 📲 Progressive Web App (PWA) Delivery
During the build step, Vite compiles the Service Worker (`sw.js`):
- All main assets are cataloged in `sw.js` for local caching.
- On client updates, the browser detects a change in the compiled Service Worker and prompts the user to refresh, guaranteeing zero-downtime client-side updates.
