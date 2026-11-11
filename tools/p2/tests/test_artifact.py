import json
import sys
import unittest
from pathlib import Path

TOOL_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = TOOL_DIR.parents[1]
sys.path.insert(0, str(TOOL_DIR))

from validate import validate_artifact, validate_review  # noqa: E402

ARTIFACT = REPO_ROOT / "experiments/html-to-asl/data/p2/NEG-01.json"
INDEX = REPO_ROOT / "experiments/html-to-asl/data/p2/index.json"
REVIEW = REPO_ROOT / "experiments/html-to-asl/data/p2/review.json"
REVIEW_MD = REPO_ROOT / "experiments/html-to-asl/data/p2/review.md"
SCOPE = REPO_ROOT / "experiments/html-to-asl/data/p2/scope.json"


class Neg01ArtifactTests(unittest.TestCase):
    def setUp(self):
        self.artifact = json.loads(ARTIFACT.read_text(encoding="utf-8"))
        self.index = json.loads(INDEX.read_text(encoding="utf-8"))
        self.review = json.loads(REVIEW.read_text(encoding="utf-8"))
        self.review_md = REVIEW_MD.read_text(encoding="utf-8")
        self.scope = json.loads(SCOPE.read_text(encoding="utf-8"))

    def test_artifact_matches_p2_contract(self):
        self.assertEqual(validate_artifact(self.artifact), [])
        self.assertEqual(self.artifact["fixtureId"], "NEG-01")
        self.assertFalse(self.artifact["translation"])
        self.assertEqual(self.artifact["status"], "partial")

    def test_every_candidate_is_aligned_to_the_source_block(self):
        block = self.artifact["source"]["blocks"][0]
        tokens = self.artifact["plan"]["sentences"][0]["tokens"]
        self.assertGreater(len(tokens), 0)
        for token in tokens:
            self.assertEqual(token["blockId"], block["id"])
            self.assertGreaterEqual(token["sourceStart"], block["textStart"])
            self.assertLessEqual(token["sourceEnd"], block["textEnd"])
            self.assertEqual(token["status"], "aligned")

    def test_index_points_at_the_artifact_hash(self):
        self.assertEqual(self.index["status"], "partial")
        self.assertEqual(len(self.index["artifacts"]), 40)
        entry = next(item for item in self.index["artifacts"] if item["fixtureId"] == "NEG-01")
        self.assertEqual(entry["outputSha256"], self.artifact["hashes"]["outputSha256"])

    def test_all_40_artifacts_match_the_contract(self):
        for entry in self.index["artifacts"]:
            path = ARTIFACT.parent / entry["file"]
            artifact = json.loads(path.read_text(encoding="utf-8"))
            self.assertEqual(validate_artifact(artifact), [], entry["fixtureId"])
            self.assertEqual(artifact["fixtureId"], entry["fixtureId"])
            self.assertEqual(artifact["translation"], False)
            self.assertEqual(artifact["status"], entry["status"])
            self.assertEqual(artifact["hashes"]["outputSha256"], entry["outputSha256"])

            blocks = {block["id"]: block for block in artifact["source"]["blocks"]}
            for sentence in artifact["plan"]["sentences"]:
                for token in sentence["tokens"]:
                    block = blocks[token["blockId"]]
                    self.assertGreaterEqual(token["sourceStart"], block["textStart"], entry["fixtureId"])
                    self.assertLessEqual(token["sourceEnd"], block["textEnd"], entry["fixtureId"])
                    self.assertEqual(token["status"], "aligned")
            self.assertEqual(artifact["abstentions"], [])

    def test_owner_and_independent_reviews_are_explicitly_pending(self):
        self.assertEqual(validate_review(self.review), [])
        self.assertEqual(self.review["status"], "pending")
        self.assertEqual(self.review["artifactCount"], 40)
        self.assertEqual(self.review["owner"]["status"], "pending")
        self.assertEqual(self.review["independent"]["status"], "pending")
        self.assertTrue(all(item["ownerStatus"] == "pending" for item in self.review["fixtures"]))
        self.assertTrue(all(item["linguisticStatus"] == "not-started" for item in self.review["fixtures"]))
        self.assertEqual(
            [item["fixtureId"] for item in self.review["fixtures"]],
            [item["fixtureId"] for item in self.index["artifacts"]],
        )

    def test_review_report_has_all_40_rows(self):
        rows = [line for line in self.review_md.splitlines() if line.startswith("| [")]
        self.assertEqual(len(rows), 40)
        self.assertIn("not ASL", self.review_md)

    def test_scope_is_prose_only_and_complete(self):
        in_scope = self.scope["inScope"]
        out_scope = self.scope["outOfScope"]
        self.assertEqual(self.scope["counts"], {"inScope": 16, "outOfScope": 24, "total": 40})
        self.assertEqual(len(set(in_scope) | set(out_scope)), 40)
        self.assertEqual(set(in_scope) & set(out_scope), set())
        self.assertEqual(
            set(in_scope) | set(out_scope),
            {entry["fixtureId"] for entry in self.index["artifacts"]},
        )
        for fixture_id in in_scope:
            artifact = json.loads((REPO_ROOT / "experiments/html-to-asl/data/p2" / f"{fixture_id}.json").read_text())
            types = {block["type"] for block in artifact["source"]["blocks"]}
            self.assertEqual(len(artifact["source"]["blocks"]), 1)
            self.assertTrue(types <= {"paragraph", "quote", "text"}, fixture_id)

    def test_artifact_does_not_claim_asl(self):
        warnings = " ".join(self.artifact["warnings"]).lower()
        self.assertIn("lexical plan only", warnings)
        self.assertIn("owner alignment review is pending", warnings)


if __name__ == "__main__":
    unittest.main()
