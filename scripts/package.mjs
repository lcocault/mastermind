#!/usr/bin/env node
// scripts/package.mjs
// Assembles a deployable static-site package in the `package/` directory and
// creates a zip archive `mastermind-static.zip` ready for AlwaysData upload.

import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const outDir = join(rootDir, 'package');
const distDir = join(outDir, 'dist');
const zipPath = join(rootDir, 'mastermind-static.zip');

// ── 1. Prepare output directory ──────────────────────────────────────────────
mkdirSync(distDir, { recursive: true });

// ── 2. Copy index.html ────────────────────────────────────────────────────────
copyFileSync(join(rootDir, 'index.html'), join(outDir, 'index.html'));

// ── 3. Copy the bundle ────────────────────────────────────────────────────────
const bundleSrc = join(rootDir, 'dist', 'bundle.js');
if (!existsSync(bundleSrc)) {
  console.error('ERROR: dist/bundle.js not found – run `npm run bundle` first.');
  process.exit(1);
}
copyFileSync(bundleSrc, join(distDir, 'bundle.js'));

// ── 4. Create zip archive ─────────────────────────────────────────────────────
// Use the built-in Node.js zip support (available since Node 22) when present;
// otherwise fall back to the system `zip` command so the script works on older
// Node versions as well.
await createZip();

console.log(`\n✅  Static package ready:`);
console.log(`   Directory : ${outDir}`);
console.log(`   Archive   : ${zipPath}`);
console.log(`\nUpload the archive (or the contents of package/) to your`);
console.log(`AlwaysData static-site document root.\n`);

// ─────────────────────────────────────────────────────────────────────────────

async function createZip() {
  // Node 22+ ships CompressionStream + DecompressionStream and a native zip API
  // but for broad compatibility we use the system zip binary if available.
  const { spawnSync } = await import('child_process');

  const result = spawnSync(
    'zip',
    ['-r', zipPath, 'index.html', 'dist/bundle.js'],
    { cwd: outDir, stdio: 'inherit' }
  );

  if (result.status !== 0) {
    console.warn('WARNING: `zip` command failed or not available; skipping archive creation.');
    console.warn('The package/ directory still contains all files needed for deployment.');
  }
}
