"""
Tests for FastAPI Backend Endpoints (GET /health and POST /profile).
"""

import json
import sys
import unittest
from pathlib import Path

# Add project root and backend to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from fastapi.testclient import TestClient
from main import app


class TestAPIEndpoints(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_health_endpoint(self):
        """Verify GET /health returns 200 and healthy status."""
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["service"], "c-route-backend")
        self.assertTrue(data["scorer_ready"])
        self.assertEqual(data["occupations_count"], 5)
        self.assertEqual(data["skills_count"], 10)

    def test_profile_scoring_aisha_json(self):
        """Verify POST /profile with Aisha's test profile returns 5 ranked routes."""
        aisha_file = PROJECT_ROOT / "data" / "test_profiles" / "aisha.json"
        with open(aisha_file, "r", encoding="utf-8") as f:
            aisha_data = json.load(f)

        response = self.client.post("/profile", json=aisha_data)
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertEqual(data["status"], "success")
        self.assertEqual(data["profile_name"], "Aisha")
        self.assertEqual(data["target_direction"], "analytics")
        self.assertEqual(data["total_routes"], 5)
        self.assertEqual(len(data["routes"]), 5)

        # Top route: Business Analyst — 51.6% Route Fit 
        top = data["routes"][0]
        self.assertEqual(top["title"], "Business Analyst")
        self.assertEqual(top["occupation_id"], "OCC001")
        self.assertEqual(top["matched_count"], 4)
        self.assertEqual(top["required_count"], 6)
        self.assertAlmostEqual(top["route_fit_score"], 0.5159, places=3)
        self.assertIn("Excel", top["matched_skills"])
        self.assertIn("SQL", top["missing_skills"])

    def test_profile_scoring_minimal_payload(self):
        """Verify POST /profile works with minimal {skills: [...]} payload."""
        response = self.client.post(
            "/profile",
            json={"skills": ["excel", "finance_basics"], "target": "analytics"},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["total_routes"], 5)
        self.assertEqual(len(data["routes"]), 5)

    def test_profile_empty_skills_validation(self):
        """Verify POST /profile returns 422 if skills are empty."""
        response = self.client.post("/profile", json={"skills": []})
        self.assertEqual(response.status_code, 422)


if __name__ == "__main__":
    unittest.main()
