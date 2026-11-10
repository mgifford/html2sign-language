// Integration checks for the static experiment route. Reads files only; no browser.
// Run from the repository root: node --test "experiments/html-to-asl/tests/*.test.mjs"

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const root = new URL('../../../', import.meta.url);
const experiment = (path) => new URL(`experiments/html-to-asl/${path}`, root);

const read = (url) => readFileSync(url, 'utf8');

test('experiment files and docs are present', () => {
  const required = [
    'index.html',
    'styles.css',
    'src/app.js',
    'src/core.mjs',
    'fixtures/manifest.json',
    'docs/PHASES.md',
    'docs/PROTOCOL.md',
    'docs/3D-LEX.md',
    'docs/UPSTREAM.md',
  ];
  for (const path of required) {
    assert.ok(existsSync(experiment(path)), `missing experiments/html-to-asl/${path}`);
  }
});

test('main page links to the experiment with a relative URL', () => {
  const main = read(new URL('index.html', root));
  assert.match(main, /href="experiments\/html-to-asl\/"/);
  assert.ok(existsSync(experiment('index.html')));
});

test('experiment links back to the main page', () => {
  const experimentHtml = read(experiment('index.html'));
  assert.match(experimentHtml, /href="\.\.\/\.\.\/"/);
});

test('experiment index links to its local docs', () => {
  const experimentHtml = read(experiment('index.html'));
  for (const doc of ['docs/PHASES.md', 'docs/PROTOCOL.md', 'docs/3D-LEX.md', 'docs/UPSTREAM.md']) {
    assert.match(experimentHtml, new RegExp(`href="${doc.replace('.', '\\.')}"`));
    assert.ok(existsSync(experiment(doc)), `missing ${doc}`);
  }
});

test('the duplicate continuation prompt is gone', () => {
  assert.equal(existsSync(experiment('docs/BUILD-FORWARD-PROMPT.md')), false);
});

test('the root test command includes the experiment tests', () => {
  const pkg = JSON.parse(read(new URL('package.json', root)));
  assert.match(pkg.scripts['test:experiment'], /^node --test .*experiments\/html-to-asl\/tests/);
  assert.match(pkg.scripts.test, /experiments\/html-to-asl\/tests/);
});

test('the decision record is present and linked', () => {
  assert.ok(existsSync(new URL('docs/DECISIONS.md', root)));
  const readme = read(new URL('README.md', root));
  assert.match(readme, /docs\/DECISIONS\.md/);
});
