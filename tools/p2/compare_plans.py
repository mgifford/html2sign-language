#!/usr/bin/env python3
"""Compare committed P2 artifacts with a clean-room run by plan content.

Warnings, provenance, and hashes are intentionally excluded: a clean-room run
may carry different provenance text. Word/gloss/order, source alignment, block
spans, and status must match.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def canonical(artifact: dict) -> dict:
    return {
        "fixtureId": artifact["fixtureId"],
        "status": artifact["status"],
        "blocks": [
            {
                "id": block["id"],
                "path": block["path"],
                "textStart": block["textStart"],
                "textEnd": block["textEnd"],
                "text": block.get("text", ""),
            }
            for block in artifact["source"]["blocks"]
        ],
        "sentences": [
            {
                "tokens": [
                    {
                        "word": token.get("word"),
                        "gloss": token.get("gloss"),
                        "pos": token.get("pos"),
                        "blockId": token.get("blockId"),
                        "sourceStart": token.get("sourceStart"),
                        "sourceEnd": token.get("sourceEnd"),
                        "status": token.get("status"),
                    }
                    for token in sentence["tokens"]
                ],
                "indexes": sentence.get("indexes", []),
            }
            for sentence in artifact["plan"]["sentences"]
        ],
        "alignment": artifact.get("alignment", []),
        "abstentions": artifact.get("abstentions", []),
    }


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Compare committed and clean-room P2 plans")
    parser.add_argument("--committed", type=Path, required=True)
    parser.add_argument("--clean", type=Path, required=True)
    args = parser.parse_args(argv)

    committed_index = load(args.committed / "index.json")
    clean_index = load(args.clean / "index.json")
    committed_ids = [entry["fixtureId"] for entry in committed_index["artifacts"]]
    clean_ids = [entry["fixtureId"] for entry in clean_index["artifacts"]]
    if committed_ids != clean_ids:
        print("fixture ID lists differ", file=sys.stderr)
        print(f"committed: {committed_ids}", file=sys.stderr)
        print(f"clean:     {clean_ids}", file=sys.stderr)
        return 1

    mismatches = 0
    for fixture_id in committed_ids:
        committed = canonical(load(args.committed / f"{fixture_id}.json"))
        clean = canonical(load(args.clean / f"{fixture_id}.json"))
        if committed != clean:
            mismatches += 1
            print(f"MISMATCH {fixture_id}", file=sys.stderr)
    if mismatches:
        print(f"{mismatches} fixture(s) differ", file=sys.stderr)
        return 1
    print(f"all {len(committed_ids)} fixture plans match")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
