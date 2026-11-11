// Browser smoke test for the P0 experiment. Serves the repository itself, so
// it needs no external server. Run:
//   node experiments/html-to-asl/tests/browser.mjs
// If Playwright's bundled Chromium is not installed, the script falls back to
// the locally installed Chrome channel. Set PLAYWRIGHT_CHANNEL to force one.

import http from 'node:http';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../', import.meta.url)));
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
};

const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    const relative = pathname.endsWith('/') ? `${pathname}index.html` : pathname;
    const filePath = path.resolve(repoRoot, `.${relative}`);
    if (!filePath.startsWith(`${repoRoot}${path.sep}`)) {
      response.writeHead(403).end('forbidden');
      return;
    }
    const body = await readFile(filePath);
    response.writeHead(200, {
      'content-type': MIME[path.extname(filePath)] || 'application/octet-stream',
    });
    response.end(body);
  } catch {
    response.writeHead(404).end('not found');
  }
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

async function launch() {
  const channel = process.env.PLAYWRIGHT_CHANNEL;
  if (channel) return chromium.launch({ headless: true, channel });
  try {
    return await chromium.launch({ headless: true });
  } catch {
    return chromium.launch({ headless: true, channel: 'chrome' });
  }
}

const browser = await launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const checks = {};

try {
  const main = await context.newPage();
  await main.goto(`${base}/`, { waitUntil: 'domcontentloaded' });
  const link = await main.evaluate(() => {
    const anchor = [...document.querySelectorAll('.site-footer a')].find((item) =>
      item.textContent.includes('HTML to ASL'),
    );
    return anchor ? { text: anchor.textContent.trim(), href: anchor.getAttribute('href') } : null;
  });
  assert.deepEqual(link, { text: 'HTML to ASL research bench', href: 'experiments/html-to-asl/' });
  const mainGates = (await main.textContent('.gate-panel')).replace(/\s+/g, ' ');
  assert.match(mainGates, /Phase C/);
  assert.match(mainGates, /P5/);
  assert.match(mainGates, /1 of 16/);
  await Promise.all([
    main.waitForURL('**/experiments/html-to-asl/'),
    main.click('.site-footer a[href="experiments/html-to-asl/"]'),
  ]);
  checks.mainLink = link.href;

  const review = await context.newPage();
  await review.goto(`${base}/review.html`, { waitUntil: 'domcontentloaded' });
  assert.match(await review.title(), /review status/i);
  assert.match(await review.textContent('main'), /no sentence-to-sign or page-to-sign feature yet/i);
  assert.ok(await review.locator('a[href="experiments/html-to-asl/p2/"]').count());
  checks.reviewPage = 'status and review links present';
  await review.close();

  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto(`${base}/experiments/html-to-asl/`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.querySelectorAll('#fixture option').length === 40);
  assert.equal(await page.textContent('#status'), 'Ready to run.');
  assert.equal(await page.getAttribute('main', 'aria-busy'), 'false');
  assert.equal(await page.isDisabled('#fixture'), false);
  assert.equal(await page.isDisabled('#run'), false);
  assert.equal(await page.getAttribute('#status', 'role'), 'status');
  const duplicateIds = await page.evaluate(() => {
    const seen = new Set();
    const duplicates = [];
    for (const element of document.querySelectorAll('[id]')) {
      if (seen.has(element.id)) duplicates.push(element.id);
      seen.add(element.id);
    }
    return duplicates;
  });
  assert.deepEqual(duplicateIds, []);
  assert.equal(await page.getAttribute('#source', 'aria-labelledby'), 'source-title');
  assert.equal(await page.getAttribute('footer a[href="../../"]', 'href'), '../../');

  await page.selectOption('#fixture', 'SEC-01');
  await page.click('#run');
  await page.waitForFunction(() => !document.getElementById('export').disabled);

  assert.equal(await page.evaluate(() => window.bad), undefined);
  assert.equal(await page.locator('#blocks article').count(), 1);
  assert.match(await page.textContent('#status'), /1 block, 0 surface cues, 1\/1 expected token present/);

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('#export'),
  ]);
  const downloadPath = await download.path();
  const exported = JSON.parse(await readFile(downloadPath, 'utf8'));
  assert.equal(exported.fixtureId, 'SEC-01');
  assert.equal(exported.translation, false);
  assert.equal(exported.targetLanguage, null);
  assert.equal(exported.plannedTargetLanguage, 'ase');
  assert.equal(exported.checkStatus, 'token-presence-passed');
  assert.deepEqual(exported.lexicalCandidates, []);
  checks.export = {
    fixtureId: exported.fixtureId,
    translation: exported.translation,
    targetLanguage: exported.targetLanguage,
    checkStatus: exported.checkStatus,
  };

  // Run every fixture through the UI; all expected tokens must be present.
  const fixtureIds = await page.$$eval('#fixture option', (options) => options.map((option) => option.value));
  for (const id of fixtureIds) {
    await page.selectOption('#fixture', id);
    await page.click('#run');
    await page.waitForFunction(() => !document.getElementById('export').disabled);
    assert.match(await page.textContent('#status'), /Completed English-only baseline/);
    assert.equal(await page.locator('#checks .check-missing').count(), 0, id);
  }
  checks.fixturesRun = fixtureIds.length;
  assert.equal(fixtureIds.length, 40);

  await page.selectOption('#fixture', 'STRUCT-TABLE');
  await page.click('#run');
  await page.waitForFunction(() => !document.getElementById('export').disabled);
  assert.equal(await page.locator('#blocks table').count(), 1);
  assert.equal(await page.textContent('#blocks table caption'), 'Fees');
  assert.equal(await page.locator('#blocks th[scope="row"]').count(), 1);

  await page.selectOption('#fixture', 'FORM-REQUIRED');
  await page.click('#run');
  await page.waitForFunction(() => !document.getElementById('export').disabled);
  assert.match(await page.textContent('#blocks'), /\(required\)/);

  // Keyboard order: select -> source pre -> run -> export.
  await page.focus('#fixture');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'source');
  const preOutline = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
  assert.equal(preOutline, 'solid');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'run');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'export');

  // Reflow at 320 CSS px (the WCAG 1.4.10 baseline).
  await page.setViewportSize({ width: 320, height: 640 });
  await page.waitForTimeout(200);
  const reflow = await page.evaluate(() => ({
    viewport: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  assert.ok(reflow.scrollWidth <= reflow.viewport, `horizontal overflow: ${reflow.scrollWidth} > ${reflow.viewport}`);

  await page.selectOption('#fixture', 'STRUCT-TABLE');
  await page.click('#run');
  await page.waitForFunction(() => !document.getElementById('export').disabled);
  const tableReflow = await page.evaluate(() => ({
    viewport: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    scroller: (() => {
      const element = document.querySelector('.table-scroll');
      return element ? { clientWidth: element.clientWidth, scrollWidth: element.scrollWidth } : null;
    })(),
  }));
  assert.ok(tableReflow.scrollWidth <= tableReflow.viewport, `table overflow: ${tableReflow.scrollWidth}`);
  checks.reflow320 = { ...reflow, table: tableReflow };

  assert.deepEqual(consoleErrors, []);
  assert.deepEqual(pageErrors, []);
  checks.consoleErrors = consoleErrors.length;

  // A failed manifest must leave a visible error and a disabled Run button.
  const failed = await context.newPage();
  const failedErrors = [];
  failed.on('pageerror', (error) => failedErrors.push(error.message));
  await failed.route('**/fixtures/manifest.json', (route) => route.abort());
  await failed.goto(`${base}/experiments/html-to-asl/`, { waitUntil: 'load' });
  await failed.waitForFunction(() => document.getElementById('status').textContent.includes('Unable to load fixtures'));
  assert.equal(await failed.isDisabled('#run'), true);
  assert.equal(await failed.isDisabled('#export'), true);
  await failed.evaluate(() => document.getElementById('run').click());
  assert.deepEqual(failedErrors, []);
  checks.manifestFailure = 'visible error, Run disabled, no page error';

  // A missing expected token must be visible and must not look like success.
  const failingToken = await context.newPage();
  await failingToken.route('**/fixtures/manifest.json', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'FAIL-01',
          title: 'Expected token missing',
          html: '<main><p>Present text.</p></main>',
          invariant: 'A token that is not present should fail.',
          expectedTokens: ['absent'],
          notes: 'Synthetic failure check.',
        },
      ]),
    }),
  );
  await failingToken.goto(`${base}/experiments/html-to-asl/`, { waitUntil: 'load' });
  await failingToken.waitForFunction(() => !document.getElementById('run').disabled);
  await failingToken.click('#run');
  assert.match(await failingToken.textContent('#status'), /Completed with 1 missing token/);
  assert.equal(await failingToken.locator('#checks .check-missing').count(), 1);
  assert.match(await failingToken.getAttribute('#status', 'class'), /is-error/);
  checks.missingToken = 'visible error and check-missing class';

  // P2 viewer: 40 precomputed plans, NEG-01 render, 320 px reflow.
  const p2 = await context.newPage();
  const p2Errors = [];
  p2.on('console', (message) => {
    if (message.type() === 'error') p2Errors.push(message.text());
  });
  p2.on('pageerror', (error) => p2Errors.push(error.message));
  await p2.goto(`${base}/experiments/html-to-asl/p2/`, { waitUntil: 'load' });
  await p2.waitForFunction(() => document.querySelectorAll('#p2-fixture option').length === 40);
  await p2.selectOption('#p2-fixture', 'NEG-01.json');
  await p2.waitForFunction(() => document.querySelectorAll('#p2-tokens tbody tr').length === 6);
  assert.equal(await p2.locator('#p2-source article').count(), 1);
  assert.match(await p2.textContent('#p2-warnings'), /Lexical plan only/i);
  await p2.setViewportSize({ width: 320, height: 640 });
  await p2.waitForTimeout(200);
  const p2Reflow = await p2.evaluate(() => ({
    viewport: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  assert.ok(p2Reflow.scrollWidth <= p2Reflow.viewport, `P2 overflow: ${p2Reflow.scrollWidth}`);
  assert.deepEqual(p2Errors, []);
  checks.p2Viewer = { fixtures: 40, neg01Candidates: 6, p2Reflow };

  // P3 page: 16 prose fixtures, explicit model consent, no automatic download.
  const p3 = await context.newPage();
  const p3Errors = [];
  p3.on('console', (message) => {
    if (message.type() === 'error') p3Errors.push(message.text());
  });
  p3.on('pageerror', (error) => p3Errors.push(error.message));
  await p3.goto(`${base}/experiments/html-to-asl/p3/`, { waitUntil: 'load' });
  await p3.waitForFunction(() => document.querySelectorAll('#fixture option').length === 16);
  assert.equal(await p3.isDisabled('#consent'), false);
  assert.equal(await p3.isDisabled('#load-model'), true);
  assert.equal(await p3.isDisabled('#run-one'), true);
  assert.match(await p3.textContent('#model-status'), /No download has started/i);
  await p3.waitForFunction(() => document.querySelectorAll('#compare-table tbody tr').length === 16);
  assert.match(await p3.textContent('#compare-status'), /16 fixtures/);
  await p3.setViewportSize({ width: 320, height: 640 });
  await p3.waitForTimeout(200);
  const p3Reflow = await p3.evaluate(() => ({
    viewport: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  assert.ok(p3Reflow.scrollWidth <= p3Reflow.viewport, `P3 overflow: ${p3Reflow.scrollWidth}`);
  assert.deepEqual(p3Errors, []);
  checks.p3Page = { fixtures: 16, consentRequired: true, reflow: p3Reflow };

  console.log(JSON.stringify({ ok: true, browser: browser.version(), checks }, null, 2));
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
