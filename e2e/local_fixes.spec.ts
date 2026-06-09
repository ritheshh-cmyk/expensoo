import { test, expect } from '@playwright/test';

test.describe('Expensoo E2E - Local Fixes Verification', () => {
  test('Verify transaction flow, parts persistence, and supplier select visibility', async ({ page }) => {
    // 1. Navigate to login
    console.log('Navigating to login page...');
    await page.goto('/login');
    
    // 2. Perform Login
    console.log('Logging in as rajshekhar...');
    await page.fill('#username', 'rajshekhar');
    await page.fill('#password', 'rajshekhar123');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard');
    console.log('Successfully logged in! Redirected to:', page.url());

    // 3. Go to New Transaction form
    console.log('Navigating to New Transaction Form...');
    await page.goto('/transactions/new');
    await page.waitForSelector('input[placeholder="Enter customer name"]');

    // 4. Fill Step 1 (Customer Details)
    console.log('Filling Customer Details (Step 1)...');
    await page.fill('input[placeholder*="customer name"]', 'E2E Playwright Customer');
    await page.fill('input[placeholder*="phone number"]', '9876543210');
    await page.fill('input[placeholder*="iPhone"]', 'iPhone 15 Pro Max');
    await page.click('#next-btn');

    // 5. Fill Step 2 (Repair Cost & Type)
    console.log('Filling Repair Details (Step 2)...');
    await page.waitForSelector('input[id="repairCost"]');

    // Select Repair Type
    console.log('Selecting Repair Type...');
    await page.click('button[role="combobox"]:has-text("Select repair type")');
    await page.waitForSelector('[role="option"]');
    await page.click('[role="option"]:has-text("Screen Replacement")');

    // Select Payment Method
    console.log('Selecting Payment Method...');
    await page.locator('button[role="combobox"]').nth(1).click();
    await page.waitForSelector('[role="option"]');
    await page.click('[role="option"]:has-text("Cash")');

    await page.fill('input[id="repairCost"]', '4500');
    await page.fill('input[id="amountGiven"]', '5000');
    await page.click('#next-btn');
    await page.waitForTimeout(500);

    // 6. Fill Step 3 (Parts & Suppliers)
    console.log('Filling Parts details (Step 3)...');
    await page.waitForSelector('#useExternalPurchase');
    
    // Toggle "Box 1: External Purchase (parts from supplier)"
    await page.click('#useExternalPurchase');
    await page.waitForSelector('button[role="combobox"]');

    // Open supplier dropdown and select first supplier
    console.log('Opening Supplier Dropdown...');
    const supplierDropdown = page.locator('button[role="combobox"]').first();
    await supplierDropdown.click();
    await page.waitForSelector('[role="option"]');

    const options = page.locator('[role="option"]');
    const optionsCount = await options.count();
    console.log(`Found ${optionsCount} options in supplier dropdown`);

    if (optionsCount > 0) {
      const firstOptionText = await options.first().textContent();
      console.log(`Selecting supplier: ${firstOptionText}`);
      await options.first().click();

      // Verify selected value is visible and not blank
      await page.waitForTimeout(500);
      const selectedText = await supplierDropdown.textContent();
      console.log(`Supplier dropdown trigger displays: "${selectedText}"`);
      expect(selectedText).not.toBeNull();
      expect(selectedText?.trim()).not.toBe('');
      expect(selectedText?.trim()).not.toContain('Choose supplier');
      console.log('✅ Supplier trigger text matches selection (Fix 7 confirmed!)');
    } else {
      console.log('⚠️ No suppliers available in dropdown');
    }

    // Click "Add External Part" button to insert a parts list row
    console.log('Clicking Add External Part button...');
    await page.click('button:has-text("Add External Part")');
    await page.waitForSelector('input[placeholder="Part name"]');

    // Fill part details
    console.log('Filling Part name, Cost and Qty...');
    await page.fill('input[placeholder="Part name"]', 'Premium OLED Screen');
    await page.fill('input[placeholder="Cost"]', '2200');
    await page.fill('input[placeholder="Qty"]', '1');

    // Go to Step 4
    console.log('Going to Step 4...');
    await page.click('#next-btn');

    // 7. Step 4 (Summary & Remarks)
    console.log('Filling remarks (Step 4)...');
    await page.waitForSelector('textarea[id="remarks"]');
    await page.fill('textarea[id="remarks"]', 'E2E Playwright verification remarks.');

    // Submit transaction
    console.log('Submitting transaction...');
    await page.click('#submit-btn');

    // 8. Verify success screen (Fix 5 confirmed!)
    console.log('Waiting for success screen...');
    await page.waitForSelector('#transaction-success-container', { timeout: 15000 });
    console.log('✅ Transaction created successfully without crashing!');

    // 9. Go to Transactions history
    await page.click('#go-to-transactions-btn');
    await page.waitForURL('**/transactions');
    console.log('Successfully navigated back to transactions list');

    // 10. Verify created transaction contains parts list details (Fix 6 confirmed!)
    console.log('Waiting for new transaction row to load in the table...');
    const txnRow = page.locator('table tbody tr', { hasText: 'E2E Playwright Customer' }).first();
    await txnRow.waitFor({ state: 'visible', timeout: 15000 });

    console.log('Expanding transaction details row...');
    await txnRow.click();

    console.log('Verifying Premium OLED Screen is displayed in parts list...');
    await page.waitForSelector('table tbody >> text="Premium OLED Screen"', { timeout: 5000 });

    console.log('🎉 E2E Verification successful!');
  });
});
