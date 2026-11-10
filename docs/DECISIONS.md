# Project decisions and open questions

Status: living record. Add entries; do not rewrite history. Mark each entry **Accepted** or **Open** and date it.

## D1 — Experiment location and links (Accepted, 2026-11-10)

- The HTML → ASL research bench lives at `experiments/html-to-asl/` and is served as a static subpath of the existing GitHub Pages site.
- All asset and documentation URLs inside the experiment are relative.
- The main page links to it from the footer; the experiment links back to the main page.
- The existing sidecar runtime is unchanged by this integration.

## D2 — Experiment boundary (Accepted, 2026-11-10)

- The bench is **English analysis only**. It does not produce ASL, contains no ASL lexicon or grammar engine, and must not feed the public signing avatar.
- The production path remains the human-translated fixed-sentence plan in [PLAN-FIXED-SENTENCES.md](PLAN-FIXED-SENTENCES.md).
- Arms C and D in the experiment are research only. Their output is not ASL and is not signed content. Any future use requires the P4/P5 gates and independent Deaf ASL review.

## D3 — Code licence metadata (Open)

- The repository has AGPL-3.0 in [LICENSE.txt](../LICENSE.txt), `"license": "ISC"` in [package.json](../package.json), and a starter statement offering AGPL-3.0-or-later. These conflict.
- PR 0 makes **no licence change**. The owner must choose `AGPL-3.0-only` or `AGPL-3.0-or-later`, then update `package.json`, add SPDX identifiers, and align the README and experiment notice.
- Until that is resolved, do not publish derivative source packages. This is not legal advice.

## D4 — Avatar format and AGENTS.md (Open)

- [AGENTS.md](../AGENTS.md) says VRM is preferred and SMPL-X is recommended. [AVATAR-AUDIT.md](AVATAR-AUDIT.md) selects the Rocketbox skinned glTF avatar; the current sidecar still runs a legacy SMPL-X flipbook, and [FAILURE_REPORT.md](../FAILURE_REPORT.md) records why VRM was abandoned.
- PR 0 makes no runtime or AGENTS change. After the owner chooses, add a dated “current state” section to `AGENTS.md` and preserve the historical rationale rather than deleting it.
- Known constraints: SMPL-X has a “No Distribution” term; Rocketbox is MIT; see the audit’s licence table.

## D5 — Third-party data licences (Open; P5 gate)

- 3D-LEX dataset: the [sign-lang data page](https://www.sign-lang.uni-hamburg.de/lrec/data/3dlexv10.html) lists CC BY 4.0. Access, performer consent, and exact asset terms still need verification. The code licence is stated as MIT in its repository.
- ASL-LEX: the [download page](https://asl-lex.org/download.html) says CC BY 4.0 in its text but its footer says CC BY-NC 4.0. Treat the terms as unresolved until confirmed.
- No dataset assets are bundled in P0. Resolve before any P5 import or redistribution.

## D6 — PR sequence (Accepted, 2026-11-10)

- **PR 0 (done, 2026-11-10):** integrate the starter, add relative links, fix paths, add this record, and add the experiment test command.
- **PR 1 (implemented, pending review, 2026-11-10):** P0 verification and hardening: extraction tests, JSON contract, manifest failure, browser smoke test, and access fixes.
- **PR 2 (implemented, pending review, 2026-11-10):** P1 extractor, 40 development fixtures, and a 20-case provisional holdout. The holdout is not blind until the owner replaces or reviews it.
- **PR 3 (implemented, pending review, 2026-11-10):** P2 proposal only, in `experiments/html-to-asl/docs/P2-ADAPTER.md`; no code, model, data, or runtime change.
- **PR 4 (implemented, pending review, 2026-11-10):** P2.0 pin record, schemas, fail-closed CLI, refusal tests, and empty data index. No model, upstream call, or lexical plan.
- **PR 5 (next, blocked):** P2.2 source-run artifacts and viewer implemented; owner alignment review and CPU image digests are still open. The WSD model/code, OMW licence, Python 3.12 import path, and artifact policy are approved.
- Do not combine P1 with P0 verification. The owner controls the holdout fixtures, not the implementing agent.

## D7 — Claim separation (Accepted, 2026-11-10)

- Token presence is not semantic validation.
- Extraction tests are not ASL linguistic review.
- Playwright or axe checks are not accessibility conformance.
- State each claim separately in the README, test report, and UI.

## D8 — P2 adapter decisions (Accepted, 2026-11-10)

- **WSD stack:** approve `sign/Ettin-150m-WSD` revision `8751b577199d1bb95b74fa2457da7065d57100ae` (Apache-2.0), `sign/word-sense-disambiguation` commit `da5d67fe731c771b0a2126a25a57e71a33ff5a81` (MIT), and `sign/wn` commit `2d0e81362599062ba185f774b08a76e226bf1415` (MIT). Local CPU only; no hosted model or external API.
- **Artifacts:** commit per-fixture `p2.0` JSON for the 40 development fixtures; do not commit model weights, caches, or bulk WSD output.
- **WSD intermediates:** keep as local/CI audit artifacts; only a small hand-authored WSD test fixture may be committed.
- **WordNet:** pin `omw-en:1.4` locally through `sign/wn`. The `wn` index records the Princeton WordNet License for the OMW English 3.0 export, so `wordnet.approved` is true; the CPU image digest is still open.
- **Fixtures:** use only the 40 development fixtures; the 20-case holdout is provisional and not blind.
- **Claims:** lexical plan only; no avatar feed, no ASL/accessibility claim, no nonmanual/spatial coverage. P2.4 requires independent Deaf ASL review. Human-translated fixed sentences remain the production route.
- **Review:** deterministic exact-span alignment; owner reviews the P2.1 fixture; an independent reviewer samples at least 20% of P2.2 and reviews 100% before a public claim; record decisions in `data/p2/review.json`. No implementer self-approval.

## D9 — P2.1 prerequisites (Open)

- Record the OMW English 3.0 licence as the Princeton WordNet License and set `wordnet.approved: true` (done).
- [done] Python 3.12 import check: spaCy 3.8.16, `en_core_web_lg` 3.8.0, and pinned `senses_to_gloss` (temporary venv; commit a lock file later).
- Pin CPU image digests for WSD and `sign/wn`, and record them in `pins.json` (still open).
- Run `precompute.py --check` with `ready: true`.
- [implemented] All 40 development artifacts and the static viewer were produced from source checkouts and a local model snapshot. Owner alignment review is pending; image-pinned reproducibility remains open.
