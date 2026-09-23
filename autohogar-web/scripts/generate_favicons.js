const fs = require('fs');
const path = require('path');
const http = require('http');

// Render SVG to PNG using HTML Canvas inside headless browser or write standard base64/SVG favicon
const svgPath = path.join(__dirname, '..', 'public', 'images', 'favicon.svg');
const svgContent = fs.readFileSync(svgPath, 'utf8');

// Copy SVG to root favicon.svg as well
fs.writeFileSync(path.join(__dirname, '..', 'favicon.svg'), svgContent);
console.log('Favicon SVG synced successfully!');
