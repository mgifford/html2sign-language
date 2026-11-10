import json
import sys
import unittest
from pathlib import Path

TOOL_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = TOOL_DIR.parents[1]
sys.path.insert(0, str(TOOL_DIR))

from validate import validate_artifact  # noqa: E402

ARTIFACT = REPO_ROOT / "experiments/html-to-asl/data/p2/NEG-01.json"
INDEX = REPO_ROOT / "experiments/html-to-asl/data/p2/index.json"


class Neg01ArtifactTests(unittest.TestCase):
    def setUp(self):
        self.artifact = json.loads(ARTIFACT.read_text(encoding="utf-8"))
        self.index = json.loads(INDEX.read_text(encoding="utf-8"))

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

    def test_artifact_does_not_claim_asl(self):
        warnings = " ".join(self.artifact["warnings"]).lower()
        self.assertIn("lexical plan only", warnings)
        self.assertIn("owner alignment review is pending", warnings)


if __name__ == "__main__":
    unittest.main()
