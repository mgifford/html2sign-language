# HTML → ASL research bench (GitHub Pages)

A **static, runnable experiment** at `experiments/html-to-asl/` in [mgifford/html2sign-language](https://github.com/mgifford/html2sign-language). It is English analysis only and does not produce ASL.

**What works in this experiment:** block-aware HTML extraction from 40 development fixtures, with 20 provisional holdout fixtures; source IDs/paths/text spans; headings, nested lists, links, tables with header scope, form labels/required/ARIA, and image alternatives; deterministic English surface-cue spotting; token-presence smoke checks (not semantic validation); JSON export; 3D-LEX credit and import contract; Node unit tests; and a Chromium browser smoke test.

Source spans are offsets into the normalized extracted text stream, paired with a DOM path; they are not byte offsets into the original HTML.

**What does not work yet:** AI simplification, direct-AI lexical planning, hybrid inference, ASL grammar, 3D-LEX motion decoding/retargeting, ASL playback, or linguistic evaluation. The dashboard explicitly marks these as *not implemented*. The rules-only baseline is **English analysis only**, not an ASL translator.

## Run

From the repository root:

```sh
python3 -m http.server 8000
# open http://localhost:8000/experiments/html-to-asl/
node --test "experiments/html-to-asl/tests/*.test.mjs"
node experiments/html-to-asl/tests/browser.mjs
```

From this directory, use `python3 -m http.server 8000`, `node --test "tests/*.test.mjs"`, and `node tests/browser.mjs` instead.

No npm install or API key is needed to use the static page. Run `npm install` once at the repository root for the Node tests (`linkedom`) and the browser test (`playwright`). The browser smoke test serves the repository itself and uses a locally installed Chromium or Chrome; set `PLAYWRIGHT_CHANNEL=chrome` to force the Chrome channel.

The experiment is served as a static subpath of the existing Pages site and is linked from the main page footer. All asset URLs are relative, so the page also works when served from its own directory.

## Planned stages

1. **P0 (delivered):** 12 fixtures, a controlled-tag HTML extractor, deterministic **English** surface cues, constraints, provenance, static UI, JSON export, tests.
2. **P1 (this branch):** 40 development fixtures and 20 provisional holdout fixtures; block-aware extraction with source IDs/paths/text spans; headings, nested lists, links/hrefs, table header scope, form labels/required/ARIA, image alternatives; adversarial and Unicode cases.
3. **P2:** upstream `spoken-to-signed-translation` adapter via offline, pinned *precomputed* outputs (GitHub Pages cannot run Python server-side); see the [P2 proposal](docs/P2-ADAPTER.md). P2.0 (pins/schema/fail-closed CLI) is implemented in `tools/p2/`; P2.2 has 40 partial source-run artifacts and a [static viewer](p2/). P2.3 has CPU image digests, a Python lock, an entity-linker pin, a source-run tool, and a passing image-pinned clean-room run (40/40 plan contents matched). Owner/independent review remains open for P2.4. WSD model/code, the OMW licence, and a Python 3.12 import path are verified. Never claim its lexical plan is fluent ASL.
4. **P3:** optional browser AI simplifier B using pinned Transformers.js or WebLLM and strict meaning checks. No model is bundled here.
5. **P4:** direct AI C and hybrid D, same fixtures, provenance, five repeats; evaluate errors, abstentions and coverage distinctly.
6. **P5:** independently reviewed ASL references and a legally sourced 3D-LEX **metadata** importer, then separate avatar rendering research. Motion is not embedded.

## Scope boundary

Do not send any generated lexical candidate to the existing public sign-language sidecar unless it has documented human translation and Deaf ASL review. Do not treat isolated-sign gloss lookup as continuous ASL translation.

## Files

- `index.html`, `styles.css`, `src/app.js` are the static Pages dashboard.
- `src/extract.mjs` is the block-aware extractor; `src/core.mjs` is the deterministic analysis engine shared with Node tests.
- `fixtures/manifest.json` contains 40 synthetic, author-created English HTML development cases.
- `fixtures/holdout.json` contains 20 provisional holdout cases; see `fixtures/HOLDOUT.md` for the owner review/replacement process.
- `docs/PHASES.md` supplies detailed exit criteria and no-go gates.
- `docs/3D-LEX.md` covers dataset access, attribution, and future adapter contract.
- `docs/PROTOCOL.md` defines evaluation metrics and conditions.
- `docs/P2-ADAPTER.md` is the P2 design proposal and acceptance criteria.
- `docs/P2-REVIEW.md` is the owner/independent review packet; no review is complete.
- `docs/P3-P4-RESEARCH.md` is the planned prose-only browser-AI research protocol; P3/P4 have not started.
- `docs/UPSTREAM.md` credits precursor work, with licence checks.
- `data/p2/` contains 40 partial P2.2 artifacts; `p2/index.html`, `p2/p2.js`, and `p2/p2.css` are the static viewer.
- `../../BUILD-FORWARD-PROMPT.md` is the agent continuation prompt for this experiment.
- `../../docs/DECISIONS.md` records project decisions and open questions.

The parent repository has a contradictory ISC entry in `package.json` and AGPL-3.0 at root: settle that upstream before publishing derivative source packages. This experiment has no third-party code or data embedded; all fixture text and application code are original. No licence change is made by this integration; see `../../docs/DECISIONS.md` (D3).
