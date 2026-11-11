# P2 automated review-risk report

Status: **advisory only.** These flags are technical signals, not owner or linguistic decisions. They do not accept, reject, or translate anything.

- 40 development artifacts; high: **10**, medium: **14**, low: **16**.
- All artifacts remain `partial` lexical plans; **not ASL**.
- Owner alignment and independent Deaf ASL review remain pending in `review.json`.

| Fixture | Severity | Blocks | Source words | Plan tokens | Flags |
|---|---|---|---|---|---|
| [NEG-01](NEG-01.json) | low | 1 | 8 | 6 | partial |
| [MOD-01](MOD-01.json) | low | 1 | 9 | 11 | partial |
| [COND-01](COND-01.json) | low | 1 | 9 | 9 | partial |
| [LEX-01](LEX-01.json) | low | 1 | 7 | 7 | partial |
| [DOC-01](DOC-01.json) | medium | 2 | 10 | 12 | partial, multi-block:2 |
| [HTML-01](HTML-01.json) | medium | 3 | 7 | 7 | partial, multi-block:3 |
| [SEC-01](SEC-01.json) | low | 1 | 3 | 4 | partial |
| [NAV-01](NAV-01.json) | medium | 2 | 8 | 8 | partial, multi-block:2 |
| [QTY-01](QTY-01.json) | low | 1 | 6 | 8 | partial |
| [LINK-01](LINK-01.json) | low | 1 | 6 | 6 | partial |
| [TABLE-01](TABLE-01.json) | high | 1 | 4 | 5 | partial, structure:table |
| [FORM-01](FORM-01.json) | high | 2 | 9 | 12 | partial, multi-block:2, structure:field |
| [STRUCT-HIER](STRUCT-HIER.json) | medium | 4 | 7 | 7 | partial, multi-block:4 |
| [STRUCT-NESTED](STRUCT-NESTED.json) | medium | 3 | 3 | 3 | partial, multi-block:3 |
| [STRUCT-ORDERED](STRUCT-ORDERED.json) | medium | 2 | 2 | 2 | partial, multi-block:2 |
| [STRUCT-DL](STRUCT-DL.json) | medium | 2 | 3 | 3 | partial, multi-block:2, structure:definition,term |
| [STRUCT-LINK](STRUCT-LINK.json) | low | 1 | 4 | 4 | partial |
| [STRUCT-LINKS](STRUCT-LINKS.json) | low | 1 | 3 | 4 | partial |
| [STRUCT-TABLE](STRUCT-TABLE.json) | high | 1 | 5 | 6 | partial, structure:table |
| [STRUCT-TABLE-NOHEAD](STRUCT-TABLE-NOHEAD.json) | high | 1 | 2 | 3 | partial, structure:table |
| [FORM-REQUIRED](FORM-REQUIRED.json) | high | 2 | 7 | 10 | partial, multi-block:2, structure:field |
| [FORM-GROUP](FORM-GROUP.json) | medium | 3 | 8 | 8 | partial, multi-block:3, structure:caption,field |
| [FORM-SELECT](FORM-SELECT.json) | high | 1 | 3 | 3 | partial, structure:field |
| [FORM-TEXTAREA](FORM-TEXTAREA.json) | high | 1 | 5 | 5 | partial, structure:field |
| [FORM-CHECK](FORM-CHECK.json) | high | 1 | 3 | 5 | partial, structure:field, length-ratio |
| [ARIA-BUTTON](ARIA-BUTTON.json) | high | 1 | 2 | 2 | partial, structure:field |
| [ARIA-SECTION](ARIA-SECTION.json) | medium | 3 | 4 | 5 | partial, multi-block:3, structure:region, duplicate-adjacent |
| [IMG-ALT](IMG-ALT.json) | medium | 2 | 10 | 6 | partial, multi-block:2, structure:caption,image |
| [IMG-DECOR](IMG-DECOR.json) | low | 1 | 3 | 4 | partial |
| [IMG-NOALT](IMG-NOALT.json) | low | 1 | 3 | 4 | partial |
| [QUOTE](QUOTE.json) | low | 1 | 7 | 6 | partial |
| [CODE](CODE.json) | medium | 1 | 3 | 3 | partial, structure:code |
| [BARE-DIV](BARE-DIV.json) | low | 1 | 4 | 5 | partial |
| [HIDDEN](HIDDEN.json) | low | 1 | 2 | 3 | partial |
| [DETAILS-CLOSED](DETAILS-CLOSED.json) | medium | 1 | 2 | 2 | partial, structure:summary |
| [DETAILS-OPEN](DETAILS-OPEN.json) | medium | 2 | 4 | 5 | partial, multi-block:2, structure:summary |
| [UNICODE](UNICODE.json) | low | 1 | 5 | 5 | partial |
| [INJECT](INJECT.json) | low | 1 | 2 | 3 | partial |
| [MIXED](MIXED.json) | medium | 4 | 6 | 6 | partial, multi-block:4 |
| [TABLE-LINK](TABLE-LINK.json) | high | 1 | 6 | 6 | partial, structure:table |

Flags: `structure:*` means a table, form field, caption, image, code, term, definition, or region; `multi-block` means more than one extracted block; `length-ratio` means the plan/source word ratio is outside 0.5–1.5; `partial` means the upstream plan is not complete. Use these signals to focus human review, not to replace it.
