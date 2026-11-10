# Agent continuation prompt

You are developing https://github.com/mgifford/html2sign-language. Read `AGENTS.md`, `docs/PLAN-FIXED-SENTENCES.md`, `docs/AVATAR-ARCHITECTURE.md`, `FAILURE_REPORT.md`, `RETROSPECTIVE.md`, `docs/DECISIONS.md`, and the integrated bench at `experiments/html-to-asl/`: read its `README.md` and all four files in `experiments/html-to-asl/docs/` (`PHASES.md`, `PROTOCOL.md`, `3D-LEX.md`, `UPSTREAM.md`) before editing.

## Mission

Continue the research bench at `experiments/html-to-asl/` without replacing the existing static sidecar or its separate human-translated fixed-sentence plan. Work strictly one phase at a time; start with P0 verification, then implement P1 in a separate, reviewed PR. Stop after a coherent tested PR; do not silently proceed to later phases.

## PR sequence

- **PR 0 (done):** integrate the starter, link it from the main page, fix paths, record decisions, and add the experiment test command. No runtime or licence changes.
- **PR 1 (implemented, pending review):** P0 verification and hardening: extractor tests, JSON contract, manifest failure, browser smoke, access fixes. P1 has not started.
- **PR 2 (implemented, pending review):** P1 extractor, 40 development fixtures, and a 20-case provisional holdout. The owner must replace or review the holdout before using it as a blind set.
- **PR 3 (implemented, pending review):** P2 proposal only: pinned offline adapter design, data contract, failure modes, licences and acceptance criteria. No upstream code, model, data, or runtime change.
- **PR 4 (implemented, pending review):** P2.0 only: pin record, artifact/index schemas, fail-closed CLI, refusal tests, empty data index. No model, upstream call, or lexical plan.
- **PR 5 (implemented, pending review):** P2.1/P2.2 source-run artifacts for all 40 development fixtures and a static viewer. Owner alignment review, CPU image digests, and image-pinned reproducibility remain open.

## First tasks

1. Inspect current repo and report conflicts, notably root AGPL-3.0 vs package.json ISC and outdated VRM preferences in root AGENTS.md. Fix only after documenting the choice in `docs/DECISIONS.md` (D3 and D4), preserving historical decisions.
2. The starter is already integrated at `experiments/html-to-asl/` with relative URLs and a footer link from the main page. Verify the static route and links; do not re-copy or duplicate it, and do not alter the main page's established behavior beyond that link.
3. Run Node unit tests, serve locally, and run real Playwright browser checks on Chromium, Firefox, and WebKit where available. Verify keyboard accessibility, visible error states, JSON export, no console errors, and that scripts in fixture HTML are inert. Browser code should not interpolate untrusted HTML into live DOM.
4. P1's extractor is implemented: stable source IDs/paths/text spans; headings, nested lists, links with href, tables with header associations and scope, form labels/required/ARIA, and alt text; adversarial and Unicode tests. Verify the P1 gate and record remaining structural gaps before P2.
5. The 40 development and 20 provisional holdout fixtures are present. The holdout is agent-authored and not blind; the owner must replace or review it before evaluation. See `experiments/html-to-asl/fixtures/HOLDOUT.md`.
6. Record changes, reasons, limitations, citations and credit in `experiments/html-to-asl/docs/UPSTREAM.md`; add an upstream maintenance/contribution plan. No copied media, 3D-LEX motions or models without explicit licence review.
7. The P2 proposal is in `experiments/html-to-asl/docs/P2-ADAPTER.md`. Do not implement P2 until the owner resolves the open decisions in section 12. GitHub Pages needs precomputed JSON; it cannot run Python server-side.

## Non-negotiable rules

- Do not invent ASL glosses, invent handshapes, call English markers ASL, or claim generated output is fluent ASL.
- Do not pass unreviewed material to the public signing avatar. Any lexical candidate needs provenance, uncertainty and explicit human review status.
- Dataset rights and code rights are separate. 3D-LEX code MIT and the described dataset CC BY 4.0, but access and exact asset usage must be verified; do not embed in Pages without review.
- No external hosted model as a hidden default; local AI will be a separate, opt-in future phase with pinned hashes and hardware reporting.
- Preserve original source HTML and source-span mappings; make failures and abstentions visible.
- Prefer existing upstream software and file formats over bespoke equivalents. Attribute original authors and contact maintainers before large overlapping work.
- Keep developer testing, semantic correctness, ASL linguistic review, and accessibility conformance as separate claims.
- Do not combine P0 verification and P1 extractor work in one PR.

## Deliverables for the PR

- Functional P0 static route on Pages, plus the P0 verification tests and test report from PR 1.
- A separate P1 PR for the block-aware extractor and the 40/20 fixture split. The provisional holdout must be owner-reviewed or replaced before it is used as a blind set.
- Test report (commands, browsers, outcomes), fixture manifest and version hashes.
- Updated architecture and attribution notes including 3D-LEX citation and licence/access caveat.
- An issue-ready P2 proposal and P2.0 scaffold with acceptance criteria (`experiments/html-to-asl/docs/P2-ADAPTER.md`, `tools/p2/`); P2.2 artifacts and the viewer are produced; owner review and CPU image pins are still required before P2.3 reproducibility.
- No claims of validated ASL content.

Stop and summarize what changed, what was omitted, why, and the next experimentally testable decision.
