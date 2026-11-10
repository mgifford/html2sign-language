# Provisional holdout

`holdout.json` currently contains **20 synthetic cases** that were authored in the same pass as the 40 development fixtures. They are **not a blind holdout**: the implementing agent has seen them while building the extractor.

## Status

- The application loads only `manifest.json` (40 development fixtures).
- The Node and browser tests run only the development manifest.
- The holdout file is checked for shape, unique IDs, and disjointness from development, but its content is not used during extractor iteration.

## Owner actions before treating it as a holdout

1. Replace or rewrite the 20 cases with cases the implementing agent has not seen.
2. Keep the file out of prompt context and out of the development loop.
3. Freeze the file before evaluating a change; record its hash in the evaluation report.
4. After a freeze, do not edit it to make a result pass. Any change requires a new freeze and a new report.

## Coverage to keep

- English negation, modality, exceptions, deadline, quantity, and ambiguity.
- Headings, nested and ordered lists, description lists.
- Links with and without visible text; `href` preservation.
- Tables with column headers, row headers, captions, and missing header cells.
- Forms with explicit and wrapping labels, required state, `aria-describedby`, selects, checkboxes, and radio groups.
- `aria-label` / `aria-labelledby` regions and icon-only controls.
- Meaningful, decorative, and missing image alternatives.
- Hidden content, closed `<details>`, blockquotes, code blocks, and bare containers.
- Unicode (including RTL), HTML entities, and script/event-handler injection attempts.

## Evaluation

- Use the criteria in `../docs/PROTOCOL.md`.
- Report token presence separately from structural preservation and from ASL linguistic review.
- Keep the 40/20 split: do not tune against holdout results.
- A passing holdout run is a developer-testing claim, not a linguistic or accessibility-conformance claim.
