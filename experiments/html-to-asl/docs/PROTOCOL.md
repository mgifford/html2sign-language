# Reproducible evaluation protocol (draft v0.1)

## Unit and arms

One fixture HTML document is the paired unit. Arms A (upstream deterministic ASL lexical pipeline), B (browser AI simplify + same upstream), C (direct browser AI lexical candidate), and D (AI concept analysis + same upstream). P0 has an English-only A-prebaseline, not the real upstream A.

P0 output uses `targetLanguage: null`, `plannedTargetLanguage: "ase"`, `translation: false`, and `checkStatus` (`token-presence-passed` or `token-presence-failed`). Its `checks` are within-block substring smoke tests, not semantic validation.

## Data governance

Keep 40 development and 20 hold-out fixtures in the 60-fixture expansion. Include conditions, negation, dates, references, ambiguous senses, forms, tables, and adversarial markup. Do not tune prompts using holdout results. Store original source, copyright status, source spans, English proposition references and human reviewer provenance. Synthetic fixture originals can be distributed.

## Metrics (do not combine into single unqualified quality score)

- Critical semantic error rate (adjudicated, paired)
- Proposition preservation (human-reviewed)
- Unsupported lexical proposals versus confirmed source IDs
- Lexical coverage and abstention rate (report together)
- Source alignment to original HTML
- Human editing/review effort
- Model init, cold/warm latency, memory, download size; energy measurement when feasible

For B/C/D pin model, revision, quantization, tokenizer/weights SHA-256, WebGPU backend, prompt bytes/hash, decoding settings, browser/OS/GPU and five sequential repeat outputs. Preserve invalid outputs and errors. Distinguish deterministic schema checks from linguistic review. Do not compare model variants while attributing changes only to algorithmic arms.

## Human review

At least two independent fluent Deaf ASL reviewers with disagreement adjudication for the pilot; consultation on the rubric before collecting results. Review lexical plans blinded to experimental arm where feasible. An English meaning-preservation evaluator and a fluent ASL reviewer have different jobs. Do not rely on BLEU as primary success measure.

## Gates

- No ASL correctness claims from lexical tokens alone.
- No automated candidate flows into public avatar.
- Invariants are evaluated for semantic preservation; checking that words remain present is only a P0 extraction smoke test, not semantic validation.
- Missing or incompatible third-party data is a failed prerequisite, not a blank successful result.
