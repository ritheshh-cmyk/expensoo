// @ts-check
import { chromium } from '@playwright/test';

const FRONTEND_URL = 'https://callmemobiles.vercel.app';

async function testTransactionFormAccess() {
  console.log('🔍 Testing transaction form access after auth fix...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. Login
    console.log('\n1. Logging in...');
    await page.goto(`${FRONTEND_URL}/login`, {
      timeout: 60000,
      waitUntil: 'networkidle'
    });
    
    await page.waitForSelector('#username', { timeout: 10000 });
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for login and redirect
    await page.waitForTimeout(4000);
    
    console.log('Current URL after login:', page.url());
    
    // 2. Try to access add-transaction
    console.log('\n2. Accessing add-transaction page...');
    await page.goto(`${FRONTEND_URL}/add-transaction`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log('Current URL:', page.url());
    console.log('Page title:', await page.title());
    
    // 3. Check for transaction form elements
    console.log('\n3. Looking for transaction form elements...');
    
    // Wait a moment for the page to fully load
    await page.waitForTimeout(2000);
    
    // Look for various possible form field patterns
    const formSelectors = [
      'input[name*="customer"], input[placeholder*="customer"], input[id*="customer"]',
      'input[name*="Customer"], input[placeholder*="Customer"], input[id*="Customer"]',
      'input[name="customerName"], input[id="customerName"]',
      'input[type="text"]',  // Any text inputs
      'form'  // Any forms
    ];
    
    for (const selector of formSelectors) {
      try {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          console.log(`Found ${elements.length} elements matching: ${selector}`);
          
          // Get details of first few elements
          for (let i = 0; i < Math.min(elements.length, 3); i++) {
            const element = elements[i];
            const name = await element.getAttribute('name');
            const id = await element.getAttribute('id');
            const placeholder = await element.getAttribute('placeholder');
            const type = await element.getAttribute('type');
            console.log(`  Element ${i + 1}: name="${name}", id="${id}", placeholder="${placeholder}", type="${type}"`);
          }
        }
      } catch (error) {
        // Selector might not work, continue
      }
    }
    
    // 4. Look for headings to understand what page we're on
    console.log('\n4. Page content analysis...');
    const headings = await page.$$('h1, h2, h3');
    console.log(`Found ${headings.length} headings:`);
    
    for (let i = 0; i < headings.length; i++) {
      const heading = headings[i];
      const text = await heading.textContent();
      const tagName = await heading.evaluate(el => el.tagName);
      console.log(`  ${tagName}: "${text?.trim()}"`);
    }
    
    // 5. Check for any error messages or loading states
    const errorSelectors = [
      '[role="alert"]',
      '.error',
      '.text-red-500',
      '.text-destructive',
      '.loading',
      '.spinner'
    ];
    
    for (const selector of errorSelectors) {
      try {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          console.log(`Found ${elements.length} elements matching error/loading selector: ${selector}`);
        }
      } catch (error) {
        // Continue
      }
    }
    
    // 6. Take a screenshot for visual inspection
    await page.screenshot({ path: 'transaction-form-test.png', fullPage: true });
    console.log('Screenshot saved as transaction-form-test.png');
    
    // 7. Test navigation to other pages
    console.log('\n7. Testing navigation to verify auth is working...');
    
    await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: 'networkidle' });
    console.log('Dashboard URL:', page.url());
    
    await page.goto(`${FRONTEND_URL}/transactions`, { waitUntil: 'networkidle' });
    console.log('Transactions URL:', page.url());
    
    // Wait to see final state
    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

try {
  await testTransactionFormAccess();
  console.log('\n✨ Test completed!');
} catch (error) {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
}
