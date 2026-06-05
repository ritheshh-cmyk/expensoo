## GLOBAL RULES
> These constraints apply to EVERY change in every phase. GSD plan-checker will enforce them.

- **No browser-native dialogs anywhere.** `window.confirm()`, `window.alert()`, `window.prompt()` are banned. Grep codebase before Phase 1 ends: `grep -r "window\.confirm\|window\.alert\|window\.prompt" src/`
- **CP (cost price) is always masked by default** with a `ti-eye` / `ti-eye-off` toggle. Every form, card, detail view, and read-only display. No exceptions.
- **No placeholder text as content.** If a field has no value, omit the field entirely from the UI — do not show "N/A", "-", or empty labels.
- **Do not change working features.** Every fix or new feature must not break adjacent behaviour. Run a regression pass on affected components after each change.
- **Match existing tech stack.** No new libraries unless strictly necessary and explicitly noted.
- **All new UI matches the existing design system** — colours, border radius, font sizes, spacing scale.
- **Mobile-first on all new components.** Test at 375px viewport. No horizontal scroll, no clipped content.
- **Custom confirmation modal is the single global component.** Build it once in Phase 1. All phases reuse it.

---

## CROSS-VERIFICATION TABLE
> Every sentence from the original request, catalogued to an item ID.

| # | Original text | Item ID | Phase |
|---|---|---|---|
| 1 | "Create transaction is not working only in sales mode…directly redirecting no response" | BUG-01 | 1 |
| 2 | "profits are not updating dynamically to all sectors" | BUG-02 | 1 |
| 3 | "In settings not able to see the audit logs of expires…shows only current logins like today and tomorrow" | BUG-03 | 1 |
| 4 | "delete after a week from db" | BUG-03b | 1 |
| 5 | "In session page there is no logout option…admin wanna remove the session" | BUG-04 | 1 |
| 6 | "Sales history page…click page from sale history it directly redirecting to dashboard…only from mobile" | BUG-05 | 1 |
| 7 | "where we can see down one more" | BUG-05b | 1 |
| 8 | "Edit transaction is not working…automatically redirecting to again dashboard" | BUG-06 | 1 |
| 9 | "While we delete the transaction in mobile it confirms again…browser ok or cancel" | BUG-07 | 1 |
| 10 | "don't use any where browser confirmation…don't relay on browsers confirmation" | RULE-01 | Global |
| 11 | "For opening side we use 3 lines logo for closing also same logo" | BUG-08 | 1 |
| 12 | "one more for closing outside of the sidebar this case for mobile users" | BUG-08b | 1 |
| 13 | "Settings page there is header…change password appearance system improper optimised…mobile users" | BUG-09 | 6 |
| 14 | "In multistep transaction add one more thing paid or unpaid feature" | FEAT-01 | 3 |
| 15 | "in sales mode while we enter cost price add eye mode like a password how we will hide" | FEAT-02 | 3 |
| 16 | "for some privacy of leaking from our behind customer or any friends while entering the cp" | FEAT-02 (context) | 3 |
| 17 | "when selecting the upi mode from repair mode amount give is directly adding the cp" | BUG-10 | 3 |
| 18 | "this mode in step 3 parts and supplies section" | BUG-10 (context) | 3 |
| 19 | "now there are 2 things one is external purchase and one is internal purchase" | Current state note | 3 |
| 20 | "instead of internal purchase convert that page internal repair" | FEAT-03 | 3 |
| 21 | "in the page internal repair details will be added here" | FEAT-03b | 3 |
| 22 | "2 modes now in step 2 repair and sale add one more mode here internal repair" | FEAT-04 | 3 |
| 23 | "step 3 should be only 3 boxes one is about the repair and cp and sp" | FEAT-05 | 3 |
| 24 | "cp should be hidden from all forms and everywhere with eyes icon accordingly update the form" | RULE-02 | Global |
| 25 | "click on single transaction it shows full details…mobile case as well in desktop" | FEAT-06 | 4 |
| 26 | "hiding all details from overview of transaction page" | FEAT-06b | 4 |
| 27 | "same implies to sales history also" | FEAT-07 | 4 |
| 28 | "parts coming from multistep transaction also to be added here" | FEAT-08 | 4 |
| 29 | "every single details coming from multistep transaction is to be used there" | FEAT-08b | 4 |
| 30 | "there are not be act as plan text or any place holders if any like that use them all around" | RULE-03 | Global |
| 31 | "propose a feature for notifications from navbar implement something later we will upgrade it" | FEAT-09 | 7 |
| 32 | "Profile page to be upgraded…remove unwanted comments and extra details…pure professional theme" | FEAT-10 | 6 |
| 33 | "these applies for all pages extra explaining any thing is not needed" | RULE-04 | Global |
| 34 | "instead of that create user manual" | FEAT-11 | 6 |
| 35 | "There is username and password edit option there is no option for users editing their name" | FEAT-12 | 6 |
| 36 | "make this also updates dynamically" | FEAT-12b | 6 |
| 37 | "in dashboard supposed to show only the last 5 transactions" | FEAT-13 | 5 |
| 38 | "upgrade this page add more cards more features but it should not be same like reports" | FEAT-14 | 5 |
| 39 | "a different from that like what we used there again same thing should not be repeated" | FEAT-14b | 5 |
| 40 | "convert into a professional dashboard" | FEAT-14c | 5 |
| 41 | "welcome message…name of the current logged in user…not the role of the user" | BUG-11 | 5 |
| 42 | "Here's your repair shop overview" | BUG-11b | 5 |
| 43 | "clone button new transaction adding now also possible from dashboard" | FEAT-15 | 5 |
| 44 | "as well in mobile case" | FEAT-15b | 5 |
| 45 | "application is still behind near spacing…extra space large grids boxes…all pages" | BUG-12 | 7 |

---

## PHASE 1 — CRITICAL BUG FIXES
> Fix these first. They block normal app usage.

### BUG-01 — Create transaction: sales mode immediate redirect
**Symptom:** Clicking "Create transaction" in sales mode immediately redirects. No loading state, no response, no error shown.

### BUG-02 — Profit not updating dynamically across sectors
**Symptom:** After create/edit/delete transaction, profit figures on dashboard, reports, and any other profit-displaying component stay stale until manual refresh.

### BUG-03 — Audit log: wrong date range + no expiry entries + no DB purge
**Symptom A:** Audit log in settings only shows today's login events. Filter is incorrectly limited to current day.  
**Symptom B:** Expired session events don't appear in the log.  
**Symptom C:** Log entries older than 7 days are never cleaned up from the DB.

### BUG-04 — Session page: admin cannot revoke/remove a user session
**Symptom:** Admin has no UI control to force-logout another user's active session.

### BUG-05 — Sales history: mobile pagination redirects to dashboard
**Symptom:** On mobile only, tapping a page number in the sales history page navigates to the dashboard instead of changing the page. Works correctly from the sidebar link and on desktop. There is an extra element at the bottom of the page on mobile ("one more" = bottom nav item overlapping).

### BUG-06 — Edit transaction: immediate redirect to dashboard
**Symptom:** Clicking "Edit" on any transaction immediately navigates to the dashboard.

### BUG-07 — Delete transaction: browser confirm() on mobile + global replacement
**Symptom:** Deleting a transaction triggers `window.confirm()` — native browser dialog that is not customisable, not mobile-friendly, and visually inconsistent.

### BUG-08 — Sidebar: same icon for open/close, no outside-click-close on mobile
**Symptom A:** The hamburger (ti-menu-2) icon is used for both opening and closing the sidebar.  
**Symptom B:** On mobile, there is no way to close the sidebar by tapping outside it.

---

## PHASE 2 — GLOBAL RULE ENFORCEMENT
> Sweep the entire codebase for the three global rules. Complete before touching features.

### RULE-01 — Zero browser-native dialogs (global sweep)
Already addressed in BUG-07. This phase confirms the sweep is complete.

### RULE-02 — CP (cost price) masked everywhere (global sweep)

### RULE-03 — No placeholder text as content (global sweep)

### RULE-04 — Remove explanatory text from all pages

---

## PHASE 3 — MULTISTEP TRANSACTION OVERHAUL
> Complete redesign of the multistep transaction form.

### FEAT-01 — Paid / Unpaid payment status

### FEAT-02 — CP eye-toggle in sales mode (and globally)

### BUG-10 — UPI mode in repair mode auto-adds CP to amount

### FEAT-03 + FEAT-04 — Step 2: Add "Internal repair" as 3rd mode

### FEAT-03b — Step 3: Internal purchase → Internal repair (with detail form)

### FEAT-05 — Step 3: Restructure to exactly 3 boxes

---

## PHASE 4 — TRANSACTION & SALES HISTORY UPGRADE
> Expandable detail views. No page navigation on row click.

### FEAT-06 — Transaction history: expandable detail view

### FEAT-08 — Parts from multistep transaction in detail view

---

## PHASE 5 — DASHBOARD UPGRADE
> Professional quick-glance dashboard. Must be distinct from the Reports page.

### BUG-11 — Welcome message shows role/shop name, not user's display name

### FEAT-13 — Dashboard: last 5 transactions

### FEAT-14 — Dashboard: new metric cards (different from Reports)

### FEAT-15 — New transaction button on dashboard (mobile-friendly)

---

## PHASE 6 — PROFILE + SETTINGS + SESSION CLEANUP
> Clean up every settings and profile surface.

### FEAT-10 + RULE-04 — Profile page: full professional cleanup (applies to ALL pages)

### FEAT-11 — User manual: dedicated page

### FEAT-12 — Display name editing (with dynamic propagation)

### BUG-09 — Settings header: mobile optimization

---

## PHASE 7 — NEW FEATURES + GLOBAL MOBILE POLISH
> Notification system, mobile spacing fix, and final polish across all pages.

### FEAT-09 — Notification bell: navbar placeholder (extensible)

### BUG-12 — Mobile spacing: global audit and fix
