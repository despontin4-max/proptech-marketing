const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace gold with blue
  content = content.replace(/brand-gold-50/g, 'blue-50');
  content = content.replace(/brand-gold-100/g, 'blue-100');
  content = content.replace(/brand-gold-200/g, 'blue-200');
  content = content.replace(/brand-gold-300/g, 'blue-300');
  content = content.replace(/brand-gold-400/g, 'blue-500'); // make a bit darker for text
  content = content.replace(/brand-gold-500/g, 'blue-600');
  content = content.replace(/brand-gold-600/g, 'blue-700');
  content = content.replace(/brand-gold-800/g, 'blue-800');
  content = content.replace(/brand-gold-950/g, 'blue-900');
  
  // Replace brand-navy with slate where appropriate for light theme
  // (In PropertyCatalog it has navy bg that we want to turn to slate-50/white)
  if (filePath.includes('PropertyCatalog.tsx')) {
    content = content.replace(/bg-brand-navy-950/g, 'bg-slate-50');
    content = content.replace(/bg-brand-navy-900/g, 'bg-white');
    content = content.replace(/border-brand-navy-800/g, 'border-slate-200');
    content = content.replace(/text-slate-200/g, 'text-slate-800');
    content = content.replace(/shadow-brand-navy-950/g, 'shadow-slate-200');
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', filePath);
  }
}

const dir = 'c:/Users/USER/Desktop/PROPTECH MARKETING/córdoba-proptech/src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  replaceInFile(path.join(dir, file));
}
