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

### Active

- [ ] **BUG-01**: Create transaction in sales mode immediate redirect fix (Phase 1)
- [ ] **BUG-02**: Dynamically update profits across all sectors on change (Phase 1)
- [ ] **BUG-03**: Fix settings audit log range, expiry entries, and DB purge (Phase 1)
- [ ] **BUG-04**: Enable session revocation/invalidation for admin (Phase 1)
- [ ] **BUG-05**: Fix sales history mobile pagination redirect and overlap (Phase 1)
- [ ] **BUG-06**: Fix edit transaction redirect to dashboard (Phase 1)
- [ ] **BUG-07**: Replace browser confirm() with custom confirmation modal (Phase 1)
- [ ] **BUG-08**: Fix sidebar menu toggle icon state and mobile outside click (Phase 1)
- [ ] **RULE-01**: Complete global sweep to ensure zero browser-native dialogs (Phase 2)
- [ ] **RULE-02**: Mask cost price (CP) everywhere by default with eye toggle (Phase 2)
- [ ] **RULE-03**: Omit empty fields entirely from UI (no placeholders like "N/A" or "-") (Phase 2)
- [ ] **RULE-04**: Remove user-facing explanatory helper text globally (Phase 2)
- [ ] **FEAT-01**: Add Paid / Unpaid toggle to transaction creation (Phase 3)
- [ ] **FEAT-02**: CP eye-toggle component in forms and lists (Phase 3)
- [ ] **BUG-10**: Fix UPI mode repair cost auto-filling customer amount (Phase 3)
- [ ] **FEAT-03**: Convert internal purchase step into Internal Repair mode (Phase 3)
- [ ] **FEAT-04**: Add "Internal Repair" as a third mode in Step 2 of wizard (Phase 3)
- [ ] **FEAT-05**: Restructure Step 3 into exactly three boxes (Job Info, CP, SP) (Phase 3)
- [ ] **FEAT-06**: Expandable inline details on row click in transaction history (Phase 4)
- [ ] **FEAT-07**: Expandable details for sales history (Phase 4)
- [ ] **FEAT-08**: Show details of parts used in the expandable view (Phase 4)
- [ ] **BUG-11**: Welcome message shows display name instead of role/shop name (Phase 5)
- [ ] **FEAT-13**: Show only last 5 transactions on dashboard (Phase 5)
- [ ] **FEAT-14**: Create distinct dashboard metric cards (Today's revenue, unpaid outstanding, week vs last week delta) (Phase 5)
- [ ] **FEAT-15**: Add floating action button (FAB) on mobile for new transaction (Phase 5)
- [ ] **FEAT-10b**: Full professional visual cleanup of Profile page (Phase 6)
- [ ] **FEAT-11**: Add dedicated User Manual page (/manual) (Phase 6)
- [ ] **FEAT-12**: Add name editing to profile with dynamic header update (Phase 6)
- [ ] **BUG-09**: Fix settings page header tabs layout on mobile screens (Phase 6)
- [ ] **FEAT-09**: Notification bell placeholder in navbar with dropdown (Phase 7)
- [ ] **BUG-12**: Global audit and correction of mobile padding/spacing (Phase 7)

### Out of Scope

- **Real-time chat/messaging**: Focus is strictly on transaction bookkeeping and inventory tracking.
- **Offline desktop app syncing**: Native multi-device web client covers mobile and desktop scenarios.

## Context

The application is a React-Vite-TypeScript project. It features styling using Tailwind CSS, a dynamic state layer with standard React hooks, and API integrations with a backend. The codebase has some existing structure for responsive mobile vs desktop tabs and grids, but requires deep optimization to fix minor bugs, redirect issues, and improve visual alignment.

## Constraints

- **Tech Stack**: Must use React, Tailwind CSS, Lucide React, and existing routing pattern (`react-router-dom`).
- **No Browser Dialogs**: Absolute ban on native browser dialogs like `window.confirm()`, `window.alert()`, or `window.prompt()`.
- **Cost Price Privacy**: All cost prices must be masked with a toggle option to prevent leakage to customers.
- **No Placeholders**: Empty values must not render standard placeholders like "N/A" or "-" but should be completely hidden from the UI.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Local GSD Installation | Used local `.agent` folder configuration to manage GSD tools and workflows. | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-04 after GSD Project Initialization*
