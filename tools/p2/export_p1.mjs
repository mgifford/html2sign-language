// Export P1 extraction blocks for the P2 source/clean-room runs.
// Usage: node tools/p2/export_p1.mjs --output /tmp/p1-all.json

import { readFileSync, writeFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';
import { extractFromDocument } from '../../experiments/html-to-asl/src/extract.mjs';

const args = process.argv.slice(2);
const outputIndex = args.indexOf('--output');
if (outputIndex === -1 || !args[outputIndex + 1]) {
  console.error('usage: node tools/p2/export_p1.mjs --output <path>');
  process.exit(2);
}
const output = args[outputIndex + 1];
const manifest = JSON.parse(
  readFileSync(new URL('../../experiments/html-to-asl/fixtures/manifest.json', import.meta.url), 'utf8'),
);

const fixtures = [];
for (const fixture of manifest) {
  const { document } = parseHTML(`<!doctype html><html><body>${fixture.html}</body></html>`);
  const extraction = extractFromDocument(document);
  fixtures.push({
    fixtureId: fixture.id,
    blocks: extraction.blocks.map((block) => ({
      id: block.id,
      type: block.type,
      text: block.text,
      source: block.source,
    })),
  });
}
writeFileSync(output, `${JSON.stringify(fixtures, null, 2)}\n`);
console.log(`wrote ${fixtures.length} fixtures to ${output}`);
