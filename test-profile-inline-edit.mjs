import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:5174/login');
    await page.waitForSelector('input[name="username"]');
    await page.type('input[name="username"]', 'admin');
    await page.type('input[name="password"]', 'Secret@123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForSelector('text=Dashboard', { timeout: 10000 });
    console.log("Logged in successfully");
    
    // Go to profile
    await page.goto('http://localhost:5174/profile');
    await page.waitForSelector('text=My Profile', { timeout: 10000 });
    console.log("On Profile page");
    
    // Click the inline pencil edit button
    // The button has aria-label="Edit name"
    await page.waitForSelector('button[aria-label="Edit name"]');
    await page.click('button[aria-label="Edit name"]');
    console.log("Clicked Edit name");
    
    // An input field should appear, autoFocused
    await page.waitForSelector('input[value]', { timeout: 5000 });
    
    // Type a new name
    await page.keyboard.down('Shift');
    for (let i = 0; i < 20; i++) {
        await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.up('Shift');
    await page.keyboard.press('Backspace');
    
    await page.keyboard.type('Admin Testing');
    
    // Click save button
    await page.click('button[aria-label="Save name"]');
    console.log("Clicked Save name");
    
    // Wait for the text to appear or toast
    await page.waitForSelector('text=Name updated', { timeout: 10000 }).catch(() => console.log('No toast seen'));
    
    const pageText = await page.evaluate(() => document.body.innerText);
    if (pageText.includes('Admin Testing')) {
      console.log('SUCCESS: Name was updated in the UI');
    } else {
      console.log('FAILED: Name was not updated in the UI');
    }
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await browser.close();
  }
})();
