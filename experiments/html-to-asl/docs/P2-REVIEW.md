# P2 review packet

Status: **pending.** No owner alignment review or independent Deaf ASL review has been completed.

This packet supports P2.4. It does not itself make a linguistic, accessibility, or ASL claim. The output being reviewed is an **English → ASL lexical plan**, not ASL.

## Materials

- Viewer: `experiments/html-to-asl/p2/`
- One-page review table: `experiments/html-to-asl/data/p2/review.md`
- Artifacts: `experiments/html-to-asl/data/p2/`
- Review record: `data/p2/review.json` (40 entries, all pending)
- Contracts: `tools/p2/artifact.schema.json`, `tools/p2/review.schema.json`
- Proposal and limits: `docs/P2-ADAPTER.md`
- Claim boundary: `docs/DECISIONS.md`

## Scope

- Review the **40 development artifacts** only.
- The 20-case holdout remains excluded; do not tune against it.
- The 40 artifacts are `partial` because upstream reports `semantic-rules-unavailable`.
- The source-run artifacts were produced from source checkouts and a local model snapshot; clean-room image-pinned reproduction is still open.

## 1. Owner alignment review (all 40)

For each fixture, compare:

1. The source block text and spans.
2. Each candidate’s word, gloss, source span, and `blockId`.
3. Omitted source tokens (`changes`) and why.
4. Notes, especially `semantic-rules-unavailable`.
5. Any candidate that should have been an abstention.

Record one `ownerStatus` per fixture:

- `accepted` — the mapping and omissions are acceptable for this research output.
- `needs-discussion` — a specific mapping/omission needs another look.
- `rejected` — the artifact must not be used until corrected.

Record `ownerNotes` with the fixture ID, a specific concern, and whether it affects the plan or only its presentation. Do not edit artifacts to make a review pass.

## 1.1 Recording decisions

```sh
python3 tools/p2/review.py --list
python3 tools/p2/review.py --set NEG-01 --owner-status accepted \
  --owner-notes "source mapping checked" --reviewer "Reviewer name"
python3 tools/p2/review.py --set NEG-01 --linguistic-status accepted \
  --linguistic-notes "recognisable in context" --reviewer "Deaf ASL reviewer"
python3 tools/p2/review.py --summary
python3 tools/p2/review.py --validate
```

The CLI edits `data/p2/review.json`; it cannot perform the review. Do not use it to self-approve as the implementer. To mark a sampled independent review accepted, record the reviewed fixtures and set the role status with `--independent-status accepted --reviewer ...`.

## 2. Independent Deaf ASL review

This is separate from source alignment. It asks whether the lexical sequence is recognisable/plausible to a fluent Deaf ASL reviewer, **not** whether the pipeline is a fluent translator.

Minimum process:

- At least one independent fluent Deaf ASL reviewer, not the implementer.
- Review at least 20% of the 40 artifacts as a sample.
- Review 100% before any public ASL claim.
- Review lexical choices, omissions, and missing nonmanual/spatial information.
- Preserve disagreement; do not average it away.
- Record `linguisticStatus` and `linguisticNotes` per reviewed fixture.

The upstream rules do not supply classifiers, spatial agreement, role shift, nonmanual markers, or aspect. Reviewers should treat those as **missing**, not as implied.

## 3. Status definitions

| Status | Meaning |
|---|---|
| `pending` / `not-started` | Not reviewed |
| `in-review` | Review underway |
| `accepted` | Accepted for the stated research scope |
| `needs-discussion` | Specific concern recorded; not accepted |
| `rejected` | Must not be used until corrected |

The overall `status` becomes `complete` only when the owner and independent review records are complete and every fixture has a decision. `rejected` is a valid outcome.

## 4. Exit criteria for P2.4

- [ ] All 40 fixtures have an owner alignment decision.
- [ ] The independent Deaf ASL reviewer has reviewed the agreed sample, and 100% before any public claim.
- [ ] Every rejection/discussion item has a recorded disposition.
- [ ] No artifact is presented as ASL or fed to the public avatar.
- [ ] The clean-room image-pinned run is complete, or the limitation is explicit.

## 5. Rules

- Do not self-approve as the implementer.
- Do not edit artifacts to make a review pass.
- Do not use the holdout for tuning.
- Do not claim ASL fluency, native-ASL correctness, or accessibility conformance from this review.
- Human-translated fixed sentences remain the production route.
