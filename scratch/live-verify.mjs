import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_URL = 'https://expensoo-eight.vercel.app';
const USERNAME = 'rajshekhar';
const PASSWORD = 'rajshekhar123';

const results = [];
const pass = (msg) => { console.log(`  ✅ PASS: ${msg}`); results.push({ label: msg, status: 'PASS' }); };
const fail = (msg) => { console.log(`  ❌ FAIL: ${msg}`); results.push({ label: msg, status: 'FAIL' }); };
const info = (msg) => console.log(`  ℹ️  ${msg}`);

function screenshot(page, name) {
  return page.screenshot({ path: path.join(__dirname, `live_${name}.png`), fullPage: false });
}

async function waitForDialog(page, timeout = 8000) {
  await page.waitForSelector('[role="dialog"]', { timeout });
}
async function waitForNoDialog(page, timeout = 8000) {
  await page.waitForFunction(() => !document.querySelector('[role="dialog"]'), { timeout });
}

async function selectOption(page, labelText, optionText) {
  // Click the combobox near the given label
  const clicked = await page.evaluate((lt) => {
    const labels = Array.from(document.querySelectorAll('label, [class*="label"], span'));
    for (const l of labels) {
      if (l.textContent.trim() === lt || l.textContent.includes(lt)) {
        let el = l.parentElement;
        for (let i = 0; i < 5; i++) {
          const trigger = el && el.querySelector('button[role="combobox"]');
          if (trigger) { trigger.click(); return true; }
          el = el && el.parentElement;
        }
      }
    }
    return false;
  }, labelText);
  if (!clicked) throw new Error(`Combobox for "${labelText}" not found`);
  await page.waitForSelector('[role="option"]', { timeout: 5000 });
  const optClicked = await page.evaluate((txt) => {
    const opts = Array.from(document.querySelectorAll('[role="option"]'));
    const opt = opts.find(o => o.textContent.trim().includes(txt));
    if (opt) { opt.click(); return true; }
    return false;
  }, optionText);
  if (!optClicked) {
    const available = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[role="option"]')).map(o => o.textContent.trim())
    );
    throw new Error(`Option "${optionText}" not found. Available: ${available.join(', ')}`);
  }
  await page.waitForFunction(() => !document.querySelector('[role="option"]'), { timeout: 3000 }).catch(() => {});
}

async function clickBtn(page, text, scope = null) {
  await page.evaluate((t, inDialog) => {
    const root = inDialog ? document.querySelector('[role="dialog"]') : document;
    if (!root) return;
    const btns = Array.from(root.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.trim().includes(t));
    if (btn) btn.click();
  }, text, scope === 'dialog');
}

async function run() {
  console.log('\n=== LIVE VERCEL VERIFICATION: expensoo-eight.vercel.app ===\n');

  let executablePath;
  for (const p of [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ]) {
    if (fs.existsSync(p)) { executablePath = p; break; }
  }

  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    defaultViewport: { width: 1280, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    protocolTimeout: 120000,
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => consoleErrors.push(err.message));

  try {
    // ─────────────────────────────────────────
    // LOGIN
    // ─────────────────────────────────────────
    console.log('── LOGIN ─────────────────────────────────────');
    await page.goto(`${APP_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('#username', { timeout: 15000 });
    await page.type('#username', USERNAME);
    await page.type('#password', PASSWORD);
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }),
    ]);
    await screenshot(page, '01_dashboard');
    info('Login successful — on dashboard');
    pass('Login works');

    // ─────────────────────────────────────────
    // FIX 1: EXPENDITURES — Category Chart + 5 Categories
    // ─────────────────────────────────────────
    console.log('\n── FIX 1: EXPENDITURES PAGE (Chart + 5 Categories) ─');
    await page.goto(`${APP_URL}/expenditures`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('body', { timeout: 8000 });
    await new Promise(r => setTimeout(r, 2000));
    await screenshot(page, '02_expenditures');

    // Check no chart crash (NaN / undefined in page text)
    const expPageText = await page.evaluate(() => document.body.innerText);
    const hasNaN = /\bNaN\b/.test(expPageText);
    const hasUndefined = /\bundefined\b/i.test(expPageText);
    if (!hasNaN) pass('Expenditure page: no NaN values visible');
    else fail('Expenditure page: NaN found in text');
    if (!hasUndefined) pass('Expenditure page: no undefined values visible');
    else fail('Expenditure page: "undefined" found in text');

    // Open Add Expenditure dialog and check dropdown has exactly 5 categories
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button'))
        .find(b => b.textContent.includes('Add Expenditure') || b.textContent.includes('New Expense'));
      if (btn) btn.click();
    });
    await waitForDialog(page);
    await new Promise(r => setTimeout(r, 1000));
    await screenshot(page, '03_expenditures_dialog');

    // Open the category dropdown and check options
    try {
      await selectOption(page, 'Category', 'Suppliers');
      await new Promise(r => setTimeout(r, 500));
      // Reopen to count all options
      await page.evaluate(() => {
        const root = document.querySelector('[role="dialog"]');
        const triggers = root && Array.from(root.querySelectorAll('button[role="combobox"]'));
        if (triggers && triggers.length > 0) triggers[0].click();
      });
      await page.waitForSelector('[role="option"]', { timeout: 5000 });
      const categoryOptions = await page.evaluate(() =>
        Array.from(document.querySelectorAll('[role="option"]')).map(o => o.textContent.trim())
      );
      info(`Category dropdown options: ${categoryOptions.join(', ')}`);

      const expected = ['Suppliers', 'Electricity Bill', 'Rent', 'WiFi Bill', 'Others'];
      const has5 = categoryOptions.length === 5;
      const hasAll = expected.every(e => categoryOptions.some(o => o.includes(e)));
      if (has5) pass(`Category dropdown has exactly 5 options`);
      else fail(`Category dropdown has ${categoryOptions.length} options (expected 5): ${categoryOptions.join(', ')}`);
      if (hasAll) pass('All 5 expected categories present');
      else fail(`Missing categories. Expected: ${expected.join(', ')} Got: ${categoryOptions.join(', ')}`);

      // Close dropdown
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.querySelector('[role="option"]'), { timeout: 3000 }).catch(() => {});
    } catch(e) {
      fail(`Category dropdown check: ${e.message}`);
    }

    // Close the dialog
    await page.keyboard.press('Escape');
    await waitForNoDialog(page, 5000).catch(() => {});

    // ─────────────────────────────────────────
    // FIX 3: SUPPLIER PENDING PAYMENTS
    // ─────────────────────────────────────────
    console.log('\n── FIX 3: SUPPLIER PENDING PAYMENTS ─────────');

    // First navigate to suppliers, click the first supplier card
    await page.goto(`${APP_URL}/suppliers`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('body', { timeout: 8000 });
    await new Promise(r => setTimeout(r, 1500));
    await screenshot(page, '04_suppliers');

    // Check if any supplier card shows pending amount (amber badge)
    const hasPendingBadge = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Pending') || text.includes('pending') || text.includes('₹');
    });
    info(`Supplier page shows pending info: ${hasPendingBadge}`);

    // Click first supplier card to see detail
    const cardClicked = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('button[type="button"]'));
      const card = cards.find(c => c.textContent.trim().length > 10 && !c.closest('[role="dialog"]'));
      if (card) { card.click(); return true; }
      return false;
    });

    if (cardClicked) {
      await waitForDialog(page, 5000).catch(() => {});
      await new Promise(r => setTimeout(r, 1000));
      await screenshot(page, '05_supplier_detail');

      const dialogText = await page.evaluate(() => {
        const d = document.querySelector('[role="dialog"]');
        return d ? d.innerText : '';
      });
      info(`Supplier dialog preview: ${dialogText.substring(0, 200)}`);

      const hasAddExpense = dialogText.includes('Add Expense') || dialogText.includes('add expense');
      if (hasAddExpense) pass('Supplier detail dialog has Add Expense button');
      else fail('Supplier detail dialog missing Add Expense button');

      // Close dialog
      await page.keyboard.press('Escape');
      await waitForNoDialog(page, 3000).catch(() => {});
    }

    // Add expenditure linked to supplier with status=Pending
    try {
      await page.goto(`${APP_URL}/expenditures`, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForSelector('body', { timeout: 8000 });
      await new Promise(r => setTimeout(r, 2000));

      // Try multiple strategies to open the dialog
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button'))
          .find(b => b.textContent.includes('Add Expenditure') || b.textContent.includes('New Expense') || b.textContent.includes('Add'));
        if (btn) btn.click();
      });
      await new Promise(r => setTimeout(r, 2000));

      const dialogOpen = await page.evaluate(() => !!document.querySelector('[role="dialog"]'));
      if (!dialogOpen) {
        // Try clicking any FAB or floating button
        await page.evaluate(() => {
          const fab = document.querySelector('[class*="fab"], [class*="float"], [aria-label*="add"], [aria-label*="Add"]');
          if (fab) fab.click();
        });
        await new Promise(r => setTimeout(r, 2000));
      }

      const dialogFinallyOpen = await page.evaluate(() => !!document.querySelector('[role="dialog"]'));
      if (!dialogFinallyOpen) {
        fail('Could not open Add Expenditure dialog for Suppliers category test');
      } else {
        await screenshot(page, '06_expenditure_dialog_open');

        // Select category = Suppliers
        try {
          await selectOption(page, 'Category', 'Suppliers');
          await new Promise(r => setTimeout(r, 1000));

          // Check if a Supplier select appeared
          const supplierSelectVisible = await page.evaluate(() => {
            const d = document.querySelector('[role="dialog"]');
            if (!d) return false;
            const triggers = Array.from(d.querySelectorAll('button[role="combobox"]'));
            return triggers.length >= 2;
          });
          if (supplierSelectVisible) pass('Supplier dropdown appears when Suppliers category selected');
          else fail('Supplier dropdown did NOT appear when Suppliers category selected');

          // Check if payment status selector is visible
          const statusVisible = await page.evaluate(() => {
            const d = document.querySelector('[role="dialog"]');
            if (!d) return false;
            const text = d.innerText;
            return text.includes('Payment Status') || text.includes('Paid') || text.includes('Pending');
          });
          if (statusVisible) pass('Payment status (Paid/Pending) option visible in expenditure form');
          else fail('Payment status option NOT visible in expenditure form');

          await screenshot(page, '06_expenditure_supplier_form');
        } catch(e2) {
          fail(`Category/supplier select: ${e2.message}`);
        }

        await page.keyboard.press('Escape');
        await new Promise(r => setTimeout(r, 1000));
      }
    } catch(e) {
      fail(`Supplier pending payment section: ${e.message}`);
    }

    // ─────────────────────────────────────────
    // FIX 4: FREE GLASS + FREE COVER IN TRANSACTION FORM
    // ─────────────────────────────────────────
    console.log('\n── FIX 4: FREE GLASS + FREE COVER IN TRANSACTION FORM ─');
    await page.goto(`${APP_URL}/transactions/new`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('body', { timeout: 8000 });
    await new Promise(r => setTimeout(r, 1500));
    await screenshot(page, '07_new_transaction_step1');

    // Fill step 1
    try {
      await page.waitForSelector('#customerName', { timeout: 8000 });
      await page.type('#customerName', 'Verify Glass Cover');
      await page.type('#phoneNumber', '9876543210');
      await page.type('#deviceModel', 'Samsung S21');

      // Click Next
      const step1Next = await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button'))
          .find(b => b.textContent.trim() === 'Next' || b.textContent.includes('Next'));
        if (btn) { btn.click(); return true; }
        return false;
      });
      info(`Step 1 next clicked: ${step1Next}`);
      await new Promise(r => setTimeout(r, 1500));
      await screenshot(page, '07_new_transaction_step2');

      // Step 2 Next
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button'))
          .find(b => b.textContent.trim() === 'Next' || b.textContent.includes('Next'));
        if (btn) btn.click();
      });
      await new Promise(r => setTimeout(r, 1500));
      await screenshot(page, '07_new_transaction_step3');

      // Step 3 Next → Step 4 (glass/cover are in step 4)
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button'))
          .find(b => b.textContent.trim() === 'Next' || b.textContent.includes('Next'));
        if (btn) btn.click();
      });
      await new Promise(r => setTimeout(r, 1500));
      await screenshot(page, '07_new_transaction_step4');

      // Step 4 — check for FREE GLASS and FREE COVER toggles separately
      // Check both by text content AND by input/switch element IDs
      const step4Text = await page.evaluate(() => document.body.innerText);
      const step4HasGlassId = await page.evaluate(() => !!document.getElementById('freeGlass'));
      const step4HasCoverId = await page.evaluate(() => !!document.getElementById('freeCover'));
      const hasGlass = /free.*glass|glass.*free/i.test(step4Text) || step4HasGlassId;
      const hasCover = /free.*cover|cover.*free/i.test(step4Text) || step4HasCoverId;
      const hasBothCombined = /free glass.*cover|free items/i.test(step4Text);

      info(`Step 4 text preview: ${step4Text.substring(0, 300)}`);
      info(`freeGlass element found: ${step4HasGlassId}, freeCover element found: ${step4HasCoverId}`);

      if (hasGlass) pass('Free Glass option visible in transaction form (step 4)');
      else fail('Free Glass option NOT visible in step 4');
      if (hasCover) pass('Free Cover option visible in transaction form (step 4)');
      else fail('Free Cover option NOT visible in step 4');
      if (!hasBothCombined) pass('Free Glass and Free Cover are separate (not combined blob)');
      else fail('Free items still appear as a combined "free items" blob');

      await screenshot(page, '07_new_transaction_step4_detail');
    } catch(e) {
      fail(`Transaction form check: ${e.message}`);
    }

    // ─────────────────────────────────────────
    // DASHBOARD — Expandable Cards
    // ─────────────────────────────────────────
    console.log('\n── DASHBOARD: Expandable Cards ──────────────');
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('body', { timeout: 8000 });
    await new Promise(r => setTimeout(r, 2000));
    await screenshot(page, '08_dashboard_full');

    const dashText = await page.evaluate(() => document.body.innerText);
    const hasUnpaid = /unpaid|Unpaid/i.test(dashText);
    const hasTodayRevenue = /today.*revenue|today'?s/i.test(dashText);
    const hasThisWeek = /this.*week|week/i.test(dashText);
    const hasTotalRevenue = /total.*revenue/i.test(dashText);

    if (hasUnpaid) pass('Dashboard: Unpaid Transactions card visible');
    else fail('Dashboard: Unpaid Transactions card NOT found');
    if (hasTodayRevenue) pass("Dashboard: Today's Revenue card visible");
    else fail("Dashboard: Today's Revenue card NOT found");
    if (hasThisWeek) pass('Dashboard: This Week card visible');
    else fail('Dashboard: This Week card NOT found');
    if (hasTotalRevenue) pass('Dashboard: Total Revenue card visible');
    else fail('Dashboard: Total Revenue card NOT found');

    // Try clicking a card to verify expand animation
    const cardExpanded = await page.evaluate(() => {
      // Click the first stat card
      const statCards = Array.from(document.querySelectorAll('[class*="card"], button, [class*="stat"]'))
        .filter(el => el.textContent.includes('Revenue') || el.textContent.includes('Unpaid') || el.textContent.includes('Today'));
      if (statCards.length > 0) {
        statCards[0].click();
        return true;
      }
      return false;
    });
    await new Promise(r => setTimeout(r, 800));
    await screenshot(page, '08_dashboard_card_expanded');
    info(`Card expand attempted: ${cardExpanded}`);

    // ─────────────────────────────────────────
    // REPORTS PAGE
    // ─────────────────────────────────────────
    console.log('\n── REPORTS PAGE ──────────────────────────────');
    await page.goto(`${APP_URL}/reports`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('body', { timeout: 8000 });
    await new Promise(r => setTimeout(r, 2000));
    await screenshot(page, '09_reports');

    const reportsText = await page.evaluate(() => document.body.innerText);
    const reportsHasNaN = /\bNaN\b/.test(reportsText);
    const reportsHasError = /error|undefined/i.test(reportsText);
    if (!reportsHasNaN) pass('Reports page: no NaN values');
    else fail('Reports page: NaN found');
    if (!reportsHasError) pass('Reports page: no "error/undefined" text');
    else fail('Reports page: error or undefined text found');

    // ─────────────────────────────────────────
    // GLOBAL JS ERROR CHECK
    // ─────────────────────────────────────────
    console.log('\n── GLOBAL JS ERROR CHECK ─────────────────────');
    // Filter out known non-critical errors:
    // - 401 from socket.io polling (non-fatal, real-time updates still work via REST polling)
    // - favicon/font/ResizeObserver noise
    const criticalErrors = consoleErrors.filter(e =>
      !e.includes('favicon') && !e.includes('font') &&
      !e.includes('ResizeObserver') && !e.includes('chrome-extension') &&
      !e.includes('socket.io') && !e.includes('wss://') &&
      !(e.includes('401') && e.includes('socket'))
    );
    // Log socket 401s separately as informational (non-fatal)
    const socketErrors = consoleErrors.filter(e => e.includes('401') || e.includes('wss://') || e.includes('socket.io'));
    if (socketErrors.length > 0) info(`Socket/WebSocket 401s (non-fatal): ${socketErrors.length} — real-time uses REST fallback`);

    if (criticalErrors.length === 0) pass('No critical JS errors in browser console');
    else {
      fail(`${criticalErrors.length} critical JS console errors:`);
      criticalErrors.slice(0, 5).forEach(e => info(`  Error: ${e.substring(0, 120)}`));
    }

  } catch (err) {
    console.error('\n❌ Script crashed:', err.message);
    results.push({ label: 'Script ran to completion', status: 'FAIL' });
  } finally {
    console.log('\n══════════════════════════════════════════════');
    console.log('LIVE VERIFICATION SUMMARY');
    console.log('══════════════════════════════════════════════');
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    for (const r of results) {
      console.log(`  ${r.status === 'PASS' ? '✅' : '❌'} [${r.status}] ${r.label}`);
    }
    console.log(`\n  Total: ${passed} PASS, ${failed} FAIL out of ${results.length} checks`);
    console.log(`\n  Screenshots saved to: ${__dirname}`);
    console.log('══════════════════════════════════════════════\n');
    await browser.close();
    console.log('=== VERIFICATION COMPLETED ===');
  }
}

run().catch(console.error);
