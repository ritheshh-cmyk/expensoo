import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_URL = 'http://localhost:5173';

async function run() {
  console.log('Starting custom login bug test...');
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
  
  // Track page console messages
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  
  // Track failed network requests
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      console.log(`API Response: ${response.status()} ${response.url()}`);
    }
  });

  try {
    console.log(`Navigating to ${APP_URL}/login...`);
    await page.goto(`${APP_URL}/login`, { waitUntil: 'networkidle2' });
    
    console.log('Typing wrong credentials...');
    await page.waitForSelector('#username');
    await page.type('#username', 'wronguser');
    await page.type('#password', 'wrongpassword');
    
    console.log('Submitting form...');
    await page.screenshot({ path: path.join(__dirname, 'before-click.png') });
    
    await page.click('button[type="submit"]');
    
    console.log('Waiting for response...');
    // Wait 5 seconds to observe the page state
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if the input is there and what errors are visible
    const pageText = await page.evaluate(() => document.body.innerText);
    const loginErrorExists = pageText.includes('Invalid username or password') || 
                             pageText.includes('Invalid username or password. Please try again.') ||
                             pageText.includes('Invalid credentials');
    const usernameValue = await page.$eval('#username', el => el.value).catch(() => 'NOT FOUND');
    
    console.log('Test results:');
    console.log('- Login error text visible:', loginErrorExists);
    console.log('- Page Text content contains "Invalid credentials":', pageText.includes('Invalid credentials'));
    console.log('- Full Page Text length:', pageText.length);
    console.log('- Username field value:', usernameValue);
    console.log('--- Page Text ---');
    console.log(pageText);
    console.log('-----------------');
    
    await page.screenshot({ path: path.join(__dirname, 'after-click.png') });
    console.log('Screenshots saved to scratch folder.');
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    await browser.close();
  }
}

run();
