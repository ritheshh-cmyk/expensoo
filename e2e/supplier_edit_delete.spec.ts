import { test, expect } from '@playwright/test';

test.describe('Expensoo E2E - Supplier Edit and Delete Verification', () => {
  test('Verify adding, editing, and deleting suppliers directly from Suppliers page', async ({ page }) => {
    // 1. Navigate to login
    console.log('Navigating to login page...');
    await page.goto('/login');
    
    // 2. Perform Login
    console.log('Logging in...');
    await page.fill('#username', 'rajshekhar');
    await page.fill('#password', 'rajshekhar123');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard');
    console.log('Successfully logged in!');

    // 3. Go to Suppliers page
    console.log('Navigating to Suppliers page...');
    await page.goto('/suppliers');
    await page.waitForSelector('h1:has-text("Suppliers")');

    // 4. Click Add Supplier button
    console.log('Opening Add Supplier Dialog...');
    await page.click('button:has-text("Add Supplier")');
    await page.waitForSelector('#sup-name');

    // 5. Fill and submit Add Supplier form
    console.log('Filling Add Supplier Form...');
    const supplierName = `E2E Supplier ${Date.now()}`;
    await page.fill('#sup-name', supplierName);
    await page.fill('#sup-person', 'E2E Contact Person');
    await page.fill('#sup-phone', '9999988888');
    
    // Use a specific selector for the submit button in the dialog to avoid clicking the background header button
    await page.click('[role="dialog"] button:has-text("Add Supplier")');

    // Wait for dialog to close and list to reload
    await page.waitForSelector('#sup-name', { state: 'detached', timeout: 10000 });
    console.log('Supplier added successfully!');

    // 6. Find the newly created supplier card
    console.log(`Locating newly added supplier: ${supplierName}`);
    const supplierCard = page.locator('div.relative.overflow-hidden', { hasText: supplierName }).first();
    await supplierCard.waitFor({ state: 'visible', timeout: 10000 });

    // 7. Click Edit on the card using data-testid
    console.log('Clicking Edit button on the supplier card...');
    const editBtn = supplierCard.locator('[data-testid="edit-supplier-btn"]').first();
    await editBtn.click();
    await page.waitForSelector('#edit-sup-name');

    // 8. Modify details and save
    console.log('Updating Supplier Details...');
    const updatedName = `${supplierName} Updated`;
    await page.fill('#edit-sup-name', updatedName);
    await page.fill('#edit-sup-person', 'E2E Contact Person Updated');
    await page.fill('#edit-sup-phone', '7777766666');
    await page.click('[role="dialog"] button:has-text("Save Changes")');

    // Wait for dialog to close
    await page.waitForSelector('#edit-sup-name', { state: 'detached', timeout: 10000 });
    console.log('Supplier updated successfully!');

    // 9. Verify updated card details
    console.log(`Locating updated supplier card: ${updatedName}`);
    const updatedCard = page.locator('div.relative.overflow-hidden', { hasText: updatedName }).first();
    await updatedCard.waitFor({ state: 'visible', timeout: 10000 });
    
    // Verify phone number was updated
    await expect(updatedCard.locator('text=7777766666')).toBeVisible();
    await expect(updatedCard.locator('text=E2E Contact Person Updated')).toBeVisible();
    console.log('✅ Updated card details verified successfully!');

    // 10. Click Delete on the card using data-testid
    console.log('Clicking Delete button on the supplier card...');
    const deleteBtn = updatedCard.locator('[data-testid="delete-supplier-btn"]').first();
    await deleteBtn.click();
    await page.waitForSelector('[role="dialog"] button:has-text("Delete Supplier")');

    // 11. Confirm Delete
    console.log('Confirming deletion...');
    await page.click('[role="dialog"] button:has-text("Delete Supplier")');

    // Wait for dialog to close and card to disappear
    await page.waitForSelector('[role="dialog"] button:has-text("Delete Supplier")', { state: 'detached', timeout: 10000 });
    await updatedCard.waitFor({ state: 'detached', timeout: 10000 });
    console.log('✅ Supplier deleted successfully!');

    // 12. Verify card is no longer present
    const cardCount = await page.locator('div.relative.overflow-hidden', { hasText: updatedName }).count();
    expect(cardCount).toBe(0);
    console.log('🎉 E2E Supplier Edit/Delete test passed successfully!');
  });
});
