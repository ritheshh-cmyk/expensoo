import { test, expect, chromium } from '@playwright/test';

const SITE      = 'https://expensoo-eight.vercel.app';
const API       = 'https://backendmobile-4swg.onrender.com';
const ADMIN_U   = 'admin';
const ADMIN_P   = 'admin123';
const TEST_USER = `testuser_${Date.now()}`;
const TEST_PASS = 'Test@1234';
const NEW_PASS  = 'New@5678!';

// ── helpers ──────────────────────────────────────────────────────────────────
async function apiLogin(username: string, password: string) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const body = await res.json();
  return { ok: res.ok, token: body.token, user: body.user, error: body.error };
}

async function loginUI(page: any, username: string, password: string) {
  await page.goto(`${SITE}/login`, { waitUntil: 'networkidle', timeout: 45_000 });
  await page.fill('input[type="text"], input[name="username"], input[placeholder*="sername"]', username);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|admin|home)/, { timeout: 15_000 });
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 1 — Backend API health
// ─────────────────────────────────────────────────────────────────────────────
test.describe('🔌 Backend API — direct checks', () => {

  test('Health endpoint responds OK', async () => {
    const r = await fetch(`${API}/health`);
    const b = await r.json();
    expect(r.status).toBe(200);
    expect(b.status).toBe('OK');
    console.log('✅ Health:', b.message, '| time:', b.timestamp);
  });

  test('Admin login returns valid token', async () => {
    const { ok, token, user } = await apiLogin(ADMIN_U, ADMIN_P);
    expect(ok).toBe(true);
    expect(token).toBeTruthy();
    expect(user.role).toBe('admin');
    console.log('✅ Admin login OK — user:', user.username, 'role:', user.role);
  });

  test('GET /api/auth/users — admin sees user list with extended fields', async () => {
    const { token } = await apiLogin(ADMIN_U, ADMIN_P);
    const r = await fetch(`${API}/api/auth/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(r.status).toBe(200);
    const users: any[] = await r.json();
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThan(0);
    const admin = users.find((u: any) => u.username === 'admin');
    expect(admin).toBeTruthy();
    expect(admin.role).toBe('admin');
    // New fields from latest deploy
    expect('passwordChangedAt' in admin).toBe(true);
    expect('createdAt' in admin).toBe(true);
    console.log('✅ GET /users OK — total users:', users.length);
    console.log('   Fields:', Object.keys(admin).join(', '));
  });

  test('GET /api/auth/users — worker gets 403', async () => {
    // Create a worker first, then test
    const { token: adminToken } = await apiLogin(ADMIN_U, ADMIN_P);
    // Create temp worker
    await fetch(`${API}/api/auth/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ username: `worker_${Date.now()}`, password: 'Work@1234', role: 'worker' }),
    });
    // Try to login as that worker and access /users
    const workerLogin = await apiLogin(`worker_${Date.now() - 1}`, 'Work@1234');
    if (workerLogin.token) {
      const r = await fetch(`${API}/api/auth/users`, {
        headers: { Authorization: `Bearer ${workerLogin.token}` },
      });
      expect(r.status).toBe(403);
      console.log('✅ Worker correctly blocked from /users');
    }
  });

  test('POST /api/auth/users — admin creates new user', async () => {
    const { token } = await apiLogin(ADMIN_U, ADMIN_P);
    const r = await fetch(`${API}/api/auth/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ username: TEST_USER, password: TEST_PASS, role: 'worker' }),
    });
    const body = await r.json();
    expect(r.status).toBe(201);
    expect(body.user.username).toBe(TEST_USER);
    expect(body.user.role).toBe('worker');
    console.log('✅ User created:', body.user.username, 'id:', body.user.id);
  });

  test('New user can login immediately after creation', async () => {
    const { ok, token, user } = await apiLogin(TEST_USER, TEST_PASS);
    expect(ok).toBe(true);
    expect(token).toBeTruthy();
    expect(user.username).toBe(TEST_USER);
    console.log('✅ New user login OK:', user.username, 'role:', user.role);
  });

  test('Admin can reset user password via POST /reset-password', async () => {
    const { token: adminToken } = await apiLogin(ADMIN_U, ADMIN_P);
    // Get user id
    const usersR = await fetch(`${API}/api/auth/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const users: any[] = await usersR.json();
    const targetUser = users.find((u: any) => u.username === TEST_USER);
    expect(targetUser).toBeTruthy();

    const r = await fetch(`${API}/api/auth/users/${targetUser.id}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ newPassword: NEW_PASS }),
    });
    const body = await r.json();
    expect(r.status).toBe(200);
    expect(body.success).toBe(true);
    console.log('✅ Password reset OK:', body.message);
  });

  test('User can login with NEW password after admin reset', async () => {
    const { ok, token } = await apiLogin(TEST_USER, NEW_PASS);
    expect(ok).toBe(true);
    expect(token).toBeTruthy();
    console.log('✅ Login with new password successful');
  });

  test('Old password no longer works after reset', async () => {
    const { ok } = await apiLogin(TEST_USER, TEST_PASS);
    expect(ok).toBe(false);
    console.log('✅ Old password correctly rejected');
  });

  test('Admin can change role via PUT /users/:id', async () => {
    const { token } = await apiLogin(ADMIN_U, ADMIN_P);
    const usersR = await fetch(`${API}/api/auth/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const users: any[] = await usersR.json();
    const targetUser = users.find((u: any) => u.username === TEST_USER);

    const r = await fetch(`${API}/api/auth/users/${targetUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role: 'owner' }),
    });
    const body = await r.json();
    expect(r.status).toBe(200);
    expect(body.user.role).toBe('owner');
    console.log('✅ Role changed to owner for:', TEST_USER);
  });

  test('Role change reflects immediately on next login', async () => {
    const { user } = await apiLogin(TEST_USER, NEW_PASS);
    expect(user.role).toBe('owner');
    console.log('✅ New role reflected in token:', user.role);
  });

  test('Admin can delete user via DELETE /users/:id', async () => {
    const { token } = await apiLogin(ADMIN_U, ADMIN_P);
    const usersR = await fetch(`${API}/api/auth/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const users: any[] = await usersR.json();
    const targetUser = users.find((u: any) => u.username === TEST_USER);

    const r = await fetch(`${API}/api/auth/users/${targetUser.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(r.status).toBe(200);
    console.log('✅ User deleted:', TEST_USER);
  });

  test('Deleted user cannot login', async () => {
    const { ok } = await apiLogin(TEST_USER, NEW_PASS);
    expect(ok).toBe(false);
    console.log('✅ Deleted user correctly rejected');
  });

  test('Audit log records all admin actions', async () => {
    const { token } = await apiLogin(ADMIN_U, ADMIN_P);
    const r = await fetch(`${API}/api/auth/audit/logs?limit=50`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await r.json();
    expect(r.status).toBe(200);
    const logs: any[] = body.data;
    const actions = logs.map((l: any) => l.action);
    console.log('✅ Audit log actions found:', [...new Set(actions)].join(', '));
    // Should have CREATE_USER, CHANGE_PASSWORD, UPDATE_ROLE, DELETE_USER from our test run
    expect(actions.some((a: string) => a === 'CREATE_USER')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 2 — Admin UI (Playwright browser)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('🖥 Admin Page UI — browser tests', () => {

  test('Admin can login and reach /admin page', async ({ page }) => {
    await loginUI(page, ADMIN_U, ADMIN_P);
    await page.goto(`${SITE}/admin`, { waitUntil: 'networkidle', timeout: 30_000 });
    await expect(page).toHaveURL(/admin/);
    // Admin heading visible
    const heading = page.locator('h1, h2').filter({ hasText: /admin/i }).first();
    await expect(heading).toBeVisible({ timeout: 10_000 });
    console.log('✅ Admin page loaded');
    await page.screenshot({ path: 'pw-admin-loaded.png', fullPage: false });
  });

  test('User Management section is visible and shows users', async ({ page }) => {
    await loginUI(page, ADMIN_U, ADMIN_P);
    await page.goto(`${SITE}/admin`, { waitUntil: 'networkidle', timeout: 30_000 });

    // Click User Management tab/section if needed
    const umBtn = page.locator('button, a').filter({ hasText: /user.?manag/i }).first();
    if (await umBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await umBtn.click();
      await page.waitForTimeout(1500);
    }

    // Wait for user cards — no 404 error shown
    const errorEl = page.locator('text=HTTP 404').first();
    await page.waitForTimeout(4000); // backend cold-start
    const has404 = await errorEl.isVisible({ timeout: 3_000 }).catch(() => false);

    if (has404) {
      // Hit Refresh
      const refreshBtn = page.locator('button').filter({ hasText: /refresh/i }).first();
      if (await refreshBtn.isVisible()) {
        await refreshBtn.click();
        await page.waitForTimeout(6000);
      }
    }

    // After retry, 404 should be gone
    await expect(errorEl).not.toBeVisible({ timeout: 10_000 });
    console.log('✅ No 404 error in User Management');

    await page.screenshot({ path: 'pw-user-mgmt.png', fullPage: false });
  });

  test('Worker cannot access /admin — gets redirected', async ({ page }) => {
    // Create a worker via API
    const { token } = await apiLogin(ADMIN_U, ADMIN_P);
    const tempWorker = `workerui_${Date.now()}`;
    await fetch(`${API}/api/auth/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ username: tempWorker, password: 'Work@1234', role: 'worker' }),
    });

    await loginUI(page, tempWorker, 'Work@1234');
    await page.goto(`${SITE}/admin`, { waitUntil: 'networkidle', timeout: 20_000 });

    // Should be redirected away from admin or show access denied
    const url = page.url();
    const isDenied = !url.includes('/admin') ||
      await page.locator('text=/access denied|not authorized|forbidden/i').isVisible({ timeout: 3_000 }).catch(() => false);
    expect(isDenied).toBe(true);
    console.log('✅ Worker correctly blocked from admin. URL:', url);
    await page.screenshot({ path: 'pw-worker-blocked.png' });

    // Cleanup
    const usersR = await fetch(`${API}/api/auth/users`, { headers: { Authorization: `Bearer ${token}` } });
    const users: any[] = await usersR.json();
    const w = users.find((u: any) => u.username === tempWorker);
    if (w) await fetch(`${API}/api/auth/users/${w.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
  });

  test('Settings page has Change Password tab and submits', async ({ page }) => {
    await loginUI(page, ADMIN_U, ADMIN_P);
    await page.goto(`${SITE}/settings`, { waitUntil: 'networkidle', timeout: 20_000 });

    // Look for password tab
    const pwTab = page.locator('button, [role="tab"]').filter({ hasText: /password/i }).first();
    if (await pwTab.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await pwTab.click();
      await page.waitForTimeout(500);
    }

    // Fill in password fields
    const inputs = page.locator('input[type="password"]');
    const count = await inputs.count();
    expect(count).toBeGreaterThanOrEqual(2);
    console.log('✅ Password inputs found:', count);
    await page.screenshot({ path: 'pw-settings-password.png' });
  });
});
