import { chromium } from 'playwright';

(async () => {
  console.log("Starting PWA verification with Playwright...");
  const browser = await chromium.launch();
  const context = await browser.newContext({
    serviceWorkers: 'allow'
  });
  const page = await context.newPage();
  
  try {
    await page.goto('http://localhost:4173');
    console.log("Page loaded.");
    
    // Wait for the service worker to be registered and activated
    await page.waitForTimeout(3000);
    
    // Check for manifest
    const manifestHref = await page.evaluate(() => {
      const link = document.querySelector('link[rel="manifest"]');
      return link ? link.href : null;
    });
    console.log('\n--- Manifest Check ---');
    console.log('Manifest URL:', manifestHref || "Not Found");
    
    if (manifestHref) {
      const response = await page.request.get(manifestHref);
      const manifest = await response.json();
      console.log('Name:', manifest.name);
      console.log('Short Name:', manifest.short_name);
      console.log('Display Mode:', manifest.display);
      console.log('Theme Color:', manifest.theme_color);
      console.log('Icons found:', manifest.icons ? manifest.icons.length : 0);
    }
    
    // Check service worker registration
    console.log('\n--- Service Worker Check ---');
    const swRegistrations = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        return regs.map(r => {
          if (r.active) return r.active.scriptURL;
          if (r.installing) return 'installing: ' + r.installing.scriptURL;
          if (r.waiting) return 'waiting: ' + r.waiting.scriptURL;
          return 'unknown state';
        });
      }
      return ["Service workers not supported"];
    });
    
    console.log('Service Worker Registrations:', swRegistrations);
    
    // Simulate Offline Mode
    console.log('\n--- Offline Mode Check ---');
    await context.setOffline(true);
    console.log('Network set to offline. Reloading page...');
    
    // Reload and check if it still loads successfully
    const reloadResponse = await page.reload();
    if (reloadResponse && reloadResponse.ok()) {
      console.log('Page successfully reloaded in OFFLINE mode (served by Service Worker).');
    } else {
      console.log('Failed to reload page in offline mode. Service Worker caching might not be working.');
    }
    
  } catch (err) {
    console.error("Error during verification:", err);
  } finally {
    await browser.close();
  }
})();
