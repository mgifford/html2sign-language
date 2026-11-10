# P2 proposal: pinned, offline English → ASL lexical-plan adapter

Status: **P2.0, P2.1, and P2.2 source-run artifacts/viewer are implemented; owner alignment review and pinned CPU image digests are still open (P2.3).** This document is the issue-ready design and acceptance criteria for P2. No upstream code, model weights, WSD outputs, or ASL content are added.

## 1. Goal

Turn a P1 extraction result into a **precomputed, auditable lexical plan** using the upstream [`spoken-to-signed-translation`](https://github.com/sign-language-processing/spoken-to-signed-translation) English → ASL rules, then serve that JSON from GitHub Pages without Python, a model, or a network call at runtime.

The output is a **lexical plan**, not fluent ASL. It does not include classifiers, spatial agreement, role shift, nonmanual markers, or lexical aspect. Those remain downstream realization work and must be labelled as missing.

**In scope**

- A local/CI precompute pipeline with pinned upstream code, WSD model, WordNet, and spaCy versions.
- A JSON contract that preserves source alignment, upstream `changes`, `notes`, unmatched tokens, and abstentions.
- A static viewer for a fixed set of P1 development fixtures.
- Reproducibility checks: commit pins, input/output hashes, schema validation.

**Out of scope**

- Python or a model at runtime on GitHub Pages.
- User-typed free text.
- Any NMT/GPT glosser, LLM, or hosted API as a default.
- Signing, avatar playback, 3D-LEX motion, or pose generation.
- Claims of fluent ASL, native-ASL correctness, or accessibility conformance.
- The 20 provisional holdout cases; P2 runs on development fixtures only.

## 1.1 P2.0 implementation status

P2.0 is implemented in `tools/p2/`:

- `pins.json` records the approved WSD/upstream/spaCy/WordNet/artifact pins; the CPU image digests remain open.
- `artifact.schema.json`, `index.schema.json`, and `pins.schema.json` define the contracts.
- `precompute.py --check` validates pins/schemas/fixture counts without importing the model stack.
- `precompute.py --fixture … --output …` refuses with exit 2 and writes nothing while prerequisites are missing; it also refuses holdout and unknown fixture IDs.
- `validate.py` and 19 stdlib `unittest` cases cover the contracts, all 40 artifacts, and refusal paths.
- `experiments/html-to-asl/data/p2/` contains **40 partial P2.2 artifacts** generated from the pinned rules and a local WSD model snapshot. All candidates align to P1 blocks; upstream reports `semantic-rules-unavailable`, and owner review is pending.
- `experiments/html-to-asl/p2/` is the static viewer for the index and artifacts.

The system default is Python 3.14 with no model stack. A temporary Python 3.12 environment has verified spaCy 3.8.16, `en_core_web_lg` 3.8.0, and the pinned `senses_to_gloss` import. See `tools/p2/README.md` for the approval checklist. P2.3 still needs pinned CPU image digests for WSD and `sign/wn`.

## 2. Upstream facts to pin

Verified from the upstream repository on 2026-11-10:

| Item | Value |
|---|---|
| Repository | `sign-language-processing/spoken-to-signed-translation` |
| Code licence | **MIT** (GitHub API repository metadata) |
| Commit to pin | `fec7ac393989f4b6541ab5f860819262a54f27c7` (`feat(asl): lower selected WSD senses through guarded transformations (#96)`, 2026-10-18) |
| Public ASL entry point | `spoken_to_signed.text_to_gloss.senses.senses_to_gloss(document, semantics=...)` |
| HTTP equivalent | `POST /senses-to-gloss` with a WSD document |
| Input | WSD JSON: `tokens` with `word`, `lemma`, `pos`, `dep`, `head`, `ent_iob`, `ent_type`, senses/entities, authoritative `sentences` |
| Output | Ordered `sentences`, `indexes`, `changes`, `notes`; candidates retain original inclusive token spans, morphology, and source annotations |
| Known upstream limits | Rules are an ordering/omission experiment, not a complete translator; no nonmanuals; conservative fallbacks for complex clauses; entity/WSD errors remain possible |

Upstream evaluation documents the WSD revision `8751b577199d1bb95b74fa2457da7065d57100ae` (`sign/Ettin-150m-WSD`) and spaCy 3.8.16 with `en_core_web_lg` 3.8.0. This project approves the WSD model/code, spaCy, and OMW English 1.4 (Princeton WordNet License) pins. The remaining implementation condition is exact CPU image digests and hashes.

References: [upstream README](https://github.com/sign-language-processing/spoken-to-signed-translation), [ASL rules and evaluation](https://github.com/sign-language-processing/spoken-to-signed-translation/blob/main/evaluation/asl/README.md), [paper](https://arxiv.org/abs/2305.17714).

## 3. Architecture

```
P1 extraction JSON (blocks, source IDs/paths/text spans)
  -> local sentence/WSD preparation
     - pinned spaCy model
     - pinned WSD model/service revision
     - pinned WordNet/OMW resources
  -> pinned spoken-to-signed-translation: senses_to_gloss()
  -> adapter: align candidates and indexes to P1 source spans
  -> schema + hash validation
  -> precomputed p2/<fixtureId>.json in the repository
  -> GitHub Pages viewer (static JSON; no Python, no model, no network)
```

The precompute tool runs **outside Pages**, in a pinned local environment or CI job. The Pages artifact contains only JSON and the existing static viewer code.

## 4. Data contract (draft `p2.0`)

One file per fixture, plus an index:

```
experiments/html-to-asl/data/p2/
  index.json
  NEG-01.json
  STRUCT-TABLE.json
  ...
```

Sketch:

```json
{
  "schemaVersion": "p2.0",
  "fixtureId": "STRUCT-TABLE",
  "source": {
    "p1SchemaVersion": "0.3.0",
    "inputSha256": "…",
    "blocks": [{ "id": "b0001", "path": "main > table:nth-of-type(1)", "textStart": 0, "textEnd": 23 }]
  },
  "upstream": {
    "repository": "sign-language-processing/spoken-to-signed-translation",
    "commit": "fec7ac393989f4b6541ab5f860819262a54f27c7",
    "license": "MIT",
    "wsdModel": "sign/Ettin-150m-WSD",
    "wsdRevision": "…",
    "wordnet": "…",
    "spacyModel": "en_core_web_lg@3.8.0 (spaCy 3.8.16)"
  },
  "language": { "spoken": "en", "signed": "ase" },
  "plan": {
    "sentences": [
      {
        "tokens": [{ "word": "…", "lemma": "…", "pos": "…", "dep": "…", "head": 1, "sourceStart": 0, "sourceEnd": 3 }],
        "indexes": [[0]],
        "changes": [{ "rule": "…", "tokenIndexes": [0] }],
        "notes": ["…"]
      }
    ]
  },
  "alignment": [
    { "candidateIndex": 0, "blockId": "b0001", "sourceStart": 0, "sourceEnd": 3 }
  ],
  "status": "complete",
  "abstentions": [],
  "warnings": ["Lexical plan only; nonmanuals and spatial grammar are not represented."],
  "hashes": { "inputSha256": "…", "outputSha256": "…" }
}
```

Rules:

- `status` is `complete`, `partial`, or `failed`; a failed precompute never produces a blank successful file.
- Every output candidate must reference a P1 `blockId` and a text-stream span, or appear in `abstentions`.
- Unknown/OOV words keep their source form and an `unmatched` marker; they are never replaced with an invented gloss.
- `changes` and `notes` are copied from upstream, not paraphrased.
- `warnings` state that this is not ASL and list missing channels (nonmanuals, spatial grammar, aspect).
- Hashes cover the canonical JSON input and output; no volatile timestamp is inside the hashed payload.

## 5. Precompute pipeline

A single command, run from the repository root:

```sh
python tools/p2/precompute.py --fixture STRUCT-TABLE --output experiments/html-to-asl/data/p2/
```

It must:

1. Read the P1 development manifest and the selected fixture only.
2. Produce a WSD document with the pinned syntactic/WSD stack. Fail closed if the WSD service, model revision, or WordNet resource is unavailable.
3. Call the pinned `senses_to_gloss` code; no NMT/GPT path.
4. Align candidates back to P1 blocks and spans.
5. Validate the JSON schema and hashes.
6. Write one artifact atomically, then update `index.json`.

The tool is **not** shipped to Pages. A `tools/p2/README.md` will document the Python version, dependency lock, model download/placement, environment variables, and the exact upstream commit.

## 6. Pages viewer

- A new static route or panel, for example `experiments/html-to-asl/p2/`, loaded from committed JSON.
- Shows: source block, ordered candidate words, upstream `changes`, `notes`, unmatched tokens, and warnings.
- Clearly labels the output: **“Lexical plan only — not ASL. Nonmanuals and spatial grammar are missing.”**
- Does not send data to the avatar, does not call an API, does not load a model.
- No free-text input in P2; only the fixed fixture list.
- Works with JavaScript disabled? At minimum a static explanatory page; the plan panel is JS-rendered like the current dashboard.

## 7. Failure and abstention behaviour

| Condition | Behaviour |
|---|---|
| WSD model or WordNet unavailable | `status: failed`, error shown, no output file published |
| Upstream commit/version mismatch | refuse to run; report expected vs actual |
| Malformed sentence/dependency tree | fail that fixture; preserve the error; do not guess |
| OOV word | retain source token, mark `unmatched`, no invented gloss |
| Entity/sense ambiguity | preserve source token/entity; add a warning; no silent substitution |
| Complex clause not handled by upstream rules | keep conservative source order; copy upstream `notes` |
| Empty input | `status: failed` with an explicit reason |
| Holdout fixture requested | refuse in P2; holdout is not part of this phase |

## 8. Security, privacy, and licences

- Runtime is static: no Python, no server, no hosted model, no external API call.
- Precompute runs on synthetic fixtures only; no user text, no PII.
- Upstream code is MIT; model weights and WordNet resources have separate terms. Do not commit weights or restricted data.
- Record the WSD model licence, WordNet/OMW licence, spaCy model licence, and upstream commit in `data/p2/index.json` and `docs/UPSTREAM.md`.
- No 3D-LEX data or motion is involved in P2.
- Do not publish an artifact until its inputs and upstream code are licence-reviewed.

## 9. Acceptance criteria

P2 is complete only when all of the following hold:

1. The upstream commit, WSD revision, WordNet version, spaCy model, and Python/dependency lock are recorded and verified.
2. A clean-environment run reproduces the committed artifacts byte-for-byte, or the report explains every non-deterministic field.
3. Every artifact validates against the `p2.0` schema and carries input/output hashes.
4. Every output candidate maps to a P1 `blockId` and source span, or is listed in `abstentions` with a reason.
5. OOV, entity ambiguity, and complex-clause cases are visible; no invented gloss fills a gap.
6. The Pages route loads with no Python, no network request, and no model; it works when served from the repository root and from a subpath.
7. The UI states “lexical plan, not ASL” and lists missing nonmanual/spatial channels.
8. Failure modes are tested: missing model, version mismatch, malformed WSD, empty input, holdout request.
9. Tests cover schema, hashes, alignment, abstentions, and static loading; Firefox/WebKit claims are made only after those browsers run.
10. No ASL fluency, native-ASL correctness, or accessibility-conformance claim is made without independent Deaf ASL review.

## 10. Evaluation

Report separately:

- source alignment coverage (candidates mapped to P1 spans);
- abstention rate and reasons;
- upstream `changes` applied;
- missing-channel notes (nonmanuals, spatial grammar, aspect);
- deterministic reproduction;
- browser/static-loading results.

Do not use a single “accuracy” score. A passing fixture set is an engineering regression, not an ASL quality measure.

## 11. Milestones

| Milestone | Deliverable |
|---|---|
| P2.0 | **Implemented:** schema, fixture selection, licence/pin record, fail-closed CLI; no model output |
| P2.1 | **Prototype delivered (pending review):** `NEG-01` local WSD → `senses_to_gloss` → aligned JSON; image-pinned reproducibility and `MOD-01` still open |
| P2.2 | **Implemented (source-run):** all 40 development fixtures precomputed; static viewer at `p2/` |
| P2.3 | Reproducibility, failure tests, browser tests, docs |
| P2.4 | Owner/Deaf-review decision before any public ASL claim |

## 12. Decisions (recorded 2026-11-10)

1. **WSD stack — approved, local only.** Use `sign/Ettin-150m-WSD` at revision `8751b577199d1bb95b74fa2457da7065d57100ae` (Apache-2.0), served by `sign/word-sense-disambiguation` at `da5d67fe731c771b0a2126a25a57e71a33ff5a81` (MIT), with `sign/wn` at `2d0e81362599062ba185f774b08a76e226bf1415` (MIT). Pin the CPU image digest and record `MODEL_VERSION`/`X-Model-Tag`. No hosted model or external API.
2. **Artifacts — commit JSON.** Commit per-fixture `p2.0` JSON for the 40 development fixtures, generated by the documented command and validated by schema/hash tests. Do not commit model weights, caches, or bulk WSD output.
3. **WSD intermediates — not committed.** Keep bulk WSD output in local/CI audit artifacts. A small hand-authored WSD test fixture may be committed only if it is needed for the adapter contract and is labelled as such.
4. **WordNet — OMW English 1.4, local — approved.** Use `omw-en:1.4` through the pinned `sign/wn` API; no hosted `WORDNET_URL`. The `wn` index lists the OMW English 3.0 export under the [Princeton WordNet License](https://wordnet.princeton.edu/license-and-commercial-use). The remaining condition is the CPU image digest.
5. **Fixture scope — development only.** Use the 40 development fixtures for P2.1/P2.2. The current 20-case holdout is agent-authored and not blind; it is excluded from P2 and must be replaced or reviewed by the owner before any evaluation claim.
6. **Rule limits — research only.** The upstream output is a lexical plan, not ASL. No avatar feed, no public translation/accessibility claim, and no claim covering nonmanuals, spatial grammar, classifiers, role shift, or aspect. P2.4 Deaf ASL review is required before any linguistic claim. Human-translated fixed sentences remain the production route.
7. **Alignment review — owner plus independent reviewer.** Deterministic exact-span alignment first; unresolved or cross-block candidates become abstentions. The owner reviews the 40 development artifacts; an independent reviewer samples at least 20% and reviews 100% before a public claim. Record reviewer, date, fixture, candidate, decision, and reason in `data/p2/review.json`. The implementer must not self-approve.

### 12.1 Remaining blockers for P2.3

- [x] Record the OMW English 3.0 licence as the Princeton WordNet License and set `wordnet.approved: true`.
- [x] Create a Python 3.12 environment and verify spaCy 3.8.16 / `en_core_web_lg` 3.8.0 and the pinned `senses_to_gloss` import (temporary venv, not committed).
- [ ] Pin CPU image digests for WSD and `sign/wn`, and record them in `pins.json`.
- [ ] Pin the spaCy entity-linker knowledge base used by the WSD service.
- [ ] Run `python3 tools/p2/precompute.py --check` with `ready: true`.
- [x] Produce all 40 development artifacts with candidates aligned to P1 blocks.
- [x] Add the static P2 viewer and browser coverage.
- [ ] Owner review of the 40 alignment records; image-pinned reproducibility.

## 13. References

- [Upstream repository](https://github.com/sign-language-processing/spoken-to-signed-translation) (MIT)
- [ASL lexical-plan rules and limits](https://github.com/sign-language-processing/spoken-to-signed-translation/blob/main/evaluation/asl/README.md)
- [An Open-Source Gloss-Based Baseline for Spoken to Signed Language Translation](https://arxiv.org/abs/2305.17714)
- P1 extractor: `src/extract.mjs`; P1 data contract: `src/core.mjs`
- Project decisions: [DECISIONS.md](../../../docs/DECISIONS.md)
