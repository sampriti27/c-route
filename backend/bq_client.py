"""
C.Route — BigQuery Client
Handles labor market data retrieval from BigQuery tables and views.
Supports both live BigQuery connections and local seed-data fallback.
"""

import os
import re
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv

load_dotenv()

# GCP & BigQuery configuration
GCP_PROJECT = os.getenv("BIGQUERY_PROJECT_ID", "croute-hackathon")
DATASET_ID = os.getenv("BIGQUERY_DATASET", "croute_market")


class BigQueryClient:
    """
    Client for querying C.Route market intelligence data from BigQuery.
    If GCP credentials are not active, seamlessly falls back to local seed data.
    """

    def __init__(self, project_id: Optional[str] = None, dataset_id: Optional[str] = None):
        self.project_id = project_id or GCP_PROJECT
        self.dataset_id = dataset_id or DATASET_ID
        self.client = None
        self._is_live = False
        self._init_client()

    def _init_client(self):
        """Attempts to initialize google-cloud-bigquery Client."""
        try:
            from google.cloud import bigquery
            self.client = bigquery.Client(project=self.project_id)
            self._is_live = True
        except Exception:
            self.client = None
            self._is_live = False

    @property
    def is_live(self) -> bool:
        """Returns True if connected to live Google Cloud BigQuery."""
        return self._is_live

    def query(self, sql: str) -> List[Dict[str, Any]]:
        """Executes a SQL query against BigQuery or fallback dataset."""
        if self._is_live and self.client:
            try:
                query_job = self.client.query(sql)
                results = [dict(row) for row in query_job.result()]
                return results
            except Exception as e:
                print(f"[BigQueryClient] Live query failed ({e}). Using local market dataset.")
        return self._fallback_query(sql)

    # ----------------------------------------------------------------------
    # Core Data Retrieval Methods
    # ----------------------------------------------------------------------

    def get_occupations(self) -> List[Dict[str, Any]]:
        """Returns all occupations in the catalog."""
        sql = f"""
        SELECT occupation_id, title, category, geography
        FROM `{self.project_id}.{self.dataset_id}.occupations`
        """
        if self._is_live:
            try:
                return self.query(sql)
            except Exception:
                pass
        return self._get_local_occupations()

    def get_skills(self) -> List[Dict[str, Any]]:
        """Returns all skills in the taxonomy."""
        sql = f"""
        SELECT skill_id, skill_name, category
        FROM `{self.project_id}.{self.dataset_id}.skills`
        """
        if self._is_live:
            try:
                return self.query(sql)
            except Exception:
                pass
        return self._get_local_skills()

    def get_occupation_skills(self) -> List[Dict[str, Any]]:
        """Returns required skills per occupation with importance for latest period."""
        sql = f"""
        SELECT
          os.occupation_id,
          o.title AS occupation_title,
          os.skill_id,
          s.skill_name,
          os.importance,
          os.period
        FROM `{self.project_id}.{self.dataset_id}.occupation_skills` os
        JOIN `{self.project_id}.{self.dataset_id}.occupations` o ON os.occupation_id = o.occupation_id
        JOIN `{self.project_id}.{self.dataset_id}.skills` s ON os.skill_id = s.skill_id
        WHERE os.period = (SELECT MAX(period) FROM `{self.project_id}.{self.dataset_id}.occupation_skills`)
        """
        if self._is_live:
            try:
                return self.query(sql)
            except Exception:
                pass
        return self._get_local_occupation_skills()

    def get_demand_scores(self) -> Dict[str, Dict[str, Any]]:
        """
        Returns latest period market demand metrics per occupation.
        Guarantees all occupations are present using LEFT JOIN / defaults.
        """
        sql = f"""
        WITH latest_demand AS (
          SELECT occupation_id, demand_count, demand_share
          FROM `{self.project_id}.{self.dataset_id}.market_demand`
          WHERE period = (SELECT MAX(period) FROM `{self.project_id}.{self.dataset_id}.market_demand`)
        )
        SELECT
          o.occupation_id,
          o.title,
          o.category,
          o.geography,
          COALESCE(SUM(ld.demand_count), 0) AS total_demand,
          ROUND(COALESCE(AVG(ld.demand_share), 0.0), 4) AS avg_demand_share
        FROM `{self.project_id}.{self.dataset_id}.occupations` o
        LEFT JOIN latest_demand ld
          ON o.occupation_id = ld.occupation_id
        GROUP BY o.occupation_id, o.title, o.category, o.geography
        """
        results = []
        if self._is_live:
            try:
                results = self.query(sql)
            except Exception:
                results = []
        if not results:
            results = self._get_local_demand_scores()

        # Map by occupation_id and ensure all occupations exist
        demand_map = {r["occupation_id"]: r for r in results}
        for occ in self.get_occupations():
            occ_id = occ["occupation_id"]
            if occ_id not in demand_map:
                demand_map[occ_id] = {
                    "occupation_id": occ_id,
                    "title": occ["title"],
                    "category": occ["category"],
                    "geography": occ.get("geography", "India"),
                    "total_demand": 0,
                    "avg_demand_share": 0.0,
                }
        return demand_map

    def get_demand_velocities(self) -> Dict[str, Dict[str, Any]]:
        """
        Returns period-over-period demand growth/velocity.
        Guarantees all occupations are present with default metrics if missing.
        """
        sql = f"""
        WITH periods AS (
          SELECT
            MAX(period) AS current_period,
            MIN(period) AS prev_period
          FROM `{self.project_id}.{self.dataset_id}.market_demand`
        ),
        current_demand_data AS (
          SELECT *
          FROM `{self.project_id}.{self.dataset_id}.market_demand`
          WHERE period = (SELECT current_period FROM periods)
        ),
        prev_demand_data AS (
          SELECT *
          FROM `{self.project_id}.{self.dataset_id}.market_demand`
          WHERE period = (SELECT prev_period FROM periods)
        )
        SELECT
          d1.occupation_id,
          o.title,
          d1.skill_id,
          s.skill_name,
          d1.demand_count AS current_demand,
          d0.demand_count AS prev_demand,
          ROUND(
            SAFE_DIVIDE(d1.demand_count - d0.demand_count, d0.demand_count) * 100,
            2
          ) AS velocity_pct
        FROM current_demand_data d1
        JOIN prev_demand_data d0
          ON  d1.occupation_id = d0.occupation_id
          AND d1.skill_id      = d0.skill_id
        JOIN `{self.project_id}.{self.dataset_id}.occupations` o ON d1.occupation_id = o.occupation_id
        JOIN `{self.project_id}.{self.dataset_id}.skills` s      ON d1.skill_id      = s.skill_id
        """
        results = []
        if self._is_live:
            try:
                results = self.query(sql)
            except Exception:
                results = []
        if not results:
            results = self._get_local_demand_velocities()

        # Group by occupation_id
        grouped: Dict[str, Dict[str, Any]] = {}
        for occ in self.get_occupations():
            occ_id = occ["occupation_id"]
            grouped[occ_id] = {
                "occupation_id": occ_id,
                "title": occ["title"],
                "skills": [],
                "avg_velocity_pct": 0.0,
                "normalized_velocity": 0.15,
            }

        for row in results:
            occ_id = row["occupation_id"]
            if occ_id in grouped:
                grouped[occ_id]["skills"].append(row)

        for occ_id, data in grouped.items():
            if data["skills"]:
                total_pct = sum(s.get("velocity_pct", 0.0) for s in data["skills"])
                data["avg_velocity_pct"] = round(total_pct / len(data["skills"]), 2)
                data["normalized_velocity"] = round(max(0.0, min(1.0, data["avg_velocity_pct"] / 100.0)), 4)

        return grouped

    def get_skill_adjacency(self) -> List[Dict[str, Any]]:
        """
        Returns co-occurrence strength between skill pairs from v_skill_adjacency.
        """
        sql = f"""
        SELECT
          skill_a,
          skill_a_name,
          skill_b,
          skill_b_name,
          cooccurrence
        FROM `{self.project_id}.{self.dataset_id}.v_skill_adjacency`
        """
        if self._is_live:
            try:
                return self.query(sql)
            except Exception:
                pass
        return self._get_local_skill_adjacency()

    # ----------------------------------------------------------------------
    # Local Seed Fallbacks
    # ----------------------------------------------------------------------

    def _get_local_occupations(self) -> List[Dict[str, Any]]:
        return [
            {"occupation_id": "OCC001", "title": "Business Analyst", "category": "analytics", "geography": "India"},
            {"occupation_id": "OCC002", "title": "Data Analyst", "category": "analytics", "geography": "India"},
            {"occupation_id": "OCC003", "title": "Financial Analyst", "category": "finance", "geography": "India"},
            {"occupation_id": "OCC004", "title": "Product Manager", "category": "product", "geography": "India"},
            {"occupation_id": "OCC005", "title": "Marketing Analyst", "category": "marketing", "geography": "India"},
        ]

    def _get_local_skills(self) -> List[Dict[str, Any]]:
        return [
            {"skill_id": "SKL001", "skill_name": "SQL", "category": "technical"},
            {"skill_id": "SKL002", "skill_name": "Excel", "category": "technical"},
            {"skill_id": "SKL003", "skill_name": "Power BI", "category": "technical"},
            {"skill_id": "SKL004", "skill_name": "Python", "category": "technical"},
            {"skill_id": "SKL005", "skill_name": "Communication", "category": "soft"},
            {"skill_id": "SKL006", "skill_name": "Finance Basics", "category": "domain"},
            {"skill_id": "SKL007", "skill_name": "PowerPoint", "category": "technical"},
            {"skill_id": "SKL008", "skill_name": "Tableau", "category": "technical"},
            {"skill_id": "SKL009", "skill_name": "Statistical Analysis", "category": "technical"},
            {"skill_id": "SKL010", "skill_name": "Product Thinking", "category": "domain"},
        ]

    def _get_local_occupation_skills(self) -> List[Dict[str, Any]]:
        skills_map = {s["skill_id"]: s["skill_name"] for s in self._get_local_skills()}
        occupations_map = {o["occupation_id"]: o["title"] for o in self._get_local_occupations()}
        raw = [
            # Business Analyst
            ("OCC001", "SKL001", 0.90),
            ("OCC001", "SKL002", 0.80),
            ("OCC001", "SKL003", 0.75),
            ("OCC001", "SKL005", 0.85),
            ("OCC001", "SKL006", 0.70),
            ("OCC001", "SKL007", 0.65),
            # Data Analyst
            ("OCC002", "SKL001", 0.95),
            ("OCC002", "SKL002", 0.60),
            ("OCC002", "SKL003", 0.70),
            ("OCC002", "SKL004", 0.85),
            ("OCC002", "SKL008", 0.75),
            ("OCC002", "SKL009", 0.80),
            # Financial Analyst
            ("OCC003", "SKL001", 0.60),
            ("OCC003", "SKL002", 0.85),
            ("OCC003", "SKL003", 0.55),
            ("OCC003", "SKL006", 0.90),
            ("OCC003", "SKL007", 0.70),
            ("OCC003", "SKL009", 0.75),
            # Product Manager
            ("OCC004", "SKL001", 0.65),
            ("OCC004", "SKL005", 0.85),
            ("OCC004", "SKL007", 0.70),
            ("OCC004", "SKL010", 0.90),
            # Marketing Analyst
            ("OCC005", "SKL001", 0.65),
            ("OCC005", "SKL002", 0.70),
            ("OCC005", "SKL003", 0.80),
            ("OCC005", "SKL005", 0.85),
        ]
        return [
            {
                "occupation_id": occ_id,
                "occupation_title": occupations_map.get(occ_id, ""),
                "skill_id": skl_id,
                "skill_name": skills_map.get(skl_id, ""),
                "importance": imp,
                "period": "2026",
            }
            for occ_id, skl_id, imp in raw
        ]

    def _get_local_demand_scores(self) -> List[Dict[str, Any]]:
        return [
            {"occupation_id": "OCC001", "title": "Business Analyst", "category": "analytics", "geography": "India", "total_demand": 700, "avg_demand_share": 0.8150},
            {"occupation_id": "OCC002", "title": "Data Analyst", "category": "analytics", "geography": "India", "total_demand": 1100, "avg_demand_share": 0.9150},
            {"occupation_id": "OCC003", "title": "Financial Analyst", "category": "finance", "geography": "India", "total_demand": 565, "avg_demand_share": 0.8600},
            {"occupation_id": "OCC004", "title": "Product Manager", "category": "product", "geography": "India", "total_demand": 1100, "avg_demand_share": 0.8000},
            {"occupation_id": "OCC005", "title": "Marketing Analyst", "category": "marketing", "geography": "India", "total_demand": 820, "avg_demand_share": 0.7300},
        ]

    def _get_local_demand_velocities(self) -> List[Dict[str, Any]]:
        return [
            {"occupation_id": "OCC001", "title": "Business Analyst", "skill_id": "SKL001", "skill_name": "SQL", "current_demand": 410, "prev_demand": 320, "velocity_pct": 28.12},
            {"occupation_id": "OCC001", "title": "Business Analyst", "skill_id": "SKL003", "skill_name": "Power BI", "current_demand": 290, "prev_demand": 200, "velocity_pct": 45.00},
            {"occupation_id": "OCC002", "title": "Data Analyst", "skill_id": "SKL001", "skill_name": "SQL", "current_demand": 610, "prev_demand": 480, "velocity_pct": 27.08},
            {"occupation_id": "OCC002", "title": "Data Analyst", "skill_id": "SKL004", "skill_name": "Python", "current_demand": 490, "prev_demand": 350, "velocity_pct": 40.00},
            {"occupation_id": "OCC003", "title": "Financial Analyst", "skill_id": "SKL006", "skill_name": "Finance Basics", "current_demand": 295, "prev_demand": 280, "velocity_pct": 5.36},
            {"occupation_id": "OCC003", "title": "Financial Analyst", "skill_id": "SKL002", "skill_name": "Excel", "current_demand": 270, "prev_demand": 260, "velocity_pct": 3.85},
            {"occupation_id": "OCC004", "title": "Product Manager", "skill_id": "SKL010", "skill_name": "Product Thinking", "current_demand": 450, "prev_demand": 380, "velocity_pct": 18.42},
            {"occupation_id": "OCC004", "title": "Product Manager", "skill_id": "SKL005", "skill_name": "Communication", "current_demand": 360, "prev_demand": 310, "velocity_pct": 16.13},
            {"occupation_id": "OCC004", "title": "Product Manager", "skill_id": "SKL001", "skill_name": "SQL", "current_demand": 290, "prev_demand": 250, "velocity_pct": 16.00},
            {"occupation_id": "OCC005", "title": "Marketing Analyst", "skill_id": "SKL005", "skill_name": "Communication", "current_demand": 320, "prev_demand": 280, "velocity_pct": 14.29},
            {"occupation_id": "OCC005", "title": "Marketing Analyst", "skill_id": "SKL003", "skill_name": "Power BI", "current_demand": 240, "prev_demand": 200, "velocity_pct": 20.00},
            {"occupation_id": "OCC005", "title": "Marketing Analyst", "skill_id": "SKL002", "skill_name": "Excel", "current_demand": 260, "prev_demand": 220, "velocity_pct": 18.18},
        ]

    def _get_local_skill_adjacency(self) -> List[Dict[str, Any]]:
        return [
            {"skill_a": "SKL001", "skill_a_name": "SQL", "skill_b": "SKL004", "skill_b_name": "Python", "cooccurrence": 0.85},
            {"skill_a": "SKL001", "skill_a_name": "SQL", "skill_b": "SKL003", "skill_b_name": "Power BI", "cooccurrence": 0.78},
            {"skill_a": "SKL001", "skill_a_name": "SQL", "skill_b": "SKL009", "skill_b_name": "Statistical Analysis", "cooccurrence": 0.76},
            {"skill_a": "SKL002", "skill_a_name": "Excel", "skill_b": "SKL006", "skill_b_name": "Finance Basics", "cooccurrence": 0.72},
            {"skill_a": "SKL003", "skill_a_name": "Power BI", "skill_b": "SKL008", "skill_b_name": "Tableau", "cooccurrence": 0.80},
        ]

    def _fallback_query(self, sql: str) -> List[Dict[str, Any]]:
        sql_lower = sql.lower()
        if "v_demand_score" in sql_lower or "avg_demand_share" in sql_lower or "total_demand" in sql_lower:
            return self._get_local_demand_scores()
        elif "v_demand_velocity" in sql_lower or "velocity_pct" in sql_lower:
            return self._get_local_demand_velocities()
        elif "v_skill_adjacency" in sql_lower or "cooccurrence" in sql_lower:
            return self._get_local_skill_adjacency()
        elif "occupation_skills" in sql_lower:
            return self._get_local_occupation_skills()
        elif "occupations" in sql_lower:
            return self._get_local_occupations()
        elif "skills" in sql_lower:
            return self._get_local_skills()
        return []
