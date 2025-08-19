// @ts-check
import { chromium } from '@playwright/test';

const FRONTEND_URL = 'https://callmemobiles.vercel.app';

async function debugLogin() {
  console.log('🔍 Debugging login process...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen to console logs from the page
  page.on('console', msg => {
    console.log(`PAGE LOG: ${msg.type()}: ${msg.text()}`);
  });

  // Listen to network requests
  page.on('request', request => {
    console.log(`REQUEST: ${request.method()} ${request.url()}`);
  });

  page.on('response', response => {
    console.log(`RESPONSE: ${response.status()} ${response.url()}`);
  });

  try {
    console.log('\n1. Navigating to login page...');
    await page.goto(`${FRONTEND_URL}/login`, {
      timeout: 60000,
      waitUntil: 'networkidle'
    });
    
    console.log('Current URL:', page.url());
    
    // Check localStorage before login
    const storageBeforeLogin = await page.evaluate(() => {
      const storage = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) storage[key] = localStorage.getItem(key);
      }
      return storage;
    });
    console.log('localStorage before login:', storageBeforeLogin);

    console.log('\n2. Filling login form...');
    await page.waitForSelector('#username', { timeout: 10000 });
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin123');
    
    console.log('\n3. Submitting form...');
    
    // Wait for any response after clicking submit
    const [response] = await Promise.all([
      page.waitForResponse(response => {
        console.log(`Waiting for response: ${response.status()} ${response.url()}`);
        return response.url().includes(FRONTEND_URL) || response.url().includes('/api/');
      }, { timeout: 10000 }),
      page.click('button[type="submit"]')
    ]);

    console.log('Form submission response:', response.status(), response.url());
    
    // Wait a moment for any redirects
    await page.waitForTimeout(3000);
    
    console.log('\n4. Checking status after form submission...');
    console.log('Current URL after form submission:', page.url());
    
    // Check localStorage after login attempt
    const storageAfterLogin = await page.evaluate(() => {
      const storage = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) storage[key] = localStorage.getItem(key);
      }
      return storage;
    });
    console.log('localStorage after login attempt:', storageAfterLogin);
    
    // Check if there are any error messages on the page
    const errorElements = await page.$$('[role="alert"], .error, .text-destructive, .text-red-500');
    console.log(`Found ${errorElements.length} potential error elements`);
    
    for (let i = 0; i < errorElements.length; i++) {
      const error = errorElements[i];
      const text = await error.textContent();
      if (text && text.trim()) {
        console.log(`Error message ${i + 1}: "${text.trim()}"`);
      }
    }
    
    // Try to manually navigate to dashboard to test if auth works
    console.log('\n5. Trying to manually navigate to dashboard...');
    await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: 'networkidle' });
    console.log('URL after dashboard navigation attempt:', page.url());
    
    // Wait to see the final state
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ Debug failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

try {
  await debugLogin();
  console.log('\n✨ Debug completed!');
} catch (error) {
  console.error('\n❌ Debug failed:', error);
  process.exit(1);
}
