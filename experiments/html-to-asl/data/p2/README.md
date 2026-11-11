# P2 precomputed data

Status: **40 partial P2.2 source-run artifacts.** No other lexical plans exist.

- `index.json` is the static index the P2 viewer reads.
- `scope.json` restricts P2/P3/P4 evaluation to 16 single-block prose fixtures; 24 structural fixtures are out of scope.
- `NEG-01.json` … `TABLE-LINK.json` are `p2.0` artifacts generated from the pinned upstream rules using a local WSD model snapshot and OMW English 1.4. All are `partial`: upstream reported `semantic-rules-unavailable`, and owner alignment review is pending.
- `review.json` records all 40 owner alignment reviews and the independent review as **pending**; see `../docs/P2-REVIEW.md`.
- `review.md` is a one-page table of all 40 source texts and plans for review.
- `review-qa.md`/`review-qa.json` are advisory automated risk flags, not decisions.
- WSD intermediates and model weights are not committed.
- The WSD model/code and OMW licence are approved. CPU image digests and the spaCy entity-linker hash are recorded; the entity-linker archive revision is unpublished. The image-pinned clean-room run passed with 40/40 plan contents matching.

View the artifacts at `../../p2/`. This directory must never contain a placeholder gloss, model weight, WSD intermediate, or 3D-LEX asset.

See [the P2 proposal](../../docs/P2-ADAPTER.md), [the pin record](../../../../tools/p2/pins.json), and [the artifact contract](../../../../tools/p2/artifact.schema.json).
