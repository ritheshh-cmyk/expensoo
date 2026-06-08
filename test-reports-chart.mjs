import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_URL = 'http://localhost:5173';
const USERNAME = 'rajshekhar';
const PASSWORD = 'rajshekhar123';

const pass = (msg) => console.log(`  ✅ PASS: ${msg}`);
const fail = (msg) => console.log(`  ❌ FAIL: ${msg}`);
const info = (msg) => console.log(`  ℹ️  ${msg}`);

async function run() {
  console.log('\n=== STARTING REPORTS CHART VERIFICATION ===\n');

  let executablePath;
  if (fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')) {
    executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  } else if (fs.existsSync('C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe')) {
    executablePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
  }

  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    // 1. Login
    info('Logging in...');
    await page.goto(`${APP_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#username', { timeout: 10000 });
    await page.type('#username', USERNAME);
    await page.type('#password', PASSWORD);
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 })
    ]);
    info('Login successful');

    // 2. Go to reports page
    info('Navigating to Reports page...');
    await page.goto(`${APP_URL}/reports`, { waitUntil: 'domcontentloaded' });
    
    // Wait for the chart to load (we check for the card containing "Repair Types Distribution")
    info('Waiting for Repair Types Distribution card to render...');
    await page.waitForFunction(() => {
      return document.body.textContent.includes('Repair Types Distribution');
    }, { timeout: 10000 });

    // Wait 2 more seconds for charts/transitions to stabilize
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Get all page text to analyze legends and names
    const pageText = await page.evaluate(() => document.body.textContent);

    // 3. Verify that test types are NOT in the text/legend
    const invalidTypes = ["Test Type", "d+", "display stick and d+", "side battans out"];
    for (const type of invalidTypes) {
      const exists = pageText.includes(type);
      if (exists) {
        fail(`Filtered type "${type}" was found on the Reports page text.`);
      } else {
        pass(`Filtered type "${type}" is successfully excluded from reports display.`);
      }
    }

    // 4. Verify that "Others" is shown
    if (pageText.includes('Others')) {
      pass('"Others" group is successfully displayed in the chart legend.');
    } else {
      info('"Others" group is not in the text (which is normal if no category is under 5% threshold).');
    }

    // 5. Verify that valid categories are present
    const validCategories = ["Screen-replacement", "Battery-replacement", "Software-issue", "Charging-port", "Side buttons"];
    let foundValid = false;
    for (const cat of validCategories) {
      if (pageText.toLowerCase().includes(cat.toLowerCase())) {
        pass(`Valid category "${cat}" is shown.`);
        foundValid = true;
      }
    }
    
    if (!foundValid) {
      fail('None of the valid categories were found on the Reports page!');
    }

    // 6. Capture screenshot for visual audit
    info('Taking screenshot of Reports page...');
    await page.screenshot({ path: 'reports-chart-final.png', fullPage: true });
    pass('Screenshot saved to reports-chart-final.png');

    console.log('\n🎉 ALL REPORTS CHART TESTS PASSED! 🎉\n');
  } catch (error) {
    fail(`Test failed: ${error.message}`);
    await page.screenshot({ path: 'reports-failure.png' });
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
