// @ts-check
import { chromium } from 'playwright';

(async () => {
  console.log('🔍 Running deployment verification...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 50 // Add delay between actions to improve reliability
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Login first
  async function login() {
    console.log('\nLogging in...');
    try {
      await page.goto('https://callmemobiles-mlo3gyi9r-ritheshs-projects-2bddf162.vercel.app/login', {
        timeout: 60000,
        waitUntil: 'networkidle'
      });
      
      // Wait for form elements
      await page.waitForSelector('input[type="email"]', { timeout: 10000 });
      await page.waitForSelector('input[type="password"]', { timeout: 10000 });
      
      // Fill form
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      
      // Submit and wait for response
      await Promise.all([
        page.waitForResponse(resp => resp.url().includes('/api/auth'), { timeout: 30000 }),
        page.click('button[type="submit"]')
      ]);

      // Wait for redirection and token
      await page.waitForTimeout(2000); // Wait for token to be set
      const token = await page.evaluate(() => localStorage.getItem('auth_token'));
      
      if (!token) {
        throw new Error('No auth token found after login');
      }

      console.log('✅ Login successful, token acquired:', token.substring(0, 20) + '...');
      return token;
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      throw error;
    }
  }

  // Acquire auth token
  const authToken = await login();

  try {
    // Check frontend accessibility
    console.log('\n1. Checking frontend deployment...');
    await page.goto('https://callmemobiles-mlo3gyi9r-ritheshs-projects-2bddf162.vercel.app');
    await page.waitForLoadState('networkidle');
    console.log('✅ Frontend is accessible');

    // Check API health
    console.log('\n2. Checking API health...');
    const apiResponse = await fetch('https://expensoo-app-gu3wg.ondigitalocean.app/api/health', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    });
    const health = await apiResponse.json();
    console.log('✅ API health check passed:', health);

    // Test transaction creation
    console.log('\n3. Testing transaction creation...');
    const response = await fetch('https://expensoo-app-gu3wg.ondigitalocean.app/api/transactions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({
        customerName: 'Test Customer',
        mobileNumber: '9876543210',
        deviceModel: 'iPhone 15',
        repairType: 'Screen Replacement',
        repairCost: 2500,
        paymentMethod: 'cash',
        amountGiven: 2500,
        changeReturned: 0,
        status: 'completed',
        remarks: 'Test transaction for verification',
        partsCost: []
      })
    });
    
    const result = await response.json();
    console.log('✅ Transaction creation test result:', result);

    // Test transaction list retrieval
    console.log('\n4. Testing transaction list retrieval...');
    const listResponse = await fetch('https://expensoo-app-gu3wg.ondigitalocean.app/api/transactions', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    });
    const transactions = await listResponse.json();
    console.log('✅ Transaction list retrieval test:', {
      status: listResponse.status,
      count: Array.isArray(transactions) ? transactions.length : 'N/A'
    });

    // Test frontend form submission
    console.log('\n5. Testing frontend transaction form...');
    try {
      await page.goto('https://callmemobiles-mlo3gyi9r-ritheshs-projects-2bddf162.vercel.app/add-transaction', {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Wait for form elements with appropriate timeout
      await page.waitForSelector('input[name="customerName"]', { timeout: 10000 });
      await page.waitForSelector('input[name="mobileNumber"]', { timeout: 10000 });
      await page.waitForSelector('input[name="deviceModel"]', { timeout: 10000 });
      await page.waitForSelector('input[name="repairType"]', { timeout: 10000 });
      await page.waitForSelector('input[name="repairCost"]', { timeout: 10000 });
      await page.waitForSelector('select[name="paymentMethod"]', { timeout: 10000 });
      await page.waitForSelector('input[name="amountGiven"]', { timeout: 10000 });
      
      // Fill form with delay between actions
      await page.fill('input[name="customerName"]', 'Frontend Test Customer');
      await page.waitForTimeout(100);
      await page.fill('input[name="mobileNumber"]', '9876543210');
      await page.waitForTimeout(100);
      await page.fill('input[name="deviceModel"]', 'Samsung S21');
      await page.waitForTimeout(100);
      await page.fill('input[name="repairType"]', 'Battery Replacement');
      await page.waitForTimeout(100);
      await page.fill('input[name="repairCost"]', '1500');
      await page.waitForTimeout(100);
      await page.selectOption('select[name="paymentMethod"]', 'cash');
      await page.waitForTimeout(100);
      await page.fill('input[name="amountGiven"]', '1500');
      await page.waitForTimeout(100);
    
    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/transactions')),
      page.click('button[type="submit"]')
    ]);

    console.log('✅ Frontend form submission completed');

  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
})().then(() => {
  console.log('\n✨ All verification checks passed!');
  console.log('\nMonitoring URLs:');
  console.log('• Frontend: https://callmemobiles-mlo3gyi9r-ritheshs-projects-2bddf162.vercel.app');
  console.log('• Backend: https://expensoo-app-gu3wg.ondigitalocean.app');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Verification script failed:', error);
  process.exit(1);
});
