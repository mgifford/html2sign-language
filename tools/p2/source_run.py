#!/usr/bin/env python3
"""Research-only source run for P2 artifacts.

This is NOT the image-pinned precompute path. It calls a running local WSD
service and the pinned Python modules directly, then writes p2.0 artifacts.
It is recorded so the P2.2 source-run artifacts can be reproduced; it must not
be run in a public deployment or fed to an avatar.

Usage:
  python tools/p2/source_run.py --allow-source-run \
    --p1-json /tmp/p1-all.json --wsd-url http://127.0.0.1:8131/disambiguate \
    --output experiments/html-to-asl/data/p2
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).resolve().parent))
import precompute  # noqa: E402
from spoken_to_signed.text_to_gloss.senses import senses_to_gloss  # noqa: E402

UPSTREAM = {
    "repository": "sign-language-processing/spoken-to-signed-translation",
    "commit": "fec7ac393989f4b6541ab5f860819262a54f27c7",
    "license": "MIT",
    "wsdModel": "sign/Ettin-150m-WSD",
    "wsdRevision": "8751b577199d1bb95b74fa2457da7065d57100ae",
    "wordnet": "omw-en:1.4",
    "spacyModel": "en_core_web_lg@3.8.0 (spaCy 3.8.16)",
}


def sha256(value) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=True).encode()).hexdigest()


def source_blocks(blocks):
    return [
        {
            "id": block["id"],
            "type": block.get("type", ""),
            "path": block["source"]["path"],
            "textStart": block["source"]["textStart"],
            "textEnd": block["source"]["textEnd"],
            "text": block["text"],
        }
        for block in blocks
    ]


def finalize(artifact):
    artifact["hashes"]["outputSha256"] = ""
    artifact["hashes"]["outputSha256"] = sha256(artifact)
    return artifact


def failed(fixture_id, p1, reason):
    artifact = {
        "schemaVersion": "p2.0",
        "fixtureId": fixture_id,
        "translation": False,
        "source": {"p1SchemaVersion": "0.3.0", "inputSha256": sha256(p1), "blocks": source_blocks(p1["blocks"])},
        "upstream": UPSTREAM,
        "language": {"spoken": "en", "signed": "ase"},
        "plan": {"sentences": []},
        "alignment": [],
        "status": "failed",
        "abstentions": [],
        "warnings": ["Lexical plan only, not ASL.", reason],
        "hashes": {"inputSha256": sha256(p1), "outputSha256": ""},
    }
    return finalize(artifact)


def build(p1, wsd_url):
    fixture_id = p1["fixtureId"]
    blocks = p1["blocks"]
    combined = "\n".join(block["text"] for block in blocks)
    spans, cursor = [], 0
    for block in blocks:
        start = cursor
        end = start + len(block["text"])
        spans.append((start, end, block))
        cursor = end + 1

    response = requests.get(wsd_url, params={"text": combined, "lang": "en"}, timeout=120)
    response.raise_for_status()
    plan = senses_to_gloss(response.json())

    sentences, alignment, abstentions = [], [], []
    candidate_index = 0
    for index, sentence in enumerate(plan["sentences"]):
        tokens = []
        for candidate in sentence:
            source = candidate["source"]["tokens"]
            start_char, end_char = source[0]["start_char"], source[-1]["end_char"]
            block = next((b for s, e, b in spans if s <= start_char and end_char <= e), None)
            if block is None:
                block = next((b for s, e, b in spans if s <= start_char <= e), None)
            if block is None:
                abstentions.append({"reason": "candidate does not map to a P1 block", "sourceStart": start_char, "sourceEnd": end_char})
            else:
                alignment.append({"candidateIndex": candidate_index, "blockId": block["id"], "sourceStart": start_char, "sourceEnd": end_char})
            tokens.append(
                {
                    "word": candidate["word"],
                    "lemma": source[0].get("lemma", candidate["word"]),
                    "pos": candidate["pos"],
                    "dep": source[0].get("dep", ""),
                    "head": source[0].get("head", -1),
                    "blockId": block["id"] if block else "b0001",
                    "sourceStart": start_char,
                    "sourceEnd": end_char,
                    "status": "aligned" if block else "abstained",
                    "gloss": candidate["gloss"],
                }
            )
            candidate_index += 1
        sentences.append({"tokens": tokens, "indexes": plan["indexes"][index], "changes": plan["changes"], "notes": plan["notes"]})

    notes = [note.get("code", str(note)) for note in plan["notes"]]
    artifact = {
        "schemaVersion": "p2.0",
        "fixtureId": fixture_id,
        "translation": False,
        "source": {"p1SchemaVersion": "0.3.0", "inputSha256": sha256(p1), "blocks": source_blocks(blocks)},
        "upstream": UPSTREAM,
        "language": {"spoken": "en", "signed": "ase"},
        "plan": {"sentences": sentences},
        "alignment": alignment,
        "status": "complete" if alignment and not abstentions and "semantic-rules-unavailable" not in notes else "partial",
        "abstentions": abstentions,
        "warnings": [
            "Lexical plan only, not ASL. Nonmanual markers and spatial grammar are not represented.",
            "Source-run prototype; not the image-pinned precompute path.",
            "Owner alignment review is pending.",
            "WSD model output was generated locally and is not committed.",
        ],
        "hashes": {"inputSha256": sha256(p1), "outputSha256": ""},
    }
    if "semantic-rules-unavailable" in notes:
        artifact["warnings"].append("Upstream reports semantic-rules-unavailable; temporal/infinitive rules were skipped.")
    return finalize(artifact)


def main(argv=None):
    parser = argparse.ArgumentParser(description="Research-only P2 source run")
    parser.add_argument("--allow-source-run", action="store_true", help="required acknowledgement that this is not the image-pinned path")
    parser.add_argument("--p1-json", type=Path, required=True, help="JSON array of {fixtureId, blocks}")
    parser.add_argument("--wsd-url", required=True, help="local WSD /disambiguate URL")
    parser.add_argument("--output", type=Path, required=True, help="artifact directory")
    args = parser.parse_args(argv)
    if not args.allow_source_run:
        parser.error("--allow-source-run is required; this bypasses the image-pinned path")

    pins = json.loads((Path(__file__).resolve().parent / "pins.json").read_text(encoding="utf-8"))
    missing = precompute.missing_prerequisites(pins)
    if missing:
        raise SystemExit("P2 source run refused: " + "; ".join(missing))

    fixtures = json.loads(args.p1_json.read_text(encoding="utf-8"))
    args.output.mkdir(parents=True, exist_ok=True)
    entries = []
    for p1 in fixtures:
        try:
            artifact = build(p1, args.wsd_url)
        except Exception as error:  # fail closed, but write an explicit failed artifact
            artifact = failed(p1["fixtureId"], p1, f"Source run failed: {type(error).__name__}: {error}")
        (args.output / f"{p1['fixtureId']}.json").write_text(json.dumps(artifact, indent=2) + "\n", encoding="utf-8")
        entries.append(
            {
                "fixtureId": artifact["fixtureId"],
                "file": f"{p1['fixtureId']}.json",
                "status": artifact["status"],
                "outputSha256": artifact["hashes"]["outputSha256"],
            }
        )
        print(artifact["fixtureId"], artifact["status"], len(artifact["alignment"]), len(artifact["abstentions"]))
    index = {
        "schemaVersion": "p2.0",
        "status": "partial" if any(entry["status"] != "complete" for entry in entries) else "complete",
        "translation": False,
        "artifacts": entries,
        "warnings": [
            "P2.2 source-run artifacts; owner alignment review and image-pinned reproducibility remain open.",
            "Lexical plans only. Nonmanual markers, spatial grammar, and ASL fluency are not represented.",
        ],
    }
    (args.output / "index.json").write_text(json.dumps(index, indent=2) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
