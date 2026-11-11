# P2 tooling

Status: **P2.0 scaffold plus 40 partial P2.2 source-run artifacts, a static viewer, P2.3 pins/lock/source-run tool, and a prose-only P2/P3/P4 scope.** The CLI still refuses to write until the image-pinned path is implemented. CPU image digests, the entity-linker hash, and the Python lock are recorded; owner alignment review and a clean-room run remain open.

## Commands

From the repository root:

```sh
python3 tools/p2/precompute.py --check
python3 tools/p2/review.py --list
python3 -m unittest discover -s tools/p2/tests -p 'test_*.py'
```

`--check` validates `pins.json`, the schema files, and the fixture counts, then reports readiness. It does not import the model stack.

A precompute attempt is expected to refuse in P2.0:

```sh
python3 tools/p2/precompute.py --fixture STRUCT-TABLE --output experiments/html-to-asl/data/p2
# exit 2; no output written
```

It also refuses holdout fixtures and unknown fixture IDs.

## What is pinned

`pins.json` records:

- upstream repository, commit, licence, and entry point;
- required Python range;
- WSD model/revision/licence plus the WSD code commit and serving note;
- WordNet version/source/licence plus the WordNet API commit;
- spaCy model/version/licence;
- artifact publication mode.

Approved on 2026-11-10: upstream, WSD model/code, spaCy, and the committed-JSON artifact policy. Still open: pinned CPU image digests. The OMW English 3.0 licence (Princeton WordNet License) and the Python 3.12 import path are verified.

## Approval checklist

Before setting any `approved` flag to `true`, record and verify:

1. [done] The exact upstream commit and MIT licence.
2. [done] The WSD model revision `8751b57…` (Apache-2.0) and WSD/WordNet API commits (MIT).
3. [done] The OMW English 3.0 licence is recorded as the Princeton WordNet License; the CPU image digest is still open.
4. [done] A Python 3.12 environment with spaCy 3.8.16, `en_core_web_lg` 3.8.0, and the pinned upstream `senses_to_gloss` import verified. A committed lock file is still needed.
5. [done] The artifact policy: commit per-fixture JSON; no WSD intermediates.
6. [done] Owner acceptance of the rule limits (lexical plan only; no nonmanuals or spatial grammar).
7. [done] Owner plus independent reviewer for P1-block → upstream-sentence alignment.
8. [done] The provisional holdout stays excluded from P2.

The image-pinned clean-room run passed with 40/40 plan matches. The remaining blocker is the owner/independent review (`data/p2/review.json` is pending). `--check` reports `ready: true` in the verified Python 3.12 environment.

## Files

- `pins.json` / `pins.schema.json` — candidate pins and their contract.
- `artifact.schema.json` — per-fixture `p2.0` artifact contract.
- `review.schema.json` — P2.4 owner/independent review contract.
- `index.schema.json` — static index contract.
- `precompute.py` — fail-closed CLI.
- `validate.py` — dependency-free checks used by tests.
- `requirements.lock` — Python 3.12 dependency freeze; platform-specific.
- `source_run.py` — explicit research-only source-run reproducer; not the image-pinned path.
- `export_p1.mjs` / `compare_plans.py` — P1 export and clean-room plan comparison used by `.github/workflows/p2-cleanroom.yml`.
- `review.py` — records owner/independent review decisions in `review.json`; it cannot perform a review.
- `qa_report.py` — advisory technical risk flags for review; not decisions.
- `tests/` — 33 unit tests, including all 40 artifacts, the pending review record, review CLI/scope guard, QA report, plan comparison, refusal, and holdout cases.

No model weights, WSD intermediates, generated glosses, or 3D-LEX assets belong in this directory.
