#!/usr/bin/env python3
"""Build a descriptive P3.2 comparison from recorded runs and P2 plans.

This compares counts/alignment/status only. It does not measure ASL quality,
semantic equivalence, or comprehension.
"""

from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def plan_metrics(artifact):
    if not isinstance(artifact, dict):
        return None
    tokens = [t for s in artifact.get("plan", {}).get("sentences", []) for t in s.get("tokens", [])]
    return {
        "status": artifact.get("status"),
        "tokens": len(tokens),
        "aligned": sum(1 for t in tokens if t.get("status") == "aligned"),
        "abstentions": len(artifact.get("abstentions", [])),
        "blockIds": sorted({t.get("blockId") for t in tokens if t.get("blockId")}),
    }


def build(runs_path: Path, original_dir: Path, simplified_dir: Path):
    runs = load(runs_path)
    fixtures = []
    for item in runs.get("fixtures", []):
        fixture_id = item["fixtureId"]
        valid = [run for run in item["runs"] if run.get("valid")]
        simplified_texts = [run.get("simplified", "") for run in valid]
        stability = len(set(simplified_texts)) if simplified_texts else 0
        chosen = valid[0] if valid else None
        original = load(original_dir / f"{fixture_id}.json")
        simplified_path = simplified_dir / f"P3-{fixture_id}.json"
        if not simplified_path.exists():
            simplified_path = simplified_dir / f"{fixture_id}.json"
        simplified = load(simplified_path) if chosen and simplified_path.exists() else None
        om = plan_metrics(original)
        sm = plan_metrics(simplified)
        original_words = len(item.get("original", "").split())
        simplified_words = len(chosen.get("simplified", "").split()) if chosen else 0
        fixtures.append(
            {
                "fixtureId": fixture_id,
                "original": item.get("original", ""),
                "simplified": chosen.get("simplified", "") if chosen else "",
                "validRuns": len(valid),
                "totalRuns": len(item["runs"]),
                "distinctValidOutputs": stability,
                "criticalMissing": chosen.get("semantic", {}).get("missing", []) if chosen else [],
                "originalPlan": om,
                "simplifiedPlan": sm,
                "tokenDelta": (sm["tokens"] - om["tokens"]) if sm and om else None,
                "tokenRatio": round(sm["tokens"] / om["tokens"], 3) if sm and om and om["tokens"] else None,
                "originalSourceWords": original_words,
                "simplifiedSourceWords": simplified_words,
                "originalTokensPerWord": round(om["tokens"] / original_words, 3) if om and original_words else None,
                "simplifiedTokensPerWord": round(sm["tokens"] / simplified_words, 3) if sm and simplified_words else None,
            }
        )
    return {
        "schemaVersion": "p3.2-comparison",
        "status": "descriptive",
        "disclaimer": "Counts and alignment only. This is not an ASL quality, semantic-equivalence, or comprehension measure. Lexical plans are not ASL.",
        "model": runs.get("model"),
        "environment": runs.get("environment"),
        "fixtures": fixtures,
        "summary": {
            "fixtures": len(fixtures),
            "validRuns": sum(item["validRuns"] for item in fixtures),
            "totalRuns": sum(item["totalRuns"] for item in fixtures),
            "allFiveValid": sum(1 for item in fixtures if item["validRuns"] == 5),
            "statusCounts": dict(Counter((item["simplifiedPlan"] or {}).get("status") for item in fixtures)),
        },
    }


def main(argv=None):
    parser = argparse.ArgumentParser(description="Build P3.2 descriptive comparison")
    parser.add_argument("--runs", type=Path, required=True)
    parser.add_argument("--original", type=Path, required=True)
    parser.add_argument("--simplified", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args(argv)
    result = build(args.runs, args.original, args.simplified)
    args.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {len(result['fixtures'])} fixtures")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
