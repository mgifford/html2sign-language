# Agent continuation prompt

You are developing https://github.com/mgifford/html2sign-language. Read `AGENTS.md`, `docs/PLAN-FIXED-SENTENCES.md`, `docs/AVATAR-ARCHITECTURE.md`, `FAILURE_REPORT.md`, `RETROSPECTIVE.md`, `docs/DECISIONS.md`, and the integrated bench at `experiments/html-to-asl/`: read its `README.md` and all four files in `experiments/html-to-asl/docs/` (`PHASES.md`, `PROTOCOL.md`, `3D-LEX.md`, `UPSTREAM.md`) before editing.

## Mission

Continue the research bench at `experiments/html-to-asl/` without replacing the existing static sidecar or its separate human-translated fixed-sentence plan. Work strictly one phase at a time; start with P0 verification, then implement P1 in a separate, reviewed PR. Stop after a coherent tested PR; do not silently proceed to later phases.

## PR sequence

- **PR 0 (done):** integrate the starter, link it from the main page, fix paths, record decisions, and add the experiment test command. No runtime or licence changes.
- **PR 1 (implemented, pending review):** P0 verification and hardening: extractor tests, JSON contract, manifest failure, browser smoke, access fixes. P1 has not started.
- **PR 2 (next, after PR 1 review):** P1 extractor and 60 fixtures, with the holdout controlled by the owner.

## First tasks

1. Inspect current repo and report conflicts, notably root AGPL-3.0 vs package.json ISC and outdated VRM preferences in root AGENTS.md. Fix only after documenting the choice in `docs/DECISIONS.md` (D3 and D4), preserving historical decisions.
2. The starter is already integrated at `experiments/html-to-asl/` with relative URLs and a footer link from the main page. Verify the static route and links; do not re-copy or duplicate it, and do not alter the main page's established behavior beyond that link.
3. Run Node unit tests, serve locally, and run real Playwright browser checks on Chromium, Firefox, and WebKit where available. Verify keyboard accessibility, visible error states, JSON export, no console errors, and that scripts in fixture HTML are inert. Browser code should not interpolate untrusted HTML into live DOM.
4. Expand P1's extractor: stable source IDs and spans; headings, nested lists, anchors with href, tables with header associations and scope, labelled form controls including required, aria-label/aria-labelledby, and alt text where relevant. Add adversarial DOM and Unicode fixtures. An extractor must not drop critical meaning; flag unsupported constructs.
5. Expand from 12 to 60 curated synthetic fixtures. Keep holdout hidden from prompt iteration and document reviewer criteria. Ensure fixtures cover English negation, modality, exceptions, numbers, entities, ambiguity, HTML structures and injection attempts.
6. Record changes, reasons, limitations, citations and credit in `experiments/html-to-asl/docs/UPSTREAM.md`; add an upstream maintenance/contribution plan. No copied media, 3D-LEX motions or models without explicit licence review.
7. Propose P2 upstream `spoken-to-signed-translation` adapter design before implementing. GitHub Pages needs precomputed JSON or a browser-native library; it cannot run Python server-side.

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
- A separate, reviewed P1 PR for the extractor and 60 fixtures, with the holdout controlled by the owner.
- Test report (commands, browsers, outcomes), fixture manifest and version hashes.
- Updated architecture and attribution notes including 3D-LEX citation and licence/access caveat.
- An issue-ready P2 proposal with acceptance criteria, not a premature AI translator.
- No claims of validated ASL content.

Stop and summarize what changed, what was omitted, why, and the next experimentally testable decision.
