const { execSync } = require('child_process');
const ffmpeg = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'imagenes de casa modulares');
const outDir = path.join(__dirname, '..', 'scratch_video_frames');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const vids = fs.readdirSync(srcDir).filter(f => f.toLowerCase().endsWith('.mp4'));

vids.forEach((v, idx) => {
  const vPath = path.join(srcDir, v);
  const prefix = path.join(outDir, `v${idx + 1}_frame_%03d.jpg`);
  const montagePath = path.join(outDir, `v${idx + 1}_montage.jpg`);
  console.log(`Processing ${v}...`);
  try {
    const cmd = `"${ffmpeg}" -y -i "${vPath}" -vf "fps=1" -q:v 3 "${prefix}"`;
    execSync(cmd, { stdio: 'inherit' });
    console.log(`Extracted frames for ${v}`);
    
    // Create contact sheet montage
    const tileCmd = `"${ffmpeg}" -y -i "${prefix}" -vf "scale=160:280,tile=6x7" -q:v 3 "${montagePath}"`;
    execSync(tileCmd, { stdio: 'inherit' });
    console.log(`Created montage: ${montagePath}`);
  } catch (err) {
    console.error(`Error processing ${v}:`, err.message);
  }
});
