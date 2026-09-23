const fs = require('fs');
const path = require('path');

const svgSourcePath = 'C:/Users/USER/.gemini/antigravity-ide/brain/e5f0805e-1bc8-4961-ad71-4c3421ebe381/.system_generated/steps/1398/content.md';
const content = fs.readFileSync(svgSourcePath, 'utf8');

const regex = /<path id="([^"]+)" title="([^"]+)" d="([^"]+)"\/>/g;
let match;
const provinces = [];

// Mapping to our custom IDs and status
const provinceConfig = {
  'AR-J': { id: 'prov-sanjuan', name: 'San Juan', active: true, hq: true, status: 'Sede Matriz Central · Casa Central y Atención' },
  'AR-M': { id: 'prov-mendoza', name: 'Mendoza', active: true, status: 'Zona Activa · Entregas y Asesoramiento Frecuente' },
  'AR-D': { id: 'prov-sanluis', name: 'San Luis', active: true, status: 'Zona Activa · Cobertura Regional Cuyo' },
  'AR-F': { id: 'prov-larioja', name: 'La Rioja', active: true, status: 'Zona Activa · Cobertura Regional Directa' },
  'AR-X': { id: 'prov-cordoba', name: 'Córdoba', active: true, status: 'Zona Activa · Entregas Programadas y Asesoramiento' },
  'AR-K': { id: 'prov-catamarca', name: 'Catamarca', active: true, status: 'Zona Activa · Cobertura Regional y Asesoramiento Directo' },
  'AR-Q': { id: 'prov-neuquen', name: 'Neuquén', active: true, status: 'Zona Activa · Cobertura Patagónica Directa' },
  'AR-R': { id: 'prov-rionegro', name: 'Río Negro', active: true, status: 'Zona Activa · Cobertura Patagónica Directa' },
  'AR-B': { id: 'prov-buenosaires', name: 'Buenos Aires', active: false, status: 'Entrega Programada · Logística Nacional' },
  'AR-C': { id: 'prov-caba', name: 'Ciudad de Buenos Aires', active: false, status: 'Entrega Programada · Logística Nacional' },
  'AR-H': { id: 'prov-chaco', name: 'Chaco', active: false, status: 'Entrega Programada · Logística Nacional' },
  'AR-U': { id: 'prov-chubut', name: 'Chubut', active: false, status: 'Entrega Modular Nacional' },
  'AR-W': { id: 'prov-corrientes', name: 'Corrientes', active: false, status: 'Entrega Programada · Logística Nacional' },
  'AR-E': { id: 'prov-entrerios', name: 'Entre Ríos', active: false, status: 'Entrega Programada · Logística Nacional' },
  'AR-P': { id: 'prov-formosa', name: 'Formosa', active: false, status: 'Entrega Programada · Logística Nacional' },
  'AR-Y': { id: 'prov-jujuy', name: 'Jujuy', active: false, status: 'Entrega Programada · Logística Nacional' },
  'AR-L': { id: 'prov-lapampa', name: 'La Pampa', active: false, status: 'Entrega Programada · Logística Nacional' },
  'AR-N': { id: 'prov-misiones', name: 'Misiones', active: false, status: 'Entrega Programada · Logística Nacional' },
  'AR-A': { id: 'prov-salta', name: 'Salta', active: false, status: 'Entrega Programada · Logística Nacional' },
  'AR-Z': { id: 'prov-santacruz', name: 'Santa Cruz', active: false, status: 'Entrega Modular Nacional' },
  'AR-S': { id: 'prov-santafe', name: 'Santa Fe', active: false, status: 'Entrega Programada · Logística Nacional' },
  'AR-G': { id: 'prov-santiago', name: 'Santiago del Estero', active: false, status: 'Entrega Programada · Logística Nacional' },
  'AR-V': { id: 'prov-tierradelfuego', name: 'Tierra del Fuego', active: false, status: 'Entrega Modular Nacional' },
  'AR-T': { id: 'prov-tucuman', name: 'Tucumán', active: false, status: 'Entrega Programada · Logística Nacional' }
};

const outputPaths = [];
let sanJuanCentroid = { cx: 85, cy: 175 };

while ((match = regex.exec(content)) !== null) {
  const [_, rawId, title, d] = match;
  const cfg = provinceConfig[rawId] || { id: 'prov-' + rawId.toLowerCase(), name: title, active: false, status: 'Entrega Programada · Logística Nacional' };

  // Calculate rough centroid
  const nums = d.match(/[-+]?[0-9]*\.?[0-9]+/g).map(Number);
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < nums.length; i += 2) {
    const x = nums[i], y = nums[i+1];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const cx = Math.round((minX + maxX) / 2);
  const cy = Math.round((minY + maxY) / 2);

  if (rawId === 'AR-J') {
    // San Juan city is located at eastern valley of San Juan province
    sanJuanCentroid = { cx: Math.round(minX + (maxX - minX) * 0.65), cy: Math.round(minY + (maxY - minY) * 0.55) };
  }

  const activeClass = cfg.active ? ' prov-active' : '';
  const hqAttr = cfg.hq ? ' data-hq="true"' : '';
  outputPaths.push(`            <path id="${cfg.id}" class="prov-path${activeClass}" d="${d}" data-name="${cfg.name}" data-status="${cfg.status}"${hqAttr} />`);
}

console.log(`Parsed ${outputPaths.length} provinces.`);
console.log('San Juan HQ Marker position:', sanJuanCentroid);

const fullSvg = `          <svg viewBox="0 0 362 793" class="argentina-svg" aria-label="Mapa geográfico de cobertura de Autohogar en Argentina">\n` +
  outputPaths.join('\n') + `\n\n` +
  `            <!-- Marcador Sede Central San Juan Capital -->\n` +
  `            <circle cx="${sanJuanCentroid.cx}" cy="${sanJuanCentroid.cy}" r="6" class="hq-marker" />\n` +
  `            <circle cx="${sanJuanCentroid.cx}" cy="${sanJuanCentroid.cy}" r="15" class="hq-pulse" />\n` +
  `          </svg>`;

fs.writeFileSync('scripts/argentina_calibrated.svg.html', fullSvg, 'utf8');
console.log('Saved to scripts/argentina_calibrated.svg.html');
