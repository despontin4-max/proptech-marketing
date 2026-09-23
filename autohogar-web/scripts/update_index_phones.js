const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// Replace copyright 2026 with 2018
html = html.replace('&copy; 2026 Autohogar', '&copy; 2018 Autohogar');

// Replace schema.org phone
html = html.replace('"telephone": "+54-264-5413291"', '"telephone": ["+54-9-264-3171848", "+54-9-264-6032870"]');

// Replace all occurrences of old whatsapp phone 5492645413291 with 5492643171848
html = html.split('5492645413291').join('5492643171848');

// Update footer phones
const oldFooterPhones = `          <li><a href="https://wa.me/5492643171848" target="_blank">WhatsApp: (264) 541-3291</a></li>
          <li><a href="tel:01121648060">Teléfono: (011) 2164-8060</a></li>`;

const newFooterPhones = `          <li><a href="https://wa.me/5492643171848" target="_blank">WhatsApp 1: (264) 317-1848</a></li>
          <li><a href="https://wa.me/5492646032870" target="_blank">WhatsApp 2: (264) 603-2870</a></li>`;

html = html.replace(oldFooterPhones, newFooterPhones);

fs.writeFileSync('index.html', html, 'utf8');
console.log('Successfully updated phones and copyright in index.html');
