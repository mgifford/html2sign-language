# P2 review report

Status: **in progress.** This table is a review aid, not an approval. Lexical plans only; not ASL.

- Scope: **16 prose fixtures** are in scope for P2.4 lexical-plan review. The other 24 structural fixtures are out of scope for P2/P3/P4; see [scope.json](scope.json).
- The 20-case holdout is excluded.
- All artifacts are `partial`: upstream reports `semantic-rules-unavailable`.
- Owner source-alignment: 1 of 16 prose fixtures accepted. Independent Deaf ASL review: **pending**. See [P2-REVIEW.md](../docs/P2-REVIEW.md).
- Automated risk flags: [review-qa.md](review-qa.md) (advisory, not decisions).

| Fixture | Scope | Artifact | Source | Plan (gloss/word order) | Owner | Independent |
|---|---|---|---|---|---|---|
| [NEG-01](NEG-01.json) | in | partial | You do not need to pay a fee. | you not need pay fee . | accepted | not-started |
| [MOD-01](MOD-01.json) | in | partial | You may appeal. You must appeal within 30 days. | you may appeal . you must appeal within 30 day . | pending | not-started |
| [COND-01](COND-01.json) | in | partial | Apply before June 1 unless you have an extension. | apply before june 1 unless you have extension . | pending | not-started |
| [LEX-01](LEX-01.json) | in | partial | Download the application before submitting your application. | download application before submit your application . | pending | not-started |
| [DOC-01](DOC-01.json) | out | partial | Maria submitted her application. / She can check its status online. | maria submit her application . she can check its status online . | n/a | n/a |
| [HTML-01](HTML-01.json) | out | partial | Required documents / Proof of address / Photo identification | required document proof of address photo identification | n/a | n/a |
| [SEC-01](SEC-01.json) | in | partial | Applications close Friday. | application close friday . | pending | not-started |
| [NAV-01](NAV-01.json) | out | partial | Apply for a licence / Send your form online. | apply for licence send your form online . | n/a | n/a |
| [QTY-01](QTY-01.json) | in | partial | Provide two references and pay $25. | provide two reference and pay $ 25 . | pending | not-started |
| [LINK-01](LINK-01.json) | in | partial | Read the eligibility guidance before applying. | read eligibility guidance before apply . | pending | not-started |
| [TABLE-01](TABLE-01.json) | out | partial | Type Fee Adult $20 | type fee adult $ 20 | n/a | n/a |
| [FORM-01](FORM-01.json) | out | partial | Email address (required) / Fields marked required must be completed. | email address ( require ) field mark require must be complete . | n/a | n/a |
| [STRUCT-HIER](STRUCT-HIER.json) | out | partial | Access guide / Apply / Online / Use the portal. | access guide apply online use portal . | n/a | n/a |
| [STRUCT-NESTED](STRUCT-NESTED.json) | out | partial | Parent / Child / Grandchild | parent child grandchild | n/a | n/a |
| [STRUCT-ORDERED](STRUCT-ORDERED.json) | out | partial | Third / Fourth | third fourth | n/a | n/a |
| [STRUCT-DL](STRUCT-DL.json) | out | partial | Fee / Twenty dollars | fee twenty dollar | n/a | n/a |
| [STRUCT-LINK](STRUCT-LINK.json) | in | partial | Read the rules first. | read rule first . | pending | not-started |
| [STRUCT-LINKS](STRUCT-LINKS.json) | in | partial | First and Second. | first and second . | pending | not-started |
| [STRUCT-TABLE](STRUCT-TABLE.json) | out | partial | Fees Type Fee Adult $20 | fee type fee adult $ 20 | n/a | n/a |
| [STRUCT-TABLE-NOHEAD](STRUCT-TABLE-NOHEAD.json) | out | partial | Adult $20 | adult $ 20 | n/a | n/a |
| [FORM-REQUIRED](FORM-REQUIRED.json) | out | partial | Email address (required) / Use your work email. | email address ( require ) use your work email . | n/a | n/a |
| [FORM-GROUP](FORM-GROUP.json) | out | partial | Contact method / Email Contact method / Phone Contact method | contact method email contact method phone contact method | n/a | n/a |
| [FORM-SELECT](FORM-SELECT.json) | out | partial | Country Canada France | country canada france | n/a | n/a |
| [FORM-TEXTAREA](FORM-TEXTAREA.json) | out | partial | Notes Do not include passwords. | note not include password . | n/a | n/a |
| [FORM-CHECK](FORM-CHECK.json) | out | partial | I agree (required) | i agree ( require ) | n/a | n/a |
| [ARIA-BUTTON](ARIA-BUTTON.json) | out | partial | Close dialog | close dialog | n/a | n/a |
| [ARIA-SECTION](ARIA-SECTION.json) | out | partial | Notice / Notice / Office closed. | notice notice office close . | n/a | n/a |
| [IMG-ALT](IMG-ALT.json) | out | partial | A ramp at the side entrance / Use the side entrance. | ramp at side entrance use side entrance . | n/a | n/a |
| [IMG-DECOR](IMG-DECOR.json) | in | partial | Decorative image above. | decorative image above . | pending | not-started |
| [IMG-NOALT](IMG-NOALT.json) | in | partial | Image without alt. | image without alt . | pending | not-started |
| [QUOTE](QUOTE.json) | in | partial | Access is a right, not a privilege. | access right , not privilege . | pending | not-started |
| [CODE](CODE.json) | out | partial | curl -I https://example.org | curl -i https://example.org | n/a | n/a |
| [BARE-DIV](BARE-DIV.json) | in | partial | Office closes at noon. | office close at noon . | pending | not-started |
| [HIDDEN](HIDDEN.json) | in | partial | Visible notice. | visible notice . | pending | not-started |
| [DETAILS-CLOSED](DETAILS-CLOSED.json) | out | partial | More information | more information | n/a | n/a |
| [DETAILS-OPEN](DETAILS-OPEN.json) | out | partial | More information / Open detail. | more information open detail . | n/a | n/a |
| [UNICODE](UNICODE.json) | in | partial | Résumé — 日本語 — العربية | résumé — 日本語 — العربية | pending | not-started |
| [INJECT](INJECT.json) | in | partial | Safe text. | safe text . | pending | not-started |
| [MIXED](MIXED.json) | out | partial | Notice / Read the guide. / One / Two | notice read guide . one two | n/a | n/a |
| [TABLE-LINK](TABLE-LINK.json) | out | partial | Links Name URL Guide Open guide | link name url guide open guide | n/a | n/a |

Update `review.json` with decisions; do not edit artifacts to make a review pass.
