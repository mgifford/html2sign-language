// Pure helpers for the P3 English-simplification experiment.
// No model inference, no ASL glossing, no network access.

export const MODEL = {
  id: 'HuggingFaceTB/SmolLM2-1.7B-Instruct',
  revision: '31b70e2e869a7173562077fd711b654946d38674',
  license: 'Apache-2.0',
  file: 'onnx/model_q4f16.onnx',
  fileSha256: 'd94946187fb5f27579f3db4ba21fb7f7466c7cbd18956bd420d3981f75282f9c',
  fileBytes: 1108730338,
  tokenizerSha256: '9ca9acddb6525a194ec8ac7a87f24fbba7232a9a15ffa1af0c1224fcd888e47c',
  library: '@huggingface/transformers',
  libraryVersion: '4.3.2',
  dtype: 'q4f16',
  device: 'wasm',
  source: 'https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct',
};

export const MODEL_CDN = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.2/dist/transformers.min.js';

const CRITICAL_PATTERNS = [
  ['number', /\b\d+(?:[.,]\d+)?\b/g],
  ['money', /[$€£]\s?\d+(?:[.,]\d+)?/g],
  ['negation', /\b(?:not|no|never|unless|without|except|cannot)\b/gi],
  ['modality', /\b(?:must|may|can|should|required|shall|eligible|ineligible)\b/gi],
  ['month', /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\b/gi],
  ['date', /\b\d{4}-\d{2}-\d{2}\b/g],
];

export function criticalTokens(text) {
  const found = new Set();
  for (const [, pattern] of CRITICAL_PATTERNS) {
    for (const match of text.matchAll(pattern)) found.add(match[0]);
  }
  return [...found];
}

export function checkPreservation(original, simplified) {
  const critical = criticalTokens(original);
  const lower = simplified.toLocaleLowerCase('en');
  const missing = critical.filter((token) => !lower.includes(token.toLocaleLowerCase('en')));
  return {
    heuristic: true,
    critical,
    missing,
    passed: missing.length === 0,
    note: 'Mechanical token check only. It does not prove that actors, conditions, or meaning are preserved.',
  };
}

export function buildPrompt(text) {
  return [
    'You simplify English for accessibility. Preserve the author\'s meaning.',
    'Return only a JSON object with exactly these keys:',
    '{"simplified":["short sentence",...],"changes":[{"from":"...","to":"...","reason":"..."}],"uncertainty":"...","abstain":false}',
    'Rules:',
    '- Preserve negation, permission, obligation, conditions, exceptions, numbers, dates, quantities, names, and references.',
    '- Do not add facts, advice, or legal conclusions.',
    '- Do not produce ASL glosses or sign-language instructions.',
    '- If you cannot preserve the meaning, set "abstain": true and explain in "uncertainty".',
    '- Put the complete simplification in "simplified"; do not return commentary outside the JSON.',
    '',
    'Text to simplify:',
    text,
  ].join('\n');
}

export function buildMessages(text) {
  return [
    {
      role: 'system',
      content: 'You simplify English for accessibility. Respond in English only. Preserve meaning, negation, permission, obligation, conditions, exceptions, numbers, dates, names, and references. Return only valid JSON with keys simplified (string or array of strings), changes (always an array, [] if none), uncertainty (always a string, "" if none), abstain (true or false). Do not produce ASL glosses or sign instructions.',
    },
    {
      role: 'user',
      content: `Simplify this English text. Return only JSON, with no markdown or commentary. Use [] for changes if none; use "" for uncertainty if none. If simplified is present, abstain must be false.\n\nExample:\nText: You must apply by Friday.\nOutput: {"simplified":"Apply by Friday.","changes":[{"from":"You must apply","to":"Apply","reason":"plain wording"}],"uncertainty":"","abstain":false}\n\nText: ${text}`,
    },
  ];
}

export function parseModelJson(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return { ok: false, error: 'empty model response', raw: raw ?? '' };
  const fenced = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const start = fenced.indexOf('{');
  const end = fenced.lastIndexOf('}');
  if (start < 0 || end <= start) return { ok: false, error: 'no JSON object found', raw };
  try {
    return { ok: true, value: JSON.parse(fenced.slice(start, end + 1)), raw };
  } catch (error) {
    return { ok: false, error: `invalid JSON: ${error.message}`, raw };
  }
}

export function validateModelOutput(value) {
  const errors = [];
  if (!value || typeof value !== 'object' || Array.isArray(value)) return ['output must be an object'];
  const keys = Object.keys(value).sort();
  const abstains = value.abstain === true;
  const expected = abstains && !('simplified' in value)
    ? ['abstain', 'changes', 'uncertainty']
    : ['abstain', 'changes', 'simplified', 'uncertainty'];
  if (JSON.stringify(keys) !== JSON.stringify(expected)) {
    errors.push(`output keys must be exactly ${expected.join(', ')}`);
  }
  if (!('simplified' in value)) {
    if (value.abstain !== true) errors.push('simplified is required unless abstain is true');
  } else if (typeof value.simplified === 'string') {
    if (!value.simplified.trim()) errors.push('simplified string must not be empty');
  } else if (!Array.isArray(value.simplified) || value.simplified.some((item) => typeof item !== 'string')) {
    errors.push('simplified must be a string or an array of strings');
  }
  if (!Array.isArray(value.changes)) {
    errors.push('changes must be an array');
  } else {
    for (const [index, change] of value.changes.entries()) {
      if (!change || typeof change !== 'object' || Array.isArray(change)) {
        errors.push(`changes[${index}] must be an object`);
        continue;
      }
      for (const key of ['from', 'to', 'reason']) {
        if (typeof change[key] !== 'string') errors.push(`changes[${index}].${key} must be a string`);
      }
    }
  }
  if (typeof value.uncertainty !== 'string') errors.push('uncertainty must be a string');
  if (typeof value.abstain !== 'boolean') errors.push('abstain must be a boolean');
  if (value.abstain === true && simplifiedText(value).length > 0) {
    errors.push('abstain must not include simplified sentences');
  }
  return errors;
}

export function simplifiedText(value) {
  if (Array.isArray(value?.simplified)) return value.simplified.join(' ').trim();
  return typeof value?.simplified === 'string' ? value.simplified.trim() : '';
}

export async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
