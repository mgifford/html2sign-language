import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

TOOL_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = TOOL_DIR.parents[1]
COMMITTED = REPO_ROOT / "experiments/html-to-asl/data/p2"


class ComparePlansTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.clean = Path(self.temp.name) / "clean"
        shutil.copytree(COMMITTED, self.clean)
        for stale in ("review.json", "review.md", "README.md"):
            path = self.clean / stale
            if path.exists():
                path.unlink()

    def tearDown(self):
        self.temp.cleanup()

    def run_compare(self):
        return subprocess.run(
            [
                sys.executable,
                str(TOOL_DIR / "compare_plans.py"),
                "--committed",
                str(COMMITTED),
                "--clean",
                str(self.clean),
            ],
            capture_output=True,
            text=True,
            check=False,
        )

    def test_identical_plans_match(self):
        result = self.run_compare()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("all 40", result.stdout)

    def test_changed_plan_fails(self):
        path = self.clean / "NEG-01.json"
        artifact = json.loads(path.read_text())
        artifact["plan"]["sentences"][0]["tokens"][0]["gloss"] = "changed"
        path.write_text(json.dumps(artifact))
        result = self.run_compare()
        self.assertEqual(result.returncode, 1)
        self.assertIn("NEG-01", result.stderr)


if __name__ == "__main__":
    unittest.main()
