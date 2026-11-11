# P3/P4 research plan: browser simplification and direct/hybrid lexical planning

Status: **P3.1 baseline implemented; P3.2/P3.3 and P4 have not run.** A pinned browser model, model card, consent page, and one browser inference are recorded. The P4.1 plan-contract validator exists. This is a research protocol, not an ASL feature and not a deployment plan.

P2 produced 40 partial lexical plans and a passing image-pinned reproduction. P2.4 human review is still pending. This document plans the optional P3/P4 research that follows that review; it does not authorize P5 avatar playback.

## 1. Decision and scope restriction

**Decision:** P2, P3, and P4 are evaluated only on single-block prose-like content.

| Scope | Count | Fixtures |
|---|---:|---|
| In scope | 16 | `NEG-01`, `MOD-01`, `COND-01`, `LEX-01`, `SEC-01`, `QTY-01`, `LINK-01`, `STRUCT-LINK`, `STRUCT-LINKS`, `IMG-DECOR`, `IMG-NOALT`, `QUOTE`, `BARE-DIV`, `HIDDEN`, `UNICODE`, `INJECT` |
| Out of scope | 24 | tables, forms, headings, lists, captions, images, code, terms, definitions, regions, summaries, and multi-block pages |

The machine-readable list is `data/p2/scope.json`. The scope rule is:

- one extracted block;
- block type `paragraph`, `quote`, or `text`;
- no table, form field, heading, list item, caption, image, code, term, definition, region, or summary.

**Why.** The P2 automated risk report found 10 high-risk and 14 medium-risk artifacts, concentrated in structural content. Table rows and form labels are not sentences; feeding them through a prose lexical planner produces sequences such as “Type Fee Adult $20” or repeated “Contact method”. That is not a useful research result.

**What happens to the 24 structural fixtures.** They stay in the repository for transparency, but they are excluded from P2.4 lexical-plan review and from P3/P4. They require a different treatment: human-translated units, 3D-LEX, or a later structural study. They must not be counted as successes or failures of the prose pipeline.

The P2.4 review record still lists all 40 fixtures. Reviewers should use `scope.json` and [review.md](../data/p2/review.md) to focus on the 16 in-scope fixtures; structural rows are out of scope, not approved.

## 2. Research questions

P3 and P4 ask engineering questions about **lexical plans**, not ASL fluency.

**RQ1 — Simplification.** Does browser-side English simplification before the P2 rules reduce owner-flagged source-alignment/omission problems on prose?

**RQ2 — Direct planning.** Does a constrained browser model produce a more usable lexical plan than the P2 rules, with acceptable schema validity and failure rates?

**RQ3 — Hybrid.** Does a hybrid (model proposes simplification/sense choices; rules enforce ordering, spans, and abstention) outperform both the rules-only and direct-model arms?

**RQ4 — Cost.** What are the model load time, per-sentence latency, memory, and failure modes on the reference laptop, and do they rule out a static Pages deployment?

**Hypotheses (pre-registered before runs):**

- H1: P3 reduces owner-flagged alignment/omission issues versus the P2 baseline, without reducing source coverage.
- H2: P4-direct is worse than P2 on schema validity/stability, even if some plans read better.
- H3: P4-hybrid is the best quality/stability trade-off, but slower than P2.
- H4: Browser model load/latency is acceptable on the reference laptop, not necessarily on mobile.

These are directional hypotheses. With 16 prose fixtures, the study is a **pilot**; it cannot establish general effectiveness. No statistical significance claim is planned at this sample size.

## 3. Experimental arms

| Arm | Name | Input | Processing | Output |
|---|---|---|---|---|
| A | Rules baseline | P1 prose block | P2 WSD + upstream rules | P2 lexical plan |
| B | Browser simplification | P1 prose block | Small browser model simplifies English; then P2 rules | P2 lexical plan from simplified text |
| C | Direct model plan | P1 prose block | Browser model emits constrained candidate glosses/spans; schema validation | P2-compatible plan or explicit failure |
| D | Hybrid | P1 prose block | Model proposes simplification and sense choices; rules enforce order/spans; invalid output rejected | P2 plan or abstention |

Arm A is the committed P2 output. B–D are research-only and must never be presented as ASL.

**Invariants for C/D:**

- Source spans and block IDs must validate against P1.
- The model may not add content that is not in the source.
- The model may not emit an avatar animation, a sign video, or a claim of ASL correctness.
- Invalid schema, out-of-span content, or invented tokens cause a recorded failure, not a repaired “success”.
- No silent fallback that hides model failure; the failure code is reported.

## 4. Model and runtime selection

Selection is the P3.1 baseline (`SmolLM2-1.7B-Instruct` q4f16). Changing it requires a new model card and a new P3.1 check. Criteria:

- permissive licence compatible with static hosting and research publication;
- 0.5B–3B parameters, quantised browser build;
- WebGPU support through WebLLM or a WASM/WebGPU path (Transformers.js/ONNX);
- deterministic-enough output for five runs, with temperature and seed recorded;
- no cloud API, no telemetry, no remote model fetch at runtime beyond the pinned model asset;
- model weights are **not committed**; pin URL, revision, file hash, and licence;
- a no-AI fallback remains the default if WebGPU/model load fails.

Candidate families to benchmark, not commitments: Qwen2.5 small variants, SmolLM2, Llama 3.2 1B/3B, Gemma small variants. The exact model is chosen after a licence/size/load benchmark and recorded in a model card with SHA-256 hashes.

**Reference device:** one named laptop (CPU/GPU/RAM/browser version) for all P3/P4 runs. Mobile is a separate future study; no mobile claim from a laptop result.

## 5. Corpus and splits

- **Development:** the 16 in-scope prose fixtures. Used for prompt/harness development.
- **Holdout:** the 20 provisional holdout cases include structural content and are not blind. Before P4 evaluation, the owner must review or replace it with a prose-only holdout. It must not be used for prompt tuning.
- **Expansion:** if P3/P4 proceed beyond a pilot, expand to at least 40 prose development fixtures and a reviewed 20-fixture prose holdout. The current 16 are enough for engineering triage, not for an efficacy claim.
- **No leakage:** prompts, few-shot examples, and model selection use development only.
- **No new content about real people or legal advice**; fixtures remain synthetic accessibility examples.

## 6. Prompt and output contract

**P3 simplification prompt:** rewrite the English block as short, plain sentences without adding facts; return JSON `{sentences: [...]}`. It must preserve named entities, numbers, negation, and conditions. The simplified text is then passed through P2 unchanged.

**P4 direct/hybrid prompt:** return a JSON object compatible with the P2 artifact plan:

- candidate `word`, `gloss`, `pos`, source `start`/`end`, and `blockId`;
- no unsupported additions;
- explicit `abstain` when the model cannot map a span;
- no explanatory prose outside JSON.

Prompt versions are files with hashes. Few-shot examples come only from development fixtures. A schema validator rejects extra keys, out-of-span tokens, invalid block IDs, and non-finite values.

## 7. Run protocol

For each arm and fixture:

1. Load P1 block and the pinned model/prompt.
2. Run five times with recorded temperature, seed/top-p, browser, and device.
3. Validate output against the P2 schema/alignment contract.
4. Store raw output, validated plan, failure code, timings, and model metadata.
5. Run the owner alignment review on the validated plans; run the independent Deaf plausibility review only on the agreed sample.
6. Compare paired results by fixture.

Warm-up runs are excluded and recorded. Model load time is reported separately from per-sentence latency. Failed runs are retained; they are not dropped.

## 8. Measures

**Technical**

- schema validity rate;
- aligned-token coverage / abstention rate;
- invented-token or out-of-span count;
- exact and Jaccard plan stability across five runs;
- model load p50/p95, per-sentence latency p50/p95;
- peak memory and failure taxonomy (load, timeout, schema, refusal, hallucination, browser crash).

**Human**

- owner alignment issue count and severity per fixture, using the P2 review categories;
- independent Deaf reviewer plausibility rating on the agreed sample, recorded separately;
- disagreement is preserved; no averaging into an “ASL accuracy” score.

**Primary outcome:** owner-flagged alignment/omission issues per in-scope fixture, paired across arms.
**Secondary:** schema validity, source coverage, stability, latency.
**Not measured as success:** fluency, native-ASL correctness, accessibility conformance, or avatar quality.

## 9. Analysis

- Report per-fixture results and arm medians; do not hide failures in an aggregate.
- Use paired comparisons by fixture; report bootstrap confidence intervals as descriptive uncertainty.
- With 16 fixtures, do not claim statistical significance or generalizable superiority.
- Pre-register the primary outcome and stopping rules before P4 runs; record any deviation.
- Separate model failures from plan-quality judgments.
- Publish negative results and failure cases.

## 10. Human review

- P2.4 owner review of the 16 prose fixtures is a prerequisite.
- The owner reviews every validated plan for source alignment.
- An independent Deaf ASL reviewer reviews at least 20% of the sample; 100% before any public ASL claim.
- The reviewer evaluates lexical plausibility and missing nonmanuals/spatial information, not whether the model is a fluent translator.
- Reviewer identity, date, fixture, decision, and reason are recorded; the implementer does not self-approve.

## 11. Reproducibility and artifacts

- Commit: protocol, prompts, model card (URL/revision/hash/licence), run manifest, analysis scripts, and per-run JSON.
- Do not commit: model weights, browser caches, or generated signing assets.
- Record browser build, OS, device, WebGPU/WASM path, model quantization, temperature, seed, and prompt hash.
- Keep failed runs and raw model output for audit, labelled as research data.
- Static viewer may display plans and failure codes; it must not autoplay an avatar or claim ASL.

## 12. Ethics and claim boundary

- Research bench only; no public translation service.
- No AI-generated signing; no avatar feed; no “ASL translation” label.
- No claim covering nonmanuals, spatial grammar, classifiers, role shift, or aspect.
- No claim that a model “understands” ASL or English.
- Human-translated fixed sentences remain the production route.
- Deaf reviewers are engaged before any linguistic claim; their time and consent are planned, not assumed.

## 13. Milestones and gates

| Milestone | Deliverable | Gate |
|---|---|---|
| P3.0 | This protocol; P2 scope restriction; P2.4 review of 16 prose | Owner review recorded; scope fixed |
| P3.1 | Model/runtime baseline and model card; browser harness | Licence/hash/model card recorded; one browser run recorded; full latency matrix not yet measured |
| P3.2 | Arm A/B development runs | Five runs; failures retained; schema valid |
| P3.3 | P3 analysis and human review | H1 supported or not; no ASL claim |
| P4.0 | P4 preregistration (arms C/D, primary outcome, stop rules) | Frozen before holdout |
| P4.1 | Direct and hybrid implementations; plan-contract validator | Schema/alignment validators; failure paths (validator implemented) |
| P4.2 | Five-run P4 development comparison | All arms; no dropped failures |
| P4.3 | Holdout evaluation and decision memo | Holdout reviewed; results published |
| P5 gate | Only if P3/P4 justify it and P2.4 review is complete | Licensed 3D-LEX/human translation and Deaf review |

## 14. Stop rules

Stop or narrow the study if:

- the model licence or weight provenance is unclear;
- schema validity is below 90% after harness fixes;
- the model invents content outside source spans;
- browser load/latency makes the static-page path unusable on the reference device;
- P3/P4 show no improvement over P2 on the primary outcome;
- the holdout cannot be made independent and owner-reviewed.

A negative result is a valid outcome. It does not authorize P5.

## 15. P5 gate

P3/P4 do **not** automatically lead to avatar playback. P5 requires:

- P2.4 owner and independent review complete;
- P3/P4 evidence that the lexical-plan approach is worth carrying forward;
- a licensed, reviewed ASL reference set or human-translated units;
- the Rocketbox avatar path and its orientation/hand/face constraints validated;
- Deaf ASL reviewers engaged before any signing claim;
- explicit owner approval of the P5 scope and data terms.

No P5 work should start before those conditions.
