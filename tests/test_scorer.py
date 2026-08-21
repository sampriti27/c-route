"""
Tests for C.Route Scorer and BigQuery Client.
"""

import sys
import unittest
from pathlib import Path

# Add project root and backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from bq_client import BigQueryClient
from scorer import RouteScorer


class TestRouteScorer(unittest.TestCase):

    def setUp(self):
        self.bq_client = BigQueryClient()
        self.scorer = RouteScorer(self.bq_client)

    def test_market_data_loaded(self):
        """Verify that occupations, skills, demand scores, and velocities are loaded."""
        self.assertEqual(len(self.scorer.occupations), 5)
        self.assertEqual(len(self.scorer.skills), 10)
        self.assertIn("OCC001", self.scorer.occupations)
        self.assertIn("OCC004", self.scorer.occupations)
        self.assertIn("OCC005", self.scorer.occupations)

    def test_aisha_all_5_occupations_scored(self):
        """Verify Aisha's profile scores all 5 occupations in catalog."""
        aisha_skills = ["Excel", "Finance Basics", "Communication", "PowerPoint"]
        routes = self.scorer.score_profile(
            current_skills=aisha_skills,
            score_all=True,
        )

        # All 5 occupations must be returned
        self.assertEqual(len(routes), 5)
        
        occ_titles = [r["title"] for r in routes]
        self.assertIn("Business Analyst", occ_titles)
        self.assertIn("Financial Analyst", occ_titles)
        self.assertIn("Product Manager", occ_titles)
        self.assertIn("Marketing Analyst", occ_titles)
        self.assertIn("Data Analyst", occ_titles)

        # Top route must be Business Analyst
        top_route = routes[0]
        self.assertEqual(top_route["occupation_id"], "OCC001")
        self.assertEqual(top_route["title"], "Business Analyst")
        
        # Overlap: 4 matched out of 6 required (66.7%)
        self.assertEqual(top_route["matched_count"], 4)
        self.assertEqual(top_route["required_count"], 6)
        
        # Skill Adjacency must be non-zero for Business Analyst (due to Excel <-> Finance Basics 0.72)
        self.assertGreater(top_route["breakdown"]["skill_adjacency"], 0.0)
        self.assertEqual(top_route["breakdown"]["skill_adjacency"], 0.24)

        # Matched & missing skills
        self.assertIn("Excel", top_route["matched_skills"])
        self.assertIn("Finance Basics", top_route["matched_skills"])
        self.assertIn("SQL", top_route["missing_skills"])
        self.assertIn("Power BI", top_route["missing_skills"])


if __name__ == "__main__":
    unittest.main()
