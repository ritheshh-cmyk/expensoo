// Basic PNG icon placeholder creation script
const fs = require('fs');
const path = require('path');

// Create a simple base64 encoded PNG for different sizes
const createSimplePNG = (size) => {
  // This is a basic blue square PNG as placeholder
  const canvas = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="#3b82f6" rx="8"/>
    <text x="${size/2}" y="${size/2}" text-anchor="middle" dominant-baseline="central" 
          fill="white" font-size="${size/8}" font-family="Arial">E</text>
  </svg>`;
  
  return canvas;
};

// Create placeholder icons
const sizes = [64, 144, 192, 512];
const publicDir = path.join(__dirname, 'public');

sizes.forEach(size => {
  const svgContent = createSimplePNG(size);
  fs.writeFileSync(path.join(publicDir, `pwa-${size}x${size}.svg`), svgContent);
});

// Create favicon
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createSimplePNG(32));

console.log('✅ Placeholder PWA icons created!');
