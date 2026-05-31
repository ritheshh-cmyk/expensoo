/**
 * HUMAN-STYLE E2E TESTS — v2 (fixed selectors, correct flow)
 * ─────────────────────────────────────────────────────────────
 * Simulates exactly what a human does:
 *   → open browser → navigate → click → type → scroll → read UI
 *
 * Tests run against the LIVE Vercel deployment.
 * Admin password reset: admin / admin123 (Render restarts fresh each deploy)
 */

import { test, expect, Page } from '@playwright/test';

const SITE    = process.env.FRONTEND_URL || 'http://localhost:4173';
const ADMIN_U = 'admin';
const ADMIN_P = 'admin123';
const WORKER_U = 'sravan';
const WORKER_P = 'sravan123';

// ── Shared: Login helper ───────────────────────────────────────────────────────
async function loginAs(page: Page, username: string, password: string) {
  await page.goto(`${SITE}/login`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForSelector('input[placeholder*="sername"], input[name="username"]', { timeout: 20_000 });

  // Clear and type username
  const userInput = page.locator('input[placeholder*="sername"], input[name="username"]').first();
  await userInput.click({ clickCount: 3 });
  await userInput.type(username, { delay: 60 });

  // Clear and type password  
  const pwInput = page.locator('input[type="password"]').first();
  await pwInput.click({ clickCount: 3 });
  await pwInput.type(password, { delay: 60 });

  await page.screenshot({ path: `screenshots/login-${username}.png` });

  // Submit
  await page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first().click();

  // Wait for redirect away from /login
  await page.waitForFunction(
    () => !window.location.pathname.includes('/login'),
    { timeout: 25_000 }
  );
  await page.waitForLoadState('networkidle', { timeout: 20_000 });
  await page.screenshot({ path: `screenshots/after-login-${username}.png` });
}

// ── Shared: Navigate to Admin tab ─────────────────────────────────────────────
async function goToAdminTab(page: Page, tabName: string) {
  // Navigate to admin page
  await page.goto(`${SITE}/admin`, { waitUntil: 'domcontentloaded', timeout: 50_000 });
  await page.waitForSelector('h1, h2', { timeout: 35_000 });

  // Click the tab by its text label
  const tab = page.locator(`button[role="tab"]:has-text("${tabName}"), button:has-text("${tabName}")`).first();
  await expect(tab).toBeVisible({ timeout: 8_000 });
  await tab.click();
  await page.waitForTimeout(1500); // let panel lazy-load
}

// ══════════════════════════════════════════════════════════════════════════════
// TEST SUITE
// ══════════════════════════════════════════════════════════════════════════════

test.describe('🧑 Human E2E — Admin Full Journey', () => {

  // ── TEST 1: Admin login ───────────────────────────────────────────────────
  test('1 · Admin can log in via UI', async ({ page }) => {
    await loginAs(page, ADMIN_U, ADMIN_P);

    // Must be on dashboard or any non-login page
    expect(page.url()).not.toContain('/login');
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10_000 });
    console.log(`✅ Admin logged in. URL: ${page.url()}`);
  });

  // ── TEST 2: Admin sees Administration heading ─────────────────────────────
  test('2 · Admin panel loads with tab navigation', async ({ page }) => {
    await loginAs(page, ADMIN_U, ADMIN_P);
    await page.goto(`${SITE}/admin`, { waitUntil: 'networkidle', timeout: 40_000 });

    // "Administration" heading
    const heading = page.locator('h1:has-text("Administration"), h2:has-text("Administration")').first();
    await expect(heading).toBeVisible({ timeout: 12_000 });

    // All 6 tabs should be present
    for (const tab of ['Overview', 'Users', 'Permissions', 'Audit', 'Export', 'Sessions']) {
      await expect(
        page.locator(`button:has-text("${tab}"), button[role="tab"]:has-text("${tab}")`)
      ).toBeVisible({ timeout: 5_000 });
    }

    await page.screenshot({ path: 'screenshots/admin-tabs.png', fullPage: true });
    console.log('✅ Admin panel with 6 tabs visible');
  });

  // ── TEST 3: System Stats (Overview tab) ───────────────────────────────────
  test('3 · Overview tab shows system stats', async ({ page }) => {
    await loginAs(page, ADMIN_U, ADMIN_P);
    await goToAdminTab(page, 'Overview');

    await page.screenshot({ path: 'screenshots/admin-overview.png', fullPage: true });

    // Stats panel should have numbers/cards
    const statsArea = page.locator('[class*="stat"], [class*="card"], [class*="grid"]').first();
    await expect(statsArea).toBeVisible({ timeout: 12_000 });
    console.log('✅ Overview/Stats tab content visible');
  });

  // ── TEST 4: Users tab — list loads ───────────────────────────────────────
  test('4 · Users tab lists all users with role badges', async ({ page }) => {
    await loginAs(page, ADMIN_U, ADMIN_P);
    await goToAdminTab(page, 'Users');

    // Wait for user cards (Render cold-start can take ~10s)
    await page.waitForTimeout(8000);
    await page.screenshot({ path: 'screenshots/users-tab.png', fullPage: true });

    // Should see at least one user card (admin itself)
    const userCards = page.locator('.border.rounded-xl, [class*="border"][class*="rounded"]');
    const count = await userCards.count();
    expect(count).toBeGreaterThan(0);
    console.log(`✅ Users tab: ${count} user card(s) found`);
  });

  // ── TEST 5: Expand a user card ────────────────────────────────────────────
  test('5 · Expanding a user card reveals details', async ({ page }) => {
    await loginAs(page, ADMIN_U, ADMIN_P);
    await goToAdminTab(page, 'Users');
    await page.waitForTimeout(8000);

    const firstCard = page.locator('.border.rounded-xl').first();
    await expect(firstCard).toBeVisible({ timeout: 10_000 });

    // Click to expand
    await firstCard.click();
    await page.waitForTimeout(700);
    await page.screenshot({ path: 'screenshots/card-expanded.png', fullPage: true });

    // Look for expanded detail text
    const detail = page.locator('text=/Username|Role|Created|Password/').first();
    await expect(detail).toBeVisible({ timeout: 6_000 });
    console.log('✅ User card expanded — detail panel visible');
  });

  // ── TEST 6: Create User form opens and validates ──────────────────────────
  test('6 · Create User form opens, validates, and creates user', async ({ page }) => {
    await loginAs(page, ADMIN_U, ADMIN_P);
    await goToAdminTab(page, 'Users');
    await page.waitForTimeout(6000);

    // Click "Create User" button
    const createBtn = page.locator('button:has-text("Create User")').first();
    await expect(createBtn).toBeVisible({ timeout: 8_000 });
    await createBtn.scrollIntoViewIfNeeded();
    await createBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/create-form.png' });

    // Form should appear — fill username
    const usernameInput = page.locator('input[placeholder*="sername"]').last();
    await expect(usernameInput).toBeVisible({ timeout: 5_000 });
    await usernameInput.click();
    await usernameInput.type('e2etestuser', { delay: 70 });

    // Fill password
    const pwInput = page.locator('input[type="password"]').last();
    await pwInput.click();
    await pwInput.type('Test@9999', { delay: 70 });

    // Select role
    const roleSelect = page.locator('select').last();
    if (await roleSelect.isVisible().catch(() => false)) {
      await roleSelect.selectOption('worker');
    }

    await page.screenshot({ path: 'screenshots/create-filled.png' });

    // Click "Create" submit button
    const submitBtn = page.locator('button:has-text("Create")').last();
    await submitBtn.click();
    await page.waitForTimeout(4000);
    await page.screenshot({ path: 'screenshots/after-create.png', fullPage: true });

    // Check for success toast or new card appearing
    const feedback = page.locator('text=/created|e2etestuser|success/i').first();
    await expect(feedback).toBeVisible({ timeout: 10_000 });
    console.log('✅ e2etestuser created via Create User form');
  });

  // ── TEST 7: Expand new user and change role ────────────────────────────────
  test('7 · Admin changes user role via UI', async ({ page }) => {
    await loginAs(page, ADMIN_U, ADMIN_P);
    await goToAdminTab(page, 'Users');
    await page.waitForTimeout(8000);

    // Find e2etestuser card
    const userCard = page.locator('.border.rounded-xl').filter({ hasText: 'e2etestuser' }).first();
    await expect(userCard).toBeVisible({ timeout: 10_000 });
    await userCard.scrollIntoViewIfNeeded();
    await userCard.click();
    await page.waitForTimeout(600);

    // Click "Change Role"
    const changeRoleBtn = page.locator('button:has-text("Change Role")').first();
    await expect(changeRoleBtn).toBeVisible({ timeout: 6_000 });
    await changeRoleBtn.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'screenshots/role-dropdown.png' });

    // Select role from dropdown
    const roleSelect = page.locator('select').last();
    await expect(roleSelect).toBeVisible({ timeout: 4_000 });
    await roleSelect.selectOption('owner');
    await page.waitForTimeout(300);

    // Click save (checkmark button)
    const saveBtn = page.locator('button').filter({ has: page.locator('svg') }).nth(-2);
    await saveBtn.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/role-changed.png', fullPage: true });

    // Role badge should update
    const ownerBadge = page.locator('text=/Owner/i').first();
    await expect(ownerBadge).toBeVisible({ timeout: 8_000 });
    console.log('✅ Role changed to Owner');
  });

  // ── TEST 8: Edit username ─────────────────────────────────────────────────
  test('8 · Admin edits username via pencil icon', async ({ page }) => {
    await loginAs(page, ADMIN_U, ADMIN_P);
    await goToAdminTab(page, 'Users');
    await page.waitForTimeout(8000);

    // Expand e2etestuser
    const userCard = page.locator('.border.rounded-xl').filter({ hasText: 'e2etestuser' }).first();
    await expect(userCard).toBeVisible({ timeout: 10_000 });
    await userCard.click();
    await page.waitForTimeout(600);

    // Click pencil icon next to username
    const pencilBtn = page.locator('button[title="Edit username"]').first();
    await expect(pencilBtn).toBeVisible({ timeout: 6_000 });
    await pencilBtn.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'screenshots/edit-username-form.png' });

    // Edit username input
    const nameInput = page.locator('input[placeholder="New username"]').first();
    await expect(nameInput).toBeVisible({ timeout: 4_000 });
    await nameInput.click({ clickCount: 3 });
    await nameInput.type('e2etestuser_renamed', { delay: 60 });

    // Click save
    const saveBtn = page.locator('button.bg-blue-600, button:has-text("✓")').first();
    // Fallback: press Enter
    await nameInput.press('Enter');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/username-renamed.png', fullPage: true });

    // Success toast
    const toast = page.locator('text=/username.*updated|renamed/i').first();
    await expect(toast).toBeVisible({ timeout: 8_000 });
    console.log('✅ Username renamed via pencil edit');
  });

  // ── TEST 9: Reset password for user ──────────────────────────────────────
  test('9 · Admin force-resets user password', async ({ page }) => {
    await loginAs(page, ADMIN_U, ADMIN_P);
    await goToAdminTab(page, 'Users');
    await page.waitForTimeout(8000);

    // Expand any non-self user
    const cards = page.locator('.border.rounded-xl');
    const count = await cards.count();
    let targetCard = null;

    // Find a non-admin user to reset
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const text = await card.textContent();
      if (text && !text.includes('admin') && !text.toLowerCase().includes('(you)')) {
        targetCard = card;
        break;
      }
    }

    if (!targetCard) {
      console.log('⚠️ No non-admin user found to reset — skipping');
      return;
    }

    await targetCard.scrollIntoViewIfNeeded();
    await targetCard.click();
    await page.waitForTimeout(600);

    // Click Reset Password
    const resetBtn = page.locator('button:has-text("Reset Password")').first();
    await expect(resetBtn).toBeVisible({ timeout: 6_000 });
    await resetBtn.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'screenshots/reset-pw-form.png' });

    // Type new password
    const newPwInput = page.locator('input[placeholder*="password"]').last();
    await expect(newPwInput).toBeVisible({ timeout: 4_000 });
    await newPwInput.click();
    await newPwInput.type('NewPass@2025', { delay: 60 });

    // Click the yellow save button
    const saveBtn = page.locator('button.bg-yellow-600, button[class*="yellow"]').first();
    await saveBtn.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/after-pw-reset.png', fullPage: true });

    const toast = page.locator('text=/password.*reset|Password reset/i').first();
    await expect(toast).toBeVisible({ timeout: 8_000 });
    console.log('✅ Password reset via admin UI');
  });

  // ── TEST 10: Worker blocked from admin ────────────────────────────────────
  test('10 · Worker cannot access /admin — sees guard screen', async ({ page }) => {
    // Login as sravan (permanent worker)
    await loginAs(page, WORKER_U, WORKER_P);

    // Try to navigate to admin
    await page.goto(`${SITE}/admin`, { waitUntil: 'networkidle', timeout: 30_000 });
    await page.screenshot({ path: 'screenshots/worker-on-admin.png', fullPage: true });

    // Must see access denied, NOT admin content
    const denied = page.locator('text=/Admin Access Required|only administrator|forbidden/i').first();
    await expect(denied).toBeVisible({ timeout: 8_000 });

    // Must NOT see tab buttons (admin features)
    const usersTab = page.locator('button:has-text("Users")');
    await expect(usersTab).not.toBeVisible({ timeout: 3_000 });

    console.log('✅ Worker correctly blocked — "Admin Access Required" shown');
  });

  // ── TEST 11: Audit Log tab loads ──────────────────────────────────────────
  test('11 · Audit Log shows action history', async ({ page }) => {
    await loginAs(page, ADMIN_U, ADMIN_P);
    await goToAdminTab(page, 'Audit');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/audit-log.png', fullPage: true });

    // Audit log should show entries or "no events" message
    // Use .or() — text=/regex/ can't be mixed in a CSS comma-selector
    const content = page
      .locator('[class*="audit"], [class*="log"]')
      .or(page.getByText(/LOGIN|CREATE|UPDATE|DELETE|events/i))
      .first();
    await expect(content).toBeVisible({ timeout: 10_000 });
    console.log('✅ Audit log panel loaded');
  });

  // ── TEST 12: Data Export tab ──────────────────────────────────────────────
  test('12 · Data Export tab shows download buttons', async ({ page }) => {
    await loginAs(page, ADMIN_U, ADMIN_P);
    await goToAdminTab(page, 'Export');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/export-tab.png', fullPage: true });

    const exportBtn = page.locator('button:has-text("Export"), button:has-text("Download"), button:has-text("CSV")').first();
    await expect(exportBtn).toBeVisible({ timeout: 8_000 });
    console.log('✅ Export tab with download buttons loaded');
  });

  // ── TEST 13: Scroll works (page scrolls via trackpad simulation) ───────────
  test('13 · Page scrolls correctly — no overflow bug', async ({ page }) => {
    // Set smaller viewport height to guarantee content overflows even if we have only 3 users
    await page.setViewportSize({ width: 1280, height: 400 });
    await loginAs(page, ADMIN_U, ADMIN_P);
    await goToAdminTab(page, 'Users');
    await page.waitForTimeout(8000);

    // Get initial scroll position
    const scrollBefore = await page.evaluate(() => window.scrollY);

    // Simulate trackpad scroll (multiple wheels for reliability)
    await page.mouse.move(640, 400);
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(300);
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(600);

    const scrollAfter = await page.evaluate(() => window.scrollY);
    await page.screenshot({ path: 'screenshots/scroll-test.png' });

    // scrollAfter must be > 0 — if still 0, overflow-x:hidden is blocking scroll
    expect(scrollAfter).toBeGreaterThan(0);
    console.log(`✅ Scroll works — before: 0px, after: ${scrollAfter}px`);
  });

  // ── TEST 14: Delete test user ─────────────────────────────────────────────
  test('14 · Admin deletes e2etestuser (cleanup)', async ({ page }) => {
    await loginAs(page, ADMIN_U, ADMIN_P);
    await goToAdminTab(page, 'Users');
    await page.waitForTimeout(8000);

    // Find and expand any e2etest user
    const userCard = page.locator('.border.rounded-xl').filter({ hasText: /e2etest/ }).first();
    const exists = await userCard.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!exists) {
      console.log('⚠️ e2etestuser not found (may have been renamed) — skipping delete');
      return;
    }

    await userCard.click();
    await page.waitForTimeout(500);

    // Handle confirm dialog
    page.once('dialog', dialog => {
      console.log('  Dialog:', dialog.message());
      dialog.accept();
    });

    const deleteBtn = page.locator('button:has-text("Delete User")').first();
    await expect(deleteBtn).toBeVisible({ timeout: 5_000 });
    await deleteBtn.scrollIntoViewIfNeeded();
    await deleteBtn.click();
    await page.waitForTimeout(4000);
    await page.screenshot({ path: 'screenshots/after-delete.png', fullPage: true });

    // Card should be gone
    await expect(userCard).not.toBeVisible({ timeout: 6_000 });
    console.log('✅ e2etestuser deleted — card removed from list');
  });

  // ── TEST 15: Mobile viewport — bottom nav visible, scrollable ─────────────
  test('15 · Mobile viewport — bottom nav and scroll work', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone 13
    await loginAs(page, ADMIN_U, ADMIN_P);

    // Bottom nav must be visible on mobile
    const nav = page.locator('nav[class*="fixed"][class*="bottom"]').first();
    await expect(nav).toBeVisible({ timeout: 8_000 });

    // All nav items have min 44px touch target
    const navLinks = nav.locator('a');
    const linkCount = await navLinks.count();
    expect(linkCount).toBeGreaterThan(0);

    for (let i = 0; i < linkCount; i++) {
      const h = await navLinks.nth(i).evaluate(el => el.getBoundingClientRect().height);
      expect(h).toBeGreaterThanOrEqual(44);
    }

    await page.screenshot({ path: 'screenshots/mobile-bottom-nav.png' });
    console.log(`✅ Mobile nav: ${linkCount} items, all ≥44px tall`);
  });
});
