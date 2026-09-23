const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, 'dist');
if (fs.existsSync(dist)) {
  fs.rmSync(dist, { recursive: true, force: true });
}
fs.mkdirSync(dist, { recursive: true });

const filesToCopy = [
  'index.html',
  'politicas-de-privacidad.html',
  'sitemap.xml',
  'robots.txt',
  'favicon.ico',
  'favicon.svg'
];

for (const file of filesToCopy) {
  const src = path.join(__dirname, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(dist, file));
  }
}

// Normalize relative asset paths in HTML files → absolute paths (add leading /)
const htmlFiles = ['index.html', 'politicas-de-privacidad.html'];
for (const htmlFile of htmlFiles) {
  const htmlPath = path.join(dist, htmlFile);
  if (!fs.existsSync(htmlPath)) continue;
  let content = fs.readFileSync(htmlPath, 'utf8');
  // Fix src="public/ → src="/public/
  content = content.replace(/src="public\//g, 'src="/public/');
  // Fix href="public/ → href="/public/
  content = content.replace(/href="public\//g, 'href="/public/');
  // Fix poster="public/ → poster="/public/
  content = content.replace(/poster="public\//g, 'poster="/public/');
  // Fix url(public/ → url(/public/
  content = content.replace(/url\(public\//g, 'url(/public/');
  // Fix url('public/ → url('/public/
  content = content.replace(/url\('public\//g, "url('/public/");
  // Fix url("public/ → url("/public/
  content = content.replace(/url\("public\//g, 'url("/public/');
  fs.writeFileSync(htmlPath, content, 'utf8');
  console.log(`Normalized paths in: ${htmlFile}`);
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (fs.existsSync(path.join(__dirname, 'public'))) {
  copyDir(path.join(__dirname, 'public'), path.join(dist, 'public'));
}

console.log('Build completed successfully: dist/ ready');
