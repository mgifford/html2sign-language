#!/usr/bin/env node
/**
 * Test script to validate GLTFLoader imports and catch missing dependencies
 * Run with: node tests/validate-imports.js
 */

const fs = require('fs');
const path = require('path');

const VENDOR_DIR = path.join(__dirname, '..', 'vendor');
const LOADER_PATH = path.join(VENDOR_DIR, 'GLTFLoader.js');
const THREE_PATH = path.join(VENDOR_DIR, 'three.module.min.js');
const BUFFER_UTILS_PATH = path.join(VENDOR_DIR, 'BufferGeometryUtils.js');

let errors = 0;
let warnings = 0;

function log(type, message) {
  const prefix = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : '✓';
  console.log(`${prefix} ${message}`);
  if (type === 'error') errors++;
  if (type === 'warn') warnings++;
}

console.log('=== Sign Language Avatar - Import Validation ===\n');

// Check files exist
const requiredFiles = [
  { path: LOADER_PATH, name: 'GLTFLoader.js' },
  { path: THREE_PATH, name: 'three.module.min.js' },
  { path: BUFFER_UTILS_PATH, name: 'BufferGeometryUtils.js' },
];

console.log('1. Checking required files...');
for (const file of requiredFiles) {
  if (fs.existsSync(file.path)) {
    const stats = fs.statSync(file.path);
    if (stats.size < 1000) {
      log('error', `${file.name} is too small (${stats.size} bytes) - may be a placeholder`);
    } else {
      log('ok', `${file.name} exists (${(stats.size / 1024).toFixed(1)} KB)`);
    }
  } else {
    log('error', `${file.name} not found`);
  }
}

// Read files
const loader = fs.readFileSync(LOADER_PATH, 'utf8');
const three = fs.readFileSync(THREE_PATH, 'utf8');

// Extract imports from GLTFLoader
console.log('\n2. Checking GLTFLoader imports from three.module.min.js...');
const importMatch = loader.match(/import\s*\{([^}]+)\}\s*from\s*['"]\.\/three\.module\.min\.js['"]/s);

if (!importMatch) {
  log('error', 'Could not find import statement from three.module.min.js');
} else {
  const imported = importMatch[1].split(',').map(s => s.trim()).filter(Boolean);
  log('ok', `Found ${imported.length} imports`);
  
  // Check each import exists in Three.js
  const missing = [];
  for (const name of imported) {
    // Look for export or definition of the name
    if (!three.includes(name)) {
      missing.push(name);
    }
  }
  
  if (missing.length > 0) {
    log('error', `Missing exports in three.module.min.js: ${missing.join(', ')}`);
  }
}

// Check for commonly needed but often missing imports
console.log('\n3. Checking for used-but-not-imported classes...');

const classesToCheck = [
  'MeshPhysicalMaterial',
  'Material',
  'ImageBitmapLoader', 
  'NearestFilter',
  'LinearFilter',
  'MirroredRepeatWrapping',
  'ClampToEdgeWrapping',
  'RepeatWrapping',
  'LinearMipmapLinearFilter',
  'LinearMipmapNearestFilter',
  'NearestMipmapLinearFilter',
  'NearestMipmapNearestFilter',
  'LinearSRGBColorSpace',
  'Line',
  'LineBasicMaterial',
  'LineLoop',
  'LineSegments',
  'InterleavedBuffer',
  'InterleavedBufferAttribute',
  'EquirectangularReflectionMapping',
  'BufferAttribute',
  'Float32BufferAttribute',
  'Uint16BufferAttribute',
  'Uint32BufferAttribute',
];

const importedList = importMatch ? importMatch[1].split(',').map(s => s.trim()) : [];

for (const cls of classesToCheck) {
  // Check if used in loader (not in comments)
  const usageRegex = new RegExp(`[^a-zA-Z]${cls}[^a-zA-Z]`);
  const isUsed = usageRegex.test(loader);
  const isImported = importedList.includes(cls);
  
  if (isUsed && !isImported) {
    log('error', `${cls} is USED but NOT IMPORTED`);
  }
}

// Check BufferGeometryUtils imports
console.log('\n4. Checking BufferGeometryUtils imports...');
const bufferUtils = fs.readFileSync(BUFFER_UTILS_PATH, 'utf8');
const bufferImportMatch = bufferUtils.match(/from\s*['"]([^'"]+)['"]/);
if (bufferImportMatch) {
  const importPath = bufferImportMatch[1];
  if (importPath === 'three' || importPath === './three') {
    log('error', `BufferGeometryUtils imports from '${importPath}' - should be './three.module.min.js'`);
  } else if (importPath === './three.module.min.js') {
    log('ok', 'BufferGeometryUtils imports from correct local path');
  }
}

// Check models and animations directories
console.log('\n5. Checking asset directories...');
const modelsDir = path.join(__dirname, '..', 'models');
const animsDir = path.join(__dirname, '..', 'animations');

if (fs.existsSync(modelsDir)) {
  const avatarPath = path.join(modelsDir, 'avatar.glb');
  if (fs.existsSync(avatarPath)) {
    const stats = fs.statSync(avatarPath);
    // Check if it's a real GLB (starts with glTF magic bytes)
    const header = Buffer.alloc(4);
    const fd = fs.openSync(avatarPath, 'r');
    fs.readSync(fd, header, 0, 4, 0);
    fs.closeSync(fd);
    
    if (header.toString('ascii', 0, 4) === 'glTF') {
      log('ok', `avatar.glb is a valid GLB file (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
    } else {
      log('warn', `avatar.glb may not be a valid GLB file (first bytes: ${header.toString('hex')})`);
    }
  } else {
    log('warn', 'avatar.glb not found - procedural placeholder will be used');
  }
} else {
  log('warn', 'models/ directory not found');
}

if (fs.existsSync(animsDir)) {
  const files = fs.readdirSync(animsDir).filter(f => f.endsWith('.glb'));
  log('ok', `animations/ directory has ${files.length} GLB files`);
} else {
  log('warn', 'animations/ directory not found');
}

// Summary
console.log('\n=== Summary ===');
console.log(`Errors: ${errors}`);
console.log(`Warnings: ${warnings}`);

if (errors > 0) {
  console.log('\n❌ Validation FAILED - fix errors before testing in browser');
  process.exit(1);
} else if (warnings > 0) {
  console.log('\n⚠️  Validation passed with warnings');
  process.exit(0);
} else {
  console.log('\n✓ All checks passed!');
  process.exit(0);
}
