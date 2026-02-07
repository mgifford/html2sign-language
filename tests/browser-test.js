#!/usr/bin/env node
/**
 * Browser-based test using Puppeteer to check for runtime errors
 * Run with: node tests/browser-test.js [url]
 * 
 * Prerequisites: npm install puppeteer
 */

const puppeteer = require('puppeteer');

const DEFAULT_URL = 'http://localhost:8000/';
const url = process.argv[2] || DEFAULT_URL;

async function runTest() {
  console.log(`\n=== Browser Test: ${url} ===\n`);
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  } catch (e) {
    console.log('Puppeteer not installed. Install with: npm install puppeteer');
    console.log('Skipping browser test.\n');
    process.exit(0);
  }

  const page = await browser.newPage();
  
  const errors = [];
  const warnings = [];
  const logs = [];
  
  // Capture console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    
    if (type === 'error') {
      errors.push(text);
    } else if (type === 'warning') {
      warnings.push(text);
    } else {
      logs.push(text);
    }
  });
  
  // Capture page errors
  page.on('pageerror', err => {
    errors.push(`Page Error: ${err.message}`);
  });
  
  // Capture failed requests
  page.on('requestfailed', request => {
    const failure = request.failure();
    const url = request.url();
    if (!url.includes('favicon')) {
      errors.push(`Request Failed: ${url} - ${failure?.errorText || 'unknown'}`);
    }
  });

  try {
    console.log('1. Loading page...');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('   ✓ Page loaded\n');
    
    // Wait for initialization
    await page.waitForTimeout(2000);
    
    // Check for THREE.js
    console.log('2. Checking Three.js...');
    const threeLoaded = await page.evaluate(() => typeof window.THREE !== 'undefined');
    if (threeLoaded) {
      console.log('   ✓ Three.js loaded\n');
    } else {
      console.log('   ❌ Three.js NOT loaded\n');
      errors.push('Three.js not loaded');
    }
    
    // Check for GLTFLoader
    console.log('3. Checking GLTFLoader...');
    const loaderLoaded = await page.evaluate(() => typeof window.THREE?.GLTFLoader !== 'undefined');
    if (loaderLoaded) {
      console.log('   ✓ GLTFLoader loaded\n');
    } else {
      console.log('   ❌ GLTFLoader NOT loaded\n');
      errors.push('GLTFLoader not loaded');
    }
    
    // Get debug log content
    console.log('4. Checking debug log...');
    const debugContent = await page.evaluate(() => {
      const el = document.getElementById('debug-log');
      return el ? el.innerText : 'Debug log not found';
    });
    
    console.log('   Debug log contents:');
    debugContent.split('\n').forEach(line => {
      if (line.trim()) {
        const prefix = line.includes('[ERROR]') ? '   ❌' : '   ';
        console.log(`${prefix} ${line}`);
        if (line.includes('[ERROR]')) {
          errors.push(line);
        }
      }
    });
    
    // Check avatar status
    console.log('\n5. Checking avatar status...');
    const avatarStatus = await page.evaluate(() => {
      const el = document.getElementById('avatar-status');
      return el ? el.innerText : 'Avatar status not found';
    });
    console.log(`   Status: "${avatarStatus}"\n`);
    
    // Check if canvas has content (WebGL context)
    console.log('6. Checking WebGL canvas...');
    const canvasOk = await page.evaluate(() => {
      const canvas = document.getElementById('signer-canvas');
      if (!canvas) return false;
      const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
      return !!gl;
    });
    if (canvasOk) {
      console.log('   ✓ WebGL context available\n');
    } else {
      console.log('   ⚠️  WebGL context not found (may be in use by Three.js)\n');
    }
    
  } catch (e) {
    errors.push(`Test error: ${e.message}`);
  }
  
  await browser.close();
  
  // Summary
  console.log('=== Summary ===');
  console.log(`Console logs: ${logs.length}`);
  console.log(`Warnings: ${warnings.length}`);
  console.log(`Errors: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\n❌ ERRORS FOUND:');
    errors.forEach(e => console.log(`   - ${e}`));
    process.exit(1);
  } else {
    console.log('\n✓ No errors detected');
    process.exit(0);
  }
}

runTest().catch(e => {
  console.error('Test failed:', e);
  process.exit(1);
});
