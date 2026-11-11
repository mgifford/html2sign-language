#!/usr/bin/env python3
"""Validate constrained P4 model output against a P1 block.

This validator is deliberately strict: a model plan that invents tokens,
leaves source spans, or adds unknown keys is a failure, not a best-effort plan.
It does not generate or review ASL.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

TOKEN_KEYS = {"word", "gloss", "pos", "blockId", "sourceStart", "sourceEnd"}
PLAN_KEYS = {"fixtureId", "sentences"}
SENTENCE_KEYS = {"tokens"}


def _span(block):
    source = block.get("source", {})
    start = source.get("textStart", block.get("textStart"))
    end = source.get("textEnd", block.get("textEnd"))
    return start, end


def validate_model_plan(plan, p1) -> list[str]:
    errors: list[str] = []
    if not isinstance(plan, dict):
        return ["plan must be an object"]
    if set(plan) != PLAN_KEYS:
        errors.append(f"plan keys must be exactly {sorted(PLAN_KEYS)}")
    if plan.get("fixtureId") != p1.get("fixtureId"):
        errors.append("fixtureId does not match the P1 fixture")
    blocks = {block["id"]: block for block in p1.get("blocks", []) if isinstance(block, dict) and "id" in block}
    sentences = plan.get("sentences")
    if not isinstance(sentences, list) or not sentences:
        errors.append("sentences must be a non-empty array")
        return errors
    for sentence_index, sentence in enumerate(sentences):
        if not isinstance(sentence, dict) or set(sentence) != SENTENCE_KEYS:
            errors.append(f"sentences[{sentence_index}] must contain only tokens")
            continue
        tokens = sentence.get("tokens")
        if not isinstance(tokens, list) or not tokens:
            errors.append(f"sentences[{sentence_index}].tokens must be a non-empty array")
            continue
        for token_index, token in enumerate(tokens):
            where = f"sentences[{sentence_index}].tokens[{token_index}]"
            if not isinstance(token, dict):
                errors.append(f"{where} must be an object")
                continue
            if set(token) != TOKEN_KEYS:
                errors.append(f"{where} keys must be exactly {sorted(TOKEN_KEYS)}")
                continue
            block = blocks.get(token["blockId"])
            if block is None:
                errors.append(f"{where} blockId is not in P1")
                continue
            for key in ("word", "gloss", "pos", "blockId"):
                if not isinstance(token[key], str) or not token[key].strip():
                    errors.append(f"{where}.{key} must be a non-empty string")
            start, end = token["sourceStart"], token["sourceEnd"]
            if not isinstance(start, int) or not isinstance(end, int):
                errors.append(f"{where} source spans must be integers")
                continue
            block_start, block_end = _span(block)
            if not isinstance(block_start, int) or not isinstance(block_end, int):
                errors.append(f"{where} P1 block has no integer span")
                continue
            if not (block_start <= start < end <= block_end):
                errors.append(f"{where} source span is outside the P1 block")
                continue
            text = block.get("text", "")
            if text[start - block_start:end - block_start] != token["word"]:
                errors.append(f"{where}.word does not match the source span")
    return errors


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Validate a constrained P4 model plan")
    parser.add_argument("--p1", type=Path, required=True, help="P1 fixture JSON")
    parser.add_argument("--plan", type=Path, required=True, help="model plan JSON")
    args = parser.parse_args(argv)
    p1 = json.loads(args.p1.read_text(encoding="utf-8"))
    plan = json.loads(args.plan.read_text(encoding="utf-8"))
    errors = validate_model_plan(plan, p1)
    if errors:
        print("\n".join(errors))
        return 1
    print("model plan is valid")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
