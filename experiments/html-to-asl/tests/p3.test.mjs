import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MODEL,
  buildMessages,
  buildPrompt,
  checkPreservation,
  criticalTokens,
  parseModelJson,
  simplifiedText,
  validateModelOutput,
} from '../p3/core.mjs';

const valid = {
  simplified: ['You must apply by November 30.'],
  changes: [{ from: 'Applicants must apply', to: 'You must apply', reason: 'plain wording' }],
  uncertainty: '',
  abstain: false,
};

test('model metadata is pinned and licensed', () => {
  assert.equal(MODEL.license, 'Apache-2.0');
  assert.match(MODEL.revision, /^[0-9a-f]{40}$/);
  assert.match(MODEL.fileSha256, /^[0-9a-f]{64}$/);
  assert.match(MODEL.tokenizerSha256, /^[0-9a-f]{64}$/);
  assert.equal(MODEL.library, '@huggingface/transformers');
  assert.equal(MODEL.libraryVersion, '4.3.2');
  assert.equal(MODEL.dtype, 'q4f16');
});

test('critical tokens include numbers, negation, modality, dates', () => {
  const tokens = criticalTokens('You must not apply after November 30, 2026.');
  for (const expected of ['must', 'not', 'November', '30']) {
    assert.ok(tokens.includes(expected), `${expected} missing from ${tokens.join(', ')}`);
  }
});

test('critical-token check is mechanical and flags loss', () => {
  const passed = checkPreservation('Pay $25 by November 30 unless an extension is granted.', 'Pay $25 by November 30 unless an extension is granted.');
  assert.equal(passed.passed, true);
  const failed = checkPreservation('Pay $25 by November 30.', 'Pay the fee by the deadline.');
  assert.equal(failed.passed, false);
  assert.ok(failed.missing.includes('$25'));
  assert.ok(failed.missing.includes('November'));
  assert.match(failed.note, /does not prove/i);
});

test('prompt keeps the source and forbids ASL output', () => {
  const prompt = buildPrompt('You must apply by November 30.');
  assert.match(prompt, /Return only a JSON object/);
  assert.match(prompt, /Do not produce ASL glosses/);
  assert.match(prompt, /You must apply by November 30\./);
});

test('chat messages carry the schema and source', () => {
  const messages = buildMessages('You must apply by Friday.');
  assert.equal(messages.length, 2);
  assert.equal(messages[0].role, 'system');
  assert.match(messages[1].content, /abstain must be false/);
  assert.match(messages[1].content, /You must apply by Friday\./);
});

test('parse accepts bare and fenced JSON', () => {
  const bare = parseModelJson(JSON.stringify(valid));
  assert.equal(bare.ok, true);
  assert.deepEqual(bare.value, valid);
  const fenced = parseModelJson(`\`\`\`json\n${JSON.stringify(valid)}\n\`\`\``);
  assert.equal(fenced.ok, true);
  assert.deepEqual(fenced.value, valid);
});

test('parse rejects malformed output without repair', () => {
  const result = parseModelJson('This is not JSON.');
  assert.equal(result.ok, false);
  assert.match(result.error, /no JSON object/i);
});

test('validation accepts a simplified string', () => {
  assert.deepEqual(validateModelOutput({ ...valid, simplified: 'Apply by Friday.' }), []);
});

test('abstention may omit simplified when it has no output', () => {
  assert.deepEqual(validateModelOutput({ changes: [], uncertainty: 'cannot preserve the condition', abstain: true }), []);
});

test('validation rejects extra keys, missing fields, and abstain with text', () => {
  assert.deepEqual(validateModelOutput(valid), []);
  assert.ok(validateModelOutput({ ...valid, extra: true }).some((error) => error.includes('keys')));
  assert.ok(validateModelOutput({ ...valid, uncertainty: 1 }).some((error) => error.includes('uncertainty')));
  assert.ok(validateModelOutput({ ...valid, abstain: true }).some((error) => error.includes('abstain')));
});

test('simplifiedText joins sentences', () => {
  assert.equal(simplifiedText({ simplified: ['One.', 'Two.'] }), 'One. Two.');
  assert.equal(simplifiedText({}), '');
});
