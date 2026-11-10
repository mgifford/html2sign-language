import copy
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

TOOL_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(TOOL_DIR))

import precompute  # noqa: E402
from validate import validate_artifact, validate_index  # noqa: E402

FIXTURES = Path(__file__).resolve().parent / "fixtures"


class PinTests(unittest.TestCase):
    def setUp(self):
        self.pins = json.loads((TOOL_DIR / "pins.json").read_text(encoding="utf-8"))

    def test_pins_are_well_formed_and_record_approvals(self):
        self.assertEqual(precompute.validate_pins(self.pins), [])
        self.assertEqual(self.pins["upstream"]["commit"], "fec7ac393989f4b6541ab5f860819262a54f27c7")
        self.assertEqual(self.pins["upstream"]["license"], "MIT")
        self.assertTrue(self.pins["upstream"]["approved"])
        self.assertTrue(self.pins["wsd"]["approved"])
        self.assertEqual(self.pins["wsd"]["revision"], "8751b577199d1bb95b74fa2457da7065d57100ae")
        self.assertEqual(self.pins["wsd"]["license"], "Apache-2.0")
        self.assertTrue(self.pins["wordnet"]["approved"])
        self.assertTrue(self.pins["wsd"]["imageDigest"].startswith("sha256:"))
        self.assertTrue(self.pins["wordnet"]["imageDigest"].startswith("sha256:"))
        self.assertTrue(self.pins["spacy"]["entityLinker"]["approved"])
        self.assertEqual(len(self.pins["spacy"]["entityLinker"]["databaseSha256"]), 64)

    def test_invalid_commit_is_rejected(self):
        pins = copy.deepcopy(self.pins)
        pins["upstream"]["commit"] = "not-a-sha"
        self.assertTrue(any("upstream.commit" in error for error in precompute.validate_pins(pins)))

    def test_python_range(self):
        self.assertTrue(precompute.python_supported(">=3.11,<3.13", (3, 11)))
        self.assertFalse(precompute.python_supported(">=3.11,<3.13", (3, 14)))
        self.assertFalse(precompute.python_supported("invalid", (3, 11)))

    def test_complete_pins_are_ready_on_python_3_12(self):
        missing = precompute.missing_prerequisites(self.pins, version=(3, 12), module_exists=lambda _: True)
        self.assertEqual(missing, [])

    def test_fully_pinned_stack_is_ready(self):
        pins = copy.deepcopy(self.pins)
        pins["wsd"]["imageDigest"] = "sha256:" + "a" * 64
        pins["wordnet"]["imageDigest"] = "sha256:" + "b" * 64
        pins["spacy"]["entityLinker"]["approved"] = True
        missing = precompute.missing_prerequisites(pins, version=(3, 11), module_exists=lambda _: True)
        self.assertEqual(missing, [])


class CliTests(unittest.TestCase):
    def run_cli(self, *args):
        return subprocess.run(
            [sys.executable, str(TOOL_DIR / "precompute.py"), *args],
            capture_output=True,
            text=True,
            check=False,
        )

    def test_check_reports_not_ready_without_writing(self):
        result = self.run_cli("--check")
        self.assertEqual(result.returncode, 0)
        payload = json.loads(result.stdout)
        self.assertTrue(payload["pinsValid"])
        self.assertFalse(payload["ready"])
        self.assertEqual(payload["developmentFixtures"], 40)
        self.assertEqual(payload["holdoutFixtures"], 20)

    def test_precompute_refuses_and_writes_nothing(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "p2"
            result = self.run_cli("--fixture", "STRUCT-TABLE", "--output", str(output))
            self.assertEqual(result.returncode, 2)
            self.assertIn("No output was written", result.stderr)
            self.assertFalse(output.exists())

    def test_holdout_fixture_is_refused(self):
        with tempfile.TemporaryDirectory() as directory:
            result = self.run_cli("--fixture", "H-TABLE-SPAN", "--output", str(Path(directory) / "p2"))
            self.assertEqual(result.returncode, 2)
            self.assertIn("holdout", result.stderr)

    def test_unknown_fixture_is_refused(self):
        with tempfile.TemporaryDirectory() as directory:
            result = self.run_cli("--fixture", "NO-SUCH-FIXTURE", "--output", str(Path(directory) / "p2"))
            self.assertEqual(result.returncode, 2)
            self.assertIn("unknown", result.stderr)



class SchemaTests(unittest.TestCase):
    def load(self, name):
        return json.loads((FIXTURES / name).read_text(encoding="utf-8"))

    def test_sample_artifact_is_valid(self):
        self.assertEqual(validate_artifact(self.load("sample-artifact.json")), [])

    def test_artifact_cannot_claim_translation(self):
        artifact = self.load("sample-artifact.json")
        artifact["translation"] = True
        self.assertTrue(any("translation must be false" in error for error in validate_artifact(artifact)))

    def test_complete_artifact_requires_a_sentence(self):
        artifact = self.load("sample-artifact.json")
        artifact["plan"]["sentences"] = []
        self.assertTrue(any("requires at least one sentence" in error for error in validate_artifact(artifact)))

    def test_index_is_valid(self):
        self.assertEqual(validate_index(self.load("sample-index.json")), [])

    def test_index_cannot_claim_translation(self):
        index = self.load("sample-index.json")
        index["translation"] = True
        self.assertTrue(any("translation must be false" in error for error in validate_index(index)))


if __name__ == "__main__":
    unittest.main()
