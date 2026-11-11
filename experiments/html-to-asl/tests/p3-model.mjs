// Manual P3 browser-model verification. Downloads ~1.1 GB and is NOT part of CI.
// Run: node experiments/html-to-asl/tests/p3-model.mjs

import http from 'node:http';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../', import.meta.url)));
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
  '.onnx': 'application/octet-stream', '.wasm': 'application/wasm',
};
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    const relative = pathname.endsWith('/') ? `${pathname}index.html` : pathname;
    const filePath = path.resolve(repoRoot, `.${relative}`);
    if (!filePath.startsWith(`${repoRoot}${path.sep}`)) { response.writeHead(403).end('forbidden'); return; }
    const body = await readFile(filePath);
    response.writeHead(200, { 'content-type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    response.end(body);
  } catch { response.writeHead(404).end('not found'); }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({ headless: true });
} catch {
  browser = await chromium.launch({ headless: true, channel: 'chrome' });
}
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.setDefaultTimeout(600000);
const errors = [];
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
page.on('pageerror', (error) => errors.push(error.message));
try {
  await page.goto(`${base}/experiments/html-to-asl/p3/`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.querySelectorAll('#fixture option').length === 16);
  assert.equal(await page.isDisabled('#consent'), false);
  assert.equal(await page.isDisabled('#load-model'), true);
  await page.check('#consent');
  assert.equal(await page.isDisabled('#load-model'), false);
  await page.click('#load-model');
  await page.waitForFunction(() => /Model loaded|Model load failed/.test(document.getElementById('model-status')?.textContent || ''), null, { timeout: 600000 });
  const modelStatus = await page.textContent('#model-status');
  if (/failed/i.test(modelStatus)) throw new Error(modelStatus);
  await page.selectOption('#fixture', 'NEG-01');
  await page.evaluate(() => document.getElementById('run-one').click());
  await page.waitForFunction(() => document.querySelectorAll('#runs-table tbody tr').length === 1, null, { timeout: 600000 });
  const status = await page.textContent('#run-status');
  const raw = await page.textContent('#raw');
  const semantic = await page.textContent('#semantic-summary');
  console.log(JSON.stringify({ ok: true, modelStatus, status, semantic, raw: raw.slice(0, 3000), errors }, null, 2));
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
