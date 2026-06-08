import puppeteer from 'puppeteer';

const FRONTEND_URL = 'http://localhost:5173';

async function runTest() {
  console.log('🚀 Starting Local E2E Verification for Expensoo...');

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    // Enable console logging from the page context
    page.on('console', msg => {
      const txt = msg.text();
      if (txt.includes('[error]') || txt.includes('Error') || txt.includes('err') || txt.includes('crash')) {
        console.log('PAGE ERROR/LOG:', txt);
      } else {
        console.log('PAGE LOG:', txt);
      }
    });

    // 1. Open Login Page
    console.log('🔑 Navigating to Login Page...');
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle2' });

    // 2. Perform Login
    console.log('📝 Filling login credentials...');
    await page.waitForSelector('#username');
    await page.type('#username', 'rajshekhar');
    await page.type('#password', 'rajshekhar123');
    
    console.log('Clicking login button...');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForFunction(() => window.location.pathname === '/dashboard' || window.location.pathname === '/', { timeout: 15000 });
    console.log('🎉 Successfully logged in! Current URL:', page.url());

    // 3. Navigate to New Transaction Form
    console.log('🔧 Navigating to New Transaction form...');
    await page.goto(`${FRONTEND_URL}/transactions/new`, { waitUntil: 'networkidle2' });
    
    // Wait for the form to appear
    await page.waitForSelector('input[placeholder="Enter customer name"]', { timeout: 10000 });
    console.log('📝 Form loaded! Filling customer details (Step 1)...');

    // Fill Step 1
    await page.type('input[placeholder*="customer name"]', 'E2E Test Customer');
    await page.type('input[placeholder*="phone number"]', '9876543210');
    await page.type('input[placeholder*="iPhone"]', 'iPhone 15 Pro');
    
    // Click Next
    console.log('Clicking Next to Step 2...');
    await page.click('#next-btn');
    await new Promise(resolve => setTimeout(resolve, 500));

    // Fill Step 2 (Repair Details)
    console.log('📝 Filling repair information (Step 2)...');
    await page.waitForSelector('input[id="repairCost"]');
    
    // Type repair cost
    await page.type('input[id="repairCost"]', '3500');
    await page.type('input[id="amountGiven"]', '4000');

    // Click Next
    console.log('Clicking Next to Step 3...');
    await page.click('#next-btn');
    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 3 (Parts & Suppliers)
    console.log('📝 Opening parts list (Step 3)...');
    await page.waitForSelector('#requiresParts');
    
    // Toggle "This repair requires parts"
    await page.click('#requiresParts');
    await new Promise(resolve => setTimeout(resolve, 500));

    // Enter a part
    console.log('Adding part item details...');
    const nameInputs = await page.$$('input[placeholder="Part name"]');
    if (nameInputs.length > 0) {
      await nameInputs[0].type('OLED Display Panel');
    }
    const costInputs = await page.$$('input[placeholder="Cost"]');
    if (costInputs.length > 0) {
      await costInputs[0].type('1800');
    }
    const qtyInputs = await page.$$('input[placeholder="Qty"]');
    if (qtyInputs.length > 0) {
      await qtyInputs[0].type('1');
    }

    // Check and select a supplier
    console.log('Opening supplier selection dropdown...');
    const comboboxes = await page.$$('button[role="combobox"]');
    let supplierCombobox = null;
    for (const cb of comboboxes) {
      const text = await page.evaluate(el => el.textContent, cb);
      // Looking for the supplier select combobox (contains 'Select supplier' or placeholder)
      if (text.includes('Select') || text.includes('supplier') || text.trim() === '') {
        supplierCombobox = cb;
        break;
      }
    }

    if (supplierCombobox) {
      await supplierCombobox.click();
      await page.waitForSelector('[role="option"]', { timeout: 5000 });
      
      const options = await page.$$('[role="option"]');
      console.log(`Found ${options.length} supplier options in dropdown.`);
      if (options.length > 0) {
        const optionText = await page.evaluate(el => el.textContent, options[0]);
        console.log(`Selecting supplier: "${optionText}"`);
        await options[0].click();
        
        // Wait a small bit and verify the trigger text is not empty/blank anymore
        await new Promise(resolve => setTimeout(resolve, 500));
        const triggerText = await page.evaluate(el => el.textContent, supplierCombobox);
        console.log(`Selected trigger text is now: "${triggerText}"`);
        if (!triggerText || triggerText.trim() === '' || triggerText.includes('Select supplier')) {
          throw new Error('FAIL: Supplier dropdown selection is blank or placeholder not replaced!');
        }
        console.log('✅ PASS: Supplier dropdown successfully displays the selected supplier name!');
      } else {
        console.log('⚠️ No suppliers found in dropdown. Will proceed without selecting supplier.');
      }
    } else {
      console.log('⚠️ Supplier combobox not found.');
    }

    // Click Next to Step 4
    console.log('Clicking Next to Step 4...');
    await page.click('#next-btn');
    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 4 (Additional Details & Summary)
    console.log('📝 Filling remarks (Step 4)...');
    await page.waitForSelector('textarea[id="remarks"]');
    await page.type('textarea[id="remarks"]', 'Screen glass was cracked. Replaced successfully.');

    // Submit form
    console.log('🚀 Submitting form and creating transaction...');
    await page.click('#submit-btn');

    // Wait for success screen
    console.log('Waiting for success screen to render...');
    await page.waitForSelector('#transaction-success-container', { timeout: 15000 });
    console.log('✅ PASS: Form submitted successfully without crashing!');

    // Click Go to Transactions button
    console.log('Navigating back to transactions list...');
    await page.click('#go-to-transactions-btn');
    
    // Wait for the transactions table to load
    await page.waitForSelector('.table, table, h1', { timeout: 10000 });
    console.log('Successfully navigated back to transactions list!');

    // Wait a brief moment for state/live update
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Find the newly created transaction row and click it to verify parts list details
    console.log('Verifying transaction details contains parts cost array...');
    
    // We can query the database directly or find the transaction row and verify
    // But since we want to be thorough, let's look for "OLED Display Panel" in the page text 
    // or expand the first transaction row to see the parts details
    const bodyText = await page.evaluate(() => document.body.innerText);
    if (bodyText.includes('OLED Display Panel')) {
      console.log('✅ PASS: Parts list and details successfully displayed in transaction history/list!');
    } else {
      console.log('⚠️ Did not see OLED Display Panel directly in main view text. Let\'s click the transaction row...');
      // Click first row / detail trigger if there is one
      const rows = await page.$$('table tr, .table tr, [role="row"]');
      if (rows.length > 1) {
        console.log('Clicking first transaction row to expand details...');
        await rows[1].click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const expandedText = await page.evaluate(() => document.body.innerText);
        if (expandedText.includes('OLED Display Panel')) {
          console.log('✅ PASS: Parts list and details successfully displayed in expanded transaction details!');
        } else {
          throw new Error('FAIL: Created transaction details do not display the parts list correctly!');
        }
      } else {
        throw new Error('FAIL: No transaction rows found in the table!');
      }
    }

    console.log('\n✨ ALL E2E VERIFICATION CHECKS COMPLETED SUCCESSFULLY! ✨');

  } catch (error) {
    console.error('❌ E2E VERIFICATION FAILED:', error.message);
    // Take a screenshot of the failure state
    await page.screenshot({ path: 'scratch/error_screenshot.png' });
    console.log('📸 Saved error screenshot to scratch/error_screenshot.png');
    await browser.close();
    process.exit(1);
  }

  await browser.close();
  process.exit(0);
}

runTest();
