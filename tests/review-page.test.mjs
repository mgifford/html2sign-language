import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import { parseHTML } from 'linkedom';

function documentFor(path) {
  return parseHTML(readFileSync(new URL(path, import.meta.url), 'utf8')).document;
}

test('main page states the 24-word demo limit and links the review guide', () => {
  const document = documentFor('../index.html');
  const text = document.body.textContent.replace(/\s+/g, ' ');
  assert.match(document.title, /Word Demo/);
  assert.match(text, /24 isolated ASL word clips/);
  assert.match(text, /not a sentence or page translator/i);
  assert.doesNotMatch(text, /124 ASL words/);
  assert.doesNotMatch(text, /Biomechanically validated/);
  assert.ok(document.querySelector('a[href="review.html"]'));
  assert.ok(document.querySelector('a[href="experiments/html-to-asl/p2/"]'));
});

test('review page names what exists, what is missing, and who may review', () => {
  const document = documentFor('../review.html');
  const text = document.body.textContent.replace(/\s+/g, ' ');
  assert.match(text, /no sentence-to-sign or page-to-sign feature yet/i);
  assert.match(text, /24 isolated ASL word clips/i);
  assert.match(text, /16 prose lexical plans/i);
  assert.match(text, /If you cannot read ASL, do not record an independent ASL review/i);
  assert.ok(document.querySelector('a[href="experiments/html-to-asl/p2/"]'));
  assert.ok(document.querySelector('a[href="experiments/html-to-asl/"]'));
  assert.ok(document.querySelector('a[href="experiments/html-to-asl/docs/P3-P4-RESEARCH.md"]'));
});
