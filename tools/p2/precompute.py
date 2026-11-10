#!/usr/bin/env python3
"""P2.0 fail-closed precompute scaffold.

This does not run upstream, a WSD model, or WordNet. It validates the pin
record and refuses to write a lexical plan until every prerequisite is approved
and installed. P2.1 adds the actual precompute path.
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import re
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
TOOL_DIR = Path(__file__).resolve().parent
PINS_PATH = TOOL_DIR / "pins.json"
PINS_SCHEMA_PATH = TOOL_DIR / "pins.schema.json"
ARTIFACT_SCHEMA_PATH = TOOL_DIR / "artifact.schema.json"
INDEX_SCHEMA_PATH = TOOL_DIR / "index.schema.json"
MANIFEST_PATH = ROOT / "experiments/html-to-asl/fixtures/manifest.json"
HOLDOUT_PATH = ROOT / "experiments/html-to-asl/fixtures/holdout.json"
DATA_DIR = ROOT / "experiments/html-to-asl/data/p2"

REQUIRED_SECTIONS = ("upstream", "python", "wsd", "wordnet", "spacy", "artifacts")


class PinError(Exception):
    """The pin record is malformed or an input is not allowed."""


def load_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise PinError(f"missing file: {path}") from error
    except json.JSONDecodeError as error:
        raise PinError(f"invalid JSON in {path}: {error}") from error


def validate_pins(pins: Any) -> list[str]:
    errors: list[str] = []
    if not isinstance(pins, dict):
        return ["pin record must be an object"]
    if pins.get("schemaVersion") != "p2.0":
        errors.append("schemaVersion must be p2.0")
    if pins.get("status") not in {"candidate", "approved", "blocked"}:
        errors.append("status must be candidate, approved, or blocked")
    for section in REQUIRED_SECTIONS:
        if not isinstance(pins.get(section), dict):
            errors.append(f"missing object: {section}")

    upstream = pins.get("upstream", {})
    if not isinstance(upstream.get("commit"), str) or not re.fullmatch(r"[0-9a-f]{40}", upstream.get("commit", "")):
        errors.append("upstream.commit must be a 40-character lowercase hex SHA")
    for key in ("repository", "license", "entryPoint"):
        if not isinstance(upstream.get(key), str) or not upstream.get(key):
            errors.append(f"upstream.{key} must be a non-empty string")
    if not isinstance(upstream.get("approved"), bool):
        errors.append("upstream.approved must be a boolean")

    python = pins.get("python", {})
    if not isinstance(python.get("requires"), str) or not python.get("requires"):
        errors.append("python.requires must be a non-empty string")

    wsd = pins.get("wsd", {})
    if not isinstance(wsd.get("model"), str) or not wsd.get("model"):
        errors.append("wsd.model must be a non-empty string")
    for key in ("revision", "license"):
        if wsd.get(key) is not None and not isinstance(wsd.get(key), str):
            errors.append(f"wsd.{key} must be a string or null")
    if not isinstance(wsd.get("approved"), bool):
        errors.append("wsd.approved must be a boolean")
    wsd_code = wsd.get("code")
    if not isinstance(wsd_code, dict):
        errors.append("wsd.code must be an object")
    else:
        if not isinstance(wsd_code.get("repository"), str) or not wsd_code.get("repository"):
            errors.append("wsd.code.repository must be a non-empty string")
        if not isinstance(wsd_code.get("commit"), str) or not re.fullmatch(r"[0-9a-f]{40}", wsd_code.get("commit", "")):
            errors.append("wsd.code.commit must be a 40-character lowercase hex SHA")
        if not isinstance(wsd_code.get("license"), str) or not wsd_code.get("license"):
            errors.append("wsd.code.license must be a non-empty string")
    if not isinstance(wsd.get("serving"), str) or not wsd.get("serving"):
        errors.append("wsd.serving must be a non-empty string")

    wordnet = pins.get("wordnet", {})
    for key in ("version", "source", "license"):
        if wordnet.get(key) is not None and not isinstance(wordnet.get(key), str):
            errors.append(f"wordnet.{key} must be a string or null")
    if not isinstance(wordnet.get("approved"), bool):
        errors.append("wordnet.approved must be a boolean")
    wordnet_api = wordnet.get("api")
    if not isinstance(wordnet_api, dict):
        errors.append("wordnet.api must be an object")
    else:
        if not isinstance(wordnet_api.get("repository"), str) or not wordnet_api.get("repository"):
            errors.append("wordnet.api.repository must be a non-empty string")
        if not isinstance(wordnet_api.get("commit"), str) or not re.fullmatch(r"[0-9a-f]{40}", wordnet_api.get("commit", "")):
            errors.append("wordnet.api.commit must be a 40-character lowercase hex SHA")
        if not isinstance(wordnet_api.get("license"), str) or not wordnet_api.get("license"):
            errors.append("wordnet.api.license must be a non-empty string")

    spacy = pins.get("spacy", {})
    if not isinstance(spacy.get("model"), str) or not spacy.get("model"):
        errors.append("spacy.model must be a non-empty string")
    if not isinstance(spacy.get("version"), str) or not spacy.get("version"):
        errors.append("spacy.version must be a non-empty string")
    if not isinstance(spacy.get("license"), str) or not spacy.get("license"):
        errors.append("spacy.license must be a non-empty string")
    if not isinstance(spacy.get("approved"), bool):
        errors.append("spacy.approved must be a boolean")

    artifacts = pins.get("artifacts", {})
    if artifacts.get("mode") not in {"committed-json", "ci-artifact"}:
        errors.append("artifacts.mode must be committed-json or ci-artifact")
    if not isinstance(artifacts.get("directory"), str) or not artifacts.get("directory"):
        errors.append("artifacts.directory must be a non-empty string")
    if not isinstance(artifacts.get("approved"), bool):
        errors.append("artifacts.approved must be a boolean")

    for schema_path in (PINS_SCHEMA_PATH, ARTIFACT_SCHEMA_PATH, INDEX_SCHEMA_PATH):
        try:
            load_json(schema_path)
        except PinError as error:
            errors.append(str(error))
    return errors


def python_supported(requires: str, version: tuple[int, int] | None = None) -> bool:
    current = version or sys.version_info[:2]
    match = re.fullmatch(r">=(\d+)\.(\d+),<(\d+)\.(\d+)", requires)
    if not match:
        return False
    low_major, low_minor, high_major, high_minor = (int(part) for part in match.groups())
    return (low_major, low_minor) <= current < (high_major, high_minor)


def module_importable(name: str) -> bool:
    try:
        importlib.import_module(name)
        return True
    except Exception:
        return False


def missing_prerequisites(
    pins: dict[str, Any],
    version: tuple[int, int] | None = None,
    module_exists=None,
) -> list[str]:
    exists = module_exists or module_importable
    missing: list[str] = []

    upstream = pins.get("upstream", {})
    if not upstream.get("approved"):
        missing.append("upstream commit/licence not approved")
    wsd = pins.get("wsd", {})
    if not wsd.get("approved"):
        missing.append("WSD model not approved")
    if not wsd.get("revision"):
        missing.append("WSD revision not pinned")
    if not wsd.get("license"):
        missing.append("WSD licence not recorded")
    if not wsd.get("code", {}).get("license"):
        missing.append("WSD code licence not recorded")
    wordnet = pins.get("wordnet", {})
    if not wordnet.get("approved"):
        missing.append("WordNet resource not approved")
    if not wordnet.get("license"):
        missing.append("WordNet data licence not recorded")
    spacy = pins.get("spacy", {})
    if not spacy.get("approved"):
        missing.append("spaCy model not approved")
    if not spacy.get("license"):
        missing.append("spaCy model licence not recorded")
    artifacts = pins.get("artifacts", {})
    if not artifacts.get("approved"):
        missing.append("artifact publication policy not approved")

    if not python_supported(pins.get("python", {}).get("requires", ""), version):
        missing.append(f"Python {pins.get('python', {}).get('requires')} is not available (running {sys.version.split()[0]})")
    for module in ("spacy", "spoken_to_signed"):
        if not exists(module):
            missing.append(f"Python module not installed: {module}")
    return missing


def fixture_sets() -> tuple[dict[str, Any], dict[str, Any]]:
    dev = load_json(MANIFEST_PATH)
    holdout = load_json(HOLDOUT_PATH)
    if not isinstance(dev, list) or not isinstance(holdout, list):
        raise PinError("fixture manifests must be arrays")
    return {item["id"]: item for item in dev}, {item["id"]: item for item in holdout}


def check_fixture(fixture_id: str) -> None:
    dev, holdout = fixture_sets()
    if fixture_id in holdout:
        raise PinError(f"{fixture_id} is in the provisional holdout; P2 excludes it")
    if fixture_id not in dev:
        raise PinError(f"unknown development fixture: {fixture_id}")


def command_check() -> int:
    try:
        pins = load_json(PINS_PATH)
    except PinError as error:
        print(json.dumps({"pinsValid": False, "ready": False, "missing": [str(error)]}, indent=2))
        return 1
    errors = validate_pins(pins)
    missing = missing_prerequisites(pins) if not errors else []
    try:
        dev, holdout = fixture_sets()
    except PinError as error:
        errors.append(str(error))
        dev, holdout = {}, {}
    payload = {
        "pinsValid": not errors,
        "errors": errors,
        "ready": not errors and not missing,
        "missing": missing,
        "developmentFixtures": len(dev),
        "holdoutFixtures": len(holdout),
        "artifactDirectory": pins.get("artifacts", {}).get("directory"),
        "note": "P2.0 validates pins only. It does not run upstream or write a lexical plan.",
    }
    print(json.dumps(payload, indent=2))
    return 0 if not errors else 1


def command_precompute(fixture_id: str, output: Path) -> int:
    try:
        pins = load_json(PINS_PATH)
        errors = validate_pins(pins)
        if errors:
            raise PinError("; ".join(errors))
        check_fixture(fixture_id)
        missing = missing_prerequisites(pins)
        if missing:
            raise PinError("prerequisites missing: " + "; ".join(missing))
    except PinError as error:
        print(f"P2 precompute refused: {error}", file=sys.stderr)
        print("No output was written.", file=sys.stderr)
        return 2

    # P2.0 deliberately stops here. P2.1 adds the actual upstream call.
    print(
        "P2.0 scaffold only: all pins are approved, but the upstream precompute path is not implemented. "
        "No output was written.",
        file=sys.stderr,
    )
    return 3


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="P2.0 fail-closed lexical-plan precompute scaffold")
    parser.add_argument("--check", action="store_true", help="validate pins and print readiness; writes nothing")
    parser.add_argument("--fixture", help="development fixture ID (P2.1 will use this)")
    parser.add_argument("--output", type=Path, help="artifact directory (must not be written by P2.0)")
    args = parser.parse_args(argv)

    if args.check and (args.fixture or args.output):
        parser.error("--check cannot be combined with --fixture or --output")
    if args.check:
        return command_check()
    if not args.fixture or not args.output:
        parser.error("use --check, or provide both --fixture and --output")
    return command_precompute(args.fixture, args.output)


if __name__ == "__main__":
    sys.exit(main())
