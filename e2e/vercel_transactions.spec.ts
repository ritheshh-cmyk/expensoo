import { test, expect } from '@playwright/test';

test.describe('E2E - Dashboard, Profile, Transactions, and Render Checks', () => {
  async function login(page, username, password) {
    await page.goto('/login');
    await page.fill('input#username', username);
    await page.fill('input#password', password);
    await page.click('button[type="submit"]');
    try {
      await page.waitForSelector('text="Dashboard"', { timeout: 10000 });
    } catch (e) {
      const bodyText = await page.locator('body').innerText();
      console.log('Login failed, body text:', bodyText.substring(0, 500));
      throw e;
    }
  }

  async function createTransactions(page, count, creatorName) {
    for (let i = 0; i < count; i++) {
      await page.goto('/transactions/new');
      await page.fill('input#customerName', `Customer ${creatorName} ${i}`);
      await page.fill('input#phoneNumber', `900000000${i}`);
      await page.fill('input#deviceModel', `Model ${i}`);
      
      await page.click('button#next-btn'); // Go to Step 2
      
      await page.waitForSelector('input#repairCost');
      
      // Select repair type
      await page.click('button[role="combobox"]:has-text("Select repair type")');
      await page.click('div[role="option"]:has-text("Screen Replacement")');
      
      await page.fill('input#repairCost', '1000');
      
      // Select payment method
      await page.locator('button[role="combobox"]').nth(1).click();
      await page.click('div[role="option"]:has-text("Cash")');
      
      await page.fill('input#amountGiven', '1000');
      
      await page.click('button#next-btn'); // Go to Step 3
      
      await page.waitForSelector('button#next-btn');
      await page.click('button#next-btn'); // Go to Step 4
      
      await page.waitForSelector('button#submit-btn');
      await page.click('button#submit-btn');
      
      await page.waitForSelector('button#go-to-transactions-btn', { timeout: 15000 });
      await page.click('button#go-to-transactions-btn');

      await page.waitForURL('**/transactions', { timeout: 15000 });
      await page.waitForSelector('table tbody tr');
    }
  }

  test('Update profile, check render issues on every page, and create transactions with multiple roles', async ({ page }) => {
    // Collect errors
    const errors: string[] = [];
    page.on('pageerror', err => {
      errors.push(err.message);
    });

    // Step 1: Admin login & Profile update
    await login(page, 'admin', 'Lucky@1222');
    
    // Check all pages for render issues as admin
    const pagesToCheck = [
      '/dashboard',
      '/transactions',
      '/inventory',
      '/users',
      '/settings'
    ];

    for (const p of pagesToCheck) {
      await page.goto(p);
      // Wait for any network requests or basic rendering to settle
      await page.waitForTimeout(500); 
    }

    expect(errors.length).toBe(0);

    // Profile update
    await page.goto('/profile');
    const newAdminName = `Admin ${Date.now().toString().slice(-4)}`;
    await page.fill('input[name="full_name"], input#name', newAdminName);
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(1000); // Wait for toast/update
    
    // Verify name updated in header
    await expect(page.locator('header')).toContainText(newAdminName);

    // Create 7 transactions as admin
    await createTransactions(page, 7, newAdminName);
    
    // Check dashboard stats for admin
    await page.goto('/dashboard');
    const todayRevenue = await page.locator('text="Today\'s Revenue" >> xpath=..').innerText();
    expect(todayRevenue).not.toContain('10');
    expect(todayRevenue).not.toContain('10.00');

    // Go to transaction history and verify names are visible
    await page.goto('/transactions');
    await expect(page.locator('table')).toContainText(newAdminName, { timeout: 15000 });
  });
});
