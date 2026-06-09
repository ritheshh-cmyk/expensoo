import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_URL = 'https://expensoo-eight.vercel.app';
const USERNAME = 'rajshekhar';
const PASSWORD = 'rajshekhar123';

async function run() {
  console.log('=== STARTING SCREENSHOT CAPTURE ON LIVE APP ===');

  let executablePath;
  if (fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')) {
    executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  } else if (fs.existsSync('C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe')) {
    executablePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
  }

  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    // 1. Go to Login
    console.log('Navigating to login...');
    await page.goto(`${APP_URL}/login`, { waitUntil: 'networkidle2' });
    
    // Take screenshot of login page
    await page.screenshot({ path: path.join(__dirname, '01_login.png') });
    console.log('Login screenshot saved.');

    // Login
    await page.type('#username', USERNAME);
    await page.type('#password', PASSWORD);
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 })
    ]);
    console.log('Login form submitted.');

    // 2. Dashboard
    console.log('Navigating to dashboard...');
    await page.screenshot({ path: path.join(__dirname, '02_dashboard.png') });
    console.log('Dashboard screenshot saved.');

    // Print dashboard page text content
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('Dashboard text preview (first 500 chars):');
    console.log(bodyText.substring(0, 500));

    // 3. Expenditures Page
    console.log('Navigating to expenditures...');
    await page.goto(`${APP_URL}/expenditures`, { waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(__dirname, '03_expenditures.png') });
    console.log('Expenditures screenshot saved.');

    // Check categories dropdown
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b =>
        b.textContent.includes('Add Expenditure') || b.textContent.includes('New Expense')
      );
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(__dirname, '03_expenditures_dialog.png') });
    console.log('Expenditures dialog screenshot saved.');

    // 4. Suppliers Page
    console.log('Navigating to suppliers...');
    await page.goto(`${APP_URL}/suppliers`, { waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(__dirname, '04_suppliers.png') });
    console.log('Suppliers page screenshot saved.');

    // Click on the first supplier card if possible to see the detail dialog
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('button[type="button"]'));
      const card = cards.find(c => c.textContent.trim().length > 10 && !c.closest('[role="dialog"]'));
      if (card) card.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(__dirname, '04_supplier_detail.png') });
    console.log('Supplier detail screenshot saved.');

    // Check if there's any pending expenditures list or Pay Now buttons
    const detailText = await page.evaluate(() => {
      const d = document.querySelector('[role="dialog"]');
      return d ? d.innerHTML : 'No dialog';
    });
    fs.writeFileSync(path.join(__dirname, '04_supplier_detail_html.txt'), detailText);

    // 5. New Transaction Form
    console.log('Navigating to new transaction...');
    await page.goto(`${APP_URL}/transactions/new`, { waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(__dirname, '05_new_transaction_step1.png') });
    console.log('Step 1 screenshot saved.');

    // Fill Step 1 and proceed to see step 2 & 3
    await page.type('#customerName', 'E2E Verify Customer');
    await page.type('#mobileNumber', '9876543210');
    await page.type('#deviceModel', 'iPhone 13');
    
    // Select category dropdown if it's there
    // In step 1: Click next
    const nextBtn = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Next') || b.textContent.includes('Continue'));
      if (btn) { btn.click(); return true; }
      return false;
    });
    console.log('Step 1 next button clicked:', nextBtn);
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(__dirname, '05_new_transaction_step2.png') });

    // Step 2 Next
    const nextBtn2 = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Next') || b.textContent.includes('Continue'));
      if (btn) { btn.click(); return true; }
      return false;
    });
    console.log('Step 2 next button clicked:', nextBtn2);
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(__dirname, '05_new_transaction_step3.png') });

    // Step 3 Next (or final step)
    const nextBtn3 = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Next') || b.textContent.includes('Continue'));
      if (btn) { btn.click(); return true; }
      return false;
    });
    console.log('Step 3 next button clicked:', nextBtn3);
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(__dirname, '05_new_transaction_step4.png') });

  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
    console.log('=== SCREENSHOT CAPTURE COMPLETED ===');
  }
}

run();
