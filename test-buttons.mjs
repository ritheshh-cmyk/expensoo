import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  await page.goto('http://localhost:10000/dashboard');
  
  // Wait for network idle or main container
  await page.waitForSelector('h1', { timeout: 10000 });
  
  const buttons = await page.$$('button');
  console.log(`Found ${buttons.length} buttons on page.`);
  
  for (let i = 0; i < buttons.length; i++) {
    const text = await page.evaluate(el => el.textContent, buttons[i]);
    console.log(`Button ${i}: ${text.trim()}`);
    if (text.includes('Show Profits') || text.includes('Hide Profits')) {
      console.log('Found profits button. Clicking it...');
      await buttons[i].click();
      await page.waitForTimeout(1000);
      const newText = await page.evaluate(el => el.textContent, buttons[i]);
      console.log(`Text after click: ${newText.trim()}`);
    }
  }

  await browser.close();
})();
