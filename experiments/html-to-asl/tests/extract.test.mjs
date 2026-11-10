// Extraction checks against the committed fixture manifest.
// Uses linkedom so the browser extractor can run in Node without a browser.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';
import { extract, extractFromDocument } from '../src/extract.mjs';
import { checkExpectedTokens, createBaseline } from '../src/core.mjs';

const manifestUrl = new URL('../fixtures/manifest.json', import.meta.url);
const holdoutUrl = new URL('../fixtures/holdout.json', import.meta.url);
const fixtures = JSON.parse(readFileSync(manifestUrl, 'utf8'));
const holdout = JSON.parse(readFileSync(holdoutUrl, 'utf8'));

function parse(html) {
  const { document } = parseHTML(`<!doctype html><html><body>${html}</body></html>`);
  return document;
}

function extractFixture(fixture) {
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
  'TABLE-01': 1,
  'FORM-01': 2,
};

test('the development manifest has 40 unique, well-formed fixtures', () => {
  assert.equal(fixtures.length, 40);
  assert.equal(new Set(fixtures.map((fixture) => fixture.id)).size, fixtures.length);
  for (const fixture of fixtures) {
    assert.equal(typeof fixture.id, 'string');
    assert.equal(typeof fixture.html, 'string');
    assert.equal(typeof fixture.invariant, 'string');
    assert.ok(Array.isArray(fixture.expectedTokens));
    assert.ok(fixture.expectedTokens.length > 0);
  }
});

test('the provisional holdout has 20 unique fixtures disjoint from development', () => {
  assert.equal(holdout.length, 20);
  assert.equal(new Set(holdout.map((fixture) => fixture.id)).size, holdout.length);
  const devIds = new Set(fixtures.map((fixture) => fixture.id));
  for (const fixture of holdout) {
    assert.equal(devIds.has(fixture.id), false, fixture.id);
    assert.equal(typeof fixture.html, 'string');
  }
});

test('every fixture extracts content and the known baseline fixtures keep their counts', () => {
  for (const fixture of fixtures) {
    const { blocks } = extractFixture(fixture);
    if (expectedBlockCounts[fixture.id] !== undefined) {
      assert.equal(blocks.length, expectedBlockCounts[fixture.id], fixture.id);
    }
    assert.ok(blocks.length > 0, fixture.id);
    assert.ok(blocks.every((block) => block.id && block.type && block.text), fixture.id);
  }
});

test('every expected token is present inside one extracted block', () => {
  for (const fixture of fixtures) {
    const { blocks } = extractFixture(fixture);
    for (const check of checkExpectedTokens(blocks, fixture.expectedTokens)) {
      assert.equal(check.preserved, true, `${fixture.id}: ${check.term}`);
    }
  }
});

test('source IDs, paths and text spans are stable and ordered', () => {
  const { blocks, sourceTextLength } = extractFixture(fixtures.find((fixture) => fixture.id === 'DOC-01'));
  assert.deepEqual(blocks.map((block) => block.id), ['b0001', 'b0002']);
  assert.ok(blocks[0].source.path.startsWith('main > p:nth-of-type(1)'));
  assert.ok(blocks[0].source.textStart < blocks[0].source.textEnd);
  assert.ok(blocks[0].source.textEnd < blocks[1].source.textStart);
  assert.ok(sourceTextLength > blocks[1].source.textEnd);
});

test('scripts are removed and navigation is excluded with a limitation', () => {
  const secure = extractFixture(fixtures.find((fixture) => fixture.id === 'SEC-01'));
  assert.deepEqual(secure.blocks.map((block) => block.text), ['Applications close Friday.']);
  assert.ok(!secure.blocks.some((block) => block.text.includes('window.bad')));

  const navigation = extractFixture(fixtures.find((fixture) => fixture.id === 'NAV-01'));
  const text = navigation.blocks.map((block) => block.text).join(' ');
  assert.ok(text.includes('Apply for a licence'));
  assert.ok(!text.includes('Home'));
  assert.ok(!text.includes('About'));
  assert.ok(!text.includes('Contact'));
  assert.ok(navigation.limitations.some((item) => item.code === 'navigation-skipped'));
});

test('nested lists keep hierarchy without duplicating child text', () => {
  const { blocks } = extractFromDocument(parse('<main><ul><li>Parent<ul><li>Child</li></ul></li></ul></main>'));
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].text, 'Parent');
  assert.equal(blocks[1].text, 'Child');
  assert.equal(blocks[1].list.depth, 2);
  assert.equal(blocks[1].list.parentId, blocks[0].id);
});

test('links keep their href and table cells keep header associations', () => {
  const link = extractFromDocument(parse('<main><p>Read <a href="/rules">the rules</a>.</p></main>'));
  assert.deepEqual(link.blocks[0].links, [{ text: 'the rules', href: '/rules' }]);

  const table = extractFromDocument(
    parse(
      '<main><table><caption>Fees</caption><thead><tr><th scope="col">Type</th><th scope="col">Fee</th></tr></thead><tbody><tr><th scope="row">Adult</th><td>$20</td></tr></tbody></table></main>',
    ),
  );
  assert.equal(table.blocks[0].table.caption, 'Fees');
  assert.deepEqual(table.blocks[0].table.rows[1].cells[1].headers, ['Fee', 'Adult']);
  assert.equal(table.blocks[0].table.headers[2].scope, 'row');
});

test('form fields keep label, type, required, and description', () => {
  const form = extractFromDocument(
    parse(
      '<main><label for="e">Email</label><input id="e" type="email" required aria-describedby="h"><p id="h">Use work email.</p></main>',
    ),
  );
  const field = form.blocks.find((block) => block.type === 'field');
  assert.equal(field.field.label, 'Email');
  assert.equal(field.field.inputType, 'email');
  assert.equal(field.field.required, true);
  assert.equal(field.field.describedBy, 'Use work email.');
  assert.ok(field.text.includes('(required)'));
});

test('text-only buttons use their visible text as the accessible name', () => {
  const { blocks } = extractFromDocument(parse('<main><button>Submit application</button></main>'));
  assert.equal(blocks[0].type, 'field');
  assert.equal(blocks[0].field.label, 'Submit application');
});

test('aria labels and image alternatives are retained', () => {
  const result = extractFromDocument(
    parse('<main><section aria-label="Notice"><p>Body</p></section><img alt="A ramp"><button aria-label="Close dialog"></button></main>'),
  );
  assert.ok(result.blocks.some((block) => block.type === 'region' && block.text === 'Notice'));
  assert.ok(result.blocks.some((block) => block.type === 'image' && block.text === 'A ramp'));
  assert.ok(result.blocks.some((block) => block.type === 'field' && block.field.label === 'Close dialog'));
});

test('closed details are skipped and flagged; open details are extracted', () => {
  const result = extractFromDocument(
    parse('<main><details><summary>More</summary><p>Closed</p></details><details open><summary>Open</summary><p>Open content</p></details></main>'),
  );
  assert.ok(!result.blocks.some((block) => block.text === 'Closed'));
  assert.ok(result.blocks.some((block) => block.text === 'Open content'));
  assert.ok(result.limitations.some((item) => item.code === 'closed-details-skipped'));
});

test('hidden and aria-hidden content is excluded', () => {
  const { blocks } = extractFixture(fixtures.find((fixture) => fixture.id === 'HIDDEN'));
  const text = blocks.map((block) => block.text).join(' ');
  assert.ok(text.includes('Visible notice'));
  assert.ok(!text.includes('Hidden notice'));
  assert.ok(!text.includes('Aria hidden notice'));
  assert.ok(!text.includes('window.bad'));

  const injected = extractFixture(fixtures.find((fixture) => fixture.id === 'INJECT'));
  const injectedText = injected.blocks.map((block) => block.text).join(' ');
  assert.ok(injectedText.includes('Safe text'));
  assert.ok(!injectedText.includes('window.bad2'));
});

test('ordered lists keep their start index', () => {
  const { blocks } = extractFixture(fixtures.find((fixture) => fixture.id === 'STRUCT-ORDERED'));
  assert.deepEqual(blocks.map((block) => block.list.index), [3, 4]);
});

test('select options and table-cell links are preserved', () => {
  const select = extractFixture(fixtures.find((fixture) => fixture.id === 'FORM-SELECT'));
  const field = select.blocks.find((block) => block.type === 'field');
  assert.deepEqual(field.field.options, ['Canada', 'France']);

  const table = extractFixture(fixtures.find((fixture) => fixture.id === 'TABLE-LINK'));
  assert.deepEqual(table.blocks[0].links, [{ text: 'Open guide', href: '/guide' }]);
});

test('missing image alternatives are flagged and decorative images are skipped', () => {
  const missing = extractFixture(fixtures.find((fixture) => fixture.id === 'IMG-NOALT'));
  assert.ok(missing.limitations.some((item) => item.code === 'image-without-alt'));
  assert.ok(!missing.blocks.some((block) => block.type === 'image'));

  const decorative = extractFixture(fixtures.find((fixture) => fixture.id === 'IMG-DECOR'));
  assert.ok(!decorative.blocks.some((block) => block.type === 'image'));
});

test('all source spans are ordered and within the text stream', () => {
  for (const fixture of fixtures) {
    const { blocks, sourceTextLength } = extractFixture(fixture);
    let previousEnd = -1;
    for (const block of blocks) {
      assert.ok(block.source.textStart >= previousEnd, `${fixture.id}: ${block.id}`);
      assert.ok(block.source.textEnd >= block.source.textStart, `${fixture.id}: ${block.id}`);
      assert.ok(block.source.textEnd < sourceTextLength, `${fixture.id}: ${block.id}`);
      previousEnd = block.source.textEnd;
    }
  }
});

test('Unicode text survives extraction', () => {
  const { blocks } = extractFromDocument(parse('<main><p>Résumé — 日本語</p></main>'));
  assert.equal(blocks[0].text, 'Résumé — 日本語');
});

test('the Node wrapper explains why it cannot run without DOMParser', () => {
  assert.throws(() => extract('<p>x</p>'), /DOMParser is not available/);
});

test('P1 limitations and the non-ASL status are explicit in the result', () => {
  const fixture = fixtures.find((item) => item.id === 'TABLE-01');
  const result = createBaseline(fixture, extractFixture(fixture));
  assert.equal(result.translation, false);
  assert.equal(result.targetLanguage, null);
  assert.equal(result.plannedTargetLanguage, 'ase');
  assert.equal(result.structures.tables, 1);
  assert.ok(result.limitations.some((line) => line.includes('does not validate meaning')));
  assert.ok(result.warnings.some((line) => line.includes('NOT an ASL translation')));
});
