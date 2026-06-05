import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'Mobile (390px)', width: 390, height: 844 }
];

const PAGES_TO_TEST = [
  '/',
  '/transactions',
  '/bills',
  '/expenditures',
  '/suppliers',
  '/reports',
];

test.describe('Responsive Visual Verification', () => {
  // Login first or assume no auth for these routes in dev mode?
  // Our tests will try to just visit the pages.
  test.beforeEach(async ({ page }) => {
    // If login is needed, we should do it here. 
    // Assuming the app has a login at /login. Let's try navigating to / first and see if it redirects.
    await page.goto('/');
    // Check if we are on login page
    if (page.url().includes('login') || await page.locator('input[type="password"]').isVisible().catch(()=>false)) {
      await page.fill('input[type="password"]', 'Lucky@1222');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/');
    }
  });

  for (const viewport of VIEWPORTS) {
    test.describe(`Viewport: ${viewport.name}`, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height } });

      for (const route of PAGES_TO_TEST) {
        test(`Verify ${route === '/' ? 'Dashboard' : route} layout`, async ({ page }) => {
          await page.goto(route);
          
          // Wait for page to be ready without waiting for networkidle (due to websockets)
          await page.waitForLoadState('domcontentloaded');
          // Wait an extra second for charts/animations
          await page.waitForTimeout(2000);
          
          // Verify no horizontal scroll
          const isScrollable = await page.evaluate(() => {
            return document.documentElement.scrollWidth > document.documentElement.clientWidth;
          });
          expect(isScrollable).toBeFalsy();
          
          // Take screenshot
          await page.screenshot({ path: `pw-results/responsive-${viewport.name.replace(/[^a-zA-Z0-9]/g, '')}-${route === '/' ? 'dashboard' : route.replace('/', '')}.png`, fullPage: true });
        });
      }
    });
  }
});
