# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-human.spec.ts >> 🧑 Human-style E2E — Admin Full Journey >> Step 11 — Admin views audit log showing all actions
- Location: e2e\admin-human.spec.ts:401:3

# Error details

```
TimeoutError: page.waitForURL: Timeout 20000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - button [ref=e6] [cursor=pointer]:
      - img [ref=e7]
    - generic [ref=e11]:
      - generic [ref=e12]:
        - img [ref=e14]
        - generic [ref=e16]: CallMeMobiles
      - generic [ref=e17]:
        - generic [ref=e18]:
          - paragraph [ref=e19]: Repair Shop Management
          - heading "MANAGE YOUR REPAIRS SMARTER" [level=1] [ref=e20]:
            - text: MANAGE YOUR
            - text: REPAIRS SMARTER
        - paragraph [ref=e21]: Complete control over every job
        - list [ref=e22]:
          - listitem [ref=e23]:
            - img [ref=e24]
            - text: Track every repair job from intake to pickup
          - listitem [ref=e27]:
            - img [ref=e28]
            - text: Live revenue & profit dashboards
          - listitem [ref=e31]:
            - img [ref=e32]
            - text: Role-based access for admin, owner & workers
          - listitem [ref=e35]:
            - img [ref=e36]
            - text: Real-time SMS billing and customer alerts
        - generic [ref=e39]:
          - img [ref=e40]
          - generic [ref=e42]:
            - paragraph [ref=e43]: Live System
            - paragraph [ref=e44]: Real-time updates across all devices
      - paragraph [ref=e45]: © 2026 CallMeMobiles · Repair Shop Management System
    - generic [ref=e47]:
      - generic [ref=e48]:
        - heading "Sign in" [level=2] [ref=e49]
        - paragraph [ref=e50]: Enter your credentials to access the dashboard
      - generic [ref=e51]:
        - generic [ref=e52]:
          - text: Username
          - textbox "Username" [ref=e53]:
            - /placeholder: Enter your username
            - text: admin
        - generic [ref=e54]:
          - text: Password
          - generic [ref=e55]:
            - textbox "Password" [ref=e56]:
              - /placeholder: Enter your password
              - text: admin123
            - button [ref=e57] [cursor=pointer]:
              - img [ref=e58]
        - alert [ref=e61]:
          - img [ref=e62]
          - text: Authentication required
        - generic [ref=e64]:
          - generic [ref=e65]:
            - checkbox "Remember me" [ref=e66] [cursor=pointer]
            - generic [ref=e67] [cursor=pointer]: Remember me
          - link "Forgot password?" [ref=e68] [cursor=pointer]:
            - /url: /auth/forgot-password
        - button "Sign In" [ref=e69] [cursor=pointer]
      - generic [ref=e70]:
        - text: Need help?
        - link "Call Support" [ref=e71] [cursor=pointer]:
          - /url: tel:+919392404104
  - region "Notifications (F8)":
    - list
```

# Test source

```ts
  1   | /**
  2   |  * HUMAN-STYLE E2E TESTS
  3   |  * ─────────────────────
  4   |  * Every step mimics exactly what a human would do:
  5   |  *   open browser → navigate → click → type → scroll → read UI
  6   |  * Zero direct API calls during test interaction.
  7   |  * Screenshots captured at every major step.
  8   |  */
  9   | 
  10  | import { test, expect, Page } from '@playwright/test';
  11  | 
  12  | const SITE    = 'https://expensoo-eight.vercel.app';
  13  | const ADMIN_U = 'admin';
  14  | const ADMIN_P = 'admin123';
  15  | 
  16  | // ── Reusable human actions ─────────────────────────────────────────────────
  17  | 
  18  | /** Type like a human — clear field first, then type character by character */
  19  | async function humanType(page: Page, selector: string, text: string) {
  20  |   const el = page.locator(selector).first();
  21  |   await el.click();
  22  |   await el.selectText().catch(() => {});
  23  |   await el.fill('');
  24  |   await el.type(text, { delay: 60 });
  25  | }
  26  | 
  27  | /** Login via the UI exactly as a user would */
  28  | async function loginAsAdmin(page: Page) {
  29  |   await page.goto(`${SITE}/login`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  30  |   await page.waitForLoadState('networkidle', { timeout: 30_000 });
  31  |   await page.screenshot({ path: 'screenshots/01-login-page.png' });
  32  | 
  33  |   // Type username
  34  |   const userInput = page.locator('input[type="text"], input[name="username"], input[placeholder*="sername"], input[placeholder*="ser"]').first();
  35  |   await userInput.click();
  36  |   await userInput.fill('');
  37  |   await userInput.type(ADMIN_U, { delay: 80 });
  38  | 
  39  |   // Type password
  40  |   const pwInput = page.locator('input[type="password"]').first();
  41  |   await pwInput.click();
  42  |   await pwInput.type(ADMIN_P, { delay: 80 });
  43  | 
  44  |   await page.screenshot({ path: 'screenshots/02-login-filled.png' });
  45  | 
  46  |   // Click login button
  47  |   await page.locator('button[type="submit"]').click();
> 48  |   await page.waitForURL(/\/(dashboard|admin|home|transactions)/, { timeout: 20_000 });
      |              ^ TimeoutError: page.waitForURL: Timeout 20000ms exceeded.
  49  |   await page.waitForLoadState('networkidle', { timeout: 15_000 });
  50  |   await page.screenshot({ path: 'screenshots/03-after-login.png' });
  51  | }
  52  | 
  53  | // ── TEST SUITE ─────────────────────────────────────────────────────────────
  54  | 
  55  | test.describe('🧑 Human-style E2E — Admin Full Journey', () => {
  56  | 
  57  |   // ── 1. LOGIN ────────────────────────────────────────────────────────────
  58  |   test('Step 1 — Admin logs in via UI', async ({ page }) => {
  59  |     await loginAsAdmin(page);
  60  | 
  61  |     // Verify dashboard is visible
  62  |     const welcome = page.locator('text=/dashboard|welcome|repair|transaction/i').first();
  63  |     await expect(welcome).toBeVisible({ timeout: 10_000 });
  64  |     console.log('✅ Admin logged in, dashboard visible. URL:', page.url());
  65  |     await page.screenshot({ path: 'screenshots/04-dashboard.png', fullPage: true });
  66  |   });
  67  | 
  68  |   // ── 2. NAVIGATE TO ADMIN ────────────────────────────────────────────────
  69  |   test('Step 2 — Navigate to Admin panel via sidebar/menu', async ({ page }) => {
  70  |     await loginAsAdmin(page);
  71  | 
  72  |     // Try sidebar link first (most natural)
  73  |     const adminLink = page.locator('a[href*="/admin"], nav >> text=/admin/i, button >> text=/admin/i').first();
  74  |     if (await adminLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
  75  |       await adminLink.click();
  76  |     } else {
  77  |       // Direct navigate as fallback
  78  |       await page.goto(`${SITE}/admin`, { waitUntil: 'networkidle', timeout: 30_000 });
  79  |     }
  80  | 
  81  |     await page.waitForURL(/admin/, { timeout: 15_000 });
  82  |     await page.waitForLoadState('networkidle', { timeout: 15_000 });
  83  |     await page.screenshot({ path: 'screenshots/05-admin-landing.png', fullPage: true });
  84  | 
  85  |     // Admin heading must be present
  86  |     const heading = page.locator('h1, h2').filter({ hasText: /admin/i }).first();
  87  |     await expect(heading).toBeVisible({ timeout: 10_000 });
  88  |     console.log('✅ Admin panel loaded. Heading:', await heading.textContent());
  89  |   });
  90  | 
  91  |   // ── 3. USER MANAGEMENT — EXPAND CARDS ──────────────────────────────────
  92  |   test('Step 3 — Open User Management and expand a user card', async ({ page }) => {
  93  |     await loginAsAdmin(page);
  94  |     await page.goto(`${SITE}/admin`, { waitUntil: 'networkidle', timeout: 30_000 });
  95  | 
  96  |     // Click User Management tab if present
  97  |     const umTab = page.locator('button, [role="tab"]').filter({ hasText: /user.?manag/i }).first();
  98  |     if (await umTab.isVisible({ timeout: 4_000 }).catch(() => false)) {
  99  |       await umTab.click();
  100 |       await page.waitForTimeout(1000);
  101 |     }
  102 | 
  103 |     // Wait for user list to load (up to 8s for backend cold start)
  104 |     await page.waitForTimeout(5000);
  105 |     await page.screenshot({ path: 'screenshots/06-user-list.png', fullPage: true });
  106 | 
  107 |     // Find first user card and click to expand
  108 |     const userCard = page.locator('.border.rounded-xl').first();
  109 |     await expect(userCard).toBeVisible({ timeout: 10_000 });
  110 |     console.log('✅ User cards visible');
  111 | 
  112 |     // Scroll to card then click (like a human)
  113 |     await userCard.scrollIntoViewIfNeeded();
  114 |     await userCard.click();
  115 |     await page.waitForTimeout(600);
  116 |     await page.screenshot({ path: 'screenshots/07-card-expanded.png', fullPage: true });
  117 | 
  118 |     // Expanded detail section should appear — role, created date etc.
  119 |     const detail = page.locator('text=/Role|Created|Password/').first();
  120 |     await expect(detail).toBeVisible({ timeout: 5_000 });
  121 |     console.log('✅ User card expanded, details visible');
  122 |   });
  123 | 
  124 |   // ── 4. CREATE NEW USER ─────────────────────────────────────────────────
  125 |   test('Step 4 — Admin creates a new user through the form', async ({ page }) => {
  126 |     await loginAsAdmin(page);
  127 |     await page.goto(`${SITE}/admin`, { waitUntil: 'networkidle', timeout: 30_000 });
  128 | 
  129 |     const umTab = page.locator('button, [role="tab"]').filter({ hasText: /user.?manag/i }).first();
  130 |     if (await umTab.isVisible({ timeout: 3_000 }).catch(() => false)) await umTab.click();
  131 |     await page.waitForTimeout(2000);
  132 | 
  133 |     // Click "Create User" button
  134 |     const createBtn = page.locator('button').filter({ hasText: /create.?user/i }).first();
  135 |     await expect(createBtn).toBeVisible({ timeout: 8_000 });
  136 |     await createBtn.scrollIntoViewIfNeeded();
  137 |     await createBtn.click();
  138 |     await page.waitForTimeout(500);
  139 |     await page.screenshot({ path: 'screenshots/08-create-form-open.png' });
  140 | 
  141 |     // Type username
  142 |     const usernameInput = page.locator('input[placeholder*="sername"], input[placeholder*="ser"]').last();
  143 |     await usernameInput.click();
  144 |     await usernameInput.type('e2etestuser', { delay: 70 });
  145 | 
  146 |     // Type password
  147 |     const passwordInput = page.locator('input[type="password"], input[placeholder*="assword"]').last();
  148 |     await passwordInput.click();
```