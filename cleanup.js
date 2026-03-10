const fs = require('fs');
const path = require('path');

function deleteFolder(folderPath) {
  if (fs.existsSync(folderPath)) {
    fs.rmSync(folderPath, { recursive: true, force: true });
    console.log('Deleted:', folderPath);
  }
}

function deleteFile(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log('Deleted:', filePath);
  }
}

// Delete prisma folder
deleteFolder(path.join(__dirname, 'prisma'));

// Delete prisma.config.ts
deleteFile(path.join(__dirname, 'prisma.config.ts'));

// Delete cleanup.js
deleteFile(path.join(__dirname, 'cleanup.js'));

// Delete remove-prisma.ps1
deleteFile(path.join(__dirname, 'remove-prisma.ps1'));

console.log('Cleanup complete!');
