const fs = require('fs');
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync('public/recibos/Recibo_1900_10012.pdf');

pdf(dataBuffer).then(function(data) {
    console.log("NUMPAGES:", data.numpages);
    console.log("TEXT:\n", data.text);
});
