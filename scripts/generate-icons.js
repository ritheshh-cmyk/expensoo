import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.resolve(__dirname, '../public');
const iconsDir = path.resolve(publicDir, 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const bgColor = '#09090b';
const textColor = '#d97757';

async function generateIcon(name, size, isMaskable = false, outDir = iconsDir) {
  // SVG generation
  // Maskable icons need their content within the inner 80% (safe zone).
  const scale = isMaskable ? 0.6 : 0.8;
  const fontSize = Math.floor(size * scale * 0.6); // approximate font size

  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${bgColor}" />
      <text 
        x="50%" 
        y="50%" 
        font-family="sans-serif" 
        font-weight="bold" 
        font-size="${fontSize}px" 
        fill="${textColor}" 
        text-anchor="middle" 
        dominant-baseline="central">
        CM
      </text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.resolve(outDir, name));
    
  console.log(`Generated ${name} (${size}x${size})`);
}

async function run() {
  await generateIcon('icon-192x192.png', 192);
  await generateIcon('icon-512x512.png', 512);
  await generateIcon('maskable-icon-512x512.png', 512, true);
  await generateIcon('apple-touch-icon.png', 180, false, publicDir);
}

run().catch(console.error);
