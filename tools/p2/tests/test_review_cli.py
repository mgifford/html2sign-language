import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

TOOL_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = TOOL_DIR.parents[1]
REVIEW = REPO_ROOT / "experiments/html-to-asl/data/p2/review.json"


class ReviewCliTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.review = Path(self.temp.name) / "review.json"
        shutil.copyfile(REVIEW, self.review)

    def tearDown(self):
        self.temp.cleanup()

    def run_cli(self, *args):
        return subprocess.run(
            [
                sys.executable,
                str(TOOL_DIR / "review.py"),
                "--review-file",
                str(self.review),
                *args,
            ],
            capture_output=True,
            text=True,
            check=False,
        )

    def test_validate_and_summary(self):
        result = self.run_cli("--validate")
        self.assertEqual(result.returncode, 0, result.stderr)
        result = self.run_cli("--summary")
        self.assertEqual(result.returncode, 0, result.stderr)
        summary = json.loads(result.stdout)
        self.assertEqual(summary["status"], "pending")
        self.assertEqual(summary["ownerStatuses"]["pending"], 40)

    def test_no_args_prints_summary_and_next_steps(self):
        result = self.run_cli()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn('"ownerStatuses"', result.stdout)
        self.assertIn("--list --scope in-scope", result.stdout)

    def test_list_filters_to_in_scope(self):
        result = self.run_cli("--list", "--scope", "in-scope")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(len([line for line in result.stdout.splitlines() if "\t" in line]), 17)

    def test_out_of_scope_decision_is_guarded(self):
        result = self.run_cli(
            "--fixture",
            "TABLE-01",
            "--owner-status",
            "accepted",
            "--reviewer",
            "Owner Test",
        )
        self.assertEqual(result.returncode, 2)
        self.assertIn("out of scope", result.stderr)
        updated = json.loads(self.review.read_text())
        fixture = next(item for item in updated["fixtures"] if item["fixtureId"] == "TABLE-01")
        self.assertEqual(fixture["ownerStatus"], "pending")

    def test_record_owner_decision(self):
        result = self.run_cli(
            "--fixture",
            "NEG-01",
            "--owner-status",
            "accepted",
            "--owner-notes",
            "source mapping checked",
            "--reviewer",
            "Owner Test",
            "--date",
            "2026-11-10",
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        updated = json.loads(self.review.read_text())
        fixture = next(item for item in updated["fixtures"] if item["fixtureId"] == "NEG-01")
        self.assertEqual(fixture["ownerStatus"], "accepted")
        self.assertEqual(fixture["ownerNotes"], "source mapping checked")
        self.assertEqual(updated["owner"]["reviewer"], "Owner Test")
        self.assertEqual(updated["owner"]["reviewedAt"], "2026-11-10")
        self.assertEqual(updated["status"], "in-review")

    def test_reviewer_is_required(self):
        result = self.run_cli("--fixture", "NEG-01", "--owner-status", "accepted")
        self.assertEqual(result.returncode, 2)
        self.assertIn("--reviewer", result.stderr)

    def test_unknown_fixture_is_rejected(self):
        result = self.run_cli(
            "--fixture",
            "NO-SUCH-FIXTURE",
            "--owner-status",
            "accepted",
            "--reviewer",
            "Owner Test",
        )
        self.assertEqual(result.returncode, 2)


if __name__ == "__main__":
    unittest.main()
