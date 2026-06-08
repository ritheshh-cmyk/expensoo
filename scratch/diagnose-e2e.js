import { chromium } from '@playwright/test';
import fs from 'fs';

const FRONTEND_URL = 'http://localhost:5173';

async function diagnose() {
  console.log('🔍 Starting local E2E diagnostic flow...');
  
  if (!fs.existsSync('scratch/screenshots')) {
    fs.mkdirSync('scratch/screenshots', { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. Go to Login
    await page.goto(`${FRONTEND_URL}/login`);
    await page.screenshot({ path: 'scratch/screenshots/01_login.png' });
    console.log('Saved 01_login.png');

    // 2. Perform Login
    await page.fill('#username', 'rajshekhar');
    await page.fill('#password', 'rajshekhar123');
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForURL('**/dashboard');
    await page.screenshot({ path: 'scratch/screenshots/02_dashboard.png' });
    console.log('Saved 02_dashboard.png');

    // 3. Go to New Transaction
    await page.goto(`${FRONTEND_URL}/transactions/new`);
    await page.waitForSelector('input[placeholder="Enter customer name"]');
    await page.screenshot({ path: 'scratch/screenshots/03_step1.png' });
    console.log('Saved 03_step1.png');

    // 4. Fill Step 1
    await page.fill('input[placeholder*="customer name"]', 'Diagnostic Customer');
    await page.fill('input[placeholder*="phone number"]', '9876543210');
    await page.fill('input[placeholder*="iPhone"]', 'iPhone 15 Pro Max');
    await page.click('#next-btn');
    await page.waitForTimeout(500);

    // 5. Fill Step 2
    await page.waitForSelector('input[id="repairCost"]');
    await page.screenshot({ path: 'scratch/screenshots/04_step2.png' });
    console.log('Saved 04_step2.png');
    await page.fill('input[id="repairCost"]', '4500');
    await page.fill('input[id="amountGiven"]', '5000');
    await page.click('#next-btn');
    await page.waitForTimeout(500);

    // 6. Step 3 (Parts)
    await page.waitForTimeout(1000); // Wait for transition
    await page.screenshot({ path: 'scratch/screenshots/05_step3_initial.png' });
    console.log('Saved 05_step3_initial.png');

    // Log the page HTML in step 3 to debug
    const htmlContent = await page.content();
    fs.writeFileSync('scratch/step3_page.html', htmlContent);
    console.log('Saved scratch/step3_page.html');

    // Look for useExternalPurchase or useInternalParts in the page content
    const hasExternalSwitch = await page.$('#useExternalPurchase') !== null;
    const hasInternalSwitch = await page.$('#useInternalParts') !== null;
    console.log(`External switch exists: ${hasExternalSwitch}, Internal switch exists: ${hasInternalSwitch}`);

    // Try clicking by label or by button
    if (hasExternalSwitch) {
      console.log('Clicking the external purchase switch button directly...');
      await page.click('#useExternalPurchase');
    } else {
      console.log('Trying to click switch by label...');
      await page.click('label[for="useExternalPurchase"]');
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'scratch/screenshots/06_step3_after_toggle.png' });
    console.log('Saved 06_step3_after_toggle.png');

    // Check if supplier dropdown is visible now
    const hasSupplierSelect = await page.$('button[role="combobox"]') !== null;
    console.log(`Supplier combobox exists after toggle: ${hasSupplierSelect}`);

    if (hasSupplierSelect) {
      await page.click('button[role="combobox"]');
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'scratch/screenshots/07_step3_supplier_open.png' });
      console.log('Saved 07_step3_supplier_open.png');
    }

  } catch (error) {
    console.error('❌ Diagnostic flow failed:', error);
  } finally {
    await browser.close();
    console.log('Diagnostic finished.');
  }
}

diagnose();
