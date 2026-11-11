# Current status

Snapshot date: **2026-11-11**. Baseline commit: **`623e7c2`**. This document is the authoritative current-status record; dated decision records and retrospectives remain historical.

## Current authorized phase

**Phase A only: documentation and review reconciliation.** No browser-AI inference, no new lexical arm, and no 3D-LEX/motion integration is authorized by this status.

Phase B may begin only after:

1. This Phase A change is reviewed and merged.
2. The P2 owner source-alignment gate is addressed.
3. The next phase is explicitly authorized.

## Baseline audit

| Area | State | Evidence / location |
|---|---|---|
| P0 static experiment | Implemented and tested | `experiments/html-to-asl/`, P0 tests, browser tests |
| P1 semantic HTML extraction | Implemented and tested | `src/extract.mjs`, 40 development fixtures, extraction and browser tests |
| P2.0 pins/schemas/fail-closed CLI | Implemented and tested | `tools/p2/`, `pins.json`, `artifact.schema.json` |
| P2.1–P2.2 lexical-plan artifacts | Implemented, **not linguistically validated** | 40 `partial` artifacts; 16 prose in scope, 24 structurally excluded |
| P2.3 reproducibility | Implemented and exercised | Python lock, image digests, source-run tool; clean-room run [42915233893](https://github.com/mgifford/html2sign-language/actions/runs/42915233893) matched 40/40 plan contents |
| P2.4 review | **In progress; gate not closed** | 1/16 owner source-alignment decisions; independent Deaf ASL review pending |
| P3/P4 browser-AI research | Proposed; not started | `experiments/html-to-asl/docs/P3-P4-RESEARCH.md`; P4 contract validator only in `tools/p3/` |
| P5/P6 3D-LEX and playback | Blocked | Requires P2.4, P3/P4 evidence, dataset licence, and independent Deaf ASL review |
| Fixed-sentence production route | Proposed; not built | `docs/PLAN-FIXED-SENTENCES.md` |
| Legacy 24-word public demo | Implemented; not validated | `index.html`, `app.js`, 24 WLASL word clips; no sentence/page translation |
| CI | Implemented | `.github/workflows/test.yml`; manual `.github/workflows/p2-cleanroom.yml` |
| Public status/review page | Implemented | `review.html`; linked from the main page |

### Implemented but not independently validated

- The 16 in-scope P2 lexical plans are research artifacts, not ASL.
- The 24 word clips have no independent Deaf ASL review.
- The P2 owner review is partial; the independent review is absent.
- The provisional 20-case holdout is not blind and is excluded from P2.

### Proposed, not implemented

- P3 browser simplification (no model, prompt, or run).
- P4 direct/hybrid lexical planning (only the P4.1 plan-contract validator exists).
- P5 3D-LEX mapping/motion integration.
- P6 avatar playback for reviewed signing.
- The production fixed-sentence route.

### Blocked

- Any claim of ASL translation, comprehension, or accessibility conformance.
- Any public avatar playback of P2/P3/P4 output.
- Any 3D-LEX asset import before access, performer, and licence confirmation.
- Any P5 work before P2.4 and P3/P4 decisions.

### Superseded or conflicting material

- The old “124 ASL words” and “biomechanically validated” claims were false; the page now reports 24 clips and limitations. Historical audit: `docs/AVATAR-AUDIT.md`.
- `AGENTS.md` still carries historical VRM/SMPL-X guidance; a dated current-architecture section points to `docs/AVATAR-ARCHITECTURE.md` and the Rocketbox decision.
- `status.html` is an old technical status page, not the current review guide.
- Older documents that describe all 40 artifacts as owner-review items conflict with `scope.json`; the scoped review record is authoritative.

## Capabilities

- Semantic HTML extraction with source paths/spans: headings, paragraphs, lists, links, tables, forms, ARIA, alt text, limitations.
- 40 development fixtures and a provisional 20-case holdout.
- 40 precomputed lexical-plan artifacts; all `partial` because upstream reports `semantic-rules-unavailable`.
- Static P2 viewer.
- 16 prose fixtures in scope for lexical-plan evaluation; 24 structural fixtures retained but `not-applicable`.
- Review CLI with scope filtering, owner/independent separation, and an independent-reviewer attestation.
- Image-pinned clean-room reproduction of plan content.
- Public page that distinguishes the 24-word demo from sentence/page translation.

## Tests and reproducibility evidence

Run locally and report the actual results in the Phase A PR:

```bash
npm ci
npm test
npm run test:p2
npm run test:p3
npm run test:browser:experiment
npm run test:avatar
```

Phase A verification executed on 2026-11-11 (macOS, Node 22, Playwright Chromium):

| Command | Result |
|---|---|
| `npm ci --cache /tmp/npm-cache` | 37 packages installed; default npm cache was not writable, so a temporary cache was used |
| `npm test` | 35/35 Node experiment tests + 2/2 public-page tests; 1 existing warning about missing `models/` |
| `npm run test:p2` | **45/45 pass** |
| `npm run test:p3` | **6/6 pass** |
| `npm run test:browser:experiment` | **pass**; P2 viewer, review page, 320 px reflow, 0 console errors |
| `npm run test:avatar` | **8/8 pass** |
| `npm run review:p2 -- --validate` | review record valid |

Known reproducibility evidence:

- P2 clean-room run: 40/40 plan contents matched.
- CI workflow runs Node, P2, P3/P4 contract, and Chromium browser tests.
- P2 review tests cover scope, missing review, attestation, and status transitions.
- Firefox and WebKit were not run; the browser suite is Chromium-only.

## Outstanding human reviews

| Review | Scope | Status |
|---|---|---|
| Owner source alignment | 16 prose fixtures | **In progress: 1 accepted (`NEG-01`), 15 pending** |
| Structural fixtures | 24 fixtures | **`not-applicable`** for the prose review; retained for future structural research |
| Independent Deaf ASL review | Agreed sample of the 16; 100% before a public ASL claim | **Pending** |
| 24-word clip review | 24 clips | **Not performed** |

No automated flag, model output, or coding agent substitutes for these reviews.

## Known limitations

- The 40 plans are lexical plans, not ASL; nonmanual markers, spatial grammar, classifiers, role shift, and aspect are absent.
- Only 16 single-block prose fixtures are in scope; structural HTML is not solved.
- The public demo has 24 isolated word clips; 316 metadata entries mostly lack animation files.
- The P2 artifacts use a source-run/model snapshot; the image-pinned clean-room run matched plan content, not linguistic quality.
- The holdout is provisional and not blind.
- No sentence-to-sign or page-to-sign pipeline exists.

## Open decisions

- **D3 — code licence:** root `LICENSE.txt` is AGPL-3.0; `package.json` says `ISC`. This conflict is unresolved. No licence change is made here; do not guess AGPL-3.0-only vs `-or-later`.
- **D4 — avatar architecture:** historical AGENTS guidance conflicts with the Rocketbox selection. The current architecture is documented in `docs/AVATAR-ARCHITECTURE.md`; the runtime is unchanged.
- **D5 — third-party data:** 3D-LEX/ASL-LEX access, performer rights, and redistribution terms remain unresolved.
- **D11 — scope:** 16 prose fixtures are in scope; 24 structural fixtures are excluded from P2/P3/P4 and retained for a separate structural study.
- **Independent reviewer:** a fluent Deaf ASL reviewer must be engaged; the owner cannot self-attest.

## Next acceptance gate

**Phase A review and merge.** After that, the next blocking gate is the complete owner source-alignment review of the 16 prose fixtures plus an independent Deaf ASL review plan. Phase B must not start automatically.

## Related records

- [README](../README.md)
- [DECISIONS.md](DECISIONS.md)
- [P2 review packet](../experiments/html-to-asl/docs/P2-REVIEW.md)
- [P3/P4 research plan](../experiments/html-to-asl/docs/P3-P4-RESEARCH.md)
- [Avatar architecture](AVATAR-ARCHITECTURE.md)
- [Avatar audit](AVATAR-AUDIT.md)
- [Session handoff](SESSION-HANDOFF.md)
- [Public review page](../review.html)
