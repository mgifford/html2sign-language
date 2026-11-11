# P3 model card — SmolLM2-1.7B-Instruct (q4f16 ONNX)

Status: **pinned P3.1 baseline; one browser run recorded; not a benchmark.** This model produces simplified English. It is not an ASL translator.

## Model

| Field | Value |
|---|---|
| Model | `HuggingFaceTB/SmolLM2-1.7B-Instruct` |
| Upstream | Hugging Face SmolLM2 team |
| Revision | `31b70e2e869a7173562077fd711b654946d38674` |
| Licence | Apache-2.0 |
| Parameter count | 1.7B |
| Quantised file | `onnx/model_q4f16.onnx` |
| Model bytes | 1,108,730,338 (~1.1 GB) |
| Model SHA-256 | `d94946187fb5f27579f3db4ba21fb7f7466c7cbd18956bd420d3981f75282f9c` |
| Tokenizer | `tokenizer.json` |
| Tokenizer SHA-256 | `9ca9acddb6525a194ec8ac7a87f24fbba7232a9a15ffa1af0c1224fcd888e47c` |
| Runtime | `@huggingface/transformers` 4.3.2, pinned via jsDelivr |
| Backend | WASM/CPU (`dtype: q4f16`, `device: wasm`); WebGPU not required or assumed |
| Source | https://huggingface.co/HuggingFaceTB/SmolLM2-1.7B-Instruct |

The runtime and model are fetched only after the user checks the consent box and presses **Download and load model**. No model fetch or inference happens on page load. There is no hosted model API, no telemetry, and no silent server fallback.

## Intended use

- Research on English simplification before the deterministic P1/P2 pipeline.
- Comparing simplified English with the original on mechanical preservation checks.
- Recording model failures, uncertainty, and abstentions.

## Out of scope

- ASL gloss generation or sign-language translation.
- ASL grammar, nonmanual markers, spatial grammar, classifiers, or role shift.
- Avatar playback or public signing content.
- Legal, medical, or accessibility-conformance advice.
- Any claim that a fluent reader would understand the output as ASL.

## Known limitations

- 1.7B parameters; still limited reasoning and instruction-following.
- Quantisation can degrade output.
- The model may omit, add, or distort meaning; the mechanical critical-token check is not semantic validation.
- Browser/device performance varies; the reference environment must be recorded for each run.
- The model may return malformed JSON; malformed output is recorded as a failure and is not repaired.
- Prompt and model outputs are English research data, not reviewed ASL.

## Consent and data flow

- The page displays the download size and requires explicit consent.
- Model files come from Hugging Face; the library comes from jsDelivr. Those providers may log requests.
- The selected English fixture is sent only to the local model instance in the browser.
- No fixture text is sent to a model API or analytics service by this page.

## Verification status

- Pinned metadata and tokenizer hash verified.
- The page's deterministic states, consent gate, and 16-fixture loading are covered by Chromium tests without downloading the model.
- **Browser model run, 2026-11-11:** [NEG-01-browser.json](../data/p3/NEG-01-browser.json). Chrome 157.0.8103.39 on macOS arm64, WASM/CPU, q4f16. `NEG-01` produced valid structured output: `{"simplified":"No fee.","changes":[{"from":"You do not need to pay a fee","to":"No fee","reason":"clear statement"}],"uncertainty":"","abstain":false}`. The mechanical critical-token check flagged `not` as missing because the simplification uses “No fee”; this is recorded as a review prompt, not automatically accepted or repaired.
- P3.2’s 80 recorded runs used Node/CPU, not the browser; the environment is stored in `data/p3/runs.json`.
- Model inference is not part of ordinary CI because of the 1.1 GB download and long WASM run.
