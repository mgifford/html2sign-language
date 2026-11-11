#!/usr/bin/env python3
"""Record P2 owner/independent review decisions.

This tool edits the review record only. It cannot perform a review and must not
be used to self-approve as the implementer. All artifacts remain lexical plans,
not ASL.
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from datetime import date
from pathlib import Path

TOOL_DIR = Path(__file__).resolve().parent
REPO_ROOT = TOOL_DIR.parents[1]
DEFAULT_REVIEW = REPO_ROOT / "experiments/html-to-asl/data/p2/review.json"
DEFAULT_ARTIFACTS = REPO_ROOT / "experiments/html-to-asl/data/p2"

sys.path.insert(0, str(TOOL_DIR))
from validate import validate_review  # noqa: E402

OWNER_STATUSES = ("pending", "accepted", "rejected", "needs-discussion")
LINGUISTIC_STATUSES = ("not-started", "accepted", "rejected", "needs-discussion")
ROLE_STATUSES = ("pending", "in-review", "accepted", "rejected")
PLACEHOLDER_REVIEWERS = {
    "deaf asl reviewer",
    "reviewer name",
    "your name",
    "owner test",
    "test",
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def artifact_ids(directory: Path) -> list[str]:
    index = load_json(directory / "index.json")
    return [entry["fixtureId"] for entry in index["artifacts"]]


def scope_map(directory: Path) -> dict[str, str]:
    path = directory / "scope.json"
    if not path.exists():
        return {}
    scope = load_json(path)
    result = {fixture: "in-scope" for fixture in scope.get("inScope", [])}
    result.update({fixture: "out-of-scope" for fixture in scope.get("outOfScope", [])})
    return result


def validate(review, expected_ids: list[str]) -> list[str]:
    errors = validate_review(review)
    if isinstance(review, dict) and isinstance(review.get("fixtures"), list):
        ids = [item.get("fixtureId") for item in review["fixtures"] if isinstance(item, dict)]
        if sorted(ids) != sorted(expected_ids):
            errors.append("review fixture IDs do not match the artifact index")
    return errors


def recompute_overall(review) -> None:
    if review["owner"]["status"] == "rejected" or review["independent"]["status"] == "rejected":
        review["status"] = "rejected"
    elif review["owner"]["status"] == "accepted" and review["independent"]["status"] == "accepted":
        review["status"] = "complete"
    elif review["owner"]["status"] != "pending" or review["independent"]["status"] != "pending":
        review["status"] = "in-review"
    else:
        review["status"] = "pending"


def recompute(review, scopes: dict[str, str]) -> None:
    fixtures = [
        item
        for item in review["fixtures"]
        if scopes.get(item["fixtureId"], "in-scope") == "in-scope"
    ]
    owner_states = [item["ownerStatus"] for item in fixtures]
    linguistic_states = [item["linguisticStatus"] for item in fixtures]

    if all(state == "accepted" for state in owner_states):
        review["owner"]["status"] = "accepted"
    elif any(state == "rejected" for state in owner_states):
        review["owner"]["status"] = "rejected"
    elif any(state in {"accepted", "needs-discussion"} for state in owner_states):
        review["owner"]["status"] = "in-review"
    else:
        review["owner"]["status"] = "pending"

    if all(state == "not-started" for state in linguistic_states):
        review["independent"]["status"] = "pending"
    elif any(state == "rejected" for state in linguistic_states):
        review["independent"]["status"] = "rejected"
    elif any(state in {"accepted", "needs-discussion"} for state in linguistic_states):
        review["independent"]["status"] = "in-review"

    recompute_overall(review)


def summary(review, scopes: dict[str, str]) -> dict:
    in_scope = [
        item
        for item in review["fixtures"]
        if scopes.get(item["fixtureId"], "in-scope") == "in-scope"
    ]
    return {
        "status": review["status"],
        "owner": review["owner"]["status"],
        "independent": review["independent"]["status"],
        "ownerStatuses": dict(Counter(item["ownerStatus"] for item in review["fixtures"])),
        "linguisticStatuses": dict(Counter(item["linguisticStatus"] for item in review["fixtures"])),
        "inScope": {
            "total": len(in_scope),
            "ownerStatuses": dict(Counter(item["ownerStatus"] for item in in_scope)),
            "linguisticStatuses": dict(Counter(item["linguisticStatus"] for item in in_scope)),
        },
    }


def command_list(review, scopes: dict[str, str], scope_filter: str) -> int:
    print("fixture\tscope\towner\tlinguistic")
    for item in review["fixtures"]:
        scope = scopes.get(item["fixtureId"], "unknown")
        if scope_filter != "all" and scope != scope_filter:
            continue
        print(f"{item['fixtureId']}\t{scope}\t{item['ownerStatus']}\t{item['linguisticStatus']}")
    return 0


def attestation_error(args) -> str | None:
    if not args.attest_independent_review:
        return "Independent ASL decisions require --attest-independent-review. The owner cannot self-attest as the Deaf ASL reviewer."
    if not args.reviewer:
        return "--reviewer is required for an independent ASL decision"
    if args.reviewer.strip().casefold() in PLACEHOLDER_REVIEWERS:
        return "Use the actual independent reviewer's name, not a placeholder"
    return None


def command_set(args, review, review_path: Path, scopes: dict[str, str]) -> int:
    if args.fixture and scopes.get(args.fixture) == "out-of-scope":
        if not args.allow_out_of_scope:
            print(
                f"{args.fixture} is out of scope for P2/P3/P4. Use --allow-out-of-scope only to record a note; do not accept a structural lexical plan.",
                file=sys.stderr,
            )
            return 2
        if args.owner_status not in (None, "not-applicable") or args.linguistic_status not in (None, "not-applicable"):
            print(
                "Out-of-scope fixtures cannot receive accepted/rejected/needs-discussion statuses; record the scope decision instead.",
                file=sys.stderr,
            )
            return 2
    if args.linguistic_status and args.linguistic_status != "not-started":
        error = attestation_error(args)
        if error:
            print(error, file=sys.stderr)
            return 2
        if not args.linguistic_notes:
            print("--linguistic-notes is required for an independent linguistic decision", file=sys.stderr)
            return 2
    if args.independent_status and args.independent_status != "pending":
        error = attestation_error(args)
        if error:
            print(error, file=sys.stderr)
            return 2
        if args.independent_status == "accepted" and not any(
            item["linguisticStatus"] == "accepted" for item in review["fixtures"]
        ):
            print("Record at least one independent linguistic decision before accepting the independent review", file=sys.stderr)
            return 2
    changed = False
    for item in review["fixtures"]:
        if item["fixtureId"] != args.fixture:
            continue
        if args.owner_status:
            item["ownerStatus"] = args.owner_status
            review["owner"]["reviewer"] = args.reviewer
            review["owner"]["reviewedAt"] = args.date
            changed = True
        if args.owner_notes is not None:
            item["ownerNotes"] = args.owner_notes
            changed = True
        if args.linguistic_status:
            item["linguisticStatus"] = args.linguistic_status
            review["independent"]["reviewer"] = args.reviewer
            review["independent"]["reviewedAt"] = args.date
            changed = True
        if args.linguistic_notes is not None:
            item["linguisticNotes"] = args.linguistic_notes
            changed = True
    if not changed:
        print("No fixture matched or no field supplied.", file=sys.stderr)
        return 2

    recompute(review, scopes)
    if args.independent_status:
        review["independent"]["status"] = args.independent_status
        review["independent"]["reviewer"] = args.reviewer
        review["independent"]["reviewedAt"] = args.date
        recompute_overall(review)
    review_path.write_text(json.dumps(review, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary(review, scopes), indent=2))
    return 0


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Record P2 review decisions")
    parser.add_argument("--review-file", type=Path, default=DEFAULT_REVIEW)
    parser.add_argument("--artifacts-dir", type=Path, default=DEFAULT_ARTIFACTS)
    parser.add_argument("--list", action="store_true")
    parser.add_argument("--scope", choices=("all", "in-scope", "out-of-scope"), default="all")
    parser.add_argument("--allow-out-of-scope", action="store_true", help="allow notes on an out-of-scope fixture; does not allow acceptance")
    parser.add_argument("--summary", action="store_true")
    parser.add_argument("--validate", action="store_true")
    parser.add_argument("--fixture", "--set", dest="fixture")
    parser.add_argument("--owner-status", choices=OWNER_STATUSES)
    parser.add_argument("--owner-notes")
    parser.add_argument("--linguistic-status", choices=LINGUISTIC_STATUSES)
    parser.add_argument("--linguistic-notes")
    parser.add_argument("--independent-status", choices=ROLE_STATUSES)
    parser.add_argument("--attest-independent-review", action="store_true", help="confirm the named reviewer is an independent fluent Deaf ASL reviewer, or that their decision is being recorded with consent")
    parser.add_argument("--reviewer")
    parser.add_argument("--date", default=date.today().isoformat())
    args = parser.parse_args(argv)

    review = load_json(args.review_file)
    errors = validate(review, artifact_ids(args.artifacts_dir))
    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1

    scopes = scope_map(args.artifacts_dir)
    if args.validate:
        print("review record is valid")
        return 0
    if args.summary:
        print(json.dumps(summary(review, scopes), indent=2))
        return 0
    if args.list:
        return command_list(review, scopes, args.scope)

    if not args.fixture and not args.independent_status:
        print(json.dumps(summary(review, scopes), indent=2))
        print("\nNext: npm run review:p2 -- --list --scope in-scope")
        print("Record: npm run review:p2 -- --fixture NEG-01 --owner-status accepted --reviewer \"Your name\"")
        return 0
    if not args.reviewer:
        parser.error("--reviewer is required when recording a review")
    if not args.fixture and args.independent_status:
        if args.independent_status != "pending":
            error = attestation_error(args)
            if error:
                print(error, file=sys.stderr)
                return 2
        review["independent"]["status"] = args.independent_status
        review["independent"]["reviewer"] = args.reviewer
        review["independent"]["reviewedAt"] = args.date
        recompute_overall(review)
        args.review_file.write_text(json.dumps(review, indent=2) + "\n", encoding="utf-8")
        print(json.dumps(summary(review, scopes), indent=2))
        return 0

    return command_set(args, review, args.review_file, scopes)


if __name__ == "__main__":
    raise SystemExit(main())
