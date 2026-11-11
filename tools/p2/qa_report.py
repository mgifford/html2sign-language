#!/usr/bin/env python3
"""Automated P2.4 review-risk flags.

These are technical signals, not owner or linguistic decisions. They do not
accept, reject, or translate anything.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA = REPO_ROOT / "experiments/html-to-asl/data/p2"
STRUCTURAL = {"table", "field", "summary", "caption", "image", "code", "term", "definition", "region"}
PUNCT = re.compile(r"^[^\w]+$", re.UNICODE)


def blocks(artifact):
    return artifact["source"]["blocks"]


def tokens(artifact):
    return [token for sentence in artifact["plan"]["sentences"] for token in sentence["tokens"]]


def flags(artifact):
    result = []
    source_words = sum(len(block.get("text", "").split()) for block in blocks(artifact))
    plan_tokens = tokens(artifact)
    glosses = [token.get("gloss") or "" for token in plan_tokens]

    if artifact.get("status") != "complete":
        result.append("partial")
    if artifact.get("abstentions"):
        result.append(f"abstentions:{len(artifact['abstentions'])}")
    if len(blocks(artifact)) > 1:
        result.append(f"multi-block:{len(blocks(artifact))}")
    structural = sorted({block.get("type", "") for block in blocks(artifact)} & STRUCTURAL)
    if structural:
        result.append("structure:" + ",".join(structural))
    if any(token.get("status") != "aligned" for token in plan_tokens):
        result.append("unaligned-token")
    if not plan_tokens:
        result.append("empty-plan")
    if any(not gloss.strip() for gloss in glosses):
        result.append("empty-gloss")
    if len(glosses) > 1 and any(
        PUNCT.match(glosses[index - 1]) is None
        and PUNCT.match(glosses[index]) is None
        and glosses[index].lower() == glosses[index - 1].lower()
        for index in range(1, len(glosses))
    ):
        result.append("duplicate-adjacent")
    if source_words and (len(plan_tokens) / source_words > 1.5 or len(plan_tokens) / source_words < 0.5):
        result.append("length-ratio")
    return result, source_words, len(plan_tokens)


def severity(flags_):
    if any(flag.startswith(("structure:table", "structure:field", "empty-plan", "unaligned-token")) for flag in flags_):
        return "high"
    if any(flag.startswith(("multi-block", "structure:", "duplicate-adjacent", "empty-gloss", "abstentions:")) for flag in flags_):
        return "medium"
    return "low"


def build(data_dir: Path):
    index = json.loads((data_dir / "index.json").read_text(encoding="utf-8"))
    rows = []
    for entry in index["artifacts"]:
        artifact = json.loads((data_dir / entry["file"]).read_text(encoding="utf-8"))
        flags_, source_words, plan_tokens = flags(artifact)
        rows.append(
            {
                "fixtureId": entry["fixtureId"],
                "status": artifact["status"],
                "blocks": len(blocks(artifact)),
                "sourceWords": source_words,
                "planTokens": plan_tokens,
                "severity": severity(flags_),
                "flags": flags_,
            }
        )
    return rows


def markdown(rows):
    counts = {level: sum(1 for row in rows if row["severity"] == level) for level in ("high", "medium", "low")}
    lines = [
        "# P2 automated review-risk report",
        "",
        "Status: **advisory only.** These flags are technical signals, not owner or linguistic decisions. They do not accept, reject, or translate anything.",
        "",
        f"- 40 development artifacts; high: **{counts['high']}**, medium: **{counts['medium']}**, low: **{counts['low']}**.",
        "- Scope: 16 single-block prose fixtures are in scope; 24 structural fixtures are out of scope for P2/P3/P4. Flags below cover all 40 for transparency.",
        "- All artifacts remain `partial` lexical plans; **not ASL**.",
        "- Owner alignment and independent Deaf ASL review remain pending in `review.json`.",
        "",
        "| Fixture | Severity | Blocks | Source words | Plan tokens | Flags |",
        "|---|---|---|---|---|---|",
    ]
    for row in rows:
        lines.append(
            f"| [{row['fixtureId']}]({row['fixtureId']}.json) | {row['severity']} | {row['blocks']} | "
            f"{row['sourceWords']} | {row['planTokens']} | {', '.join(row['flags']) or 'none'} |"
        )
    lines += ["", "Flags: `structure:*` means a table, form field, caption, image, code, term, definition, or region; `multi-block` means more than one extracted block; `length-ratio` means the plan/source word ratio is outside 0.5–1.5; `partial` means the upstream plan is not complete. Use these signals to focus human review, not to replace it.", ""]
    return "\n".join(lines)


def main(argv=None):
    parser = argparse.ArgumentParser(description="Generate advisory P2 review-risk flags")
    parser.add_argument("--data-dir", type=Path, default=DATA)
    parser.add_argument("--markdown", type=Path, default=DATA / "review-qa.md")
    parser.add_argument("--json", type=Path, default=DATA / "review-qa.json")
    args = parser.parse_args(argv)
    rows = build(args.data_dir)
    args.markdown.write_text(markdown(rows), encoding="utf-8")
    args.json.write_text(json.dumps({"schemaVersion": "p2.4-qa", "artifactCount": len(rows), "artifacts": rows}, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {len(rows)} advisory rows")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
