import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from compare import build  # noqa: E402


def artifact(tokens):
    return {
        "status": "partial",
        "plan": {"sentences": [{"tokens": tokens}]},
        "abstentions": [],
    }


class CompareTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.original = self.root / "original"
        self.simplified = self.root / "simplified"
        self.original.mkdir()
        self.simplified.mkdir()

    def tearDown(self):
        self.temp.cleanup()

    def write(self):
        token = {"word": "Apply", "gloss": "apply", "status": "aligned", "blockId": "b0001"}
        (self.original / "NEG-01.json").write_text(json.dumps(artifact([token, token])))
        (self.simplified / "P3-NEG-01.json").write_text(json.dumps(artifact([token])))
        runs = {
            "model": {"id": "test"},
            "fixtures": [
                {
                    "fixtureId": "NEG-01",
                    "original": "Apply now.",
                    "runs": [
                        {"valid": True, "simplified": "Apply."},
                        {"valid": True, "simplified": "Apply."},
                        {"valid": False, "simplified": ""},
                    ],
                }
            ],
        }
        (self.root / "runs.json").write_text(json.dumps(runs))
        return runs

    def test_build_counts_and_stability(self):
        self.write()
        result = build(self.root / "runs.json", self.original, self.simplified)
        row = result["fixtures"][0]
        self.assertEqual(row["validRuns"], 2)
        self.assertEqual(row["distinctValidOutputs"], 1)
        self.assertEqual(row["originalPlan"]["tokens"], 2)
        self.assertEqual(row["simplifiedPlan"]["tokens"], 1)
        self.assertEqual(row["tokenDelta"], -1)

    def test_no_valid_run_leaves_plan_empty(self):
        runs = self.write()
        runs["fixtures"][0]["runs"] = [{"valid": False, "simplified": ""}]
        (self.root / "runs.json").write_text(json.dumps(runs))
        result = build(self.root / "runs.json", self.original, self.simplified)
        self.assertIsNone(result["fixtures"][0]["simplifiedPlan"])


if __name__ == "__main__":
    unittest.main()
