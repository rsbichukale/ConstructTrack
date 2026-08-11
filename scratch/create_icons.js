const fs = require('fs');
const path = require('path');

const svg192 = `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">
  <rect width="192" height="192" rx="36" fill="#0284c7"/>
  <path d="M 46 140 L 46 60 L 146 60 L 146 140 Z" fill="none" stroke="#ffffff" stroke-width="10"/>
  <rect x="70" y="80" width="52" height="40" rx="6" fill="#f59e0b"/>
</svg>`;

const svg512 = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#0284c7"/>
  <path d="M 120 370 L 120 150 L 392 150 L 392 370 Z" fill="none" stroke="#ffffff" stroke-width="24"/>
  <rect x="180" y="210" width="152" height="110" rx="16" fill="#f59e0b"/>
</svg>`;

const iconsDir = path.join(process.cwd(), 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

fs.writeFileSync(path.join(iconsDir, 'icon-192.svg'), svg192);
fs.writeFileSync(path.join(iconsDir, 'icon-512.svg'), svg512);

console.log('Created SVG PWA icons in public/icons/ successfully!');
