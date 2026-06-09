import { chromium } from 'playwright';

async function run() {
  console.log('Starting console error checker for worker user...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('error') || msg.text().includes('Exception')) {
      console.log(`PAGE CONSOLE LOG [${msg.type()}]:`, msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('PAGE ERROR CRASH:', err.stack || err.message);
  });

  try {
    // Login
    console.log('Logging in as temp_worker_e2e...');
    await page.goto('http://localhost:5173/login');
    await page.waitForSelector('#username');
    await page.fill('#username', 'temp_worker_e2e');
    await page.fill('#password', 'TempWorker@1234');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    console.log('Logged in successfully!');

    // Go to /admin
    console.log('Navigating to /admin...');
    await page.goto('http://localhost:5173/admin');
    await page.waitForTimeout(5000);
    console.log('Finished waiting.');
  } catch (err) {
    console.error('Script error:', err);
  } finally {
    await browser.close();
  }
}

run();
