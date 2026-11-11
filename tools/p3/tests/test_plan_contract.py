import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from plan_contract import validate_model_plan

P1 = {
    "fixtureId": "NEG-01",
    "blocks": [
        {
            "id": "b0001",
            "text": "You do not need to pay a fee.",
            "source": {"path": "p[1]", "textStart": 0, "textEnd": 30},
        }
    ],
}

PLAN = {
    "fixtureId": "NEG-01",
    "sentences": [
        {
            "tokens": [
                {"word": "You", "gloss": "you", "pos": "PRON", "blockId": "b0001", "sourceStart": 0, "sourceEnd": 3},
                {"word": "need", "gloss": "need", "pos": "VERB", "blockId": "b0001", "sourceStart": 11, "sourceEnd": 15},
            ]
        }
    ],
}


class PlanContractTests(unittest.TestCase):
    def test_valid_plan(self):
        self.assertEqual(validate_model_plan(PLAN, P1), [])

    def test_unknown_key_is_rejected(self):
        plan = json.loads(json.dumps(PLAN))
        plan["sentences"][0]["tokens"][0]["extra"] = "nope"
        self.assertTrue(any("keys must be exactly" in error for error in validate_model_plan(plan, P1)))

    def test_out_of_span_is_rejected(self):
        plan = json.loads(json.dumps(PLAN))
        plan["sentences"][0]["tokens"][0]["sourceEnd"] = 999
        self.assertTrue(any("outside the P1 block" in error for error in validate_model_plan(plan, P1)))

    def test_invented_word_is_rejected(self):
        plan = json.loads(json.dumps(PLAN))
        plan["sentences"][0]["tokens"][0]["word"] = "invented"
        self.assertTrue(any("does not match the source" in error for error in validate_model_plan(plan, P1)))

    def test_empty_gloss_is_rejected(self):
        plan = json.loads(json.dumps(PLAN))
        plan["sentences"][0]["tokens"][0]["gloss"] = " "
        self.assertTrue(any("gloss" in error for error in validate_model_plan(plan, P1)))

    def test_wrong_fixture_is_rejected(self):
        plan = json.loads(json.dumps(PLAN))
        plan["fixtureId"] = "OTHER"
        self.assertTrue(any("fixtureId" in error for error in validate_model_plan(plan, P1)))


if __name__ == "__main__":
    unittest.main()
