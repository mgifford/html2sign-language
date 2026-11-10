"""Minimal validators for the P2.0 artifact/index contracts.

The JSON Schema files are the normative contracts. These checks give the
P2.0 tests and the precompute CLI a dependency-free way to reject the most
important contract violations without adding `jsonschema` to the repository.
"""

from __future__ import annotations

import re
from typing import Any

SHA256 = re.compile(r"^[0-9a-f]{64}$")
BLOCK_ID = re.compile(r"^b[0-9]{4}$")
TOKEN_KEYS = ("word", "lemma", "pos", "dep", "head", "blockId", "sourceStart", "sourceEnd")


def validate_artifact(data: Any) -> list[str]:
    errors: list[str] = []
    if not isinstance(data, dict):
        return ["artifact must be an object"]

    if data.get("schemaVersion") != "p2.0":
        errors.append("schemaVersion must be p2.0")
    if not isinstance(data.get("fixtureId"), str) or not data.get("fixtureId"):
        errors.append("fixtureId must be a non-empty string")
    if data.get("translation") is not False:
        errors.append("translation must be false")

    source = data.get("source")
    if not isinstance(source, dict):
        errors.append("source must be an object")
    else:
        if source.get("p1SchemaVersion") != "0.3.0":
            errors.append("source.p1SchemaVersion must be 0.3.0")
        if not isinstance(source.get("inputSha256"), str) or not SHA256.fullmatch(source["inputSha256"]):
            errors.append("source.inputSha256 must be a SHA-256 hex string")
        blocks = source.get("blocks")
        if not isinstance(blocks, list) or not blocks:
            errors.append("source.blocks must be a non-empty array")
        else:
            for block in blocks:
                if not isinstance(block, dict):
                    errors.append("source.blocks entries must be objects")
                    continue
                if not BLOCK_ID.fullmatch(str(block.get("id", ""))):
                    errors.append(f"invalid block id: {block.get('id')}")
                if not isinstance(block.get("path"), str) or not block.get("path"):
                    errors.append(f"missing path for block {block.get('id')}")
                for key in ("textStart", "textEnd"):
                    if not isinstance(block.get(key), int) or block[key] < 0:
                        errors.append(f"invalid {key} for block {block.get('id')}")

    upstream = data.get("upstream")
    if not isinstance(upstream, dict):
        errors.append("upstream must be an object")
    else:
        for key in ("repository", "commit", "license", "wsdModel", "wsdRevision", "wordnet", "spacyModel"):
            if not isinstance(upstream.get(key), str) or not upstream.get(key):
                errors.append(f"upstream.{key} must be a non-empty string")
        if isinstance(upstream.get("commit"), str) and not re.fullmatch(r"[0-9a-f]{40}", upstream["commit"]):
            errors.append("upstream.commit must be a 40-character hex SHA")

    language = data.get("language")
    if not isinstance(language, dict) or language.get("spoken") != "en" or language.get("signed") != "ase":
        errors.append("language must be {spoken: en, signed: ase}")

    plan = data.get("plan")
    sentences = plan.get("sentences") if isinstance(plan, dict) else None
    if not isinstance(sentences, list):
        errors.append("plan.sentences must be an array")
        sentences = []
    for index, sentence in enumerate(sentences):
        if not isinstance(sentence, dict):
            errors.append(f"plan.sentences[{index}] must be an object")
            continue
        tokens = sentence.get("tokens")
        if not isinstance(tokens, list):
            errors.append(f"plan.sentences[{index}].tokens must be an array")
            continue
        for token in tokens:
            if not isinstance(token, dict):
                errors.append(f"plan.sentences[{index}] token must be an object")
                continue
            for key in TOKEN_KEYS:
                if key not in token:
                    errors.append(f"token missing {key}")
            if not BLOCK_ID.fullmatch(str(token.get("blockId", ""))):
                errors.append(f"token has invalid blockId: {token.get('blockId')}")

    status = data.get("status")
    if status not in {"complete", "partial", "failed"}:
        errors.append("status must be complete, partial, or failed")
    if status in {"complete", "partial"} and not sentences:
        errors.append(f"status {status} requires at least one sentence")

    alignment = data.get("alignment")
    if not isinstance(alignment, list):
        errors.append("alignment must be an array")
    else:
        for item in alignment:
            if not isinstance(item, dict):
                errors.append("alignment entries must be objects")
                continue
            if not isinstance(item.get("candidateIndex"), int) or item["candidateIndex"] < 0:
                errors.append("alignment.candidateIndex must be a non-negative integer")
            if not BLOCK_ID.fullmatch(str(item.get("blockId", ""))):
                errors.append(f"alignment has invalid blockId: {item.get('blockId')}")

    if not isinstance(data.get("warnings"), list):
        errors.append("warnings must be an array")
    if not isinstance(data.get("abstentions"), list):
        errors.append("abstentions must be an array")

    hashes = data.get("hashes")
    if not isinstance(hashes, dict):
        errors.append("hashes must be an object")
    else:
        for key in ("inputSha256", "outputSha256"):
            if not isinstance(hashes.get(key), str) or not SHA256.fullmatch(hashes[key]):
                errors.append(f"hashes.{key} must be a SHA-256 hex string")

    return errors


def validate_index(data: Any) -> list[str]:
    errors: list[str] = []
    if not isinstance(data, dict):
        return ["index must be an object"]
    if data.get("schemaVersion") != "p2.0":
        errors.append("schemaVersion must be p2.0")
    if data.get("status") not in {"empty", "partial", "complete", "failed"}:
        errors.append("status must be empty, partial, complete, or failed")
    if data.get("translation") is not False:
        errors.append("translation must be false")
    artifacts = data.get("artifacts")
    if not isinstance(artifacts, list):
        errors.append("artifacts must be an array")
    else:
        for item in artifacts:
            if not isinstance(item, dict):
                errors.append("artifacts entries must be objects")
                continue
            for key in ("fixtureId", "file"):
                if not isinstance(item.get(key), str) or not item.get(key):
                    errors.append(f"artifact missing {key}")
            if not isinstance(item.get("outputSha256"), str) or not SHA256.fullmatch(item["outputSha256"]):
                errors.append("artifact outputSha256 must be a SHA-256 hex string")
            if item.get("status") not in {"complete", "partial", "failed"}:
                errors.append("artifact status is invalid")
    if not isinstance(data.get("warnings"), list):
        errors.append("warnings must be an array")
    return errors
