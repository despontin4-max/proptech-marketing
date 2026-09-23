const { execSync } = require('child_process');
const ffmpeg = require('ffmpeg-static');
const path = require('path');

const outDir = path.join(__dirname, '..', 'scratch_video_frames');

try {
  // Video 1 (38 frames) -> 6x7 tile
  execSync(`"${ffmpeg}" -y -i "${path.join(outDir, 'v1_frame_%03d.jpg')}" -frames:v 1 -vf "scale=160:280,tile=6x7" -q:v 3 "${path.join(outDir, 'v1_montage.jpg')}"`);
  console.log('Video 1 montage created');
  
  // Video 2 (84 frames) -> 9x10 tile
  execSync(`"${ffmpeg}" -y -i "${path.join(outDir, 'v2_frame_%03d.jpg')}" -frames:v 1 -vf "scale=160:280,tile=9x10" -q:v 3 "${path.join(outDir, 'v2_montage.jpg')}"`);
  console.log('Video 2 montage created');
} catch (e) {
  console.error('Error:', e.message);
}
