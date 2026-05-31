# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-human.spec.ts >> 🧑 Human E2E — Admin Full Journey >> 1 · Admin can log in via UI
- Location: e2e\admin-human.spec.ts:68:3

# Error details

```
TimeoutError: page.waitForSelector: Timeout 20000ms exceeded.
Call log:
  - waiting for locator('input[placeholder*="sername"], input[name="username"]') to be visible

```

# Test source

```ts
  1   | /**
  2   |  * HUMAN-STYLE E2E TESTS — v2 (fixed selectors, correct flow)
  3   |  * ─────────────────────────────────────────────────────────────
  4   |  * Simulates exactly what a human does:
  5   |  *   → open browser → navigate → click → type → scroll → read UI
  6   |  *
  7   |  * Tests run against the LIVE Vercel deployment.
  8   |  * Admin password reset: admin / admin123 (Render restarts fresh each deploy)
  9   |  */
  10  | 
  11  | import { test, expect, Page } from '@playwright/test';
  12  | 
  13  | const SITE    = 'https://expensoo-eight.vercel.app';
  14  | const ADMIN_U = 'admin';
  15  | const ADMIN_P = 'admin123';
  16  | const WORKER_U = 'sravan';
  17  | const WORKER_P = 'sravan123';
  18  | 
  19  | // ── Shared: Login helper ───────────────────────────────────────────────────────
  20  | async function loginAs(page: Page, username: string, password: string) {
  21  |   await page.goto(`${SITE}/login`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
> 22  |   await page.waitForSelector('input[placeholder*="sername"], input[name="username"]', { timeout: 20_000 });
      |              ^ TimeoutError: page.waitForSelector: Timeout 20000ms exceeded.
  23  | 
  24  |   // Clear and type username
  25  |   const userInput = page.locator('input[placeholder*="sername"], input[name="username"]').first();
  26  |   await userInput.click({ clickCount: 3 });
  27  |   await userInput.type(username, { delay: 60 });
  28  | 
  29  |   // Clear and type password  
  30  |   const pwInput = page.locator('input[type="password"]').first();
  31  |   await pwInput.click({ clickCount: 3 });
  32  |   await pwInput.type(password, { delay: 60 });
  33  | 
  34  |   await page.screenshot({ path: `screenshots/login-${username}.png` });
  35  | 
  36  |   // Submit
  37  |   await page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first().click();
  38  | 
  39  |   // Wait for redirect away from /login
  40  |   await page.waitForFunction(
  41  |     () => !window.location.pathname.includes('/login'),
  42  |     { timeout: 25_000 }
  43  |   );
  44  |   await page.waitForLoadState('networkidle', { timeout: 20_000 });
  45  |   await page.screenshot({ path: `screenshots/after-login-${username}.png` });
  46  | }
  47  | 
  48  | // ── Shared: Navigate to Admin tab ─────────────────────────────────────────────
  49  | async function goToAdminTab(page: Page, tabName: string) {
  50  |   // Navigate to admin page
  51  |   await page.goto(`${SITE}/admin`, { waitUntil: 'networkidle', timeout: 40_000 });
  52  |   await page.waitForSelector('h1, h2', { timeout: 15_000 });
  53  | 
  54  |   // Click the tab by its text label
  55  |   const tab = page.locator(`button[role="tab"]:has-text("${tabName}"), button:has-text("${tabName}")`).first();
  56  |   await expect(tab).toBeVisible({ timeout: 8_000 });
  57  |   await tab.click();
  58  |   await page.waitForTimeout(1500); // let panel lazy-load
  59  | }
  60  | 
  61  | // ══════════════════════════════════════════════════════════════════════════════
  62  | // TEST SUITE
  63  | // ══════════════════════════════════════════════════════════════════════════════
  64  | 
  65  | test.describe('🧑 Human E2E — Admin Full Journey', () => {
  66  | 
  67  |   // ── TEST 1: Admin login ───────────────────────────────────────────────────
  68  |   test('1 · Admin can log in via UI', async ({ page }) => {
  69  |     await loginAs(page, ADMIN_U, ADMIN_P);
  70  | 
  71  |     // Must be on dashboard or any non-login page
  72  |     expect(page.url()).not.toContain('/login');
  73  |     const heading = page.locator('h1, h2').first();
  74  |     await expect(heading).toBeVisible({ timeout: 10_000 });
  75  |     console.log(`✅ Admin logged in. URL: ${page.url()}`);
  76  |   });
  77  | 
  78  |   // ── TEST 2: Admin sees Administration heading ─────────────────────────────
  79  |   test('2 · Admin panel loads with tab navigation', async ({ page }) => {
  80  |     await loginAs(page, ADMIN_U, ADMIN_P);
  81  |     await page.goto(`${SITE}/admin`, { waitUntil: 'networkidle', timeout: 40_000 });
  82  | 
  83  |     // "Administration" heading
  84  |     const heading = page.locator('h1:has-text("Administration"), h2:has-text("Administration")').first();
  85  |     await expect(heading).toBeVisible({ timeout: 12_000 });
  86  | 
  87  |     // All 6 tabs should be present
  88  |     for (const tab of ['Overview', 'Users', 'Permissions', 'Audit', 'Export', 'Sessions']) {
  89  |       await expect(
  90  |         page.locator(`button:has-text("${tab}"), button[role="tab"]:has-text("${tab}")`)
  91  |       ).toBeVisible({ timeout: 5_000 });
  92  |     }
  93  | 
  94  |     await page.screenshot({ path: 'screenshots/admin-tabs.png', fullPage: true });
  95  |     console.log('✅ Admin panel with 6 tabs visible');
  96  |   });
  97  | 
  98  |   // ── TEST 3: System Stats (Overview tab) ───────────────────────────────────
  99  |   test('3 · Overview tab shows system stats', async ({ page }) => {
  100 |     await loginAs(page, ADMIN_U, ADMIN_P);
  101 |     await goToAdminTab(page, 'Overview');
  102 | 
  103 |     await page.screenshot({ path: 'screenshots/admin-overview.png', fullPage: true });
  104 | 
  105 |     // Stats panel should have numbers/cards
  106 |     const statsArea = page.locator('[class*="stat"], [class*="card"], [class*="grid"]').first();
  107 |     await expect(statsArea).toBeVisible({ timeout: 12_000 });
  108 |     console.log('✅ Overview/Stats tab content visible');
  109 |   });
  110 | 
  111 |   // ── TEST 4: Users tab — list loads ───────────────────────────────────────
  112 |   test('4 · Users tab lists all users with role badges', async ({ page }) => {
  113 |     await loginAs(page, ADMIN_U, ADMIN_P);
  114 |     await goToAdminTab(page, 'Users');
  115 | 
  116 |     // Wait for user cards (Render cold-start can take ~10s)
  117 |     await page.waitForTimeout(8000);
  118 |     await page.screenshot({ path: 'screenshots/users-tab.png', fullPage: true });
  119 | 
  120 |     // Should see at least one user card (admin itself)
  121 |     const userCards = page.locator('.border.rounded-xl, [class*="border"][class*="rounded"]');
  122 |     const count = await userCards.count();
```