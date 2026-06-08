import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_URL = 'http://localhost:5173';
const USERNAME = 'rajshekhar';
const PASSWORD = 'rajshekhar123';

const pass = (msg) => console.log(`  ✅ PASS: ${msg}`);
const fail = (msg) => console.log(`  ❌ FAIL: ${msg}`);
const info = (msg) => console.log(`  ℹ️  ${msg}`);

async function waitForDialog(page, timeout = 5000) {
  await page.waitForSelector('[role="dialog"]', { timeout });
}

async function run() {
  console.log('\n=== STARTING DETAIL DELETE VERIFICATION ===\n');

  let executablePath;
  if (fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')) {
    executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  } else if (fs.existsSync('C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe')) {
    executablePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
  }

  const browser = await puppeteer.launch({
    headless: true, // run headless for speed and automation
    executablePath,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  page.on('response', response => {
    if (response.url().includes('/api/') && response.status() >= 400) {
      console.log(`  [HTTP ERR]: ${response.status()} ${response.url()}`);
    }
  });

  let nativeDialogFired = false;
  page.on('dialog', async (dialog) => {
    nativeDialogFired = true;
    fail(`Native dialog fired: "${dialog.type()}" — "${dialog.message()}"`);
    await dialog.dismiss();
  });

  try {
    // 1. Login
    info('Logging in...');
    await page.goto(`${APP_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#username', { timeout: 10000 });
    await page.type('#username', USERNAME);
    await page.type('#password', PASSWORD);
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 })
    ]);
    info('Login successful');

    // 2. Go to suppliers page
    await page.goto(`${APP_URL}/suppliers`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('button', { timeout: 8000 });

    // 3. Create temp supplier
    const tempSupplierName = `Detail Delete Supplier ${Date.now()}`;
    info(`Creating supplier: "${tempSupplierName}"`);
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Add Supplier'));
      if (btn) btn.click();
    });
    await waitForDialog(page);
    await page.waitForSelector('#sup-name', { timeout: 5000 });
    await page.type('#sup-name', tempSupplierName);
    await page.type('#sup-person', 'Detail Contact');
    await page.type('#sup-phone', '1234567890');

    // Click "Add Supplier" button inside dialog
    await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      if (!dialog) return;
      const btn = Array.from(dialog.querySelectorAll('button')).find(b => b.textContent.trim().includes('Add Supplier'));
      if (btn) btn.click();
    });

    // Wait for the creation dialog to close
    await page.waitForFunction(() => {
      const dialogs = Array.from(document.querySelectorAll('[role="dialog"]'));
      return dialogs.length === 0;
    }, { timeout: 8000 });

    info('Supplier created successfully');

    // Verify it is on the list
    await page.waitForFunction((name) => document.body.textContent.includes(name), { timeout: 8000 }, tempSupplierName);
    pass('Supplier appears on the list');

    // 4. Click the supplier card to open the detail view dialog
    info('Opening supplier detail dialog...');
    const clickedCard = await page.evaluate((name) => {
      const cards = Array.from(document.querySelectorAll('button[type="button"]'));
      const card = cards.find(c => c.textContent.includes(name));
      if (card) {
        card.click();
        return true;
      }
      return false;
    }, tempSupplierName);

    if (!clickedCard) {
      throw new Error(`Failed to find card for supplier: ${tempSupplierName}`);
    }

    // Wait for detail dialog to open
    await page.waitForFunction(() => {
      const dialog = document.querySelector('[role="dialog"]');
      return dialog && dialog.textContent.includes('Purchases & Expenditures');
    }, { timeout: 8000 });
    pass('Supplier detail dialog opened successfully');

    // Take screenshot of detail dialog
    await page.screenshot({ path: 'detail-dialog.png' });

    // 5. Click the "Delete" button inside the supplier detail dialog
    info('Clicking Delete button inside detail dialog...');
    const clickedDeleteDetail = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      if (!dialog) return false;
      const deleteBtn = Array.from(dialog.querySelectorAll('button')).find(b => 
        b.textContent.trim().includes('Delete')
      );
      if (deleteBtn) {
        deleteBtn.click();
        return true;
      }
      return false;
    });

    if (!clickedDeleteDetail) {
      throw new Error('Could not find or click Delete button in detail dialog');
    }

    // 6. Verify ConfirmModal opens
    info('Waiting for ConfirmModal...');
    await page.waitForFunction(() => {
      const dialogs = Array.from(document.querySelectorAll('[role="dialog"]'));
      // The ConfirmModal should be on top, and contain "Delete Supplier" title/description
      return dialogs.length >= 2 || dialogs.some(d => d.textContent.includes('Are you sure you want to delete'));
    }, { timeout: 8000 });
    
    const customConfirmVisible = await page.evaluate(() => {
      const dialogs = Array.from(document.querySelectorAll('[role="dialog"]'));
      return dialogs.some(d => d.textContent.includes('Delete Supplier') && d.textContent.includes('Are you sure you want to delete'));
    });

    if (customConfirmVisible && !nativeDialogFired) {
      pass('Custom ConfirmModal displayed correctly (not native dialog)');
    } else {
      fail(`ConfirmModal check failed. Visible: ${customConfirmVisible}, Native dialog fired: ${nativeDialogFired}`);
      throw new Error('ConfirmModal validation failed');
    }

    // 7. Click "Delete" in the ConfirmModal
    info('Clicking Delete in the ConfirmModal...');
    const clickedConfirm = await page.evaluate(() => {
      const dialogs = Array.from(document.querySelectorAll('[role="dialog"]'));
      // Find the dialog that is the confirm modal (has variant danger or "Are you sure")
      const confirmDialog = dialogs.find(d => d.textContent.includes('Are you sure you want to delete'));
      if (!confirmDialog) return false;
      const deleteBtn = Array.from(confirmDialog.querySelectorAll('button')).find(b => 
        b.textContent.trim() === 'Delete'
      );
      if (deleteBtn) {
        deleteBtn.click();
        return true;
      }
      return false;
    });

    if (!clickedConfirm) {
      throw new Error('Failed to find or click Delete in ConfirmModal');
    }

    // 8. Verify both dialogs close
    info('Waiting for all dialogs to close...');
    await page.waitForFunction(() => {
      return document.querySelectorAll('[role="dialog"]').length === 0;
    }, { timeout: 8000 });
    pass('Both detail dialog and ConfirmModal closed successfully');

    // 9. Verify supplier is removed from the list immediately
    info('Verifying supplier removed from list...');
    await page.waitForFunction((name) => {
      return !document.body.textContent.includes(name);
    }, { timeout: 8000 }, tempSupplierName);
    pass('Supplier successfully removed from list immediately');

    console.log('\n🎉 ALL TESTS PASSED! DELETE WORKS PERFECTLY FROM DETAIL DIALOG. 🎉\n');
  } catch (error) {
    fail(`Test failed: ${error.message}`);
    await page.screenshot({ path: 'failure-detail.png' });
    console.error(error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
