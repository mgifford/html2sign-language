# 3D-LEX: integration strategy and attribution

**Reference:** Oline Ranum, Gomèr Otterspeer, Jari I. Andersen, Robert G. Belleman, Floris Roelofsen. (2024). *3D-LEX v1.0: 3D Lexicons for American Sign Language and Sign Language of the Netherlands*. LREC-COLING Sign Language Workshop. https://aclanthology.org/2024.signlang-1.33/

**Code:** https://github.com/OlineRanum/SAPA (MIT, stated in README).
**Dataset:** https://osf.io/g7u9c/ (CC BY 4.0 listed at https://www.sign-lang.uni-hamburg.de/lrec/data/3dlexv10.html).
**Project:** https://olineranum.github.io/SAPA/

The repository's README states that the full dataset will be made public and says to contact authors for access. That does not guarantee an immediately available bulk download. Verify the current data availability, individual asset permissions, performer consent provisions, and file schemas before downloading or redistribution. No motion files are in this starter.

3D-LEX contains recorded isolated signs, not an English→fluent-ASL translator. Hand/body/face streams may be in different capture coordinate systems and require alignment. Do not assume compatibility with the repository's Rocketbox or SMPL-X pipeline.

## Proposed future adapter

An opt-in offline CLI, NOT part of P0:

```text
input: user-supplied, licensed 3D-LEX dataset location
 -> verify declared files, provenance and signatures
 -> inspect streams/frame rates/unit conventions and timestamps
 -> normalize to documented intermediate representation
 -> retarget one sign onto existing Rocketbox avatar (separate P5)
 -> structural + temporal checks
 -> render diagnostic preview and request Deaf signer review
output: manifest + original source identifiers + warnings + local preview
```

The adapter must refuse unknown formats rather than guessing axes, face indices or hand joint correspondence. Never generate a fake sign to fill a missing asset. Do not bundle the input dataset in GitHub Pages by default.

## Research questions

1. Can ASL gloss IDs be unambiguously mapped to 3D-LEX items and ASL-LEX references, accounting for variants?
2. Are handshapes, body and facial channels synchronized and exportable under the actual dataset's terms?
3. Can one sample be retargeted without losing handshape and facial features?
4. Does a Deaf ASL reviewer recognize the isolated sign without showing its gloss?
5. Does the resulting file permit acceptable mobile-size performance?
