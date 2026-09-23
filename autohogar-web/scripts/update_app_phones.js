const fs = require('fs');

let appJs = fs.readFileSync('public/scripts/app.js', 'utf8');
appJs = appJs.split('5492645413291').join('5492643171848');

fs.writeFileSync('public/scripts/app.js', appJs, 'utf8');
console.log('Successfully updated phones in app.js');
