const { test, expect } = require('@playwright/test');

test.describe('Transaction Creation Test Suite', () => {
  const FRONTEND_URL = 'https://callmemobiles-mlo3gyi9r-ritheshs-projects-2bddf162.vercel.app';
  
  test.beforeEach(async ({ page }) => {
    await page.goto(FRONTEND_URL);
    
    // Login if needed
    if (await page.getByText('Login').isVisible()) {
      await page.getByPlaceholder('Email').fill('test@example.com');
      await page.getByPlaceholder('Password').fill('test123');
      await page.getByRole('button', { name: 'Login' }).click();
      await expect(page.getByText('Dashboard')).toBeVisible();
    }
  });

  test('should create a new transaction successfully', async ({ page }) => {
    // Navigate to transactions page
    await page.getByRole('link', { name: 'Transactions' }).click();
    await expect(page.getByText('Transactions')).toBeVisible();

    // Click create transaction button
    await page.getByRole('button', { name: 'Create Transaction' }).click();

    // Fill in transaction details
    await page.getByLabel('Customer Name').fill('Test Customer');
    await page.getByLabel('Amount').fill('1000');
    await page.getByLabel('Type').selectOption('sales');
    await page.getByLabel('Status').selectOption('completed');

    // Take a screenshot before submission
    await page.screenshot({ path: 'before-transaction-submit.png' });

    // Submit the form
    await page.getByRole('button', { name: 'Create' }).click();

    // Verify success message
    await expect(page.getByText('Transaction created successfully')).toBeVisible();

    // Verify transaction appears in list
    await expect(page.getByText('Test Customer')).toBeVisible();
    await expect(page.getByText('₹1,000')).toBeVisible();
  });

  test('should show API error messages', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/transactions/new`);

    // Try to submit empty form
    await page.getByRole('button', { name: 'Create' }).click();

    // Verify validation errors
    await expect(page.getByText('Customer name is required')).toBeVisible();
    await expect(page.getByText('Amount is required')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Force API error by sending invalid data
    await page.route('**/api/transactions', route => {
      return route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    await page.goto(`${FRONTEND_URL}/transactions/new`);

    // Fill form with valid data
    await page.getByLabel('Customer Name').fill('Test Error Customer');
    await page.getByLabel('Amount').fill('1000');
    await page.getByLabel('Type').selectOption('sales');
    await page.getByLabel('Status').selectOption('completed');

    // Submit and verify error handling
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByText('Failed to create transaction')).toBeVisible();
  });
});
