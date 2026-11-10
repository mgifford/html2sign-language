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
        self.assertEqual(len(self.index["artifacts"]), 1)
        entry = self.index["artifacts"][0]
        self.assertEqual(entry["fixtureId"], "NEG-01")
        self.assertEqual(entry["outputSha256"], self.artifact["hashes"]["outputSha256"])

    def test_artifact_does_not_claim_asl(self):
        warnings = " ".join(self.artifact["warnings"]).lower()
        self.assertIn("lexical plan only", warnings)
        self.assertIn("owner alignment review is pending", warnings)


if __name__ == "__main__":
    unittest.main()
