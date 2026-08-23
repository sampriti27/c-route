"""
C.Route — Deterministic Route Fit Scoring Engine
Core Analytics Engine: Computes 5-factor Route Fit scores for career destinations.

Formula:
  Route Fit = 0.40 * skill_overlap
            + 0.25 * market_demand
            + 0.15 * demand_velocity
            + 0.10 * skill_adjacency
            - 0.10 * gap_effort

"Data decides. AI explains."
"""

import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

sys.path.insert(0, str(Path(__file__).resolve().parent))

from bq_client import BigQueryClient

# Standard Formula Weights
WEIGHT_OVERLAP = 0.40
WEIGHT_DEMAND = 0.25
WEIGHT_VELOCITY = 0.15
WEIGHT_ADJACENCY = 0.10
WEIGHT_GAP_PENALTY = 0.10


def normalize_name(name: str) -> str:
    """Normalizes skill/occupation names for robust matching."""
    return name.lower().replace("_", " ").replace("-", " ").strip()


class RouteScorer:
    """
    Deterministic Career Destination Scorer for C.Route.
    Extracts labor market signals from BigQuery and scores candidate career routes.
    """

    def __init__(self, bq_client: Optional[BigQueryClient] = None):
        self.bq = bq_client or BigQueryClient()
        self._load_market_data()

    def _load_market_data(self):
        """Loads and indexes market intelligence from BigQuery."""
        self.occupations = {o["occupation_id"]: o for o in self.bq.get_occupations()}

        self.skills = {s["skill_id"]: s for s in self.bq.get_skills()}
        self.skill_name_to_id = {
            normalize_name(s["skill_name"]): s["skill_id"]
            for s in self.skills.values()
        }

        raw_occ_skills = self.bq.get_occupation_skills()
        self.occupation_skills: Dict[str, List[Dict[str, Any]]] = {}
        for row in raw_occ_skills:
            occ_id = row["occupation_id"]
            if occ_id not in self.occupation_skills:
                self.occupation_skills[occ_id] = []
            self.occupation_skills[occ_id].append(row)

        self.demand_scores = self.bq.get_demand_scores()
        self.demand_velocities = self.bq.get_demand_velocities()

        raw_edges = self.bq.get_skill_adjacency()
        self.adjacency_graph: Dict[str, Dict[str, float]] = {}
        for edge in raw_edges:
            sa = edge["skill_a"]
            sb = edge["skill_b"]
            weight = float(edge.get("cooccurrence", 0.0))
            if sa not in self.adjacency_graph:
                self.adjacency_graph[sa] = {}
            if sb not in self.adjacency_graph:
                self.adjacency_graph[sb] = {}
            self.adjacency_graph[sa][sb] = max(self.adjacency_graph[sa].get(sb, 0.0), weight)
            self.adjacency_graph[sb][sa] = max(self.adjacency_graph[sb].get(sa, 0.0), weight)

    def reload(self):
        """Reloads and refreshes market data from BigQuery."""
        self._load_market_data()

    def _map_user_skills(self, user_skill_names: List[str]) -> Set[str]:
        """Maps free-text or snake_case user skill names to canonical skill_ids."""
        skill_ids = set()
        for name in user_skill_names:
            norm = normalize_name(name)
            if norm in self.skill_name_to_id:
                skill_ids.add(self.skill_name_to_id[norm])
            else:
                for canonical_norm, s_id in self.skill_name_to_id.items():
                    if norm == canonical_norm or norm in canonical_norm or canonical_norm in norm:
                        skill_ids.add(s_id)
                        break
        return skill_ids

    def calculate_adjacency_score(
        self, user_skill_ids: Set[str], required_skill_ids: Set[str]
    ) -> Tuple[float, Optional[str]]:
        """
        Calculates skill adjacency score between user skills and occupation requirements.
        Returns (adjacency_score, top_synergy_pair_label).
        """
        if not required_skill_ids or not user_skill_ids:
            return 0.0, None

        adj_values: List[float] = []
        best_edge_weight = 0.0
        best_pair = None

        for req_id in required_skill_ids:
            max_edge = 0.0
            best_u_id = None
            neighbors = self.adjacency_graph.get(req_id, {})
            for u_id in user_skill_ids:
                if u_id != req_id and u_id in neighbors:
                    edge = neighbors[u_id]
                    if edge > max_edge:
                        max_edge = edge
                        best_u_id = u_id
            adj_values.append(max_edge)
            if max_edge > best_edge_weight and best_u_id:
                best_edge_weight = max_edge
                req_name = self.skills.get(req_id, {}).get("skill_name", req_id)
                u_name = self.skills.get(best_u_id, {}).get("skill_name", best_u_id)
                best_pair = f"{u_name} <-> {req_name} = {best_edge_weight:.2f}"

        if not adj_values:
            return 0.0, None

        return round(sum(adj_values) / len(adj_values), 4), best_pair

    def score_occupation(
        self,
        occupation_id: str,
        user_skill_ids: Set[str],
        target_direction: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Calculates the 5-factor Route Fit score for a single target occupation."""
        occ = self.occupations.get(occupation_id, {})
        title = occ.get("title", occupation_id)
        category = occ.get("category", "general")

        target_dir_match = (
            normalize_name(category) == normalize_name(target_direction)
            if target_direction
            else False
        )

        req_rows = self.occupation_skills.get(occupation_id, [])
        required_skill_ids = {r["skill_id"] for r in req_rows}
        total_req_count = len(required_skill_ids)

        if total_req_count == 0:
            return {
                "occupation_id": occupation_id,
                "title": title,
                "category": category,
                "target_direction_match": target_dir_match,
                "route_fit_score": 0.0,
                "breakdown": {},
                "matched_skills": [],
                "missing_skills": [],
            }

        matched_skill_ids = user_skill_ids.intersection(required_skill_ids)
        missing_skill_ids = required_skill_ids.difference(user_skill_ids)
        skill_overlap = len(matched_skill_ids) / total_req_count

        demand_data = self.demand_scores.get(occupation_id, {})
        avg_demand_share = float(demand_data.get("avg_demand_share", 0.0))
        total_demand = int(demand_data.get("total_demand", 0))

        vel_data = self.demand_velocities.get(occupation_id, {})
        normalized_velocity = float(vel_data.get("normalized_velocity", 0.0))
        avg_velocity_pct = float(vel_data.get("avg_velocity_pct", 0.0))

        adjacency_score, top_adjacency_pair = self.calculate_adjacency_score(
            user_skill_ids, required_skill_ids
        )

        gap_effort = len(missing_skill_ids) / total_req_count

        route_fit = (
            (WEIGHT_OVERLAP * skill_overlap)
            + (WEIGHT_DEMAND * avg_demand_share)
            + (WEIGHT_VELOCITY * normalized_velocity)
            + (WEIGHT_ADJACENCY * adjacency_score)
            - (WEIGHT_GAP_PENALTY * gap_effort)
        )
        route_fit = max(0.0, min(1.0, route_fit))

        matched_names = [
            self.skills[sid]["skill_name"]
            for sid in matched_skill_ids
            if sid in self.skills
        ]
        missing_names = [
            self.skills[sid]["skill_name"]
            for sid in missing_skill_ids
            if sid in self.skills
        ]

        return {
            "occupation_id": occupation_id,
            "title": title,
            "category": category,
            "target_direction_match": target_dir_match,
            "route_fit_score": round(route_fit, 4),
            "matched_count": len(matched_skill_ids),
            "required_count": total_req_count,
            "matched_skills": sorted(matched_names),
            "missing_skills": sorted(missing_names),
            "breakdown": {
                "skill_overlap": round(skill_overlap, 4),
                "market_demand": round(avg_demand_share, 4),
                "total_demand": total_demand,
                "demand_velocity": round(normalized_velocity, 4),
                "velocity_pct": avg_velocity_pct,
                "skill_adjacency": round(adjacency_score, 4),
                "top_adjacency_pair": top_adjacency_pair,
                "gap_effort": round(gap_effort, 4),
            },
            "weighted_contributions": {
                "overlap_contrib": round(WEIGHT_OVERLAP * skill_overlap, 4),
                "demand_contrib": round(WEIGHT_DEMAND * avg_demand_share, 4),
                "velocity_contrib": round(WEIGHT_VELOCITY * normalized_velocity, 4),
                "adjacency_contrib": round(WEIGHT_ADJACENCY * adjacency_score, 4),
                "gap_penalty": round(-WEIGHT_GAP_PENALTY * gap_effort, 4),
            },
        }

    def compute_skill_gaps(
        self,
        current_skills: List[str],
        occupation_id: str,
    ) -> List[Dict[str, Any]]:
        """
        Returns missing skills for an occupation ranked by market demand score.
        Used by GeminiClient to build the 90-day roadmap skeleton.
        """
        normalised = {normalize_name(s) for s in current_skills}
        if not self.occupations.get(occupation_id):
            return []

        req_rows = self.occupation_skills.get(occupation_id, [])
        required_skill_ids = {r["skill_id"] for r in req_rows}
        gaps = []

        for skill_id in required_skill_ids:
            skill = self.skills.get(skill_id)
            if not skill:
                continue

            if (
                normalize_name(skill["skill_name"]) in normalised
                or normalize_name(skill_id) in normalised
            ):
                continue

            occ_demand = self.demand_scores.get(occupation_id, {})
            demand_score = float(occ_demand.get("avg_demand_share", 0.0))

            gaps.append({
                "skill_id": skill_id,
                "skill_name": skill["skill_name"],
                "category": skill.get("category", "default"),
                "demand_score": demand_score,
            })

        gaps.sort(key=lambda g: g["demand_score"], reverse=True)
        return gaps

    def score_profile(
        self,
        current_skills: List[str],
        candidate_destinations: Optional[List[str]] = None,
        target_direction: Optional[str] = None,
        score_all: bool = True,
    ) -> List[Dict[str, Any]]:
        """
        Scores and ranks career destinations for a user profile.
        """
        user_skill_ids = self._map_user_skills(current_skills)
        target_dir_norm = normalize_name(target_direction) if target_direction else None

        if not score_all:
            if candidate_destinations:
                candidate_ids = []
                for dest in candidate_destinations:
                    norm_dest = normalize_name(dest)
                    for occ_id, occ in self.occupations.items():
                        if (
                            norm_dest in normalize_name(occ["title"])
                            or norm_dest == normalize_name(occ_id)
                        ):
                            candidate_ids.append(occ_id)
            elif target_dir_norm:
                candidate_ids = [
                    occ_id
                    for occ_id, occ in self.occupations.items()
                    if normalize_name(occ.get("category", "")) == target_dir_norm
                ]
            else:
                candidate_ids = list(self.occupations.keys())

            if not candidate_ids:
                candidate_ids = list(self.occupations.keys())
        else:
            candidate_ids = list(self.occupations.keys())

        ranked_routes = []
        for occ_id in candidate_ids:
            score_card = self.score_occupation(
                occ_id, user_skill_ids, target_direction=target_direction
            )
            ranked_routes.append(score_card)

        ranked_routes.sort(key=lambda x: x["route_fit_score"], reverse=True)
        return ranked_routes


# --------------------------------------------------------------------------
# Singleton Accessor
# --------------------------------------------------------------------------
_SCORER_INSTANCE: Optional[RouteScorer] = None


def get_scorer(
    bq_client: Optional[BigQueryClient] = None, force_refresh: bool = False
) -> RouteScorer:
    """Returns a cached RouteScorer singleton. Pass force_refresh=True to reload."""
    global _SCORER_INSTANCE
    if _SCORER_INSTANCE is None or force_refresh:
        _SCORER_INSTANCE = RouteScorer(bq_client=bq_client)
    return _SCORER_INSTANCE


if __name__ == "__main__":
    scripts_dir = Path(__file__).resolve().parent.parent / "scripts"
    sys.path.insert(0, str(scripts_dir))
    from demo_scorer import run_aisha_demo
    run_aisha_demo()