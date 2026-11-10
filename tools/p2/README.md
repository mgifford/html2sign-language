# P2 tooling

Status: **P2.0 scaffold.** It validates pins and refuses to write a lexical plan until every prerequisite is approved and installed. It does not run upstream, a WSD model, WordNet, or spaCy.

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
- WSD model/revision/licence;
- WordNet version/source/licence;
- spaCy model/version;
- artifact publication mode.

Every `approved` flag is currently `false`. The upstream commit is a candidate, not an approved dependency.

## Approval checklist

Before setting any `approved` flag to `true`, record and verify:

1. The exact upstream commit and MIT licence.
2. A WSD model revision, its licence, and permission for local use.
3. A WordNet/OMW version, source, and licence.
4. A Python 3.11/3.12 environment with locked dependencies.
5. The artifact policy: committed JSON or CI artifact.
6. Owner acceptance of the upstream rule limits (lexical plan only; no nonmanuals or spatial grammar).
7. A reviewer for P1-block → upstream-sentence alignment.
8. Confirmation that the provisional holdout stays excluded.

Then run `--check` and confirm `ready: true` before P2.1.

## Files

- `pins.json` / `pins.schema.json` — candidate pins and their contract.
- `artifact.schema.json` — per-fixture `p2.0` artifact contract.
- `index.schema.json` — static index contract.
- `precompute.py` — fail-closed CLI.
- `validate.py` — dependency-free checks used by tests.
- `tests/` — 14 unit tests, including refusal and holdout cases.

No model weights, WSD intermediates, generated glosses, or 3D-LEX assets belong in this directory.
