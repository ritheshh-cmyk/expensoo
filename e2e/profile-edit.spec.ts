import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

test('Inline profile display name edit updates successfully', async ({ page }) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle all OPTIONS requests
  await page.route('**/api/**', async route => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 200, headers: corsHeaders });
    } else {
      route.fallback();
    }
  });

  // Mock login
  await page.route('**/api/auth/login', async route => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 200, headers: corsHeaders });
    } else {
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-token',
          user: { id: '1', username: 'admin', name: 'Admin', role: 'admin', email: 'admin@example.com' }
        })
      });
    }
  });

  // Mock verify
  await page.route('**/api/auth/verify', async route => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 200, headers: corsHeaders });
    } else {
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { valid: true } })
      });
    }
  });

  // Mock dashboard stats
  await page.route('**/api/dashboard/stats', async route => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 200, headers: corsHeaders });
    } else {
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        contentType: 'application/json',
        body: JSON.stringify({ totals: { totalRevenue: 0, pendingTransactions: 0 }, today: { totalRevenue: 0 }, week: { totalRevenue: 0 } })
      });
    }
  });

  // Mock transactions
  await page.route('**/api/transactions', async route => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 200, headers: corsHeaders });
    } else {
      await route.fulfill({ status: 200, headers: corsHeaders, contentType: 'application/json', body: JSON.stringify({ data: [], count: 0 }) });
    }
  });

  // Mock profile update
  await page.route('**/api/profile', async route => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 200, headers: corsHeaders });
    } else {
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        contentType: 'application/json',
        body: JSON.stringify({ id: '1', name: 'Admin Testing', full_name: 'Admin Testing', role: 'admin' })
      });
    }
  });

  // Log page console messages
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page.goto('http://localhost:5173/login');
  await page.fill('#username', 'admin');
  await page.fill('#password', 'Secret@123');
  
  const [response] = await Promise.all([
    page.waitForResponse('**/api/auth/login'),
    page.click('button[type="submit"]')
  ]);

  console.log('Login Response:', response.status(), await response.json().catch(() => 'no json'));

  // Wait for login and navigate to profile
  await expect(page).toHaveURL(/.*\/dashboard/);  
  await page.goto('http://localhost:5173/profile');
  await expect(page.locator('h1').filter({ hasText: 'My Profile' })).toBeVisible();

  // Click inline edit
  await page.getByRole('button', { name: 'Edit name' }).click();

  // A safer selector:
  const inlineInput = page.locator('input[value]').first();
  await inlineInput.fill('');
  await inlineInput.fill('Admin Testing');
  
  // Click Save Name
  await page.getByRole('button', { name: 'Save name' }).click();

  // Wait for the UI to reflect the new name (either the toast or the heading)
  await expect(page.locator('h1, h2, h3, p, span, div').filter({ hasText: 'Admin Testing' }).first()).toBeVisible({ timeout: 5000 });
});
