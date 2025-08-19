// @ts-check
import { chromium } from '@playwright/test';

const FRONTEND_URL = 'https://callmemobiles.vercel.app';

async function checkTransactionForm() {
  console.log('🔍 Investigating transaction form accessibility...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. First login
    console.log('\n1. Logging in...');
    await page.goto(`${FRONTEND_URL}/login`, {
      timeout: 60000,
      waitUntil: 'networkidle'
    });
    
    await page.waitForSelector('#username', { timeout: 10000 });
    await page.fill('#username', 'test@example.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await page.waitForTimeout(3000);
    
    console.log('Current URL after login:', page.url());
    
    // 2. Try to access add-transaction directly
    console.log('\n2. Attempting to access /add-transaction...');
    await page.goto(`${FRONTEND_URL}/add-transaction`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log('Current URL:', page.url());
    console.log('Page title:', await page.title());
    
    // Take a screenshot
    await page.screenshot({ path: 'add-transaction-page.png', fullPage: true });
    console.log('Screenshot saved as add-transaction-page.png');
    
    // 3. Check what's actually on the page
    const bodyText = await page.textContent('body');
    console.log('\n3. Page content (first 500 chars):');
    console.log(bodyText?.substring(0, 500));
    
    // 4. Look for any forms
    const forms = await page.$$('form');
    console.log(`\n4. Found ${forms.length} form elements`);
    
    // 5. Look for all input fields
    const inputs = await page.$$('input');
    console.log(`\n5. Found ${inputs.length} input elements`);
    
    for (let i = 0; i < inputs.length && i < 10; i++) {
      const input = inputs[i];
      const type = await input.getAttribute('type');
      const name = await input.getAttribute('name');
      const id = await input.getAttribute('id');
      const placeholder = await input.getAttribute('placeholder');
      const className = await input.getAttribute('class');
      console.log(`Input ${i + 1}: type="${type}", name="${name}", id="${id}", placeholder="${placeholder}", class="${className}"`);
    }
    
    // 6. Look for buttons
    const buttons = await page.$$('button');
    console.log(`\n6. Found ${buttons.length} button elements`);
    
    for (let i = 0; i < buttons.length && i < 5; i++) {
      const button = buttons[i];
      const text = await button.textContent();
      const type = await button.getAttribute('type');
      const className = await button.getAttribute('class');
      console.log(`Button ${i + 1}: text="${text?.trim()}", type="${type}", class="${className}"`);
    }
    
    // 7. Check if this is actually the dashboard/login page
    const h1Elements = await page.$$('h1');
    console.log(`\n7. Found ${h1Elements.length} h1 elements`);
    
    for (let i = 0; i < h1Elements.length; i++) {
      const h1 = h1Elements[i];
      const text = await h1.textContent();
      console.log(`H1 ${i + 1}: "${text?.trim()}"`);
    }
    
    // 8. Try accessing from dashboard with navigation
    console.log('\n8. Trying navigation from dashboard...');
    await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: 'networkidle' });
    console.log('Dashboard URL:', page.url());
    
    // Look for navigation links
    const links = await page.$$('a');
    console.log(`Found ${links.length} links on dashboard`);
    
    for (let i = 0; i < links.length && i < 10; i++) {
      const link = links[i];
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      if (href && text) {
        console.log(`Link ${i + 1}: "${text.trim()}" -> "${href}"`);
      }
    }
    
    // 9. Try clicking on transaction-related links
    console.log('\n9. Looking for transaction-related navigation...');
    try {
      const transactionLinks = await page.$$('a[href*="transaction"], a[href*="add"], button:has-text("Add"), button:has-text("New")');
      console.log(`Found ${transactionLinks.length} potential transaction links`);
      
      for (let i = 0; i < transactionLinks.length; i++) {
        const link = transactionLinks[i];
        const href = await link.getAttribute('href');
        const text = await link.textContent();
        console.log(`Transaction link ${i + 1}: "${text?.trim()}" -> "${href}"`);
      }
    } catch (error) {
      console.log('Error finding transaction links:', error.message);
    }
    
    // Wait to see the final state
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ Investigation failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

try {
  await checkTransactionForm();
  console.log('\n✨ Investigation completed!');
} catch (error) {
  console.error('\n❌ Investigation failed:', error);
  process.exit(1);
}
