# Architecture Guide

This document outlines the client-side architectural design of Expensoo, covering routing, state management, contexts, and custom UI subsystems.

## 🗺️ Routing & Layouts
The application is structured as a Single Page Application (SPA) using **React Router DOM**.
- **`App.tsx`**: Defines all routing endpoints. Pages are lazy-loaded via `React.lazy()` to optimize initial bundle delivery.
- **`ProtectedRoute.tsx`**: Wraps authenticated routes. Validates session state, token expiration, and role-based permissions (`requiredPermission`, `requiredRoles`).
- **`AppLayout.tsx`**: Implements the main navigation sidebar, theme selector, and user header panel.
- **`ErrorBoundary.tsx`**: Captures unhandled runtime errors at the boundary level and renders a recovery view.

## 🔐 State Management & Contexts
Expensoo utilizes React Context Providers for global state tracking:
1. **`AuthContext.tsx`**:
   - Manages JWT session tokens, active user information, and roles.
   - Restores session state from local storage.
   - Exposes `hasAccess(permissions)` for granular UI controls.
2. **`LanguageContext.tsx`**:
   - Manages internationalization (i18n).
   - Translates text content dynamically via a `t()` function mapping to localized dictionary JSON files.

## 📡 API Client & State Layer
Located in `src/lib/api.ts`, the `apiClient` is the primary interface for backend service queries:
- **Abort Controller Support**: Employs query abort signals to cancel outbound requests on timeouts or component unmounts.
- **WebSocket Synchronization**: Connects to the backend via `socket.io-client` on the Dashboard and lists pages to receive mutation notifications (`transactionCreated`, `expenditureUpdated`, etc.), triggering reload-free, real-time UI updates.

## 🎨 UI Atoms & Component Design
The project follows a component-driven atomic design:
- **`field-input-group.tsx`**: Renders forms with built-in validation states, icons, and error labels.
- **`date-picker.tsx`**: Viewport-aware calendar picker that falls back to native date inputs on mobile.
- **`ConfirmModal.tsx`**: Portal-based, custom dialog utility that replaces native browser blockages (`window.confirm`).
- **Glassmorphic Overlays**: Styled with Tailwind, employing `backdrop-blur` and custom HSL variables to create clean dark-mode visuals.
