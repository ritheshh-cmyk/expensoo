const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage();
  
  // Set a slightly larger viewport to avoid mobile layout complexities if any
  await page.setViewport({ width: 1280, height: 800 });
  
  console.log('Navigating to http://localhost:5173/');
  await page.goto('http://localhost:5173/', { waitUntil: 'load' });
  
  const title = await page.title();
  console.log('Waiting for potential login form...');
  const needsLogin = await page.waitForSelector('input[type="password"]', { timeout: 5000 }).catch(() => null);
  if (needsLogin) {
    console.log('Handling login...');
    const usernameInput = await page.$('#username');
    if (usernameInput) {
      await page.type('#username', 'admin');
    }
    await page.type('input[type="password"]', 'Lucky@1222');
    await page.click('button[type="submit"]');
    console.log('Waiting for SPA navigation to / ...');
    await page.waitForFunction('window.location.pathname === "/"', { timeout: 10000 });
    await page.screenshot({ path: 'puppeteer_debug_login.png' });
  }

  console.log('Navigating to /transactions/new');
  await page.goto('http://localhost:5173/transactions/new', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'puppeteer_debug_after_goto.png' });

  console.log('Filling form step 1');
  await page.waitForSelector('#customerName', { timeout: 10000 });
  await page.type('#customerName', 'Test User');
  await page.type('#phoneNumber', '9876543210');
  await page.type('#deviceModel', 'iPhone 13');
  
  // Select repair type
  await page.click('button[role="combobox"]');
  await new Promise(r => setTimeout(r, 500));
  await page.click('text=Screen Replacement');
  await new Promise(r => setTimeout(r, 500));

  console.log('Clicking Next (to step 2)');
  await page.click('#next-btn');
  await new Promise(r => setTimeout(r, 500));

  console.log('Clicking Next (to step 3)');
  await page.click('#next-btn');
  await new Promise(r => setTimeout(r, 500));

  console.log('Entering repair cost');
  // Need to clear existing '0' value first sometimes
  await page.click('#repairCost', { clickCount: 3 });
  await page.type('#repairCost', '5000');
  await new Promise(r => setTimeout(r, 500));

  console.log('Clicking Next (to step 4)');
  await page.click('#next-btn');
  await new Promise(r => setTimeout(r, 500));

  console.log('Clicking Create Transaction');
  await page.click('#submit-btn');

  console.log('Waiting for WhatsApp button');
  // Wait for the whatsapp button to appear
  await page.waitForSelector('#send-whatsapp-receipt-btn', { timeout: 10000 });
  
  console.log('Checking button state immediately');
  let isDisabled = await page.$eval('#send-whatsapp-receipt-btn', el => el.disabled);
  console.log('Is WhatsApp button disabled immediately? ', isDisabled);
  if (!isDisabled) {
    console.error('TEST FAILED: WhatsApp button was NOT disabled immediately after transaction creation.');
    await page.screenshot({ path: 'FINAL_puppeteer_error.png' });
    process.exit(1);
  }

  console.log('Waiting 600ms...');
  await new Promise(r => setTimeout(r, 600));

  console.log('Checking button state after delay');
  isDisabled = await page.$eval('#send-whatsapp-receipt-btn', el => el.disabled);
  console.log('Is WhatsApp button disabled after 600ms? ', isDisabled);
  
  if (isDisabled) {
    console.error('TEST FAILED: WhatsApp button is STILL disabled after 600ms.');
    await page.screenshot({ path: 'FINAL_puppeteer_error2.png' });
    process.exit(1);
  }

  console.log('TEST PASSED: WhatsApp button is initially disabled (preventing ghost clicks) and then becomes enabled.');
  
  await browser.close();
})();
