// @ts-check
import { chromium } from '@playwright/test';

const FRONTEND_URL = 'https://callmemobiles.vercel.app';

async function debugLoginPage() {
  console.log('🔍 Debugging login page...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the main page
    console.log('\n1. Accessing main page...');
    await page.goto(FRONTEND_URL, {
      timeout: 60000,
      waitUntil: 'networkidle'
    });
    
    console.log('Current URL:', page.url());
    console.log('Page title:', await page.title());
    
    // Take a screenshot
    await page.screenshot({ path: 'main-page.png', fullPage: true });
    console.log('Screenshot saved as main-page.png');
    
    // Try to navigate to login
    console.log('\n2. Attempting to navigate to login...');
    await page.goto(`${FRONTEND_URL}/login`, {
      timeout: 60000,
      waitUntil: 'networkidle'
    });
    
    console.log('Login page URL:', page.url());
    console.log('Login page title:', await page.title());
    
    // Take another screenshot
    await page.screenshot({ path: 'login-page.png', fullPage: true });
    console.log('Login page screenshot saved as login-page.png');
    
    // Check what elements are on the page
    const bodyText = await page.textContent('body');
    console.log('\n3. Page content (first 500 chars):');
    console.log(bodyText?.substring(0, 500));
    
    // Look for any input fields
    const inputs = await page.$$('input');
    console.log(`\n4. Found ${inputs.length} input elements`);
    
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const type = await input.getAttribute('type');
      const name = await input.getAttribute('name');
      const id = await input.getAttribute('id');
      const placeholder = await input.getAttribute('placeholder');
      console.log(`Input ${i + 1}: type="${type}", name="${name}", id="${id}", placeholder="${placeholder}"`);
    }
    
    // Look for forms
    const forms = await page.$$('form');
    console.log(`\n5. Found ${forms.length} form elements`);
    
    // Look for buttons
    const buttons = await page.$$('button');
    console.log(`\n6. Found ${buttons.length} button elements`);
    
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      const text = await button.textContent();
      const type = await button.getAttribute('type');
      console.log(`Button ${i + 1}: text="${text}", type="${type}"`);
    }
    
    // Wait a bit to see the page
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ Debug failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

try {
  await debugLoginPage();
  console.log('\n✨ Debug completed!');
} catch (error) {
  console.error('\n❌ Debug script failed:', error);
  process.exit(1);
}
