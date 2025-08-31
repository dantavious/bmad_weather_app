const fs = require('fs');
const path = require('path');

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'src', 'assets', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// SVG template for the icon
function createSVG(size) {
  const fontSize = Math.floor(size * 0.35);
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#6750A4" rx="${size * 0.2}"/>
  <text x="${size/2}" y="${size * 0.58}" font-family="Roboto, sans-serif" font-size="${fontSize}" font-weight="bold" text-anchor="middle" fill="white">BW</text>
</svg>`;
}

// Generate icon sizes
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

sizes.forEach(size => {
  const svg = createSVG(size);
  const filename = path.join(iconsDir, `icon-${size}x${size}.svg`);
  fs.writeFileSync(filename, svg);
  console.log(`Generated icon-${size}x${size}.svg`);
});

// Also create placeholder screenshots
const screenshotsDir = path.join(__dirname, 'src', 'assets', 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Create placeholder screenshot SVGs
const screenshotSVG = `<svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
  <rect width="1280" height="720" fill="#FEF7FF"/>
  <text x="640" y="360" font-family="Roboto, sans-serif" font-size="48" text-anchor="middle" fill="#6750A4">BMad Weather Dashboard</text>
</svg>`;

fs.writeFileSync(path.join(screenshotsDir, 'dashboard.svg'), screenshotSVG);
fs.writeFileSync(path.join(screenshotsDir, 'map.svg'), screenshotSVG);

console.log('All PWA assets generated successfully!');