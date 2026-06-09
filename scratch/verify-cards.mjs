import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_URL = 'https://expensoo-eight.vercel.app';

const pass = (msg) => console.log(`  ✅ PASS: ${msg}`);
const fail = (msg) => console.log(`  ❌ FAIL: ${msg}`);
const info = (msg) => console.log(`  ℹ️  ${msg}`);
const ss = (page, name) => page.screenshot({ path: path.join(__dirname, `card_${name}.png`), fullPage: false });

// Check if a specific card's expanded panel is visible
const isPanelOpen = (page, cardId) => page.evaluate((id) => {
  const card = document.getElementById(id);
  if (!card) return false;
  // Find motion.div inside this card - the expanded panel has overflow-hidden + mt-4
  const panels = card.querySelectorAll('[class*="overflow-hidden"][class*="mt-4"][class*="border-t"]');
  for (const p of panels) {
    const rect = p.getBoundingClientRect();
    const opacity = parseFloat(window.getComputedStyle(p).opacity);
    if (rect.height > 20 && opacity > 0.5) return true;
  }
  return false;
}, cardId);

// Check panel via text content presence inside the card
const cardHasExpandedContent = (page, cardId) => page.evaluate((id) => {
  const card = document.getElementById(id);
  if (!card) return { open: false, height: 0, text: '' };
  const rect = card.getBoundingClientRect();
  // Find any div that has a scrollable content area (max-h-[300px])
  const contentArea = card.querySelector('[style*="height"]') || card.querySelector('[class*="max-h"]');
  const panels = card.querySelectorAll('[class*="border-t"]');
  let panelHeight = 0;
  let panelOpacity = 0;
  for (const p of panels) {
    const pr = p.getBoundingClientRect();
    const op = parseFloat(window.getComputedStyle(p).opacity);
    if (pr.height > panelHeight) { panelHeight = pr.height; panelOpacity = op; }
  }
  return {
    cardHeight: rect.height,
    panelHeight: Math.round(panelHeight),
    panelOpacity: panelOpacity.toFixed(2),
    open: panelHeight > 30 && panelOpacity > 0.5
  };
}, cardId);

async function run() {
  console.log('\n=== CARD EXPAND ISOLATION TEST v2 (Scoped per-card) ===\n');

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
  await page.goto(`${APP_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForSelector('#username', { timeout: 15000 });
  await page.type('#username', 'rajshekhar');
  await page.type('#password', 'rajshekhar123');
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }),
  ]);
  info('Logged in');
  await new Promise(r => setTimeout(r, 2500));
  await ss(page, '00_initial');

  const CARDS = [
    { id: 'dashboard-today-card', key: 'today', label: "Today's Revenue" },
    { id: 'dashboard-week-card', key: 'week', label: 'This Week' },
    { id: 'dashboard-unpaid-card', key: 'unpaid', label: 'Unpaid Transactions' },
  ];

  // ── Test 1: Nothing open on load ─────────────────────────────────────────
  console.log('\n── Test 1: Initial state ────────────────────────────');
  for (const c of CARDS) {
    const state = await cardHasExpandedContent(page, c.id);
    info(`${c.label}: panelHeight=${state.panelHeight}px opacity=${state.panelOpacity} open=${state.open}`);
    if (!state.open) pass(`${c.label} not expanded on load`);
    else fail(`${c.label} appears expanded on load`);
  }

  // ── Test 2: Click Today — only Today opens ────────────────────────────────
  console.log('\n── Test 2: Click Today\'s Revenue ───────────────────');
  await page.click('#dashboard-today-card');
  await new Promise(r => setTimeout(r, 800));
  await ss(page, '01_today_clicked');

  const todayState = await cardHasExpandedContent(page, 'dashboard-today-card');
  const weekState2 = await cardHasExpandedContent(page, 'dashboard-week-card');
  const unpaidState2 = await cardHasExpandedContent(page, 'dashboard-unpaid-card');

  info(`Today:  panelHeight=${todayState.panelHeight}px open=${todayState.open}`);
  info(`Week:   panelHeight=${weekState2.panelHeight}px open=${weekState2.open}`);
  info(`Unpaid: panelHeight=${unpaidState2.panelHeight}px open=${unpaidState2.open}`);

  if (todayState.open) pass("Today's Revenue expanded ✓");
  else fail("Today's Revenue did NOT expand");
  if (!weekState2.open) pass('This Week stayed closed ✓');
  else fail('This Week ALSO opened — bug!');
  if (!unpaidState2.open) pass('Unpaid stayed closed ✓');
  else fail('Unpaid ALSO opened — bug!');

  // ── Test 3: Switch to This Week ───────────────────────────────────────────
  console.log('\n── Test 3: Switch to This Week ──────────────────────');
  await page.click('#dashboard-week-card');
  await new Promise(r => setTimeout(r, 800));
  await ss(page, '02_week_clicked');

  const todayState3 = await cardHasExpandedContent(page, 'dashboard-today-card');
  const weekState3 = await cardHasExpandedContent(page, 'dashboard-week-card');
  const unpaidState3 = await cardHasExpandedContent(page, 'dashboard-unpaid-card');

  info(`Today:  panelHeight=${todayState3.panelHeight}px open=${todayState3.open}`);
  info(`Week:   panelHeight=${weekState3.panelHeight}px open=${weekState3.open}`);
  info(`Unpaid: panelHeight=${unpaidState3.panelHeight}px open=${unpaidState3.open}`);

  if (!todayState3.open) pass("Today's Revenue collapsed when Week opened ✓");
  else fail("Today's Revenue did NOT collapse — still expanded!");
  if (weekState3.open) pass('This Week now expanded ✓');
  else fail('This Week did NOT expand');
  if (!unpaidState3.open) pass('Unpaid stayed closed ✓');
  else fail('Unpaid ALSO opened — bug!');

  // ── Test 4: Click Week again to collapse ─────────────────────────────────
  console.log('\n── Test 4: Collapse This Week ───────────────────────');
  await page.click('#dashboard-week-card');
  await new Promise(r => setTimeout(r, 800));
  await ss(page, '03_week_collapsed');

  const todayState4 = await cardHasExpandedContent(page, 'dashboard-today-card');
  const weekState4 = await cardHasExpandedContent(page, 'dashboard-week-card');

  info(`Today:  open=${todayState4.open}`);
  info(`Week:   open=${weekState4.open}`);

  if (!weekState4.open) pass('This Week collapsed ✓');
  else fail('This Week did NOT collapse');
  if (!todayState4.open) pass('Today still closed ✓');
  else fail("Today's Revenue unexpectedly opened");

  // ── Test 5: Unpaid opens independently ───────────────────────────────────
  console.log('\n── Test 5: Unpaid Transactions ──────────────────────');
  await page.click('#dashboard-unpaid-card');
  await new Promise(r => setTimeout(r, 800));
  await ss(page, '04_unpaid_clicked');

  const todayState5 = await cardHasExpandedContent(page, 'dashboard-today-card');
  const weekState5 = await cardHasExpandedContent(page, 'dashboard-week-card');
  const unpaidState5 = await cardHasExpandedContent(page, 'dashboard-unpaid-card');

  info(`Today:  open=${todayState5.open}`);
  info(`Week:   open=${weekState5.open}`);
  info(`Unpaid: open=${unpaidState5.open}`);

  if (unpaidState5.open) pass('Unpaid Transactions expanded ✓');
  else fail('Unpaid did NOT expand');
  if (!todayState5.open) pass('Today still closed ✓');
  else fail('Today unexpectedly open');
  if (!weekState5.open) pass('Week still closed ✓');
  else fail('Week unexpectedly open');

  console.log('\n══════════════════════════════════════════════');
  console.log('CARD ISOLATION TEST COMPLETE');
  console.log('Check scratch/card_*.png for screenshots');
  console.log('══════════════════════════════════════════════\n');
  await browser.close();
}

run().catch(console.error);
