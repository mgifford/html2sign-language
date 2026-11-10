# P2 precomputed data

Status: **40 partial P2.2 source-run artifacts.** No other lexical plans exist.

- `index.json` is the static index the P2 viewer reads.
- `NEG-01.json` … `TABLE-LINK.json` are `p2.0` artifacts generated from the pinned upstream rules using a local WSD model snapshot and OMW English 1.4. All are `partial`: upstream reported `semantic-rules-unavailable`, and owner alignment review is pending.
- WSD intermediates and model weights are not committed.
- The WSD model/code and OMW licence are approved. CPU image digests remain open, so this is not yet an image-pinned reproducible run.

View the artifacts at `../../p2/`. This directory must never contain a placeholder gloss, model weight, WSD intermediate, or 3D-LEX asset.

See [the P2 proposal](../../docs/P2-ADAPTER.md), [the pin record](../../../../tools/p2/pins.json), and [the artifact contract](../../../../tools/p2/artifact.schema.json).
