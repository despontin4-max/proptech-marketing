const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ffmpeg = require('ffmpeg-static');

const baseDir = path.join(__dirname, '..');
const srcDir = path.join(baseDir, 'imagenes de casa modulares');
const imgDestDir = path.join(baseDir, 'public', 'images', 'modulares');
const vidDestDir = path.join(baseDir, 'public', 'videos', 'modulares');

if (!fs.existsSync(imgDestDir)) fs.mkdirSync(imgDestDir, { recursive: true });
if (!fs.existsSync(vidDestDir)) fs.mkdirSync(vidDestDir, { recursive: true });

// Mapping images to semantic names
const imageMap = {
  'WhatsApp Image 2026-09-18 at 17.04.21.jpeg': 'modular_fabrica_iluminada_01.jpeg',
  'WhatsApp Image 2026-09-18 at 17.04.22 (1).jpeg': 'modular_fabrica_iluminada_02.jpeg',
  'WhatsApp Image 2026-09-18 at 17.04.23.jpeg': 'modular_estructura_steelframing.jpeg',
  'WhatsApp Image 2026-09-18 at 17.04.22.jpeg': 'modular_cocina_mesada_marmol.jpeg',
  'WhatsApp Image 2026-09-18 at 17.04.23 (1).jpeg': 'modular_cocina_detalle_griferia.jpeg',
  'WhatsApp Image 2026-09-18 at 17.04.22 (3).jpeg': 'modular_bano_completo_marmol.jpeg',
  'WhatsApp Image 2026-09-18 at 17.04.17.jpeg': 'modular_bano_vanitory.jpeg',
  'WhatsApp Image 2026-09-18 at 17.04.18 (1).jpeg': 'modular_interior_estar_madera.jpeg',
  'WhatsApp Image 2026-09-18 at 17.04.19 (2).jpeg': 'modular_interior_panoramica.jpeg',
  'WhatsApp Image 2026-09-18 at 17.04.19.jpeg': 'modular_interior_ventana.jpeg',
  'WhatsApp Image 2026-09-18 at 17.04.22 (2).jpeg': 'modular_interior_pasillo.jpeg',
  'WhatsApp Image 2026-09-18 at 17.04.18.jpeg': 'modular_exterior_esquina_negra.jpeg',
  'WhatsApp Image 2026-09-18 at 17.04.19 (1).jpeg': 'modular_exterior_lateral.jpeg',
  'WhatsApp Image 2026-09-18 at 17.04.20.jpeg': 'modular_exterior_trasera.jpeg',
  'WhatsApp Image 2026-09-18 at 17.04.21 (1).jpeg': 'modular_exterior_acceso.jpeg',
};

console.log('--- Copying and organizing images ---');
for (const [srcName, destName] of Object.entries(imageMap)) {
  const src = path.join(srcDir, srcName);
  const dest = path.join(imgDestDir, destName);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied: ${srcName} -> ${destName}`);
  } else {
    console.warn(`File not found: ${srcName}`);
  }
}

console.log('\n--- Trimming and processing videos (removing all people) ---');

// Video 1 (17.04.24 (1).mp4): Trim 11.0s to 37.0s (living, kitchen, bath - no people)
const vid1Src = path.join(srcDir, 'WhatsApp Video 2026-09-18 at 17.04.24 (1).mp4');
const vid1Dest = path.join(vidDestDir, 'video_recorrido_interior.mp4');
try {
  console.log('Trimming Video 1 (Interior Walkthrough: 11.0s - 37.0s)...');
  execSync(`"${ffmpeg}" -y -ss 00:00:11.00 -i "${vid1Src}" -to 00:00:26.00 -c:v libx264 -crf 22 -preset medium -c:a aac -b:a 128k -movflags +faststart "${vid1Dest}"`);
  console.log(`Successfully created: ${vid1Dest}`);
} catch (e) {
  console.error('Error trimming Video 1:', e.message);
}

// Video 2 (17.04.24 (2).mp4): Trim 54.0s to 83.5s (furnished master bedroom - no people)
const vid2Src = path.join(srcDir, 'WhatsApp Video 2026-09-18 at 17.04.24 (2).mp4');
const vid2Dest = path.join(vidDestDir, 'video_recorrido_dormitorio.mp4');
try {
  console.log('Trimming Video 2 (Master Bedroom: 54.0s - 83.5s)...');
  execSync(`"${ffmpeg}" -y -ss 00:00:54.00 -i "${vid2Src}" -to 00:00:29.50 -c:v libx264 -crf 22 -preset medium -c:a aac -b:a 128k -movflags +faststart "${vid2Dest}"`);
  console.log(`Successfully created: ${vid2Dest}`);
} catch (e) {
  console.error('Error trimming Video 2:', e.message);
}

// Video 3 (17.04.24.mp4): Trim 0.0s to 6.5s (Steel framing factory structure - no people)
const vid3Src = path.join(srcDir, 'WhatsApp Video 2026-09-18 at 17.04.24.mp4');
const vid3Dest = path.join(vidDestDir, 'video_estructura_fabrica.mp4');
try {
  console.log('Trimming Video 3 (Steel Framing Structure: 0.0s - 6.5s)...');
  execSync(`"${ffmpeg}" -y -ss 00:00:00.00 -i "${vid3Src}" -to 00:00:06.50 -c:v libx264 -crf 22 -preset medium -c:a aac -b:a 128k -movflags +faststart "${vid3Dest}"`);
  console.log(`Successfully created: ${vid3Dest}`);
} catch (e) {
  console.error('Error trimming Video 3:', e.message);
}

console.log('\nAll images and videos organized and processed successfully.');
