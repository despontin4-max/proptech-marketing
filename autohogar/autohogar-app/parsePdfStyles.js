const fs = require('fs');
const PDFParser = require('pdf2json');
const pdfParser = new PDFParser();

pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError));
pdfParser.on("pdfParser_dataReady", pdfData => {
  const page = pdfData.Pages[0];
  const texts = page.Texts.map(t => {
    return {
      text: decodeURIComponent(t.R[0].T),
      y: t.y,
      x: t.x,
      clr: t.R[0].S,
      size: t.R[0].TS[1],
      isBold: t.R[0].TS[2] === 1
    };
  });
  
  texts.sort((a,b) => a.y - b.y || a.x - b.x);
  for (let i = 0; i < Math.min(25, texts.length); i++) {
    console.log(texts[i]);
  }
});

pdfParser.loadPDF("public/recibos/Recibo_1900_10012.pdf");
