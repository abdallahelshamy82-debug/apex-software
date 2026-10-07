const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const stagingDir = path.join(rootDir, '_staging_export');
const zipFile = path.join(rootDir, 'Apex_Software_Project.zip');
const desktopZip = 'C:\\Users\\ASUS\\Desktop\\Apex_Software_Project.zip';

console.log('--- Packaging Apex Project for Telegram ---');

// 1. Remove old staging or zip if exists
if (fs.existsSync(stagingDir)) {
  fs.rmSync(stagingDir, { recursive: true, force: true });
}
if (fs.existsSync(zipFile)) {
  fs.unlinkSync(zipFile);
}

fs.mkdirSync(stagingDir, { recursive: true });

// Helper to copy recursively excluding node_modules, .expo, .git, etc.
function copyDirFiltered(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.expo' || entry.name === '.git' || entry.name === '_staging_export') {
        continue;
      }
      copyDirFiltered(srcPath, destPath);
    } else {
      if (entry.name.endsWith('.zip') || entry.name.endsWith('.log')) {
        continue;
      }
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 2. Copy root files
const rootFiles = ['README.md', 'DEVELOPER_GUIDE.md', 'run_dev.bat', 'run_dev.sh'];
for (const file of rootFiles) {
  const p = path.join(rootDir, file);
  if (fs.existsSync(p)) {
    fs.copyFileSync(p, path.join(stagingDir, file));
  }
}

// 3. Copy apex-app
console.log('Copying apex-app...');
copyDirFiltered(path.join(rootDir, 'apex-app'), path.join(stagingDir, 'apex-app'));

// 4. Copy apex-backend
console.log('Copying apex-backend...');
copyDirFiltered(path.join(rootDir, 'apex-backend'), path.join(stagingDir, 'apex-backend'));

// Ensure uploads directory exists in backend staging
fs.mkdirSync(path.join(stagingDir, 'apex-backend', 'uploads'), { recursive: true });

// 5. Compress using PowerShell Compress-Archive
console.log('Compressing to ZIP...');
try {
  execSync(`powershell -command "Compress-Archive -Path '${stagingDir}\\*' -DestinationPath '${zipFile}' -Force"`);
  console.log(`✅ Created: ${zipFile}`);

  // Copy to Desktop as well for convenience
  try {
    fs.copyFileSync(zipFile, desktopZip);
    console.log(`✅ Also copied to Desktop: ${desktopZip}`);
  } catch (e) {
    console.log('Desktop copy skipped:', e.message);
  }
} catch (err) {
  console.error('Compression error:', err.message);
}

// Cleanup staging
fs.rmSync(stagingDir, { recursive: true, force: true });

const stats = fs.statSync(zipFile);
console.log(`\n🎉 Final ZIP size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
