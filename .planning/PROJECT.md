# Expensoo

## What This Is

Expensoo is a professional, mobile-friendly shop transaction manager tailored for mobile repair shops. It provides technicians and admins with tools to track customer repairs, hardware sales, parts inventory from suppliers, shop expenditures, and real-time dashboard analytics.

## Core Value

Ensure accurate profit and transaction tracking for mobile repair shops through an intuitive, mobile-optimized multi-step workflow.

## Requirements

### Validated

- ✓ **CORE-01**: User can log in and manage sessions — *existing*
- ✓ **CORE-02**: User can create, view, edit, and delete transactions — *existing*
- ✓ **CORE-03**: Multi-step transaction wizard supports Sales and Repair modes — *existing*
- ✓ **CORE-04**: User can manage suppliers and track parts inventory — *existing*
- ✓ **CORE-05**: User can log expenditures and view business reports — *existing*
- ✓ **CORE-06**: Invoice/bill generation with WhatsApp sharing — *existing*
- ✓ **BUG-01**: Create transaction in sales mode immediate redirect fix — v1.0
- ✓ **BUG-02**: Dynamically update profits across all sectors on change — v1.0
- ✓ **BUG-03**: Fix settings audit log range, expiry entries, and DB purge — v1.0
- ✓ **BUG-04**: Enable session revocation/invalidation for admin — v1.0
- ✓ **BUG-05**: Fix sales history mobile pagination redirect and overlap — v1.0
- ✓ **BUG-06**: Fix edit transaction redirect to dashboard — v1.0
- ✓ **BUG-07**: Replace browser confirm() with custom confirmation modal — v1.0
- ✓ **BUG-08**: Fix sidebar menu toggle icon state and mobile outside click — v1.0
- ✓ **RULE-01**: Complete global sweep to ensure zero browser-native dialogs — v1.0
- ✓ **RULE-02**: Mask cost price (CP) everywhere by default with eye toggle — v1.0
- ✓ **RULE-03**: Omit empty fields entirely from UI (no placeholders like "N/A" or "-") — v1.0
- ✓ **RULE-04**: Remove user-facing explanatory helper text globally — v1.0
- ✓ **FEAT-01**: Add Paid / Unpaid toggle to transaction creation — v1.0
- ✓ **FEAT-02**: CP eye-toggle component in forms and lists — v1.0
- ✓ **BUG-10**: Fix UPI mode repair cost auto-filling customer amount — v1.0
- ✓ **FEAT-03**: Convert internal purchase step into Internal Repair mode — v1.0
- ✓ **FEAT-04**: Add "Internal Repair" as a third mode in Step 2 of wizard — v1.0
- ✓ **FEAT-05**: Restructure Step 3 into exactly three boxes (Job Info, CP, SP) — v1.0
- ✓ **FEAT-06**: Expandable inline details on row click in transaction history — v1.0
- ✓ **FEAT-07**: Expandable details for sales history — v1.0
- ✓ **FEAT-08**: Show details of parts used in the expandable view — v1.0
- ✓ **BUG-11**: Welcome message shows display name instead of role/shop name — v1.0
- ✓ **FEAT-13**: Show only last 5 transactions on dashboard — v1.0
- ✓ **FEAT-14**: Create distinct dashboard metric cards (Today's revenue, unpaid outstanding, week vs last week delta) — v1.0
- ✓ **FEAT-15**: Add floating action button (FAB) on mobile for new transaction — v1.0
- ✓ **FEAT-10b**: Full professional visual cleanup of Profile page — v1.0
- ✓ **FEAT-11**: Add dedicated User Manual page (/manual) — v1.0
- ✓ **FEAT-12**: Add name editing to profile with dynamic header update — v1.0
- ✓ **BUG-09**: Fix settings page header tabs layout on mobile screens — v1.0
- ✓ **FEAT-09**: Notification bell placeholder in navbar with dropdown — v1.0
- ✓ **BUG-12**: Global audit and correction of mobile padding/spacing — v1.0

### Active

(None yet — planning next milestone)

### Out of Scope

- **Real-time chat/messaging**: Focus is strictly on transaction bookkeeping and inventory tracking.
- **Offline desktop app syncing**: Native multi-device web client covers mobile and desktop scenarios.

## Context

The application is a React-Vite-TypeScript project. It features styling using Tailwind CSS, a dynamic state layer with standard React hooks, and API integrations with a backend. We successfully resolved all critical bugs, completed visual redesign of report sheets and custom confirmation dialogs, added period filter dropdowns to the dashboard, and built full project documentation under `docs/`.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Local GSD Installation | Used local `.agent` folder configuration to manage GSD tools and workflows. | ✓ Good |
| Dropdown Date Filtering | Swapped static button pills for a sleek glassmorphic select dropdown on the dashboard. | ✓ Good |
| Resilient Card Locators | Swapped text-based locator matching in E2E tests for static card ID selectors to avoid test timeouts. | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

---
*Last updated: 2026-06-10 after v1.0 milestone completion*
