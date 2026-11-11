# P3 browser-run data

Status: one manual browser run recorded; not a benchmark.

- `NEG-01-browser.json` records the pinned model, prompt, prompt hash, browser/backend, raw response, validation, and mechanical critical-token result for `NEG-01`.
- The model simplified “You do not need to pay a fee.” to “No fee.”
- The mechanical check flagged `not` as missing; this is a **review prompt**, not an automatic failure of meaning. The output was not repaired or accepted as a translation.
- The run is English-only. It is not ASL and is not connected to the avatar.
- P3.2/P3.3 comparisons have not run. See `../docs/P3-MODEL-CARD.md` and `../docs/P3-P4-RESEARCH.md`.
