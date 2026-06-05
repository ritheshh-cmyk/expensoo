// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'retain-on-failure',
    headless: true,
  },
  reporter: [['html', { outputFolder: 'pw-report', open: 'never' }], ['list']],
  outputDir: 'pw-results',
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 1280, height: 800 },
        launchOptions: { slowMo: 50 },
      },
    },
  ],
});

