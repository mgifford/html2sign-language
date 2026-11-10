// Extraction checks against the committed fixture manifest.
// Uses linkedom so the browser extractor can run in Node without a browser.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';
import { extract, extractFromDocument } from '../src/extract.mjs';
import { checkExpectedTokens, createBaseline } from '../src/core.mjs';

const manifestUrl = new URL('../fixtures/manifest.json', import.meta.url);
const fixtures = JSON.parse(readFileSync(manifestUrl, 'utf8'));

function parse(html) {
  const { document } = parseHTML(`<!doctype html><html><body>${html}</body></html>`);
  return document;
}

function blocksFor(fixture) {
  return extractFromDocument(parse(fixture.html));
}

const expectedBlockCounts = {
  'NEG-01': 1,
  'MOD-01': 1,
  'COND-01': 1,
  'LEX-01': 1,
  'DOC-01': 2,
  'HTML-01': 3,
  'SEC-01': 1,
  'NAV-01': 2,
  'QTY-01': 1,
  'LINK-01': 1,
  'TABLE-01': 4,
  'FORM-01': 2,
};

test('the fixture manifest has 12 unique, well-formed fixtures', () => {
  assert.equal(fixtures.length, 12);
  assert.equal(new Set(fixtures.map((fixture) => fixture.id)).size, fixtures.length);
  for (const fixture of fixtures) {
    assert.equal(typeof fixture.id, 'string');
    assert.equal(typeof fixture.html, 'string');
    assert.equal(typeof fixture.invariant, 'string');
    assert.ok(Array.isArray(fixture.expectedTokens));
  }
});

test('every fixture extracts its expected blocks', () => {
  for (const fixture of fixtures) {
    const blocks = blocksFor(fixture);
    assert.equal(blocks.length, expectedBlockCounts[fixture.id], fixture.id);
    assert.ok(blocks.every((block) => block.id && block.type && block.text), fixture.id);
  }
});

test('every expected token is present inside one extracted block', () => {
  for (const fixture of fixtures) {
    const checks = checkExpectedTokens(blocksFor(fixture), fixture.expectedTokens);
    for (const check of checks) assert.equal(check.preserved, true, `${fixture.id}: ${check.term}`);
  }
});

test('scripts are removed and navigation is excluded', () => {
  const secure = blocksFor(fixtures.find((fixture) => fixture.id === 'SEC-01'));
  assert.deepEqual(secure.map((block) => block.text), ['Applications close Friday.']);
  assert.ok(!secure.some((block) => block.text.includes('window.bad')));

  const navigation = blocksFor(fixtures.find((fixture) => fixture.id === 'NAV-01'));
  const text = navigation.map((block) => block.text).join(' ');
  assert.ok(text.includes('Apply for a licence'));
  assert.ok(!text.includes('Home'));
  assert.ok(!text.includes('About'));
  assert.ok(!text.includes('Contact'));
});

test('Unicode text survives extraction', () => {
  const blocks = extractFromDocument(parse('<main><p>Résumé — 日本語</p></main>'));
  assert.equal(blocks[0].text, 'Résumé — 日本語');
});

test('the Node wrapper explains why it cannot run without DOMParser', () => {
  assert.throws(() => extract('<p>x</p>'), /DOMParser is not available/);
});

test('P0 limitations and the non-ASL status are explicit in the result', () => {
  const fixture = fixtures.find((item) => item.id === 'TABLE-01');
  const result = createBaseline(fixture, blocksFor(fixture));
  assert.equal(result.translation, false);
  assert.equal(result.targetLanguage, null);
  assert.equal(result.plannedTargetLanguage, 'ase');
  assert.ok(result.limitations.some((line) => line.includes('Table')));
  assert.ok(result.warnings.some((line) => line.includes('NOT an ASL translation')));
});
