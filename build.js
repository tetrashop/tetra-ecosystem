const fs = require('fs');
const path = require('path');

console.log('🏗️ در حال ساخت پروژه...');

// ایجاد پوشه dist
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// کپی فایل‌ها
const filesToCopy = [
  'index.html',
  'package.json',
  'vercel.json',
  'README.md',
  'deploy-intelligent.js',
  'deploy-final.sh'
];

filesToCopy.forEach(file => {
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, path.join('dist', file));
    console.log(`✅ کپی شد: ${file}`);
  }
});

// کپی پوشه‌ها
const foldersToCopy = [
  'ai-core',
  'blockchain', 
  'cloud-services',
  'business-layer',
  'shared-libs'
];

function copyFolder(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const files = fs.readdirSync(src);
  files.forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    
    if (fs.statSync(srcPath).isDirectory()) {
      copyFolder(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

foldersToCopy.forEach(folder => {
  if (fs.existsSync(folder)) {
    copyFolder(folder, path.join('dist', folder));
    console.log(`✅ کپی شد: ${folder}/`);
  }
});

console.log('🎉 ساخت پروژه کامل شد!');
