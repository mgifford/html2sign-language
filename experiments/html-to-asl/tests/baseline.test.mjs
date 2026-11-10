// Unit checks for the JSON contract and the P0 smoke checks.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  checkExpectedTokens,
  createBaseline,
  markEnglishConcepts,
} from '../src/core.mjs';

const fixture = { id: 'T', expectedTokens: ['no fee'] };

test('token checks are case-insensitive and stay within one block', () => {
  assert.deepEqual(checkExpectedTokens([{ text: 'NO FEE' }], ['no fee']), [
    { term: 'no fee', preserved: true },
  ]);
  assert.deepEqual(checkExpectedTokens([{ text: 'pay a' }, { text: 'fee' }], ['pay a fee']), [
    { term: 'pay a fee', preserved: false },
  ]);
});

test('a missing token changes the check status and adds a warning', () => {
  const result = createBaseline(fixture, [{ id: 'b1', text: 'no charge' }]);
  assert.equal(result.checkStatus, 'token-presence-failed');
  assert.deepEqual(result.checksSummary, { total: 1, passed: 0, failed: 1 });
  assert.ok(result.warnings.some((line) => line.includes('no fee')));
});

test('the JSON never claims an ASL target or translation', () => {
  const result = createBaseline(fixture, [{ id: 'b1', text: 'no fee' }]);
  assert.equal(result.translation, false);
  assert.equal(result.targetLanguage, null);
  assert.equal(result.plannedTargetLanguage, 'ase');
  assert.equal(result.status, 'english-analysis-only');
  assert.equal(result.arm, 'A-prebaseline');
  assert.deepEqual(result.lexicalCandidates, []);
});

test('surface cues are marked as unreviewed cues, not semantic roles', () => {
  const markers = markEnglishConcepts([{ id: 'b1', text: 'May 1' }]);
  assert.equal(markers.length, 1);
  assert.equal(markers[0].term, 'May');
  assert.equal(markers[0].interpretation, 'surface-cue-only');
  assert.equal(markers[0].reviewStatus, 'unreviewed');
  assert.equal(markers[0].start, 0);
  assert.equal(markers[0].end, 3);
});

test('a fixture without expectedTokens yields an empty, passing check set', () => {
  const result = createBaseline({ id: 'EMPTY' }, [{ id: 'b1', text: 'text' }]);
  assert.deepEqual(result.checks, []);
  assert.deepEqual(result.checksSummary, { total: 0, passed: 0, failed: 0 });
  assert.equal(result.checkStatus, 'token-presence-passed');
});
