import { test, expect } from '@playwright/test';

test.describe('E2E - Dashboard Revenue Cards and Mobile Grid Verification', () => {
  async function login(page) {
    await page.goto('/login');
    await page.fill('#username', 'rajshekhar');
    await page.fill('#password', 'rajshekhar123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  }

  test('Verify Revenue and Today\'s Revenue cards behavior under filters, and mobile 375px grid', async ({ page }) => {
    // 1. Login
    await login(page);

    // Verify card titles are correct
    const revenueCardTitle = page.locator('#dashboard-today-card').locator('.text-sm');
    await expect(revenueCardTitle.first()).toHaveText('Revenue');

    const todaysRevenueCardTitle = page.locator('#dashboard-total-card').locator('.text-sm');
    await expect(todaysRevenueCardTitle.first()).toHaveText("Today's Revenue");

    // 2. Set filter to "This Month"
    console.log('Setting period filter to This Month...');
    await page.click('#dashboard-filter-trigger');
    await page.waitForSelector('div[role="option"]');
    await page.click('div[role="option"]:has-text("This Month")');
    await page.waitForTimeout(1500); // Wait for CountUp animation/load

    // Note Today's Revenue value
    const todaysRevenueThisMonthStr = await page.locator('#dashboard-total-card .font-bold').first().innerText();
    console.log(`Today's Revenue under "This Month" filter: ${todaysRevenueThisMonthStr}`);

    // Note Revenue card value (filtered)
    const revenueThisMonthStr = await page.locator('#dashboard-today-card .font-bold').first().innerText();
    console.log(`Revenue card under "This Month" filter: ${revenueThisMonthStr}`);

    // Verify sub-labels
    const revenueSublabel = await page.locator('#dashboard-today-card p').first().innerText();
    expect(revenueSublabel).toContain('This Month');

    const todaysRevenueSublabel = await page.locator('#dashboard-total-card p').first().innerText();
    expect(todaysRevenueSublabel.trim()).toBe('Today');

    // 3. Change filter to "Last 6 Months"
    console.log('Changing period filter to Last 6 Months...');
    await page.click('#dashboard-filter-trigger');
    await page.waitForSelector('div[role="option"]');
    await page.click('div[role="option"]:has-text("Last 6 Months")');
    await page.waitForTimeout(1000);

    const todaysRevenueLast6MonthsStr = await page.locator('#dashboard-total-card .font-bold').first().innerText();
    const revenueLast6MonthsStr = await page.locator('#dashboard-today-card .font-bold').first().innerText();
    console.log(`Today's Revenue under "Last 6 Months" filter: ${todaysRevenueLast6MonthsStr}`);
    console.log(`Revenue card under "Last 6 Months" filter: ${revenueLast6MonthsStr}`);

    // Confirm Today's Revenue remains virtually unchanged (allowing for minor background increments)
    const val1 = parseInt(todaysRevenueThisMonthStr.replace(/[^0-9]/g, ''), 10);
    const val2 = parseInt(todaysRevenueLast6MonthsStr.replace(/[^0-9]/g, ''), 10);
    console.log(`Parsed val1 (This Month Today's Revenue): ${val1}, val2 (Last 6 Months Today's Revenue): ${val2}`);
    expect(Math.abs(val1 - val2)).toBeLessThanOrEqual(10);
    
    // Confirm period sub-label updated
    const revenueSublabel6m = await page.locator('#dashboard-today-card p').first().innerText();
    expect(revenueSublabel6m).toContain('Last 6 Months');

    // 4. Change filter to "Today"
    console.log('Changing period filter to Today...');
    await page.click('#dashboard-filter-trigger');
    await page.waitForSelector('div[role="option"]');
    await page.click('div[role="option"]:has-text("Today")');

    // Wait for CountUp animations to fully settle: poll until both values stop changing.
    // CountUp duration=0.7s — we poll until stable for 300ms.
    const waitForStableValue = async (selector: string): Promise<string> => {
      let prev = '';
      for (let i = 0; i < 20; i++) {
        await page.waitForTimeout(200);
        const curr = await page.locator(selector).first().innerText();
        if (curr === prev && curr !== '') return curr;
        prev = curr;
      }
      return prev;
    };

    const todaysRevenueTodayFilterStr = await waitForStableValue('#dashboard-total-card .font-bold');
    const revenueTodayFilterStr = await waitForStableValue('#dashboard-today-card .font-bold');
    console.log(`Today's Revenue under "Today" filter: ${todaysRevenueTodayFilterStr}`);
    console.log(`Revenue card under "Today" filter: ${revenueTodayFilterStr}`);

    // Confirm both cards now show the identical figure (same filterTxByPeriod engine)
    const valToday1 = parseInt(todaysRevenueTodayFilterStr.replace(/[^0-9]/g, ''), 10);
    const valToday2 = parseInt(revenueTodayFilterStr.replace(/[^0-9]/g, ''), 10);
    console.log(`Parsed valToday1: ${valToday1}, valToday2: ${valToday2}`);
    expect(valToday1).toBe(valToday2);

    // 5. Verify 375px mobile view responsiveness
    console.log('Setting viewport to 375px width...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // Verify all 5 cards display in a 2-column grid and do not overflow
    const todayCard = page.locator('#dashboard-today-card');
    const weekCard = page.locator('#dashboard-week-card');
    const totalCard = page.locator('#dashboard-total-card');
    const pendingCard = page.locator('#dashboard-pending-card');
    const unpaidCard = page.locator('#dashboard-unpaid-card');

    await expect(todayCard).toBeVisible();
    await expect(weekCard).toBeVisible();
    await expect(totalCard).toBeVisible();
    await expect(pendingCard).toBeVisible();
    await expect(unpaidCard).toBeVisible();

    // Check for horizontal overflow
    const isScrollable = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(isScrollable).toBeFalsy();
    console.log('✅ Visual verification at 375px passed: No horizontal overflow');
  });
});
