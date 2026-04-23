import fs from 'fs';
import path from 'path';

const copyDir = (src, dest) => {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
};

const standalonePath = path.join('.next', 'standalone');
const publicDest = path.join(standalonePath, 'public');
const staticDest = path.join(standalonePath, '.next', 'static');

console.log('Copying public files...');
copyDir('public', publicDest);

console.log('Copying static files...');
copyDir(path.join('.next', 'static'), staticDest);

console.log('Preparation complete!');
