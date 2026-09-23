const fs = require('fs');

const indexHtmlPath = 'index.html';
let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

const svgSnippet = fs.readFileSync('scripts/argentina_calibrated.svg.html', 'utf8');

const startMarker = '<div class="argentina-map-container" id="argentina-map">';
const endMarker = '</div>\n\n        <!-- Tarjeta Flotante Interactiva -->';

const startIndex = indexHtml.indexOf(startMarker);
const endIndex = indexHtml.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('Markers not found! startIndex:', startIndex, 'endIndex:', endIndex);
  process.exit(1);
}

const before = indexHtml.substring(0, startIndex + startMarker.length);
const after = indexHtml.substring(endIndex);

const updatedHtml = before + '\n' + svgSnippet + '\n        ' + after;

fs.writeFileSync(indexHtmlPath, updatedHtml, 'utf8');
console.log('Successfully updated index.html with calibrated Argentina SVG map!');
