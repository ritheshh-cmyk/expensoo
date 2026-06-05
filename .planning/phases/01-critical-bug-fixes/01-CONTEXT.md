# Phase 1: Critical Bug Fixes - Context

**Gathered:** 2026-06-04
**Status:** Ready for planning
**Source:** PRD Express Path (REPAIR_SHOP_SPEC.md)

<domain>
## Phase Boundary

Resolve core functionality bugs (BUG-01 to BUG-08). Focus on fixing broken functionality without changing major requirements.
</domain>

<decisions>
## Implementation Decisions

### BUG-01 — Create transaction: sales mode immediate redirect
- Clicking "Create transaction" in sales mode immediately redirects with no loading state or response. Fix the redirect logic and show proper error/loading states.

### BUG-02 — Profit not updating dynamically
- Profit figures on dashboard, reports, and other components stay stale until manual refresh. Make profits update reactively upon adding/editing/deleting transactions.

### BUG-03 — Audit log fixes
- Audit log currently only shows today's login events. Fix filter to show default 30 days.
- Include expired session events in the log.
- Implement database cleanup for log entries older than 7 days.

### BUG-04 — Session page admin control
- Provide UI control for admins to force-logout another user's active session.

### BUG-05 — Sales history mobile pagination
- On mobile, tapping a page number in sales history navigates to dashboard instead of changing page. Fix mobile pagination. 
- Remove extra element ("one more" bottom nav item) overlapping at the bottom on mobile.

### BUG-06 — Edit transaction redirect
- Clicking "Edit" on a transaction immediately navigates to dashboard. Fix to stay on edit view.

### BUG-07 — Delete transaction confirmation
- Replace `window.confirm()` native browser dialog on delete transaction with a customisable, mobile-friendly custom confirmation modal.
- Build this custom confirmation modal once so it can be reused globally in later phases.

### BUG-08 — Sidebar fixes
- Change hamburger (ti-menu-2) icon used for closing the sidebar to a close icon (like an X).
- Allow closing the sidebar by tapping outside it on mobile devices.

### the agent's Discretion
- Custom confirmation modal design details (should match existing UI brand).
- How the db purge logic for 7-day-old logs is implemented (e.g. cron vs on-access cleanup).
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### General Requirements
- `REPAIR_SHOP_SPEC.md` — Original PRD with bug definitions and global rules

</canonical_refs>

<specifics>
## Specific Ideas

- Global Rules constraint: No browser-native dialogs anywhere (`window.confirm()`, `window.alert()`, `window.prompt()`).

</specifics>

<deferred>
## Deferred Ideas

None — PRD covers phase scope
</deferred>

---

*Phase: 01-critical-bug-fixes*
*Context gathered: 2026-06-04 via PRD Express Path*
