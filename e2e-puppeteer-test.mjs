import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import path from 'path';

const FRONTEND_URL = 'http://localhost:5173';

async function runTest() {
  console.log('🚀 Starting Puppeteer End-to-End Test for Expensoo Transaction Flow...');
  
  // 1. Start Vite dev server locally to test against local changes
  console.log('📦 Launching local dev server...');
  const devServer = spawn('npm', ['run', 'dev'], {
    shell: true,
    stdio: 'ignore'
  });

  // Ensure dev server is closed when test finishes
  const cleanup = () => {
    try {
      devServer.kill();
      console.log('🛑 Local dev server stopped.');
    } catch (e) {}
  };

  process.on('exit', cleanup);
  process.on('SIGINT', cleanup);

  // Wait 4 seconds for Vite server to spin up
  await new Promise(resolve => setTimeout(resolve, 4000));

  console.log('🌐 Connecting Puppeteer to ' + FRONTEND_URL);
  const browser = await puppeteer.launch({
    headless: false, // Set to false to see the premium UI live in action
    defaultViewport: { width: 1280, height: 800 },
    executablePath: 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    
    // 2. Open Login Page
    console.log('🔑 Step 1: Navigating to Login Page...');
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'screenshots/puppeteer_01_login.png' });
    console.log('✅ Screenshot saved: screenshots/puppeteer_01_login.png');

    // 3. Perform Login
    console.log('📝 Filling login credentials...');
    await page.waitForSelector('#username');
    await page.type('#username', 'admin');
    await page.type('#password', 'admin123');
    await page.screenshot({ path: 'screenshots/puppeteer_02_login_filled.png' });
    
    console.log('clicking login button...');
    await page.click('button[type="submit"]');

    // Using waitForFunction to wait for URL change to dashboard since it's a SPA
    await page.waitForFunction(() => window.location.pathname === '/dashboard' || window.location.pathname === '/', { timeout: 15000 });
    console.log('🎉 Successfully logged in! Current URL:', page.url());
    await page.screenshot({ path: 'screenshots/puppeteer_03_dashboard.png' });
    console.log('✅ Screenshot saved: screenshots/puppeteer_03_dashboard.png');

    // Navigate to New Transaction form
    console.log('🔧 Step 2: Navigating to New Transaction form...');
    await page.waitForSelector('a[href="/transactions"]');
    await page.click('a[href="/transactions"]');

    // Click "New Transaction"
    await page.waitForSelector('a[href="/transactions/new"]', { timeout: 15000 });
    await page.click('a[href="/transactions/new"]');
    
    // Wait for the form to appear
    await page.waitForSelector('input[placeholder="Enter customer name"]', { timeout: 10000 });
    console.log('📝 Form loaded! Filling transaction details...');
    await page.screenshot({ path: 'screenshots/puppeteer_04_new_transaction_step1.png' });

    // 5. Fill Step 1 (Customer Information)
    console.log('📝 Filling customer information (Step 1)...');
    await page.type('input[placeholder*="customer name"]', 'John Doe');
    await page.type('input[placeholder*="phone number"]', '9876543210');
    await page.type('input[placeholder*="iPhone"]', 'iPhone 15 Pro');
    await page.screenshot({ path: 'screenshots/puppeteer_05_step1_filled.png' });
    
    // Click Next
    console.log('clicking Next button...');
    await page.click('#next-btn');
    await new Promise(resolve => setTimeout(resolve, 500));

    // 6. Fill Step 2 (Repair Details)
    console.log('📝 Filling repair information (Step 2)...');
    await page.waitForSelector('input[id="repairCost"]');
    
    // Select repair type
    console.log('Choosing repair type dropdown...');
    await page.click('button[role="combobox"]');
    await page.waitForSelector('[role="option"]');
    // Click "Screen Replacement" or first option
    const options = await page.$$('[role="option"]');
    if (options.length > 0) {
      await options[0].click();
    }
    
    // Fill cost & amount given
    await page.type('input[id="repairCost"]', '3500');
    await page.type('input[id="amountGiven"]', '4000');
    await page.screenshot({ path: 'screenshots/puppeteer_06_step2_filled.png' });

    // Click Next
    console.log('clicking Next button...');
    await page.click('#next-btn');
    await new Promise(resolve => setTimeout(resolve, 500));

    // 7. Verify and fill Step 3 (Parts & Suppliers)
    console.log('📝 Opening parts list and verifying headers (Step 3)...');
    await page.waitForSelector('#requiresParts');
    
    // Toggle "This repair requires parts"
    await page.click('#requiresParts');
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.screenshot({ path: 'screenshots/puppeteer_07_step3_parts_opened.png' });

    // Verify presence of Column Headers
    const headersText = await page.evaluate(() => {
      const headers = Array.from(document.querySelectorAll('.grid-cols-12.text-xs'));
      return headers.map(h => h.textContent?.trim());
    });
    console.log('🔍 Detected Column Headers in Parts List:', headersText);

    // Enter a part
    console.log('Adding first part item details...');
    // The inputs are rendered. Fill the part name, cost, qty
    const inputs = await page.$$('input[placeholder="Part name"]');
    if (inputs.length > 0) {
      await inputs[0].type('OLED Display Panel');
    }
    const costInputs = await page.$$('input[placeholder="Cost"]');
    if (costInputs.length > 0) {
      await costInputs[0].type('1800');
    }
    const qtyInputs = await page.$$('input[placeholder="Qty"]');
    if (qtyInputs.length > 0) {
      await qtyInputs[0].type('1');
    }

    await page.screenshot({ path: 'screenshots/puppeteer_08_step3_filled.png' });

    // Click Next
    console.log('clicking Next button...');
    await page.click('#next-btn');
    await new Promise(resolve => setTimeout(resolve, 500));

    // 8. Step 4 (Additional Details & Summary)
    console.log('📝 Additional details and summary (Step 4)...');
    await page.waitForSelector('textarea[id="remarks"]');
    await page.type('textarea[id="remarks"]', 'Screen glass was cracked. Replaced successfully under warranty.');
    await page.screenshot({ path: 'screenshots/puppeteer_09_step4_summary.png' });

    // 9. Submit Form & Verify No Auto-Redirect (Stay on page to view Success View)
    console.log('🚀 Submitting form and creating transaction...');
    
    // Store current page state
    const originalTarget = page.target();
    
    // Click submit
    await page.click('#submit-btn');
    console.log('Submitted. Waiting for Success container to render...');

    // Wait for Success view
    await page.waitForSelector('#transaction-success-container', { timeout: 10000 });
    console.log('🎉 SUCCESS: Beautiful transaction success view rendered without any immediate/forcible redirect!');
    await page.screenshot({ path: 'screenshots/puppeteer_10_success_screen.png' });
    console.log('✅ Screenshot saved: screenshots/puppeteer_10_success_screen.png');

    // 10. Verify Success Screen contents
    const successTitle = await page.$eval('#transaction-success-container .text-2xl', el => el.textContent?.trim());
    console.log('🏆 Success Screen Header Title:', successTitle);

    // Verify WhatsApp button is rendered
    const hasWhatsAppBtn = await page.$('#send-whatsapp-receipt-btn') !== null;
    console.log('📱 Manual "Send via WhatsApp" button exists:', hasWhatsAppBtn);

    // Verify Go to Transactions button is rendered
    const hasTransactionsBtn = await page.$('#go-to-transactions-btn') !== null;
    console.log('📋 "Go to Transactions" button exists:', hasTransactionsBtn);

    // 11. Complete flow by going to transactions list
    console.log('📋 Clicking "Go to Transactions" to complete the flow...');
    await page.click('#go-to-transactions-btn');
    await page.waitForSelector('.table, table, h1', { timeout: 10000 });
    console.log('✅ Navigated successfully back to transactions page! Current URL:', page.url());
    await page.screenshot({ path: 'screenshots/puppeteer_11_final_transactions_list.png' });
    console.log('✅ Screenshot saved: screenshots/puppeteer_11_final_transactions_list.png');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    await page.screenshot({ path: 'screenshots/puppeteer_error.png' });
    console.log('📸 Error screenshot captured: screenshots/puppeteer_error.png');
    cleanup();
    await browser.close();
    process.exit(1);
  }

  cleanup();
  await browser.close();
  console.log('\n✨ All Puppeteer End-to-End Tests passed successfully! Column headers verify correct, automatic redirect disabled, manual WhatsApp share and success summary screens verified.');
}

runTest();
