import { test, expect } from '@playwright/test';

test.describe('E2E Flow', () => {
  const FRONTEND_URL = process.env.FRONTEND_URL || 'https://expensoo-eight.vercel.app';
  
  test('Complete login and verification flow', async ({ page }) => {
    await page.goto(FRONTEND_URL);

    // Should redirect to login if not authenticated
    await expect(page).toHaveURL(/.*\/login/);

    // Verify Sign In elements are visible
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();

    // Fill login
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Verify successful login
    await expect(page).toHaveURL(/.*\/dashboard/);
    // Check Dashboard
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    // Check Transactions
    await page.getByRole('link', { name: 'transactions' }).click();
    await expect(page.getByRole('heading', { name: 'Transactions', exact: true })).toBeVisible();

    // Create a transaction
    await page.getByRole('link', { name: 'New Transaction' }).click();
    await expect(page.getByRole('heading', { name: 'New Transaction' })).toBeVisible();
    
    // Check Suppliers
    await page.getByRole('link', { name: 'suppliers' }).click();
    await expect(page.getByRole('heading', { name: 'Suppliers' })).toBeVisible();
    
    // Take a screenshot of the suppliers page
    await page.screenshot({ path: 'suppliers-page.png' });
    
    // Logout
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/.*\/login/);
  });
});
