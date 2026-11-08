# Plan: typed sentences to ASL through human translation (route A)

Status: proposal, 2026-11-07. Nothing in this plan is built yet.

Revised 2026-11-07: the translation units now come from new, short content about the page and the avatar, not from the legacy page's EN 301 549 text. Section 4 explains why.

Evidence labels: **[V]** verified in this repository or a cited source, **[A]** assumption, **[D]** decision for the project owner.

## 1. Goal

A visitor types a sentence from this page, or picks one, and the avatar signs a human translation of it into ASL. The English text stays on screen. The avatar is an addition to the text, not a replacement.

**In scope**

- A small, fixed set of translation units: new, short content about the page and the avatar (section 4). The legacy page and its EN 301 549 text stay unchanged.
- Matching typed text to those units.
- Playback on the rigged Rocketbox avatar (`assets/avatars/rocketbox-female-adult-01.glb`), with hands, face, gaze, and head on one timeline.
- Showing each unit's review status.

**Out of scope**

- Translating free English into ASL (route C). This is an unsolved research problem, and the brief forbids AI inventing signs.
- Signing English word by word and calling it ASL (route B). A sign dictionary may come later, labelled as a dictionary.
- Live or interactive content.
- Reusing the SMPL-X and SignAvatars clips. Their licences are unresolved (audit section 8), so this route avoids them entirely.

**Why this route.** The page is fixed content, so every sentence can be translated and checked by people before anyone sees it. The World Federation of the Deaf and WASLI caution against avatars replacing human signers, especially for live, complex, or important information ([2018 statement](https://wfdeaf.org/?p=7496)) [V]. A translated summary says they accept avatars only where Deaf people have advised on the signed content. That wording has not been checked against the English original [A]. Route A is designed to meet that condition.

## 2. How it works

```
typed text
  -> normalise (case, punctuation, spacing)
  -> find the matching translation unit
  -> the unit's ASL timeline (written by a translator, reviewed by Deaf signers)
  -> compile into one animation clip (hands, face, gaze, head together)
  -> player (play, pause, stop, replay, seek, speed, step)
```

**Matching is deterministic.**

1. Exact match after normalising.
2. Otherwise, a ranked list of the closest units by shared words, and the message "No ASL translation exists for this exact text. Closest matches:".
3. The page never builds a translation that a person has not made.

Paraphrase matching with a browser AI model is optional and later (brief Phase 9). It would need a labelled test set to show a measurable gain, and even then it would only pick an existing unit, never generate signing.

## 3. The key design decision: compose from signs, or capture whole units

**[D] D1.** How is the motion for each unit produced?

| | Compose from a sign dictionary | Capture each unit as one performance |
| --- | --- | --- |
| How | Record each sign once, then join them in the order the translator gives | The signer performs the whole translated unit, and the motion is captured as one take |
| Grammar | Placement in space, verb direction, and role shift must be authored by hand for every use | Kept, because the signer performed them |
| Flow between signs | Joined by interpolation, which tends to look robotic | Natural, because it was performed |
| Reuse | High: one recording of each sign | Low: each unit is its own take |
| Editing after review | Change one token | Re-record or hand-edit the take |
| Captions | Each sign's timing is known by construction | The take must be segmented into signs with timestamps |

**Recommendation:** capture whole units as the main path, segmented into sign tokens so the gloss can be highlighted in sync. Keep a sign dictionary as a secondary output for later dictionary-style lookup. Milestone M2 tests both before committing.

## 4. Proposed translation units

**Why not the legacy page's text.** An earlier draft of this plan took its units from `index.html`. That text compares how Canada and the EU apply EN 301 549. It is sample reading material from the original sidecar demo, and none of it is about sign language. It is also a poor first test:

- It is dense with names and acronyms: CAN/ASC, WAD, EAA, BFSG, RGAA, S.I. No. 636/2023 [V `index.html`]. Most would be fingerspelled. Fingerspelling is the hardest thing for an avatar to make readable, and it tests little of ASL grammar.
- Deaf reviewers would be judging a translation of content a Deaf visitor has little reason to want signed.
- Legal and standards text is closer to the important information that WFD and WASLI caution against giving to avatars (section 1).

**Proposed instead:** short content about the page and the avatar, which is what a Deaf visitor needs to know first. The source text does not exist yet. The project owner writes it with the translator at M0. Because the text is new, it could be drafted in ASL first, with the English written to match; the translator advises on which comes first (D3). The translator may also merge or split units, because an ASL translation does not have to follow English sentence boundaries.

| ID | Topic | Notes |
| --- | --- | --- |
| U1 | What this page is, and what the avatar is for | |
| U2 | What the avatar cannot do, and that it does not replace human interpreters | **Proposed pilot.** It is short, has few proper names, and tests negation, which ASL marks partly with the head and face as well as the hands [A, to confirm with the translator]. It also states the avatar's limits before anything else is signed. |
| U3 | Who translated and reviewed this content, and what each review status means | Needed by the honesty rules (section 8) |
| U4 | How to use the player controls | Play, pause, stop, speed, step |
| U5 | How to send feedback | |
| U6 | Optional: sign language in EN 301 549 and WCAG | Only if D9 is yes |

**[D] D9.** Keep an EN 301 549 thread, limited to what concerns signers? If yes, U6 could cover two verified points:

- EN 301 549 does not require sign language for prerecorded video. Its web requirements for time-based media stop at clause 9.1.2.5. WCAG 1.2.6 Sign Language (Prerecorded) appears only in Table 9.1, a list of Level AAA criteria that authors are encouraged to consider [V [EN 301 549 V3.2.1](https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf), clause 9.5; [WCAG 2.2 Understanding 1.2.6](https://www.w3.org/WAI/WCAG22/Understanding/sign-language-prerecorded.html), Level AAA].
- Clause 6.5 does serve signers, but only for two-way video calls. It names sign language and lip reading as the reason for its minimums: at least 20 frames per second (30 preferred), at least QVGA resolution, and audio and video within 100 ms. Its informative note says frame rate matters more than resolution, especially for fingerspelling [V EN 301 549 V3.2.1, clauses 6.5.1 to 6.5.4]. These are call requirements, not avatar requirements.

**[D] D2.** Which sign language? This plan assumes ASL only. Canada also has LSQ (Quebec Sign Language), and each EU country has its own national sign language. Supporting only ASL should be stated on the page as a limitation.

## 5. Data model

Each record carries provenance and a review status. The schema is validated by `src/timeline/schema.js` (audit section 7).

**Translation unit** (`content/asl/units/U1.json`):

- `id`, and `english`: the exact page text.
- `source`: page location and the git commit it was taken from.
- `language: "ase"` (the ISO 639-3 code for ASL).
- `gloss`: the translator's gloss, in their notation.
- `tokens`: one entry per sign with start and end times, the sign ID if it is in the dictionary, and a `fingerspelled` flag where it applies.
- `tracks`: non-manual markers over time ranges, for example brow raise, head nod, or gaze.
- `motion`: the file of joint rotations and morph weights, and its fps.
- `translator`, `performer`, `captureMethod`, `consentRef`, `licence`.
- `status`: `draft`, `translator-checked`, `reviewed`, or `rejected`, plus the dates and the review record IDs behind it.

**Motion** is stored as rotations on the canonical bones in `src/avatar/rigProfile.js`, plus ARKit-named morph weights. It is not stored as meshes. By my estimate that is tens of KB per unit rather than MB [A]. Milestone M2 measures the real size.

**Sign dictionary entry** (`lexicon/ase/<sign-id>.json`): the same provenance and status fields, plus the English glosses it can stand for, handedness, and channels present and missing.

## 6. People, rights, and money (decisions for you)

- **[D] D3. A Deaf ASL translator** produces each unit's translation, gloss, and a reference video. A Deaf translator or Certified Deaf Interpreter is preferred over a hearing interpreter for written-to-signed translation [A].
- **[D] D4. A performer** for motion capture. This can be the translator.
- **[D] D5. Reviewers:** at least three fluent Deaf ASL signers who did not take part in the translation (proposed number) [A]. They follow the Phase 11 protocol.
- **[D] D6. Payment.** This is paid human work. The brief rules out paid services, which I read as software, so you need to decide whether paid people are acceptable.
- **[D] D7. Rights,** agreed in writing before any recording:
  - a licence for the motion data and glosses that is compatible with the repo's AGPL-3.0 (for example CC BY 4.0 for data; check this)
  - whether the reference videos may be published, which involves the signer's likeness, or must stay private
  - how contributors are credited

## 7. Milestones

Each milestone ends with a check. Brief phase numbers are in brackets.

**M0. Decisions and source text.** D1 to D7 and D9, the unit topics, the pilot unit, and where the feature lives. **[D] D8:** a new page with its own content (recommended, so the legacy demo and its EN 301 549 text stay as a historical record), or replacing the legacy page's text and sidecar. The source text for the pilot unit (U2) is written.
*Exit:* the decisions are recorded in this file, and the pilot unit's source text is agreed by the owner and the translator.

**M1. Player foundation, with no ASL content** [Phases 2 and 5].
- Before building, assess Performs (MIT, three.js) for reuse, and record the decision (see `AVATAR-ARCHITECTURE.md`).
- Build `loadAvatar`, `rigProfile`, timeline `schema` and `compile`, and `Player`. The player needs play, pause, stop, replay, seek, speeds 0.25, 0.5, 1, and 1.5x, frame step, and reset to neutral. It renders only when something changes.
- Test with non-linguistic movements labelled "Test motion, not sign language".

*Exit:*
- Node unit tests: the schema rejects bad input, and the compiled tracks are as expected.
- Playwright: the capability report is complete, the avatar is at rest pose after loading, and relative timing is identical at every speed.
- axe shows 0 violations, and a keyboard-only run passes.

**M2. Motion method trial** [Phases 3, 4, 6, and 7]. Try three or four signs from the pilot unit, and the pilot unit itself as one take, with each method:
- (a) keyed by hand in `/lab/hands/` and `/lab/facial-expressions/`
- (b) tracked from the reference video into the rig. This needs research: finger occlusion and face detail are known weak points [A].
- (c) motion capture, if you have access to equipment.

*Exit:*
- `/lab/compare/` shows the reference video beside the avatar.
- A Deaf reviewer identifies each sign without being told which it is.
- The effort per sign and the file size are recorded for each method.
- D1 is decided.

**M3. Pilot unit end to end** [Phases 8 and 11]. The translator delivers U2. Build its motion, non-manual tracks, fingerspelled items, and gloss-synchronised captions.

*Exit:* the Phase 11 review is complete, and comprehension and naturalness are recorded. U2 is marked `reviewed` only if it meets criteria agreed before the review. If it fails, the failure is documented.

**M4. Typed input page** [Phases 8 and 10].
- A labelled text field and a submit button.
- Results in a list, with a status message announced politely. The unit list is also shown, so typing is optional.
- The English text is always visible, and the canvas accessible name updates for the current unit.
- No autoplay.

*Exit:*
- Playwright keyboard tests and axe pass.
- Manual checks done with VoiceOver and NVDA, at 400% zoom and reflow, and in forced colours.

**M5. Remaining units** [Phases 10 and 11]. Section by section, with each unit reviewed before it is published.

*Exit:*
- Every published unit is `reviewed`.
- A total download budget is agreed and met.
- `ASL-DATA-SOURCES.md`, `ASL-VALIDATION.md`, `KNOWN-LIMITATIONS.md`, and `AGENTS.md` are updated.

## 8. Honesty rules for the public page

- Only `reviewed` units play on the public page. Draft units play only in `/lab/`, under a banner.
- Each unit shows who translated it, its review status, and how to send feedback.
- The page makes no "validated" or "accurate ASL" claim without a review record behind it.
- The legacy demo's claims ("124 ASL words", "Biomechanically validated", audit L10) are not repeated.

## 9. Risks

| Risk | Effect | Mitigation |
| --- | --- | --- |
| Joined signs read as robotic | Low comprehension | Whole-unit capture (D1). M2 measures it. |
| Fingers hidden from the camera in tracked video | Wrong handshapes | Hand-key corrections in `/lab/hands/`. The reviewer checks handshapes. |
| Face movement too small to read at sidecar size (brows move 0.5 to 1.1 cm, see `AVATAR-ARCHITECTURE.md`) | Questions and negation are missed | Test in M2. Allow exaggeration within limits that reviewers agree. |
| No forearm twist bones, so the wrist narrows when it turns | Distracting deformation | Record as a limitation, or add twist bones (needs Blender) |
| The current avatar wears a pink shirt | Lower hand contrast | Choose the final avatar before M3 |
| Deaf experts' availability and cost | Delays | Agree scope at M0 and start with one unit |
| Data rights not settled | Cannot publish | D7 must be signed before recording |
| The units' source text is not written yet | M3 cannot start | Write the pilot unit (U2) first, at M0 |

## 10. Relation to the brief

| Brief phase | Where it lands |
| --- | --- |
| 2 Rig and loader | M1 (the avatar converter already exists) |
| 3 and 4 Face and hand labs | M2 tools |
| 5 Timeline | M1 |
| 6 Real ASL motion (at most 5 signs) | M2, from people recorded for this project rather than SignAvatars |
| 7 Compare viewer | M2 |
| 8 Text to sign through a controlled vocabulary | M3 and M4: the units are the controlled vocabulary |
| 9 Browser AI | Optional paraphrase matching after M4, only with a measured gain |
| 10 Testing and performance | Every milestone's exit check |
| 11 Human evaluation | M2, M3, and M5 |
