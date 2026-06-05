import { chromium } from 'playwright';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const server = app.listen(3000, async () => {
  console.log('Server started on http://localhost:3000');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', error => console.log(`[Browser Error] ${error.message}`));
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  
  await browser.close();
  server.close();
});
