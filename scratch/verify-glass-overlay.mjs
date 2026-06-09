import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_URL = 'https://expensoo-eight.vercel.app';

const pass = (msg) => console.log(`  ✅ PASS: ${msg}`);
const fail = (msg) => console.log(`  ❌ FAIL: ${msg}`);
const info = (msg) => console.log(`  ℹ️  ${msg}`);
const ss = (page, name) => page.screenshot({ path: path.join(__dirname, `glass_${name}.png`), fullPage: false });

const isOverlayVisible = (page) => page.evaluate(() => {
  const panel = document.getElementById('glassmorphism-overlay-panel');
  if (!panel) return { visible: false };

  const titleEl = panel.querySelector('span.font-semibold');
  return {
    visible: true,
    title: titleEl ? titleEl.textContent.trim() : 'No Title'
  };
});

async function run() {
  console.log('\n=== GLASSMORPHISM OVERLAY VERIFICATION ===\n');

  let executablePath;
  for (const p of [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ]) { if (fs.existsSync(p)) { executablePath = p; break; } }

  const browser = await puppeteer.launch({
    headless: true, executablePath,
    defaultViewport: { width: 1280, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();

  // Login
  info(`Navigating to ${APP_URL}/login`);
  await page.goto(`${APP_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForSelector('#username', { timeout: 15000 });
  await page.type('#username', 'rajshekhar');
  await page.type('#password', 'rajshekhar123');
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }),
  ]);
  info('Logged in successfully');
  await new Promise(r => setTimeout(r, 3000));
  await ss(page, '00_dashboard_loaded');

  // Test 1: Check initial overlay state (should be hidden)
  console.log('\n── Test 1: Initial state ────────────────────────────');
  let state = await isOverlayVisible(page);
  if (!state.visible) {
    pass('Overlay is not visible on initial load');
  } else {
    fail(`Overlay is visible on initial load! Title: ${state.title}`);
  }

  // Test 2: Click Today card to open overlay
  console.log('\n── Test 2: Click Today card ─────────────────────────');
  await page.click('#dashboard-today-card');
  await new Promise(r => setTimeout(r, 600)); // wait for spring animation
  await ss(page, '01_today_overlay_open');
  
  state = await isOverlayVisible(page);
  if (state.visible && state.title === "Today's Revenue") {
    pass('Clicking Today card opens Today\'s Revenue overlay');
  } else {
    fail(`Clicking Today card failed. Visible: ${state.visible}, Title: ${state.title}`);
  }

  // Test 3: Click backdrop to close
  console.log('\n── Test 3: Close via backdrop click ─────────────────');
  await page.click('#glassmorphism-overlay-backdrop');
  await new Promise(r => setTimeout(r, 600)); // wait for transition
  await ss(page, '02_backdrop_clicked_closed');

  state = await isOverlayVisible(page);
  if (!state.visible) {
    pass('Clicking backdrop closes the overlay');
  } else {
    fail(`Clicking backdrop failed to close overlay. Title: ${state.title}`);
  }

  // Test 4: Click Week card to open overlay
  console.log('\n── Test 4: Click Week card ──────────────────────────');
  await page.click('#dashboard-week-card');
  await new Promise(r => setTimeout(r, 600));
  await ss(page, '03_week_overlay_open');

  state = await isOverlayVisible(page);
  if (state.visible && state.title === 'This Week') {
    pass('Clicking Week card opens This Week overlay');
  } else {
    fail(`Clicking Week card failed. Visible: ${state.visible}, Title: ${state.title}`);
  }

  // Test 5: Click Close button to close
  console.log('\n── Test 5: Close via close button (X) ───────────────');
  // Close button is a button inside the glass panel
  await page.evaluate(() => {
    const panel = document.getElementById('glassmorphism-overlay-panel');
    if (panel) {
      const closeBtn = panel.querySelector('button');
      if (closeBtn) closeBtn.click();
    }
  });
  await new Promise(r => setTimeout(r, 600));
  await ss(page, '04_close_btn_clicked_closed');

  state = await isOverlayVisible(page);
  if (!state.visible) {
    pass('Clicking Close button closes the overlay');
  } else {
    fail(`Clicking Close button failed to close overlay. Title: ${state.title}`);
  }

  // Test 6: Click Unpaid card to open overlay
  console.log('\n── Test 6: Click Unpaid card ────────────────────────');
  await page.click('#dashboard-unpaid-card');
  await new Promise(r => setTimeout(r, 600));
  await ss(page, '05_unpaid_overlay_open');

  state = await isOverlayVisible(page);
  if (state.visible && state.title === 'Unpaid Transactions') {
    pass('Clicking Unpaid card opens Unpaid Transactions overlay');
  } else {
    fail(`Clicking Unpaid card failed. Visible: ${state.visible}, Title: ${state.title}`);
  }

  // Close browser
  await browser.close();
  console.log('\n=== GLASSMORPHISM OVERLAY VERIFICATION COMPLETE ===\n');
}

run().catch(console.error);
