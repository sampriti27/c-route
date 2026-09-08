"""
C.Route — Multi-Agent Architecture
Wraps existing scoring and Gemini logic into named agent classes.

Agents:
  ProfileAgent       — extracts structured profile from raw text (Gemini)
  MarketAgent        — retrieves labor-market signals from BigQuery
  SkillGapAgent      — identifies and ranks skill gaps
  PlannerAgent       — generates CRO explanation + 90-day roadmap (Gemini)
  CRouteOrchestrator — coordinates agents into a single career navigation response

"Data decides. AI explains."
"""

import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


# --------------------------------------------------------------------------
# ProfileAgent
# --------------------------------------------------------------------------
class ProfileAgent:
    """
    Responsibility: Extract a structured skill profile from raw resume text.
    Tool:           Gemini (gemini_client.extract_profile_from_text)
    Decision:       What skills, education, and target direction does this person have?
    """

    def __init__(self, gemini_client):
        self.gemini = gemini_client

    def run(self, raw_text: str) -> Dict[str, Any]:
        """
        Input:  Raw resume / profile text (str)
        Output: Structured profile dict — {name, skills, education,
                experience_years, target_direction, gemini_live}
        """
        logger.info("[ProfileAgent] Extracting profile from text (%d chars)", len(raw_text))
        result = self.gemini.extract_profile_from_text(raw_text)
        logger.info("[ProfileAgent] Extracted %d skill(s)", len(result.get("skills", [])))
        return result


# --------------------------------------------------------------------------
# MarketAgent
# --------------------------------------------------------------------------
class MarketAgent:
    """
    Responsibility: Retrieve current labor-market intelligence from BigQuery.
    Tool:           BigQueryClient (via RouteScorer.bq)
    Decision:       What does the market currently demand for each occupation?
    """

    def __init__(self, scorer):
        self.scorer = scorer

    def run(self, user_skills: List[str]) -> Dict[str, Any]:
        """
        Input:  List of user skill names (used for logging / future filtering)
        Output: Market context dict — {demand_scores, demand_velocities,
                occupation_count, live_bigquery}
        """
        logger.info("[MarketAgent] Fetching market signals for %d skill(s)", len(user_skills))
        demand_scores = self.scorer.bq.get_demand_scores()
        demand_velocities = self.scorer.bq.get_demand_velocities()
        logger.info(
            "[MarketAgent] Retrieved demand for %d occupation(s) | live_bigquery=%s",
            len(demand_scores),
            self.scorer.bq.is_live,
        )
        return {
            "demand_scores": demand_scores,
            "demand_velocities": demand_velocities,
            "occupation_count": len(demand_scores),
            "live_bigquery": self.scorer.bq.is_live,
        }


# --------------------------------------------------------------------------
# SkillGapAgent
# --------------------------------------------------------------------------
class SkillGapAgent:
    """
    Responsibility: Identify and rank skill gaps between a user profile and a target occupation.
    Tool:           RouteScorer.compute_skill_gaps
    Decision:       Which missing skills have the highest market impact?
    """

    def __init__(self, scorer):
        self.scorer = scorer

    def run(self, current_skills: List[str], occupation_id: str) -> List[Dict[str, Any]]:
        """
        Input:  current_skills (list of str), occupation_id (str)
        Output: Ranked list of missing skills — [{skill_id, skill_name,
                category, demand_score}, ...]
        """
        logger.info(
            "[SkillGapAgent] Computing gaps — occupation_id=%s skills=%d",
            occupation_id,
            len(current_skills),
        )
        gaps = self.scorer.compute_skill_gaps(current_skills, occupation_id)
        logger.info("[SkillGapAgent] Found %d gap(s)", len(gaps))
        return gaps


# --------------------------------------------------------------------------
# PlannerAgent
# --------------------------------------------------------------------------
class PlannerAgent:
    """
    Responsibility: Generate CRO explanation and personalised 90-day career roadmap.
    Tool:           Gemini (gemini_client.generate_cro_response)
    Decision:       How should this person navigate toward their best-fit route?
    """

    def __init__(self, gemini_client):
        self.gemini = gemini_client

    def run(
        self,
        top_route: Dict[str, Any],
        skill_gaps: List[Dict[str, Any]],
        profile_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Input:  top_route (scored route dict), skill_gaps (ranked list), profile_name
        Output: {cro_explanation, roadmap_90_day, roadmap_weeks, gemini_live}
        """
        logger.info(
            "[PlannerAgent] Generating roadmap — destination=%s gaps=%d",
            top_route.get("title", "unknown"),
            len(skill_gaps),
        )
        result = self.gemini.generate_cro_response(
            top_route=top_route,
            skill_gaps=skill_gaps,
            profile_name=profile_name,
        )
        logger.info(
            "[PlannerAgent] Roadmap generated — gemini_live=%s",
            result.get("gemini_live"),
        )
        return result


# --------------------------------------------------------------------------
# CRouteOrchestrator
# --------------------------------------------------------------------------
class CRouteOrchestrator:
    """
    Orchestrator: Coordinates all agents into a single career navigation pipeline.

    Pipeline:
      MarketAgent   → retrieve BigQuery labor-market signals  (data decides)
      RouteScorer   → deterministic 5-factor Route Fit scoring (data decides)
      SkillGapAgent → identify gaps for the top-ranked destination (data decides)
      PlannerAgent  → CRO explanation + 90-day roadmap        (AI explains)
    """

    def __init__(self, scorer, gemini_client):
        self.scorer = scorer
        self.market_agent = MarketAgent(scorer)
        self.gap_agent = SkillGapAgent(scorer)
        self.planner_agent = PlannerAgent(gemini_client)

    def run(
        self,
        current_skills: List[str],
        candidate_destinations: Optional[List[str]] = None,
        target_direction: Optional[str] = None,
        score_all: bool = True,
        profile_name: Optional[str] = None,
        skip_cro: bool = False,
    ) -> Dict[str, Any]:
        """
        Runs the full C.Route career navigation pipeline.

        Input:  User profile — skills, optional target direction and name
        Output: {routes, cro_explanation, roadmap_90_day, roadmap_weeks, gemini_live}
        """
        logger.info(
            "[Orchestrator] Pipeline start — skills=%d target=%s skip_cro=%s",
            len(current_skills),
            target_direction,
            skip_cro,
        )

        # Step 1 — Market intelligence (data decides)
        self.market_agent.run(current_skills)

        # Step 2 — Deterministic Route Fit scoring (data decides)
        ranked_routes = self.scorer.score_profile(
            current_skills=current_skills,
            candidate_destinations=candidate_destinations,
            target_direction=target_direction,
            score_all=score_all,
        )

        # Step 3 + 4 — Skill gap analysis + CRO planning (AI explains)
        cro_output: Dict[str, Any] = {}
        if ranked_routes and not skip_cro:
            top_route = ranked_routes[0]
            top_occ_id = top_route.get("occupation_id", "")
            gaps = self.gap_agent.run(current_skills, top_occ_id)
            cro_output = self.planner_agent.run(
                top_route=top_route,
                skill_gaps=gaps,
                profile_name=profile_name,
            )

        logger.info(
            "[Orchestrator] Pipeline complete — routes=%d top=%s",
            len(ranked_routes),
            ranked_routes[0].get("occupation_id") if ranked_routes else "none",
        )

        return {"routes": ranked_routes, **cro_output}

    def whatif(
        self,
        current_skills: List[str],
        whatif_occupation: str,
        profile_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        What-if scenario: score a specific occupation the user wants to explore.
        No Gemini call — fast deterministic response for comparison.

        Input:  current_skills, whatif_occupation (name or id)
        Output: {whatif_route, skill_gaps, live_bigquery}
        """
        logger.info(
            "[Orchestrator] What-if — occupation=%s skills=%d",
            whatif_occupation,
            len(current_skills),
        )

        # Resolve occupation name → id
        from scorer import normalize_name
        norm_target = normalize_name(whatif_occupation)
        matched_occ_id = None
        for occ_id, occ in self.scorer.occupations.items():
            if (
                norm_target == normalize_name(occ.get("title", ""))
                or norm_target == normalize_name(occ_id)
                or norm_target in normalize_name(occ.get("title", ""))
            ):
                matched_occ_id = occ_id
                break

        if not matched_occ_id:
            return {
                "error": f"Occupation '{whatif_occupation}' not found in C.Route catalog.",
                "available_occupations": [
                    occ["title"] for occ in self.scorer.occupations.values()
                ],
            }

        user_skill_ids = self.scorer._map_user_skills(current_skills)
        whatif_route = self.scorer.score_occupation(matched_occ_id, user_skill_ids)
        gaps = self.gap_agent.run(current_skills, matched_occ_id)

        logger.info(
            "[Orchestrator] What-if complete — %s route_fit=%.4f gaps=%d",
            whatif_route.get("title"),
            whatif_route.get("route_fit_score", 0.0),
            len(gaps),
        )

        return {
            "whatif_route": whatif_route,
            "skill_gaps": gaps,
            "live_bigquery": self.scorer.bq.is_live,
        }
