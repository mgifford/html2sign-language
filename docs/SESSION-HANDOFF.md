# Session handoff — HTML to sign language

Date: 2026-11-11. This is the durable record of what was decided and what remains; the chat transcript is not the source of truth.

## Current stage

- Public page: **24 isolated ASL word clips** from WLASL; it is not a sentence or page translator.
- Research bench: **16 prose lexical plans** (English → gloss order), not ASL, with no avatar playback.
- P2.0–P2.3: implemented, including an image-pinned clean-room run that matched all 40 plan contents.
- P2.4: owner alignment review is **in progress** (`NEG-01` accepted for English source/gloss order, explicitly not ASL); independent Deaf ASL review is **pending**.
- P3/P4: planned only; no model, prompt, run, or result.
- P5/P6: gated; no avatar signing claim.

## What was corrected

- The public page claimed **124 ASL words** and **biomechanical validation**. Only **24 word clips** exist; 316 metadata entries mostly lack an animation file. The visible claims were corrected.
- The public page now says it is not a sentence/page translator and links to [review.html](../review.html).
- A test-created ASL acceptance was reverted. The CLI now requires an explicit independent-reviewer attestation and a real reviewer name; placeholder names are rejected. The owner cannot self-attest as the Deaf ASL reviewer.

## The 12 supplied approaches: assessment

| Source | What it actually is | Direction | Use here |
|---|---|---|---|
| [Quarantadue “Generate Variants”](https://quarantadue.ai/sign-language/software/12.7.1) | Paid MCP specification for varying phonological parameters; marketing page; no peer-reviewed validation | Variant generation, not translation | **No.** Not an ASL generation engine and no evidence base |
| [Machine Translation for Sign Languages](https://arxiv.org/abs/2610.00881) | Review of sign-language MT, recognition, production, evaluation, ethics | Survey | **Yes, as related work and evaluation/ethics guidance**; no code |
| [David Gray project](https://davidmgray.com/work/sign-language-interpreter/) | MediaPipe/CNN recognition of 14 static ASL gestures for smart-home commands | ASL → text/commands | **No for generation.** Only a recognition/control example |
| [David Gray GitHub](https://github.com/davidgraymi/Sign-Language-Interpretation-System) | The same recognition capstone; old Python/MediaPipe stack | ASL → commands | **No for generation** |
| [Berkeley SignSense](https://www.ischool.berkeley.edu/projects/2023/signsense-american-sign-language-translation) | ASL video → English captions; MoViNet + T5 | ASL → English | **No for generation.** Opposite direction |
| [Kaggle ASL dataset](https://www.kaggle.com/datasets/saurabhshahane/american-sign-language-dataset/data) | MS-ASL: ~25k word-level ASL videos; Computational Use of Data Agreement | Recognition training/evaluation | **No for generation.** License and word-level scope do not give signing motion rights |
| [Van Manen Rule of Three study](https://www.oalib.com/research/6905095) | Empirical study of 1,579 ASL morph tokens and sublexical constraints | ASL phonology/fingerspelling analysis | **Maybe for review/evaluation**, especially fingerspelling constraints; not sentence generation |
| [Real-Time ASL Recognition (3D CNN + LSTM)](https://arxiv.org/abs/2512.22177) | Word-level webcam recognition on WLASL/MS-ASL/curated signs | ASL → text | **No for generation** |
| [Sensors 2025, 25, 2138](https://www.mdpi.com/1424-8220/25/7/2138) | YOLOv11 + MediaPipe recognition of ASL alphabet letters | ASL → text | **No for generation** |
| [UPenn TEAM](https://repository.upenn.edu/server/api/core/bitstreams/efca3f6c-3825-44bb-b140-b8392eed756c/content) | English → ASL machine translation with an intermediate representation and 3D animated output; 2000 | English → ASL | **Closest architectural precedent for P5**; old, no reusable code |
| [ramyd ASL recognition](https://www.ramyd-dev.com/blog/asl-recognition) | Rule-based MediaPipe recognition of A–Z handshapes | ASL → text | **No for generation** |
| [SignLangApp](https://github.com/ibukunOduntan/SignLangApp) | CNN/Flask app for learning the ASL alphabet | ASL → text/learning | **No for generation** |

## Recommendation

Do not switch the project to one of these as a shortcut. Almost all of them solve **ASL → English recognition**; this project needs **English/HTML → reviewed signing**, which is the harder unsolved direction.

What is reusable:

1. **TEAM** for the P5 architecture: English → intermediate ASL representation → 3D animation. It confirms the shape of the problem but is not a modern implementation.
2. **The 2026 review** for related work, evaluation vocabulary, and ethics/community requirements.
3. **The Rule of Three study** as a review aid for fingerspelling/phonological constraints, with caution about the venue and scope.
4. **Recognition** only for optional feedback/evaluation (for example, a signer performs a plan and a recognizer checks it), never as the generator.
5. **MS-ASL/WLASL** only for recognition experiments, not as a production signing corpus.

The credible signing path remains:

- P2.4 human review of the 16 prose lexical plans.
- P3/P4 prose-only research, if it earns its keep.
- P5 licensed 3D-LEX or human-translated signing units, with Deaf ASL review.
- P6 optional playback only after review and licensing.

## How this session’s learning is captured

**Durable in the repository**

- Git commits and pull requests.
- [DECISIONS.md](DECISIONS.md), [P2-REVIEW.md](../experiments/html-to-asl/docs/P2-REVIEW.md), [P3-P4-RESEARCH.md](../experiments/html-to-asl/docs/P3-P4-RESEARCH.md), and this handoff.
- Tests, CI logs, the clean-room workflow, and `review.json`.
- The public status/review pages.

**Not durable / not a training feed**

- The model does not fine-tune on this conversation. No weights are updated.
- There is no hidden cross-session memory here; a future session starts from the repository and prompt, not from this chat.
- The host may retain the session transcript according to its own policy; I cannot inspect or promise its retention or deletion.
- Web requests send URLs/queries to external sites; those sites may log them. Do not put secrets in prompts or URLs.
- There is no automatic report to a third party beyond the model/host processing and the tools used.

**How to share it with people**

Share the repository links and this handoff, not the raw chat. The useful review links are:

- [Public review status](https://mgifford.github.io/html2sign-language/review.html)
- [P2 viewer](https://mgifford.github.io/html2sign-language/experiments/html-to-asl/p2/)
- [One-page review table](https://github.com/mgifford/html2sign-language/blob/main/experiments/html-to-asl/data/p2/review.md)
- [Review packet](https://github.com/mgifford/html2sign-language/blob/main/experiments/html-to-asl/docs/P2-REVIEW.md)
- [P3/P4 plan](https://github.com/mgifford/html2sign-language/blob/main/experiments/html-to-asl/docs/P3-P4-RESEARCH.md)

## Verification

- Public page: 24 clips, honest status, links to review guide.
- `npm test`: 35 Node tests + 2 page tests.
- P2: 40 tests.
- P3/P4 contract: 6 tests.
- Browser test: passes, including the review page and 320 px P2 viewer.
- CI and GitHub Pages deployment: success.

## Open items

1. Independent Deaf ASL reviewer for the 16 prose lexical plans and/or the 24 word clips.
2. Decide whether to expand the prose corpus from 16 to at least 40 before P3/P4 efficacy claims.
3. P3.1 model/runtime benchmark and pinned model card.
4. P5 data/licence decision (3D-LEX or human-translated units).
5. Owner decision on whether the 24-word demo remains public, is labelled as a dictionary demo, or is retired.
