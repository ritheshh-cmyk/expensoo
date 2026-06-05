# Roadmap: Expensoo Upgrades

## Overview
This roadmap details a 7-phase plan to address critical bug fixes, enforce cost price privacy, overhaul the transaction creation flow, upgrade history pages, polish the dashboard, clean up profile and settings pages, and optimize global mobile responsiveness.

## Phases

- [ ] **Phase 1: Critical Bug Fixes** - Resolve core functionality bugs (BUG-01 to BUG-08)
- [ ] **Phase 2: Global Rule Enforcement** - Verify zero native alerts and mask cost prices globally (RULE-01 to RULE-04)
- [ ] **Phase 3: Multistep Transaction Overhaul** - Introduce Paid/Unpaid, CP toggle, UPI fixes, and Internal Repair mode (FORM-01 to FORM-06)
- [x] **Phase 4: History Upgrades** - Implement expandable rows, mobile slide-up sheets, and parts info (HIST-01 to HIST-03)
- [x] **Phase 5: Dashboard Upgrade** - Personalized welcome, last 5 transactions list, metric cards, and Mobile FAB (DASH-01 to DASH-04)
- [x] **Phase 6: Settings, Profile & Manual Cleanup** - UI cleanup, horizontal mobile tabs, display name sync, and User Manual (CONF-01 to CONF-04)
- [x] **Phase 7: New Features & Global Polish** - Add notification bell with dropdown, and global mobile spacing checks (FEAT-01 to FEAT-02)

## Phase Details

### Phase 1: Critical Bug Fixes
**Goal**: Resolve application-breaking bugs and set up custom confirmation modal.
**Depends on**: Nothing
**Requirements**: BUG-01, BUG-02, BUG-03, BUG-04, BUG-05, BUG-06, BUG-07, BUG-08
**Success Criteria**:
  1. User can successfully submit Sales transactions without redirection or errors.
  2. Total profits on dashboard and reports update reactively upon adding/editing/deleting transactions.
  3. Settings audit log displays all events default to 30 days and DB cleans up old logs.
  4. Admin can revoke user sessions, and deleted transactions use the custom modal.
  5. Mobile pagination in Sales History works without overlaps.
  6. Edit transaction does not navigate to dashboard prematurely.
  7. Mobile sidebar can be closed by clicking outside.
**Plans**: 1 plan

Plans:
- [x] 01-01: Implement custom confirmation modal, fix session logs, and solve redirection issues.

### Phase 2: Global Rule Enforcement
**Goal**: Enforce privacy and clean layout by sweeping codebase for global constraints.
**Depends on**: Phase 1
**Requirements**: RULE-01, RULE-02, RULE-03, RULE-04
**Success Criteria**:
  1. No window.confirm or window.alert references left in the codebase.
  2. All Cost Price (CP) displays are masked by default with an eye toggle.
  3. Empty fields do not show N/A placeholders and are hidden from UI.
  4. Explanatory helper texts are removed from all views.
**Plans**: 1 plan

Plans:
- [x] 02-01: Sweep codebase for browser dialogs, mask cost price (CP) globally, hide empty elements, and clean descriptions.

### Phase 3: Multistep Transaction Overhaul
**Goal**: Integrate Paid/Unpaid flag, UPI fix, Internal Repair mode, and restructured Step 3.
**Depends on**: Phase 2
**Requirements**: FORM-01, FORM-02, FORM-03, FORM-04, FORM-05, FORM-06
**Success Criteria**:
  1. User can set transaction payment status as Paid/Unpaid.
  2. Wizard Step 2 includes "Internal Repair" mode, hiding payment options.
  3. UPI mode does not auto-populate customer payment with Cost Price (CP).
  4. Wizard Step 3 is restructured into exactly three layout blocks: Job Info, CP, and SP.
**Plans**: 1 plan

Plans:
- [x] 03-01: Restructure Multistep Transaction form steps, fix UPI pre-filling, and add Internal Repair details form.

### Phase 4: History Upgrades
**Goal**: Make transactions and sales history details expandable instead of navigating away.
**Depends on**: Phase 3
**Requirements**: HIST-01, HIST-02, HIST-03
**Success Criteria**:
  1. Row click in history expands to inline accordion on desktop.
  2. Row click in history opens a slide-up bottom sheet on mobile.
  3. Expandable detail lists all transaction fields, parts used, and supplier names.
**Plans**: 1 plan

Plans:
- [x] 04-01: Update Transactions and Sales History page tables with expandable row details and mobile bottom sheets.

### Phase 5: Dashboard Upgrade
**Goal**: Make dashboard professional with custom metrics, last 5 items, and Mobile FAB.
**Depends on**: Phase 4
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04
**Success Criteria**:
  1. Welcome card greets user with their actual display name instead of role.
  2. Dashboard shows maximum 5 most-recent transactions.
  3. Today's revenue, unpaid outstanding, and WoW comparison cards show up.
  4. Mobile dashboard displays a floating "+" action button for new transactions.
**Plans**: 1 plan

Plans:
- [x] 05-01: Polish dashboard metrics, limit list, dynamically display actual name, and add mobile action FAB.

### Phase 6: Settings, Profile & Manual Cleanup
**Goal**: User manual page, display name editing, and settings mobile tabs.
**Depends on**: Phase 5
**Requirements**: CONF-01, CONF-02, CONF-03, CONF-04
**Success Criteria**:
  1. Users can change their display name and it propagates in real-time.
  2. Settings tabs bar scroll horizontally or stack correctly on mobile viewports.
  3. A clean User Manual (/manual) describes step-by-step help content.
**Plans**: 1 plan

Plans:
- [x] 06-01: Clean up profile layout, configure manual page, implement display name change, and fix settings tabs overflow.

### Phase 7: New Features & Global Polish
**Goal**: Extensible notification bell with dropdown, and global mobile spacing checks.
**Depends on**: Phase 6
**Requirements**: FEAT-01, FEAT-02
**Success Criteria**:
  1. Notification bell icon in navbar opens dropdown with empty states.
  2. Mobile viewport at 375px has comfortable spacing without horizontal scrolling.
**Plans**: 1 plan

Plans:
- [x] 07-01: Add notification bell component to Header context, and audit/reduce spacing gaps on all views for mobile.

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Critical Bug Fixes | 1/1 | Completed | - |
| 2. Global Rule Enforcement | 1/1 | Completed | - |
| 3. Multistep Transaction Overhaul | 1/1 | Completed | - |
| 4. History Upgrades | 1/1 | Completed | - |
| 5. Dashboard Upgrade | 1/1 | Completed | - |
| 6. Settings, Profile & Manual Cleanup | 1/1 | Completed | 2026-06-04 |
| 7. New Features & Global Polish | 1/1 | Completed | 2026-06-04 |

## Bug Tracker (Phase 1)

| Bug | Description | Status |
|-----|-------------|--------|
| BUG-01 | Sales transaction immediate redirect / blocked submit | ✅ Fixed |
| BUG-02 | Dynamic profits not updating on dashboard/reports | ✅ Fixed |
| BUG-03 | Audit log 30-day filter + 7-day DB cleanup | ✅ Fixed |
| BUG-04 | Admin session revocation | ✅ Fixed |
| BUG-05 | Mobile pagination nav link + overlap fix | ✅ Fixed |
| BUG-06 | Edit transaction premature redirect + wrong prop | ✅ Fixed |
| BUG-07 | Replace window.confirm() with custom ConfirmModal | ✅ Fixed |
| BUG-08 | Sidebar toggle icon (Menu→X) + overlay close | ✅ Fixed |
