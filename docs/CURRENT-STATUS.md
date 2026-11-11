# Current status

Snapshot date: **2026-11-11**. Baseline commit: **`ed0354d`** (P3.2 merged). This document is the authoritative current-status record; dated decision records and retrospectives remain historical.

## Current authorized phase

**Phase B: browser English simplification only, owner-authorized 2026-11-11.** No ASL gloss generation, no avatar feed, and no 3D-LEX/motion integration is authorized. P2.4 human review remains open and is not satisfied by Phase B.

Phase B was explicitly authorized by the owner on 2026-11-11 after Phase A merged. P2.4 remains **open**: Phase B does not review or validate P2, and its output must not be presented as ASL.

Phase C and P5 may begin only after explicit authorization and the relevant review gates.

## Baseline audit

| Area | State | Evidence / location |
|---|---|---|
| P0 static experiment | Implemented and tested | `experiments/html-to-asl/`, P0 tests, browser tests |
| P1 semantic HTML extraction | Implemented and tested | `src/extract.mjs`, 40 development fixtures, extraction and browser tests |
| P2.0 pins/schemas/fail-closed CLI | Implemented and tested | `tools/p2/`, `pins.json`, `artifact.schema.json` |
| P2.1–P2.2 lexical-plan artifacts | Implemented, **not linguistically validated** | 40 `partial` artifacts; 16 prose in scope, 24 structurally excluded |
| P2.3 reproducibility | Implemented and exercised | Python lock, image digests, source-run tool; clean-room run [42915233893](https://github.com/mgifford/html2sign-language/actions/runs/42915233893) matched 40/40 plan contents |
| P2.4 review | **In progress; gate not closed** | 1/16 owner source-alignment decisions; independent Deaf ASL review pending |
| P3 browser English simplification | **P3.1 and descriptive P3.2 implemented; P3.3 not run** | `p3/`, `P3-MODEL-CARD.md`, 70/80 valid runs, 16-fixture comparison, one Chrome 157 browser run |
| P4 direct/hybrid lexical planning | Proposed; not started | `P3-P4-RESEARCH.md`; P4 contract validator only in `tools/p3/` |
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

- P4 direct/hybrid lexical planning (only the P4.1 plan-contract validator exists).
- P3.3 human analysis; P3.2 descriptive comparison is implemented, not a quality evaluation.
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

Phase A and P3.1 verification executed on 2026-11-11 (macOS, Node 22, Playwright Chromium):

| Command | Result |
|---|---|
| `npm ci --cache /tmp/npm-cache` | 37 packages installed; default npm cache was not writable, so a temporary cache was used |
| `npm test` | 47/47 Node experiment tests + 3/3 public-page tests; 1 existing warning about missing `models/` |
| `npm run test:p2` | **45/45 pass** |
| `npm run test:p3` | **8/8 pass** |
| `npm run test:browser:experiment` | **pass**; P2 viewer, P3 page, review page, 320 px reflow, 0 console errors |
| `npm run test:avatar` | **8/8 pass** |
| Manual `p3-model.mjs` | **pass**; SmolLM2-1.7B q4f16, Chrome 157, WASM; valid `NEG-01` JSON output, critical `not` flagged for review |
| `npm run review:p2 -- --validate` | review record valid |

Known reproducibility evidence:

- P2 clean-room run: 40/40 plan contents matched.
- CI workflow runs Node, P2, P3/P4 contract, and Chromium browser tests.
- P2 review tests cover scope, missing review, attestation, and status transitions.
- Firefox and WebKit were not run; the browser suite is Chromium-only.

## Gates to Phase C and P5

The code path is not the current blocker. These are the decisions and reviews that must happen first.

| Gate | Current state | Required before proceeding |
|---|---|---|
| P2.4 owner source alignment | **1 of 16** prose fixtures accepted; 15 pending | Owner records `accepted` / `needs-discussion` / `rejected` for the remaining 15, with notes |
| Independent Deaf ASL review | **Agreed as a requirement; no reviewer identity, date, or decisions recorded** | A fluent Deaf ASL reviewer reviews the agreed sample (at least 20%; 100% before any public ASL claim) and records identity/date/decisions |
| P3.3 human analysis | **Not started** | Human review of P3 simplification meaning, uncertainty, and failures; no automatic “accuracy” score |
| Phase C / P4 direct and hybrid | **Blocked** | P2.4 and P3.3 addressed; independent review recorded; prompts/models/rules frozen; owner-approved prose holdout; preregistered comparison |
| P5 3D-LEX / avatar | **Blocked** | Phase C decision memo; 3D-LEX/ASL-LEX access, performer, and redistribution terms verified; reviewed ASL reference or human-translated units; Rocketbox/Three.js validation; independent Deaf ASL review; explicit owner authorization |

**Nothing in Phase C or P5 is waiting on a code fix or CI.** The tests and P3.2 comparison pass. The next required work is human review, an independent reviewer, and a licensing/access decision.

What can happen now:

1. Review the 16 prose lexical plans and record owner alignment decisions.
2. Run P3.3’s human semantic/uncertainty analysis.
3. Obtain the independent Deaf ASL review.
4. Decide whether/how to expand the prose corpus and prepare a reviewed holdout.
5. Clarify 3D-LEX/ASL-LEX access and performer terms for P5.

## P3.2 descriptive findings

- **70/80** Node/CPU model runs produced valid structured output; **14/16** fixtures had five valid runs. The separate Chrome/WASM run is recorded in `data/p3/NEG-01-browser.json`.
- **2/16** fixtures (`STRUCT-LINKS`, `IMG-DECOR`) produced zero valid runs; failures included invalid JSON and copying the prompt example. They are retained as failures.
- `NEG-01` simplified to “No fee.”; the mechanical check flagged `not` as missing, showing why token checks are not semantic validation.
- The comparison records original vs simplified P2 token counts and alignment. It does **not** measure ASL quality, semantic equivalence, or comprehension.
- P3.3 human analysis has not run.

## Outstanding human reviews

| Review | Scope | Status |
|---|---|---|
| Owner source alignment | 16 prose fixtures | **In progress: 1 accepted (`NEG-01`), 15 pending** |
| Structural fixtures | 24 fixtures | **`not-applicable`** for the prose review; retained for future structural research |
| Independent Deaf ASL review | Agreed sample of the 16; 100% before a public ASL claim | **Agreed; reviewer/date/decisions still pending** |
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
- **Independent reviewer:** agreed as a requirement; reviewer identity, date, and decisions are not recorded. The owner cannot self-attest.

## Next acceptance gate

**P3.3 human analysis and P2.4/independent review.** Phase C and P5 remain blocked until the gates above are closed. They must not start automatically.

## Related records

- [README](../README.md)
- [DECISIONS.md](DECISIONS.md)
- [P2 review packet](../experiments/html-to-asl/docs/P2-REVIEW.md)
- [P3/P4 research plan](../experiments/html-to-asl/docs/P3-P4-RESEARCH.md)
- [Avatar architecture](AVATAR-ARCHITECTURE.md)
- [Avatar audit](AVATAR-AUDIT.md)
- [Session handoff](SESSION-HANDOFF.md)
- [Public review page](../review.html)
