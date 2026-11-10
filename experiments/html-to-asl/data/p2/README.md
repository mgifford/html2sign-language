# P2 precomputed data

Status: **one partial P2.1 prototype** (`NEG-01`). No other lexical plans exist.

- `index.json` is the static index the Pages viewer may read in P2.2.
- `NEG-01.json` is a `p2.0` artifact generated from the pinned upstream rules using a local WSD model snapshot. It is `partial`: upstream reported `semantic-rules-unavailable`, and owner alignment review is pending.
- WSD intermediates and model weights are not committed.
- The WSD model/code and OMW licence are approved. CPU image digests remain open, so this prototype is not yet a reproducible image-pinned run.

This directory must never contain a placeholder gloss, model weight, WSD intermediate, or 3D-LEX asset.

See [the P2 proposal](../../docs/P2-ADAPTER.md), [the pin record](../../../../tools/p2/pins.json), and [the artifact contract](../../../../tools/p2/artifact.schema.json).
