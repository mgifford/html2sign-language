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


def validate_review(data: Any) -> list[str]:
    errors: list[str] = []
    if not isinstance(data, dict):
        return ["review must be an object"]
    if data.get("schemaVersion") != "p2.4-review":
        errors.append("schemaVersion must be p2.4-review")
    if data.get("status") not in {"pending", "in-review", "complete", "rejected"}:
        errors.append("status is invalid")
    if data.get("artifactCount") != 40:
        errors.append("artifactCount must be 40")
    for role in ("owner", "independent"):
        review = data.get(role)
        if not isinstance(review, dict):
            errors.append(f"{role} must be an object")
            continue
        if review.get("status") not in {"pending", "in-review", "accepted", "rejected"}:
            errors.append(f"{role}.status is invalid")
        if review.get("reviewer") is not None and not isinstance(review.get("reviewer"), str):
            errors.append(f"{role}.reviewer must be a string or null")
        if not isinstance(review.get("notes"), str):
            errors.append(f"{role}.notes must be a string")
    fixtures = data.get("fixtures")
    if not isinstance(fixtures, list) or len(fixtures) != 40:
        errors.append("fixtures must contain exactly 40 entries")
    else:
        seen = set()
        for fixture in fixtures:
            if not isinstance(fixture, dict):
                errors.append("fixture review entries must be objects")
                continue
            fixture_id = fixture.get("fixtureId")
            if not isinstance(fixture_id, str) or not fixture_id:
                errors.append("fixtureId must be a non-empty string")
            elif fixture_id in seen:
                errors.append(f"duplicate fixtureId: {fixture_id}")
            else:
                seen.add(fixture_id)
            scope = fixture.get("scope")
            if scope not in {"in-scope", "out-of-scope"}:
                errors.append(f"invalid scope for {fixture_id}")
            if fixture.get("ownerStatus") not in {"pending", "accepted", "rejected", "needs-discussion", "not-applicable"}:
                errors.append(f"invalid ownerStatus for {fixture_id}")
            if fixture.get("linguisticStatus") not in {"not-started", "accepted", "rejected", "needs-discussion", "not-applicable"}:
                errors.append(f"invalid linguisticStatus for {fixture_id}")
            if scope == "out-of-scope":
                if fixture.get("ownerStatus") != "not-applicable" or fixture.get("linguisticStatus") != "not-applicable":
                    errors.append(f"out-of-scope fixture {fixture_id} must be not-applicable")
            if scope == "in-scope" and (
                fixture.get("ownerStatus") == "not-applicable" or fixture.get("linguisticStatus") == "not-applicable"
            ):
                errors.append(f"in-scope fixture {fixture_id} must not be not-applicable")
            for key in ("ownerNotes", "linguisticNotes"):
                if not isinstance(fixture.get(key), str):
                    errors.append(f"{key} must be a string for {fixture_id}")
    if not isinstance(data.get("warnings"), list):
        errors.append("warnings must be an array")

    if isinstance(fixtures, list):
        in_scope = [
            fixture
            for fixture in fixtures
            if isinstance(fixture, dict) and fixture.get("scope") == "in-scope"
        ]
        owner_states = [fixture.get("ownerStatus") for fixture in in_scope]
        linguistic_states = [fixture.get("linguisticStatus") for fixture in in_scope]
        owner_status = data.get("owner", {}).get("status") if isinstance(data.get("owner"), dict) else None
        independent_status = data.get("independent", {}).get("status") if isinstance(data.get("independent"), dict) else None
        overall = data.get("status")

        if owner_status == "accepted" and any(state != "accepted" for state in owner_states):
            errors.append("owner.status accepted requires every in-scope fixture accepted")
        if owner_status == "pending" and any(state in {"accepted", "rejected", "needs-discussion"} for state in owner_states):
            errors.append("owner.status pending conflicts with in-scope owner decisions")
        if owner_status == "rejected" and "rejected" not in owner_states:
            errors.append("owner.status rejected requires a rejected in-scope fixture")
        if independent_status == "accepted" and "accepted" not in linguistic_states:
            errors.append("independent.status accepted requires at least one accepted linguistic decision")
        if independent_status == "pending" and any(state in {"accepted", "rejected", "needs-discussion"} for state in linguistic_states):
            errors.append("independent.status pending conflicts with in-scope linguistic decisions")
        if independent_status == "rejected" and "rejected" not in linguistic_states:
            errors.append("independent.status rejected requires a rejected linguistic decision")
        if overall == "complete" and not (owner_status == "accepted" and independent_status == "accepted"):
            errors.append("overall complete requires both owner and independent accepted")
        if overall != "rejected" and (owner_status == "rejected" or independent_status == "rejected"):
            errors.append("overall status must be rejected when either review is rejected")
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
