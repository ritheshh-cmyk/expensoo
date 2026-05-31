/**
 * HUMAN-STYLE E2E TESTS
 * ─────────────────────
 * Every step mimics exactly what a human would do:
 *   open browser → navigate → click → type → scroll → read UI
 * Zero direct API calls during test interaction.
 * Screenshots captured at every major step.
 */

import { test, expect, Page } from '@playwright/test';

const SITE    = 'https://expensoo-eight.vercel.app';
const ADMIN_U = 'admin';
const ADMIN_P = 'admin123';

// ── Reusable human actions ─────────────────────────────────────────────────

/** Type like a human — clear field first, then type character by character */
async function humanType(page: Page, selector: string, text: string) {
  const el = page.locator(selector).first();
  await el.click();
  await el.selectText().catch(() => {});
  await el.fill('');
  await el.type(text, { delay: 60 });
}

/** Login via the UI exactly as a user would */
async function loginAsAdmin(page: Page) {
  await page.goto(`${SITE}/login`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForLoadState('networkidle', { timeout: 30_000 });
  await page.screenshot({ path: 'screenshots/01-login-page.png' });

  // Type username
  const userInput = page.locator('input[type="text"], input[name="username"], input[placeholder*="sername"], input[placeholder*="ser"]').first();
  await userInput.click();
  await userInput.fill('');
  await userInput.type(ADMIN_U, { delay: 80 });

  // Type password
  const pwInput = page.locator('input[type="password"]').first();
  await pwInput.click();
  await pwInput.type(ADMIN_P, { delay: 80 });

  await page.screenshot({ path: 'screenshots/02-login-filled.png' });

  // Click login button
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/(dashboard|admin|home|transactions)/, { timeout: 20_000 });
  await page.waitForLoadState('networkidle', { timeout: 15_000 });
  await page.screenshot({ path: 'screenshots/03-after-login.png' });
}

// ── TEST SUITE ─────────────────────────────────────────────────────────────

test.describe('🧑 Human-style E2E — Admin Full Journey', () => {

  // ── 1. LOGIN ────────────────────────────────────────────────────────────
  test('Step 1 — Admin logs in via UI', async ({ page }) => {
    await loginAsAdmin(page);

    // Verify dashboard is visible
    const welcome = page.locator('text=/dashboard|welcome|repair|transaction/i').first();
    await expect(welcome).toBeVisible({ timeout: 10_000 });
    console.log('✅ Admin logged in, dashboard visible. URL:', page.url());
    await page.screenshot({ path: 'screenshots/04-dashboard.png', fullPage: true });
  });

  // ── 2. NAVIGATE TO ADMIN ────────────────────────────────────────────────
  test('Step 2 — Navigate to Admin panel via sidebar/menu', async ({ page }) => {
    await loginAsAdmin(page);

    // Try sidebar link first (most natural)
    const adminLink = page.locator('a[href*="/admin"], nav >> text=/admin/i, button >> text=/admin/i').first();
    if (await adminLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await adminLink.click();
    } else {
      // Direct navigate as fallback
      await page.goto(`${SITE}/admin`, { waitUntil: 'networkidle', timeout: 30_000 });
    }

    await page.waitForURL(/admin/, { timeout: 15_000 });
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
    await page.screenshot({ path: 'screenshots/05-admin-landing.png', fullPage: true });

    // Admin heading must be present
    const heading = page.locator('h1, h2').filter({ hasText: /admin/i }).first();
    await expect(heading).toBeVisible({ timeout: 10_000 });
    console.log('✅ Admin panel loaded. Heading:', await heading.textContent());
  });

  // ── 3. USER MANAGEMENT — EXPAND CARDS ──────────────────────────────────
  test('Step 3 — Open User Management and expand a user card', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${SITE}/admin`, { waitUntil: 'networkidle', timeout: 30_000 });

    // Click User Management tab if present
    const umTab = page.locator('button, [role="tab"]').filter({ hasText: /user.?manag/i }).first();
    if (await umTab.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await umTab.click();
      await page.waitForTimeout(1000);
    }

    // Wait for user list to load (up to 8s for backend cold start)
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'screenshots/06-user-list.png', fullPage: true });

    // Find first user card and click to expand
    const userCard = page.locator('.border.rounded-xl').first();
    await expect(userCard).toBeVisible({ timeout: 10_000 });
    console.log('✅ User cards visible');

    // Scroll to card then click (like a human)
    await userCard.scrollIntoViewIfNeeded();
    await userCard.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'screenshots/07-card-expanded.png', fullPage: true });

    // Expanded detail section should appear — role, created date etc.
    const detail = page.locator('text=/Role|Created|Password/').first();
    await expect(detail).toBeVisible({ timeout: 5_000 });
    console.log('✅ User card expanded, details visible');
  });

  // ── 4. CREATE NEW USER ─────────────────────────────────────────────────
  test('Step 4 — Admin creates a new user through the form', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${SITE}/admin`, { waitUntil: 'networkidle', timeout: 30_000 });

    const umTab = page.locator('button, [role="tab"]').filter({ hasText: /user.?manag/i }).first();
    if (await umTab.isVisible({ timeout: 3_000 }).catch(() => false)) await umTab.click();
    await page.waitForTimeout(2000);

    // Click "Create User" button
    const createBtn = page.locator('button').filter({ hasText: /create.?user/i }).first();
    await expect(createBtn).toBeVisible({ timeout: 8_000 });
    await createBtn.scrollIntoViewIfNeeded();
    await createBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/08-create-form-open.png' });

    // Type username
    const usernameInput = page.locator('input[placeholder*="sername"], input[placeholder*="ser"]').last();
    await usernameInput.click();
    await usernameInput.type('e2etestuser', { delay: 70 });

    // Type password
    const passwordInput = page.locator('input[type="password"], input[placeholder*="assword"]').last();
    await passwordInput.click();
    await passwordInput.type('Test@9999', { delay: 70 });

    // Select role — choose "owner"
    const roleSelect = page.locator('select').last();
    if (await roleSelect.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await roleSelect.selectOption('owner');
    }

    await page.screenshot({ path: 'screenshots/09-create-form-filled.png' });

    // Click Create button
    const submitBtn = page.locator('button').filter({ hasText: /^create$/i }).last();
    await submitBtn.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/10-after-create.png', fullPage: true });

    // Toast or new user card should appear
    const success = page.locator('text=/created|success|e2etestuser/i').first();
    await expect(success).toBeVisible({ timeout: 8_000 });
    console.log('✅ New user "e2etestuser" created via UI');
  });

  // ── 5. CHANGE ROLE ─────────────────────────────────────────────────────
  test('Step 5 — Admin changes a user role through the UI', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${SITE}/admin`, { waitUntil: 'networkidle', timeout: 30_000 });

    const umTab = page.locator('button, [role="tab"]').filter({ hasText: /user.?manag/i }).first();
    if (await umTab.isVisible({ timeout: 3_000 }).catch(() => false)) await umTab.click();
    await page.waitForTimeout(5000);

    // Find the e2etestuser card and expand it
    const userCard = page.locator('.border.rounded-xl').filter({ hasText: /e2etestuser/i }).first();
    await expect(userCard).toBeVisible({ timeout: 10_000 });
    await userCard.scrollIntoViewIfNeeded();
    await userCard.click();
    await page.waitForTimeout(600);

    // Click "Change Role" button
    const changeRoleBtn = page.locator('button').filter({ hasText: /change.?role/i }).first();
    await expect(changeRoleBtn).toBeVisible({ timeout: 5_000 });
    await changeRoleBtn.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'screenshots/11-role-dropdown-open.png' });

    // Select worker role from dropdown
    const roleSelect = page.locator('select').filter({ hasText: /worker|owner|admin/i }).first();
    await roleSelect.selectOption('worker');
    await page.waitForTimeout(200);

    // Click checkmark/save
    const saveBtn = page.locator('button').filter({ has: page.locator('svg') }).filter({ hasText: '' }).nth(1);
    // More reliable: find the green/primary button next to select
    const confirmBtn = page.locator('button[class*="h-8"]').first();
    await confirmBtn.click();
    await page.waitForTimeout(2500);
    await page.screenshot({ path: 'screenshots/12-role-changed.png', fullPage: true });

    // Badge should show "Worker"
    const workerBadge = page.locator('.border.rounded-xl').filter({ hasText: /e2etestuser/i })
      .locator('text=/Worker/i').first();
    await expect(workerBadge).toBeVisible({ timeout: 8_000 });
    console.log('✅ Role changed to Worker for e2etestuser via UI');
  });

  // ── 6. RESET PASSWORD ─────────────────────────────────────────────────
  test('Step 6 — Admin resets password via the Reset Password form', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${SITE}/admin`, { waitUntil: 'networkidle', timeout: 30_000 });

    const umTab = page.locator('button, [role="tab"]').filter({ hasText: /user.?manag/i }).first();
    if (await umTab.isVisible({ timeout: 3_000 }).catch(() => false)) await umTab.click();
    await page.waitForTimeout(5000);

    // Expand e2etestuser
    const userCard = page.locator('.border.rounded-xl').filter({ hasText: /e2etestuser/i }).first();
    await expect(userCard).toBeVisible({ timeout: 10_000 });
    await userCard.click();
    await page.waitForTimeout(500);

    // Click Reset Password
    const resetBtn = page.locator('button').filter({ hasText: /reset.?password/i }).first();
    await expect(resetBtn).toBeVisible({ timeout: 5_000 });
    await resetBtn.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'screenshots/13-reset-pw-form.png' });

    // Type new password in the inline form
    const newPwInput = page.locator('input[type="password"], input[type="text"]').last();
    await newPwInput.click();
    await newPwInput.type('NewPass@2025', { delay: 70 });
    await page.screenshot({ path: 'screenshots/14-new-password-typed.png' });

    // Click the submit (shield/check icon button)
    const submitBtn = page.locator('button[class*="yellow"], button[class*="h-9"]').first();
    await submitBtn.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/15-after-reset.png', fullPage: true });

    // Toast confirmation
    const toast = page.locator('text=/password.*(reset|updated|changed)/i').first();
    await expect(toast).toBeVisible({ timeout: 8_000 });
    console.log('✅ Password reset via UI completed');
  });

  // ── 7. VERIFY RESET USER CAN LOGIN ────────────────────────────────────
  test('Step 7 — Verify reset user logs in with new password (browser login)', async ({ page }) => {
    await page.goto(`${SITE}/login`, { waitUntil: 'networkidle', timeout: 30_000 });

    const userInput = page.locator('input[type="text"], input[placeholder*="sername"]').first();
    await userInput.type('e2etestuser', { delay: 70 });

    const pwInput = page.locator('input[type="password"]').first();
    await pwInput.type('NewPass@2025', { delay: 70 });

    await page.screenshot({ path: 'screenshots/16-worker-login-attempt.png' });
    await page.locator('button[type="submit"]').click();

    // Should land on dashboard (not stay on login with error)
    await page.waitForURL(/\/(dashboard|home|transactions)/, { timeout: 15_000 });
    await page.screenshot({ path: 'screenshots/17-worker-logged-in.png', fullPage: true });

    // Worker role displayed in sidebar
    const roleText = page.locator('text=/worker/i').first();
    await expect(roleText).toBeVisible({ timeout: 5_000 });
    console.log('✅ e2etestuser logged in with new password, role: worker');
  });

  // ── 8. WORKER BLOCKED FROM ADMIN ──────────────────────────────────────
  test('Step 8 — Worker cannot access admin (sees guard screen)', async ({ page }) => {
    // Login as e2etestuser (worker)
    await page.goto(`${SITE}/login`, { waitUntil: 'networkidle', timeout: 30_000 });
    await page.locator('input[type="text"], input[placeholder*="sername"]').first().type('e2etestuser', { delay: 60 });
    await page.locator('input[type="password"]').first().type('NewPass@2025', { delay: 60 });
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/(dashboard|home|transactions)/, { timeout: 20_000 });

    // Try to navigate to admin
    await page.goto(`${SITE}/admin`, { waitUntil: 'networkidle', timeout: 20_000 });
    await page.screenshot({ path: 'screenshots/18-worker-on-admin.png', fullPage: true });

    // Should see access denied message (not admin content)
    const denied = page.locator('text=/admin access required|only administrator|forbidden/i').first();
    await expect(denied).toBeVisible({ timeout: 8_000 });

    // Should NOT see User Management (admin-only section)
    const umSection = page.locator('text=/user management/i').first();
    await expect(umSection).not.toBeVisible({ timeout: 3_000 });

    console.log('✅ Worker blocked — "Admin Access Required" shown, no admin content visible');
  });

  // ── 9. SETTINGS — CHANGE OWN PASSWORD ─────────────────────────────────
  test('Step 9 — Admin changes own password in Settings', async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate to Settings via sidebar
    const settingsLink = page.locator('a[href*="settings"], nav >> text=/settings/i').first();
    if (await settingsLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await settingsLink.click();
    } else {
      await page.goto(`${SITE}/settings`, { waitUntil: 'networkidle', timeout: 20_000 });
    }
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
    await page.screenshot({ path: 'screenshots/19-settings-page.png', fullPage: true });

    // Click the Password tab
    const pwTab = page.locator('button, [role="tab"]').filter({ hasText: /password/i }).first();
    if (await pwTab.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await pwTab.click();
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: 'screenshots/20-password-tab.png' });

    // Fill Current Password
    const inputs = page.locator('input[type="password"]');
    await expect(inputs).toHaveCount(3, { timeout: 8_000 }); // current / new / confirm
    await inputs.nth(0).click();
    await inputs.nth(0).type(ADMIN_P, { delay: 70 });

    // Fill New Password
    await inputs.nth(1).click();
    await inputs.nth(1).type('Admin@NewPass1', { delay: 70 });

    // Fill Confirm Password
    await inputs.nth(2).click();
    await inputs.nth(2).type('Admin@NewPass1', { delay: 70 });

    await page.screenshot({ path: 'screenshots/21-password-filled.png' });

    // Click save/update button
    const saveBtn = page.locator('button').filter({ hasText: /update|save|change.*password/i }).last();
    await saveBtn.scrollIntoViewIfNeeded();
    await saveBtn.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/22-after-pw-change.png' });

    // Toast success
    const toast = page.locator('text=/password.*(changed|updated|success)/i').first();
    await expect(toast).toBeVisible({ timeout: 8_000 });
    console.log('✅ Admin changed own password via Settings UI');

    // Reset back so admin still works (don't lock ourselves out!)
    await page.waitForTimeout(500);
    await inputs.nth(0).fill('');
    await inputs.nth(0).type('Admin@NewPass1', { delay: 60 });
    await inputs.nth(1).fill('');
    await inputs.nth(1).type(ADMIN_P, { delay: 60 });
    await inputs.nth(2).fill('');
    await inputs.nth(2).type(ADMIN_P, { delay: 60 });
    await saveBtn.click();
    await page.waitForTimeout(2000);
    console.log('✅ Admin password restored to original');
  });

  // ── 10. DELETE USER ────────────────────────────────────────────────────
  test('Step 10 — Admin deletes e2etestuser from the UI', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${SITE}/admin`, { waitUntil: 'networkidle', timeout: 30_000 });

    const umTab = page.locator('button, [role="tab"]').filter({ hasText: /user.?manag/i }).first();
    if (await umTab.isVisible({ timeout: 3_000 }).catch(() => false)) await umTab.click();
    await page.waitForTimeout(5000);

    // Find e2etestuser and expand
    const userCard = page.locator('.border.rounded-xl').filter({ hasText: /e2etestuser/i }).first();
    await expect(userCard).toBeVisible({ timeout: 10_000 });
    await userCard.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/23-before-delete.png', fullPage: true });

    // Click Delete User (red button)
    const deleteBtn = page.locator('button').filter({ hasText: /delete.?user/i }).first();
    await expect(deleteBtn).toBeVisible({ timeout: 5_000 });
    await deleteBtn.scrollIntoViewIfNeeded();
    await deleteBtn.click();

    // Handle browser confirm dialog
    page.on('dialog', async dialog => {
      console.log('  Confirm dialog:', dialog.message());
      await dialog.accept();
    });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/24-after-delete.png', fullPage: true });

    // e2etestuser card should be gone
    const deletedCard = page.locator('.border.rounded-xl').filter({ hasText: /e2etestuser/i });
    await expect(deletedCard).not.toBeVisible({ timeout: 8_000 });
    console.log('✅ e2etestuser deleted from UI, card removed from list');
  });

  // ── 11. AUDIT LOG VISIBLE ─────────────────────────────────────────────
  test('Step 11 — Admin views audit log showing all actions', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${SITE}/admin`, { waitUntil: 'networkidle', timeout: 30_000 });

    // Navigate to Audit Log section
    const auditTab = page.locator('button, [role="tab"]').filter({ hasText: /audit/i }).first();
    if (await auditTab.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await auditTab.click();
      await page.waitForTimeout(1500);
    }
    await page.screenshot({ path: 'screenshots/25-audit-log.png', fullPage: true });

    // Audit entries should appear
    const logEntries = page.locator('[class*="audit"], [class*="log"], text=/CREATE_USER|CHANGE_PASSWORD|DELETE_USER|UPDATE_ROLE/').first();
    await expect(logEntries).toBeVisible({ timeout: 10_000 });

    // Count visible entries
    const count = await page.locator('text=/CREATE_USER|CHANGE_PASSWORD|DELETE_USER|UPDATE_ROLE|LOGIN/').count();
    console.log(`✅ Audit log visible — ${count} action entries found`);

    await page.screenshot({ path: 'screenshots/26-audit-entries.png', fullPage: true });
  });
});
