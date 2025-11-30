// scripts/build.js
// cross-platform small build script that creates www/ and copies selected files/folders

const fs = require('fs-extra');
const path = require('path');

async function main() {
  const root = process.cwd();
  const out = path.join(root, 'www');

  // list files and folders to copy (add any extra names you need)
  const toCopy = [
    'index.html',
    'offline.html',
    'manifest.json',
    'styles.css',
    'script.js',
    'icons',
    'assets'
  ];

  try {
    // remove existing www and recreate
    await fs.remove(out);
    await fs.mkdirp(out);

    for (const name of toCopy) {
      const src = path.join(root, name);
      const dst = path.join(out, name);
      if (await fs.pathExists(src)) {
        await fs.copy(src, dst);
        console.log(`Copied: ${name}`);
      } else {
        console.log(`Not found (skipped): ${name}`);
      }
    }

    console.log('Build complete — www/ is ready.');
  } catch (err) {
    console.error('Build failed:', err);
    process.exitCode = 1;
  }
}

main();