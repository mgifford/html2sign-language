# P2 precomputed data

Status: **empty scaffold.** No lexical plans exist yet.

- `index.json` is the static index the Pages viewer may read in P2.2.
- Per-fixture artifacts will be `p2.0` JSON files described by `tools/p2/artifact.schema.json`.
- P2.0 does not run upstream, a WSD model, or WordNet. `tools/p2/precompute.py --check` validates the pin record; `--fixture` refuses to write until every prerequisite is approved and installed. The WSD model/code pins and OMW licence are approved; the CPU image digests remain open. A Python 3.12 import check has been done in a temporary environment.

This directory must never contain a placeholder gloss, model weight, WSD intermediate, or 3D-LEX asset.

See [the P2 proposal](../../docs/P2-ADAPTER.md) and [the pin record](../../../../tools/p2/pins.json).
