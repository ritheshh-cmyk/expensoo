# Technical Plan: Wave 5 Fixes

This plan outlines the specific code changes and verification steps for all 5 fixes of Wave 5.

## Proposed Code Changes

### Fix 1: Runtime Crash ("Something went wrong")
- **Investigation**: We will run the app (or look at the code) to find the crash. It is likely a component in `expensoo/src/` receiving undefined props or map on undefined.
- **Remediation**: Add null/undefined guards at data boundaries. Return skeletons for arrays, null for objects. Avoid try-catch band-aids.
- **Verification**: Run `npm run build` and ensure pages load without triggering the Error Boundary.

### Fix 2: Audit Logs Tab Stuck
- **Investigation**: Check the `TabsTrigger` and `TabsContent` values in the admin panel to ensure they match exactly. Inspect the table inside the audit logs tab.
- **Remediation**: Remove any Accordion wrapper around the table. Ensure the date range filter defaults to the last 30 days. Verify event type filter chips.
- **Verification**: Navigate to the tab and verify the table loads.

### Fix 3: Active Sessions Only
- **Investigation**: Check the sessions page component and API call to filter out expired/revoked sessions.
- **Remediation**: Filter sessions on client/server so only valid, unexpired sessions show. Render table/cards displaying: username, role badge, device type, browser name, IP address, time since last activity, and revoke button. Show "Current session" badge for the logged-in user (no revoke button). Mobile: compact cards with 44px tap targets.
- **Verification**: Test the session revocation flow and mobile layout.

### Fix 4: Login Eye Toggle
- **Investigation**: Inspect the login page component and `FieldInputGroup` component for password visibility toggling.
- **Remediation**: Fix the state variable and toggle function controlling `type="password" | "text"`. Ensure 44px tap target on mobile.
- **Verification**: Manually toggle password visibility.

### Fix 5: Supplier Lifecycle & Pay Outstanding Flow
- **Investigation**: Check `expensoo/openapi.yaml` and the frontend Supplier component.
- **Remediation**:
  1. Supplier cards: Show 2x2 grid (Total transactions, Total paid, Pending, Lifetime total). Total paid is sum of expenditures category="Suppliers", status="paid", supplier_id matching. Show Pending in amber if > 0, green "Settled" badge if = 0, red "Overpaid" if paid > total.
  2. Supplier detail view: Add "Transaction History" and "Payment History" accordions. Show running balance.
  3. Add "Pay Outstanding" button: Pre-fill Add Expenditure form with category="Suppliers", supplier pre-selected, outstanding amount pre-filled, status="Paid".
- **Verification**: Run `openspec validate` before coding.
