const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

const dataBuffer = fs.readFileSync(path.join(__dirname, '..', 'contrato Casas Autohogar (2).pdf'));

pdf(dataBuffer).then(function(data) {
    console.log(data.text.substring(0, 1500));
}).catch(err => console.error(err));
