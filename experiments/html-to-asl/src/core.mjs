// English surface analysis only. Never interpret output as ASL.

export const RULES = Object.freeze([
  { kind: 'negation', pattern: /\b(?:not|never|no)\b/gi },
  { kind: 'obligation', pattern: /\b(?:must|required|shall)\b/gi },
  { kind: 'permission', pattern: /\b(?:may|can|allowed)\b/gi },
  { kind: 'exception', pattern: /\b(?:unless|except|extension)\b/gi },
  { kind: 'deadline', pattern: /\b(?:before|after|within|by)\b/gi },
  { kind: 'reference', pattern: /\b(?:she|he|they|it|its|their)\b/gi },
]);

// These are surface cues, not semantic role labels. "May" can be a month,
// "can" can be a noun, and "by" can introduce an agent. Every marker is
// therefore marked as an unreviewed cue, not an interpretation.
export function markEnglishConcepts(blocks) {
  const found = [];
  for (const block of blocks) {
    for (const rule of RULES) {
      const re = new RegExp(rule.pattern.source, rule.pattern.flags);
      for (const match of block.text.matchAll(re)) {
        found.push({
          kind: rule.kind,
          term: match[0],
          blockId: block.id,
          start: match.index,
          end: match.index + match[0].length,
          interpretation: 'surface-cue-only',
          reviewStatus: 'unreviewed',
        });
      }
    }
  }
  return found;
}

// P0/P1 smoke test only: checks that an expected string occurs inside one
// extracted block. It is not a semantic, coreference, table, form or link
// check. Checking within one block avoids matching a phrase that is split
// across unrelated blocks.
export function checkExpectedTokens(blocks, terms = []) {
  const texts = blocks.map((block) => block.text.toLowerCase());
  const list = Array.isArray(terms) ? terms : [];
  return list.map((term) => {
    const needle = String(term).toLowerCase();
    return { term, preserved: texts.some((text) => text.includes(needle)) };
  });
}

function structureSummary(blocks) {
  const counts = {};
  let links = 0;
  let images = 0;
  for (const block of blocks) {
    counts[block.type] = (counts[block.type] || 0) + 1;
    links += block.links?.length || 0;
    images += block.images?.length || 0;
  }
  return {
    counts,
    headings: blocks.filter((block) => block.type === 'heading').length,
    lists: blocks.filter((block) => block.type === 'list-item').length,
    tables: blocks.filter((block) => block.type === 'table').length,
    fields: blocks.filter((block) => block.type === 'field').length,
    links,
    images,
  };
}

export function createBaseline(fixture, extraction) {
  const blocks = Array.isArray(extraction) ? extraction : extraction?.blocks || [];
  const extractionLimitations = Array.isArray(extraction?.limitations) ? extraction.limitations : [];
  const sourceTextLength = Number.isInteger(extraction?.sourceTextLength)
    ? extraction.sourceTextLength
    : blocks.reduce((total, block) => total + block.text.length + 1, 0);

  const expected = Array.isArray(fixture.expectedTokens) ? fixture.expectedTokens : [];
  const checks = checkExpectedTokens(blocks, expected);
  const passed = checks.filter((check) => check.preserved).length;
  const failed = checks.length - passed;

  const warnings = [
    'This is NOT an ASL translation.',
    'No ASL lexicon or grammar engine is integrated.',
    'Surface cues are lexical matches, not semantic roles.',
    'Token presence is not semantic validation.',
  ];
  if (failed > 0) {
    const missing = checks.filter((check) => !check.preserved).map((check) => check.term);
    warnings.push(`Expected token(s) not found: ${missing.join(', ')}.`);
  }
  if (extractionLimitations.length) {
    warnings.push(`${extractionLimitations.length} extraction limitation(s); see limitations.`);
  }

  return {
    schemaVersion: '0.3.0',
    fixtureId: fixture.id,
    arm: 'A-prebaseline',
    sourceLanguage: 'en',
    targetLanguage: null,
    plannedTargetLanguage: 'ase',
    translation: false,
    status: 'english-analysis-only',
    checkStatus: failed > 0 ? 'token-presence-failed' : 'token-presence-passed',
    checkMethod: 'substring-presence-within-block',
    blocks,
    structures: structureSummary(blocks),
    sourceTextLength,
    englishConceptMarkers: markEnglishConcepts(blocks),
    markerMethod: 'regex-surface-cues',
    checks,
    checksSummary: { total: checks.length, passed, failed },
    lexicalCandidates: [],
    warnings,
    limitations: [
      'Token presence is not semantic validation.',
      'P1 preserves structure metadata but does not validate meaning, coreference, or ASL equivalence.',
      ...extractionLimitations.map((item) => {
        const detail = item.detail ? ` (${item.detail})` : '';
        return `${item.code}: ${item.path}${detail}`;
      }),
    ],
    provenance: {
      source: 'original synthetic fixture',
      engine: 'local deterministic regex + block-aware DOM extraction',
      datasetAssetsBundled: false,
    },
  };
}
