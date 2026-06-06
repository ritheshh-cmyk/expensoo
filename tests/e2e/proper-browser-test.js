import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false, slowMo: 50 });
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await context.newPage();

// Log all browser console messages
page.on('console', msg => console.log(`BROWSER CONSOLE: ${msg.type()} - ${msg.text()}`));
page.on('pageerror', err => console.log(`BROWSER ERROR: ${err.message}`));
page.on('requestfailed', request => console.log(`BROWSER REQUEST FAILED: ${request.url()} - ${request.failure()?.errorText}`));

const targetUrl = 'https://expensoo-eight.vercel.app';

// Helper to login
async function login(username, password) {
  console.log(`Logging in as ${username}...`);
  await page.goto(`${targetUrl}/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500); // Give React time to hydrate so the form doesn't do a native HTML submit!
  await page.fill('#username', username);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  // Wait for dashboard to load by waiting for the URL to contain /dashboard
  try {
    await page.waitForURL('**/dashboard', { timeout: 15000 });
  } catch (err) {
    await page.screenshot({ path: `C:/Users/rithesh/.gemini/antigravity/brain/8d87d7db-1409-4765-a7e7-846949120efb/login-failed.png` });
    throw err;
  }
  await page.waitForTimeout(2000); // Wait for the sidebar and React components to fully hydrate
  console.log(`Logged in as ${username}`);
}

// Helper to logout
async function logout() {
  console.log('Logging out...');
  await page.getByText('Profile', { exact: true }).first().click({ force: true });
  await page.waitForSelector('text=Profile Settings');
  await page.locator('button:has-text("Logout"), button:has-text("Sign Out")').first().click({ force: true });
  await page.waitForSelector('button[type="submit"]', { state: 'visible', timeout: 15000 });
  console.log('Logged out.');
}

// Helper to create a transaction
async function createTransaction(type, customerName, amount, itemName = null) {
  console.log(`Creating transaction: ${type} for ${customerName}...`);
  await page.screenshot({ path: `C:/Users/rithesh/.gemini/antigravity/brain/8d87d7db-1409-4765-a7e7-846949120efb/before-transactions.png` });
  await page.getByText('Transactions', { exact: true }).first().click({ force: true });
  await page.waitForSelector('button:has-text("New Transaction"), a:has-text("New Transaction")');
  await page.click('button:has-text("New Transaction"), a:has-text("New Transaction")');
  
  // Select category tab
  if (type === 'sales') {
    await page.click('button:has-text("Sales")');
  } else if (type === 'internal-repair') {
    await page.click('button:has-text("Internal")');
  } else {
    await page.click('button:has-text("Repair")');
  }

  // Wait for Customer Name input (Step 1)
  await page.waitForSelector('input[name="customerName"]', { state: 'visible' });
  await page.fill('input[name="customerName"]', customerName);
  await page.fill('input[name="phoneNumber"]', '9876543210');
  
  if (type !== 'sales') {
    await page.fill('input[name="deviceModel"]', 'Test Device');
  } else {
    await page.fill('input[name="itemName"]', itemName || 'Test Item');
  }

  // Next step
  await page.click('button:has-text("Next")');
  await page.waitForTimeout(500);

  // Step 2
  if (type === 'sales') {
    await page.fill('input[name="soldPrice"]', amount.toString());
    await page.fill('input[name="ourCost"]', (amount - 100).toString());
  } else if (type === 'internal-repair') {
    await page.click('button[role="combobox"]');
    await page.click('text=Screen Replacement'); // Select a repair type
  } else {
    await page.click('button[role="combobox"]');
    await page.click('text=Screen Replacement');
    await page.fill('input[name="repairCost"]', amount.toString());
    // amountGiven might autofill, but let's ensure it's filled
    await page.fill('input[name="amountGiven"]', amount.toString());
  }

  // Next step
  await page.click('button:has-text("Next")');
  await page.waitForTimeout(500);

  // Step 3 (Parts / internal details)
  if (type === 'repair' || type === 'sales') {
    // Just click Next or Skip parts
    const nextBtn = await page.$('button:has-text("Next")');
    if (nextBtn) {
      await page.click('button:has-text("Next")');
      await page.waitForTimeout(500);
    }
  } else if (type === 'internal-repair') {
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);
  }

  // Step 4 (Submit)
  await page.click('button:has-text("Submit"), button:has-text("Complete")');
  
  // Wait for success
  await page.waitForSelector('text=/Transaction Created|Success/i', { timeout: 15000 });
  console.log(`Successfully created transaction for ${customerName}`);
  
  // Navigate back to dashboard to reset state for next test safely
  await page.getByText('Dashboard', { exact: true }).first().click({ force: true });
  await page.waitForTimeout(1000);
}

try {
  // 1. Admin login & 2 transactions
  await login('admin', 'Lucky@1222');
  await createTransaction('repair', 'E2E Admin Customer 1', 1500);
  await createTransaction('repair', 'E2E Admin Customer 2', 2500);
  
  // 2. Profile Display Name Test
  console.log('Testing profile name propagation...');
  await page.getByText('Profile', { exact: true }).first().click({ force: true });
  const newName = `Admin E2E ${Math.floor(Math.random() * 1000)}`;
  await page.fill('input[name="displayName"], input[name="name"]', newName);
  await page.click('button:has-text("Save Changes")');
  await page.waitForSelector('text=/Profile updated|Success/i', { timeout: 10000 }).catch(() => console.log('No toast seen, continuing...'));
  
  // Verify Dashboard Welcome Message
  await page.getByText('Dashboard', { exact: true }).first().click({ force: true });
  await page.waitForSelector(`text=${newName}`, { timeout: 10000 });
  console.log(`Profile propagation verified: Name updated to ${newName} on dashboard.`);

  await logout();

  // 3. Owner login & 2 transactions
  await login('testowner', 'Owner@1234');
  await createTransaction('sales', 'E2E Owner Customer 1', 5000, 'Screen Guard');
  await createTransaction('sales', 'E2E Owner Customer 2', 6000, 'Back Cover');
  await logout();

  // 4. Worker login & 2 transactions
  await login('testworker', 'Worker@1234');
  await createTransaction('internal-repair', 'E2E Worker Customer 1', 800);
  await createTransaction('internal-repair', 'E2E Worker Customer 2', 900);
  await logout();

  console.log('✅ ALL E2E BROWSER TESTS PASSED!');
} catch (error) {
  console.error('❌ E2E TEST FAILED:', error);
  await page.screenshot({ path: 'tests/e2e/failure-screenshot.png' });
  process.exit(1);
} finally {
  await browser.close();
}
