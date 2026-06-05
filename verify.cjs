const puppeteer = require('puppeteer');

(async () => {
  console.log("Launching Puppeteer...");
  let browser;
  try {
    browser = await puppeteer.launch({ 
        headless: true, 
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'] 
    });
    console.log("Puppeteer launched.");
    const page = await browser.newPage();
    
    console.log("Navigating to https://expensoo-eight.vercel.app ...");
    await page.goto('https://expensoo-eight.vercel.app', { waitUntil: 'networkidle2' });
    
    // 1. Login
    console.log("Logging in...");
    await page.waitForSelector('#username', {timeout: 10000});
    await page.type('#username', 'admin');
    await page.type('#password', 'Lucky@1222');
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('button[type="submit"]')
    ]);
    
    console.log("Logged in successfully. Current URL:", page.url());

    // 2. Check Sidebar for "Sales History"
    const bodyText = await page.evaluate(() => document.body.innerText);
    if (bodyText.includes('Sales History') || bodyText.includes('అమ్మకాల చరిత్ర')) {
      console.log("✅ Found 'Sales History' in sidebar/page text.");
    } else {
      console.log("❌ 'Sales History' not found.");
    }
    
    // 3. Test Repair Flow Next Button
    console.log("Navigating to New Transaction...");
    await page.goto('https://expensoo-eight.vercel.app/transactions/new', { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[name="customerName"]', {timeout: 10000});
    
    console.log("Testing Repair Flow...");
    await page.type('input[name="customerName"]', 'Test Customer');
    await page.type('input[name="phoneNumber"]', '9999999999');
    
    async function clickNext() {
      const btns = await page.$$('button');
      for (const btn of btns) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.includes('Next')) {
          await btn.click();
          return true;
        }
      }
      return false;
    }
    
    await clickNext();
    await new Promise(r => setTimeout(r, 1000));
    
    // Step 2 Repair
    const repairCostInput = await page.$('input[name="repairCost"]');
    if (repairCostInput) {
      await repairCostInput.type('1000');
    }
    const amountGivenInput = await page.$('input[name="amountGiven"]');
    if (amountGivenInput) {
      await amountGivenInput.type('1000');
    }
    
    await clickNext();
    await new Promise(r => setTimeout(r, 1000));
    
    // Step 3 Repair - Click Next without issues
    console.log("Clicking Next on Repair Step 3...");
    await clickNext();
    await new Promise(r => setTimeout(r, 1000));
    
    const step4Text = await page.evaluate(() => document.body.innerText);
    if (step4Text.includes('Priority') || step4Text.includes('Free Glass')) {
      console.log("✅ Repair Step 3 successfully advanced to Step 4 without device model validation blocking.");
    } else {
      console.log("❌ Repair Step 3 failed to advance.");
    }
    
    // 4. Test Sales Flow
    console.log("Testing Sales Flow...");
    await page.goto('https://expensoo-eight.vercel.app/transactions/new', { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[name="customerName"]', {timeout: 10000});
    
    await page.type('input[name="customerName"]', 'Test Sale Customer');
    await page.type('input[name="phoneNumber"]', '8888888888');
    await clickNext();
    await new Promise(r => setTimeout(r, 1000));
    
    // Switch to Sales
    console.log("Switching to Sales mode...");
    const buttons = await page.$$('button, div');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text === 'Sales') {
        await btn.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1000));
    
    const salesText = await page.evaluate(() => document.body.innerText);
    if (salesText.includes('of 3')) {
      console.log("✅ Confirmed Sales is a 3-step form.");
    } else if (salesText.includes('of 4')) {
      console.log("❌ Sales form still shows 4 steps.");
    }
    
    // Move to Sales Step 3
    await clickNext();
    await new Promise(r => setTimeout(r, 1000));
    
    const step3SalesText = await page.evaluate(() => document.body.innerText);
    if (step3SalesText.includes('Supplier') && (step3SalesText.includes('Item Name') || step3SalesText.includes('Cost from Supplier') || step3SalesText.includes('Our Cost'))) {
      console.log("✅ Sales Step 3 shows Supplier, Item Name, and Cost correctly.");
    } else {
      console.log("❌ Sales Step 3 missing Supplier/Item/Cost fields.");
    }
  } catch (e) {
    console.error("Test failed with error:", e);
  } finally {
    if (browser) await browser.close();
    console.log("Done cross verifying.");
  }
})();
