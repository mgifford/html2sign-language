# P3 browser-run data

Status: one manual browser run recorded; not a benchmark.

- `runs.json` records 80 Node/CPU model runs (16 fixtures × 5) with raw responses, prompt hashes, validity, and critical-token checks. The browser run is separate.
- `comparison.json` is the descriptive P3.2 comparison of original and simplified P2 lexical-plan counts.
- `NEG-01-browser.json` records the pinned model, prompt, prompt hash, browser/backend, raw response, validation, and mechanical critical-token result for `NEG-01`.
- The model simplified “You do not need to pay a fee.” to “No fee.”
- The mechanical check flagged `not` as missing; this is a **review prompt**, not an automatic failure of meaning. The output was not repaired or accepted as a translation.
- The run is English-only. It is not ASL and is not connected to the avatar.
- P3.2 is descriptive only: 70/80 valid runs, 14/16 fixtures with five valid runs, two fixtures with zero valid runs. It is not a quality or ASL evaluation. P3.3 has not run. See `../docs/P3-MODEL-CARD.md` and `../docs/P3-P4-RESEARCH.md`.
