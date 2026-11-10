# P2 tooling

Status: **P2.0 scaffold.** It validates pins and refuses to write a lexical plan until every prerequisite is approved and installed. It does not run upstream, a WSD model, WordNet, or spaCy. The WSD model/code pins are approved; the OMW data licence and CPU image digests are still open. A Python 3.12 import check is complete in a temporary environment.

## Commands

From the repository root:

```sh
python3 tools/p2/precompute.py --check
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

Approved on 2026-11-10: upstream, WSD model/code, spaCy, and the committed-JSON artifact policy. Still open: the explicit OMW English 3.0 data licence and pinned CPU image digests. The Python 3.12 import path is verified in a temporary environment.

## Approval checklist

Before setting any `approved` flag to `true`, record and verify:

1. [done] The exact upstream commit and MIT licence.
2. [done] The WSD model revision `8751b57…` (Apache-2.0) and WSD/WordNet API commits (MIT).
3. [open] The OMW English 3.0 data licence and its exact resource hash.
4. [done] A Python 3.12 environment with spaCy 3.8.16, `en_core_web_lg` 3.8.0, and the pinned upstream `senses_to_gloss` import verified. A committed lock file is still needed.
5. [done] The artifact policy: commit per-fixture JSON; no WSD intermediates.
6. [done] Owner acceptance of the rule limits (lexical plan only; no nonmanuals or spatial grammar).
7. [done] Owner plus independent reviewer for P1-block → upstream-sentence alignment.
8. [done] The provisional holdout stays excluded from P2.

The remaining blockers are the OMW data licence and pinned CPU image digests for WSD and `sign/wn`. Run `--check` and confirm `ready: true` before P2.1.

## Files

- `pins.json` / `pins.schema.json` — candidate pins and their contract.
- `artifact.schema.json` — per-fixture `p2.0` artifact contract.
- `index.schema.json` — static index contract.
- `precompute.py` — fail-closed CLI.
- `validate.py` — dependency-free checks used by tests.
- `tests/` — 14 unit tests, including refusal and holdout cases.

No model weights, WSD intermediates, generated glosses, or 3D-LEX assets belong in this directory.
