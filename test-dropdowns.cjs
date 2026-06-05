const { chromium } = require('playwright');

const BASE = 'http://localhost:5173';
const SCRATCH = 'C:\\Users\\rithesh\\.gemini\\antigravity\\brain\\8d87d7db-1409-4765-a7e7-846949120efb\\scratch';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  async function ss(name) {
    await page.screenshot({ path: SCRATCH + '\\' + name });
    console.log('  Screenshot: ' + name);
  }

  // === 1. LOGIN ===
  console.log('\n=== 1. LOGIN ===');
  await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await ss('pw_01_login.png');

  const ui = page.locator('input[type="text"]').first();
  const pi = page.locator('input[type="password"]').first();
  const lb = page.locator('button[type="submit"]').first();

  const uv = await ui.isVisible().catch(function() { return false; });
  const pv = await pi.isVisible().catch(function() { return false; });
  const bv = await lb.isVisible().catch(function() { return false; });
  console.log('  username visible:', uv, 'password visible:', pv, 'btn visible:', bv);

  if (uv && pv) {
    await ui.fill('admin');
    await pi.fill('admin123');
    await ss('pw_02_filled.png');
    if (bv) await lb.click();
    else await pi.press('Enter');
    await page.waitForTimeout(2000);
  }
  await ss('pw_03_after_login.png');
  console.log('  URL after login:', page.url());

  // === 2. NEW TRANSACTION ===
  console.log('\n=== 2. NEW TRANSACTION ===');
  await page.goto(BASE + '/transactions/new', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await ss('pw_04_newtxn.png');
  console.log('  URL:', page.url());

  // === 3. STEP 1: CUSTOMER DETAILS ===
  console.log('\n=== 3. STEP 1 - CUSTOMER DETAILS ===');
  var nameField = page.locator('#customerName');
  if (await nameField.isVisible()) {
    await nameField.fill('Test Customer');
    await page.locator('#phoneNumber').fill('9876543210');
    await page.locator('#deviceModel').fill('iPhone 15 Pro');
    console.log('  Filled customer details');
  } else {
    console.log('  ERROR: Customer fields not visible');
  }

  var nextBtn = page.locator('button:has-text("Next")');
  if (await nextBtn.isVisible()) {
    await nextBtn.click();
    await page.waitForTimeout(800);
    console.log('  Clicked Next -> Step 2');
  }
  await ss('pw_05_step2.png');

  // === 4. REPAIR TYPE DROPDOWN ===
  console.log('\n=== 4. REPAIR TYPE DROPDOWN ===');
  var triggers = page.locator('button[role="combobox"]');
  var triggerCount = await triggers.count();
  console.log('  Combobox triggers found:', triggerCount);

  if (triggerCount > 0) {
    var rt = triggers.first();
    var rtBox = await rt.boundingBox();
    console.log('  Repair trigger box:', JSON.stringify(rtBox));

    if (rtBox) {
      const topEl = await page.evaluate((pos) => {
        const el = document.elementFromPoint(pos.x + 10, pos.y + 10);
        return el ? { tagName: el.tagName, className: el.className, id: el.id } : null;
      }, { x: rtBox.x, y: rtBox.y });
      console.log('  Element at trigger coordinates:', topEl);
    }

    await rt.click();
    await page.waitForTimeout(600);

    const activeElStats = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return {
        tagName: el.tagName,
        className: el.className,
        box: { x: r.x, y: r.y, w: r.width, h: r.height },
        opacity: style.opacity,
        display: style.display,
        visibility: style.visibility,
        transform: style.transform,
        zIndex: style.zIndex,
        color: style.color,
        backgroundColor: style.backgroundColor
      };
    });
    console.log('  Active element stats after click:', activeElStats);

    const portals = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[data-radix-portal], [role="listbox"], [role="presentation"], [data-radix-popper-content-wrapper]')).map(el => {
        const r = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return {
          tagName: el.tagName,
          className: el.className,
          attributes: Array.from(el.attributes).map(a => a.name + '=' + a.value),
          box: { x: r.x, y: r.y, w: r.width, h: r.height },
          opacity: style.opacity,
          display: style.display,
          visibility: style.visibility,
          transform: style.transform,
          zIndex: style.zIndex
        };
      });
    });
    console.log('  Portals and Listboxes in DOM:', portals);
    await ss('pw_06_repair_dropdown.png');

    var dd = page.locator('[data-radix-popper-content-wrapper]').first();
    var ddVis = await dd.isVisible().catch(function() { return false; });
    console.log('  Dropdown visible:', ddVis);

    if (ddVis) {
      var ddBox = await dd.boundingBox();
      console.log('  Dropdown box:', JSON.stringify(ddBox));
      if (rtBox && ddBox) {
        var offset = ddBox.y - (rtBox.y + rtBox.height);
        console.log('  Vertical offset:', offset + 'px');
        console.log(Math.abs(offset) < 50 ? '  PASS: Correct position' : '  FAIL: Mispositioned!');
      }

      var opt = page.locator('[role="option"]').first();
      if (await opt.isVisible()) {
        var optText = await opt.textContent();
        await opt.click();
        await page.waitForTimeout(300);
        console.log('  Selected:', optText);
      } else {
        console.log('  FAIL: No options visible');
      }
    } else {
      console.log('  FAIL: Dropdown not visible after click');
      var listboxes = await page.locator('[role="listbox"]').count();
      console.log('  Listbox elements in DOM:', listboxes);
    }
  }

  await ss('pw_07_after_repair.png');

  // === 5. REPAIR COST ===
  console.log('\n=== 5. FILL REPAIR COST ===');
  var costField = page.locator('#repairCost');
  if (await costField.isVisible()) {
    await costField.fill('4500');
    console.log('  Filled 4500');
  }

  // === 6. PAYMENT METHOD DROPDOWN ===
  console.log('\n=== 6. PAYMENT METHOD DROPDOWN ===');
  var triggers2 = page.locator('button[role="combobox"]');
  var tc2 = await triggers2.count();
  console.log('  Combobox triggers now:', tc2);

  if (tc2 >= 2) {
    var pt = triggers2.nth(1);
    var ptBox = await pt.boundingBox();
    console.log('  Payment trigger box:', JSON.stringify(ptBox));

    await pt.click();
    await page.waitForTimeout(600);
    await ss('pw_08_payment_dropdown.png');

    var pd = page.locator('[data-radix-popper-content-wrapper]').first();
    var pdVis = await pd.isVisible().catch(function() { return false; });
    console.log('  Payment dropdown visible:', pdVis);

    if (pdVis) {
      var pdBox = await pd.boundingBox();
      console.log('  Payment dropdown box:', JSON.stringify(pdBox));
      if (ptBox && pdBox) {
        var off2 = pdBox.y - (ptBox.y + ptBox.height);
        console.log('  Vertical offset:', off2 + 'px');
        console.log(Math.abs(off2) < 50 ? '  PASS: Correct position' : '  FAIL: Mispositioned!');
      }

      var upiOpt = page.locator('[role="option"]:has-text("UPI")');
      if (await upiOpt.isVisible()) {
        await upiOpt.click();
        console.log('  Selected UPI');
      }
    } else {
      console.log('  FAIL: Payment dropdown not visible');
    }
  } else if (tc2 === 1) {
    var pt2 = triggers2.first();
    var pt2Text = await pt2.textContent();
    console.log('  Single trigger text:', pt2Text);
  }

  await ss('pw_09_final.png');

  // === 7. BACKDROP-BLUR AUDIT IN MAIN ===
  console.log('\n=== 7. BACKDROP-BLUR AUDIT ===');
  var blurList = await page.evaluate(function() {
    var results = [];
    document.querySelectorAll('main *').forEach(function(el) {
      var s = getComputedStyle(el);
      var bf = s.backdropFilter;
      if (bf && bf !== 'none') {
        results.push({
          tag: el.tagName,
          cls: (el.className || '').substring(0, 80),
          bf: bf
        });
      }
    });
    return results;
  });
  console.log('  backdrop-filter elements in <main>:', blurList.length);
  blurList.forEach(function(e) { console.log('    <' + e.tag + '> cls="' + e.cls + '" filter="' + e.bf + '"'); });

  // === 8. CHECK OTHER PAGES ===
  console.log('\n=== 8. OTHER PAGES AUDIT ===');
  var paths = ['/dashboard', '/transactions', '/suppliers', '/expenditures', '/bills', '/reports'];
  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    try {
      await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 10000 });
    } catch(e) {}
    await page.waitForTimeout(500);
    var cnt = await page.evaluate(function() {
      var c = 0;
      document.querySelectorAll('main *').forEach(function(el) {
        var s = getComputedStyle(el);
        if (s.backdropFilter !== 'none') c++;
      });
      return c;
    });
    await ss('pw_page' + path.replace('/', '_') + '.png');
    console.log('  ' + path + ': ' + cnt + ' backdrop-filter elements in <main>');
  }

  await browser.close();
  console.log('\n=== ALL TESTS DONE ===\n');
})();
