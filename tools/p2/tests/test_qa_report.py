import unittest
from pathlib import Path

from qa_report import build, markdown

TOOL_DIR = Path(__file__).resolve().parents[1]
DATA = TOOL_DIR.parents[1] / "experiments/html-to-asl/data/p2"


class QaReportTests(unittest.TestCase):
    def test_flags_all_40_without_decisions(self):
        rows = build(DATA)
        self.assertEqual(len(rows), 40)
        self.assertTrue(all(row["status"] == "partial" for row in rows))
        self.assertTrue(all("partial" in row["flags"] for row in rows))
        self.assertGreaterEqual(sum(1 for row in rows if row["severity"] == "high"), 1)
        self.assertTrue(all(row["severity"] in {"high", "medium", "low"} for row in rows))
        self.assertNotIn("accepted", {row["status"] for row in rows})
        self.assertNotIn("rejected", {row["status"] for row in rows})

    def test_markdown_has_40_rows_and_disclaimer(self):
        text = markdown(build(DATA))
        self.assertEqual(len([line for line in text.splitlines() if line.startswith("| [")]), 40)
        self.assertIn("advisory only", text)
        self.assertIn("not ASL", text)


if __name__ == "__main__":
    unittest.main()
