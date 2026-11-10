# Small, sequential GitHub Pages phases

Each phase must be independently runnable and should be reviewed before advancing. P0 is delivered; P1 is implemented with a provisional holdout; later phases are specifications only.

| Phase | Deliverable | Exit gate |
|---|---|---|
| P0 | Static Pages viewer, 12 synthetic HTML fixtures, English-only deterministic surface cues, JSON export | `node --test "tests/*.test.mjs"` passes; `node tests/browser.mjs` passes in Chromium; viewer works via static server; B–D clearly not implemented |
| P1 | 40 development + 20 provisional holdout fixtures; block-aware extraction with source IDs/paths/text spans; headings, lists, links, tables, forms, ARIA, alt; security and Unicode tests; Playwright | Extraction tests pass; structural relationships are covered; the holdout is owner-reviewed or replaced before being used as a blind evaluation set |
| P2 | Pinned, offline precomputed upstream ASL lexical-plan adapter; see the [P2 proposal](P2-ADAPTER.md) | Proposal accepted; pinned commit, WSD model, WordNet, spaCy and licences recorded; schema/hashes validated; no runtime Python/model; missing input produces error/abstention, not synthetic gloss |
| P3 | Browser AI simplification (B), one pinned model and exact prompt/weights hash | AI output never deployed as signed content; enforce invariant checks and record failed outputs; record device runtime |
| P4 | Direct AI (C) and hybrid (D), compare 4 arms with paired metrics; five runs for AI arms | Publish all runs, failures, model provenance, lexical coverage vs errors separately; freeze holdout set |
| P5 | 3D-LEX metadata importer and independently sourced reviewed ASL test items | Dataset access and specific asset licences verified; sample transforms reproducible; Deaf ASL reviewers engaged before signing claim |
| P6 | Optional separately approved browser avatar playback | Only reviewed licensed signing content exposed publicly; independent linguistic and UX validation |

## Pages deployment

The experiment lives at `experiments/html-to-asl/` and is served as a static subpath of the existing GitHub Pages site, linked from the main page footer. Relative asset references support subpaths. No GitHub Actions or external services are required for P0. If Pages deploys a different directory, make sure the experiment directory is included in the published artifacts; verify the deployed route rather than assuming it.

## Blockers and decisions

- No ASL lexicon, grammar or pose data is bundled in P0. This is intentional.
- A GitHub Pages website **cannot execute a Python ASL pipeline server-side**. Future P2 precomputes artifacts in CI/local development and publishes them as JSON, or uses a separately hosted API subject to explicit scope decision.
- P1 extracts table, form, link, and ARIA structure, but this is not semantic validation; P2/P5 must not treat extraction as meaning preservation.
- Decide whether to publish full-page source text only when source licences permit.
- Agree human review method and funding before labeling any candidate as ASL.
