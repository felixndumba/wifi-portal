const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/USER/desktop/wifi-portal';

function removeDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log('Removed:', dirPath);
  }
}

function removeFile(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log('Removed:', filePath);
  }
}

// Remove prisma folder
removeDir(path.join(dir, 'prisma'));

// Remove Prisma config files
removeFile(path.join(dir, 'prisma.config.ts'));
removeFile(path.join(dir, 'cleanup.js'));
removeFile(path.join(dir, 'remove-prisma.ps1'));

console.log('Done removing Prisma files');
