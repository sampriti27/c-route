"""
C.Route — Gemini AI Client
CRO (Career Route Oracle) — explains route recommendations and generates 90-day roadmaps.
"Data decides. AI explains." Gemini receives pre-computed numbers — it never invents them.
"""

import os
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv

load_dotenv()

try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

# --------------------------------------------------------------------------
# Constants
# --------------------------------------------------------------------------
MODEL_ID = "gemini-3.6-flash"  # Update if project board changes

# Static platform suggestions per skill category (Phase 2: replace with real course API)
RESOURCE_PLATFORMS: Dict[str, List[str]] = {
    "data":          ["Kaggle Learn", "Mode Analytics", "Google Data Analytics (Coursera)"],
    "finance":       ["Corporate Finance Institute", "Investopedia Academy", "edX Finance"],
    "product":       ["Product School", "Reforge", "Coursera Product Management"],
    "communication": ["Toastmasters", "Coursera Business Communication", "LinkedIn Learning"],
    "default":       ["Coursera", "LinkedIn Learning", "YouTube"],
}

# --------------------------------------------------------------------------
# Singleton
# --------------------------------------------------------------------------
_instance: Optional["GeminiClient"] = None


def get_gemini_client() -> "GeminiClient":
    global _instance
    if _instance is None:
        _instance = GeminiClient()
    return _instance


# --------------------------------------------------------------------------
# GeminiClient
# --------------------------------------------------------------------------
class GeminiClient:
    """
    CRO wrapper around Google Gemini.
    All market numbers come from the scorer — Gemini only explains them.
    Temperature = 0 for near-deterministic output on repeated calls.
    """

    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.model_id = MODEL_ID
        self.is_live = False
        self.client = None

        if not GENAI_AVAILABLE:
            print("[WARN] google-genai not installed. GeminiClient in offline mode.")
            return

        if not self.api_key:
            print("[WARN] GEMINI_API_KEY not set. GeminiClient in offline mode.")
            return

        try:
            self.client = genai.Client(api_key=self.api_key)
            self.is_live = True
            print(f"[INFO] GeminiClient ready — model: {self.model_id}")
        except Exception as e:
            print(f"[WARN] GeminiClient init failed: {e}. Falling back to offline mode.")

    # ------------------------------------------------------------------
    # Internal: raw Gemini call
    # ------------------------------------------------------------------
    def _call(self, prompt: str, max_tokens: int = 512) -> str:
        """Single Gemini call at temperature=0 for consistency."""
        if not self.is_live or not self.client:
            return ""
        response = self.client.models.generate_content(
            model=self.model_id,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.0,
                max_output_tokens=max_tokens,
                thinking_config=types.ThinkingConfig(thinking_budget=0),
            ),
        )
        return response.text.strip()
        """Single Gemini call at temperature=0 for consistency."""
        if not self.is_live or not self.client:
            return ""
        response = self.client.models.generate_content(
            model=self.model_id,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.0,
                max_output_tokens=max_tokens,
            ),
        )
        return response.text.strip()

    # ------------------------------------------------------------------
    # Route Explanation
    # ------------------------------------------------------------------
    def explain_route(
        self,
        top_route: Dict[str, Any],
        profile_name: Optional[str] = None,
    ) -> str:
        """
        2–3 sentence CRO explanation for the top recommended route.
        All numbers injected from scorer — Gemini cannot invent them.
        """
        if not self.is_live:
            return self._fallback_explanation(top_route, profile_name)

        name = profile_name or "you"
        title = top_route.get("title", "this role")
        fit = round(top_route.get("route_fit_score", 0) * 100, 1)
        matched = top_route.get("matched_skills", [])
        missing = top_route.get("missing_skills", [])
        bd = top_route.get("breakdown", {})

        prompt = f"""You are CRO, the Career Route Oracle for C.Route — a data-driven career navigation system.

Explain the following route recommendation in 2–3 sentences using ONLY the data provided.
DO NOT invent market statistics, salaries, or job counts.
Speak directly to the user in a warm, mentor-like voice.

USER: {name}
RECOMMENDED ROUTE: {title}
ROUTE FIT SCORE: {fit}%
MATCHED SKILLS: {', '.join(matched) if matched else 'None'}
MISSING SKILLS: {', '.join(missing) if missing else 'None'}
MARKET DEMAND: {round(bd.get('market_demand', 0) * 100, 1)}%
SKILL OVERLAP: {round(bd.get('skill_overlap', 0) * 100, 1)}%
DEMAND VELOCITY: {round(bd.get('demand_velocity', 0) * 100, 1)}% growth
SKILL ADJACENCY: {round(bd.get('skill_adjacency', 0), 2)}

Write 2–3 sentences covering:
1. Why this route fits {name} based on the exact data above
2. What makes it the strongest match
3. One honest note about the skill gaps to close

Rules: Never say "perfect". Never invent numbers. Tone: confident, data-grounded, warm mentor."""

        try:
            result = self._call(prompt, max_tokens=1024)
            return result if result else self._fallback_explanation(top_route, profile_name)
        except Exception as e:
            print(f"[WARN] explain_route failed: {e}")
            return self._fallback_explanation(top_route, profile_name)

    def _fallback_explanation(self, top_route: Dict, profile_name: Optional[str]) -> str:
        name = profile_name or "Your profile"
        title = top_route.get("title", "this role")
        fit = round(top_route.get("route_fit_score", 0) * 100, 1)
        matched = top_route.get("matched_skills", [])
        missing = top_route.get("missing_skills", [])
        return (
            f"{name} aligns with {title} at a {fit}% Route Fit score, "
            f"driven by existing strengths in {', '.join(matched[:3]) if matched else 'transferable skills'}. "
            f"Closing the gap on {', '.join(missing[:2]) if missing else 'key technical skills'} "
            f"will significantly strengthen this route."
        )

    # ------------------------------------------------------------------
    # 90-Day Roadmap
    # ------------------------------------------------------------------
    def generate_roadmap(
        self,
        skill_gaps: List[Dict[str, Any]],
        top_route: Dict[str, Any],
        profile_name: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        12-week roadmap.
        Python builds the skeleton (skill order by demand score — data decides).
        Gemini writes the weekly descriptions (AI explains).
        """
        skeleton = self._build_skeleton(skill_gaps, top_route)
        if not self.is_live:
            return skeleton
        return self._enrich_skeleton(skeleton, top_route, profile_name)

    def _build_skeleton(
        self,
        skill_gaps: List[Dict[str, Any]],
        top_route: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        """
        Deterministic skeleton — Python decides structure, not Gemini.
        2 weeks per skill (top 5 gaps by demand score) + 2-week integration sprint.
        """
        title = top_route.get("title", "your target role")
        roadmap = []
        week = 1

        # Sort gaps by demand score descending — data decides priority
        sorted_gaps = sorted(
            skill_gaps,
            key=lambda g: g.get("demand_score", 0),
            reverse=True,
        )

        for gap in sorted_gaps[:5]:
            skill_name = gap.get("skill_name", gap.get("skill_id", "Unknown Skill"))
            demand_score = round(gap.get("demand_score", 0) * 100, 1)
            category = gap.get("category", "default")
            platforms = RESOURCE_PLATFORMS.get(category, RESOURCE_PLATFORMS["default"])

            roadmap.append({
                "weeks": f"Week {week}–{week + 1}",
                "week_start": week,
                "week_end": week + 1,
                "focus_skill": skill_name,
                "demand_score": demand_score,
                "suggested_platforms": platforms,
                "description": (
                    f"Build foundational competency in {skill_name} — "
                    f"demand score {demand_score}% for {title}."
                ),
                "milestone": f"Complete 2 hands-on exercises using {skill_name}.",
            })
            week += 2

        # Integration sprint — always final 2 weeks
        roadmap.append({
            "weeks": "Week 11–12",
            "week_start": 11,
            "week_end": 12,
            "focus_skill": "Integration & Portfolio",
            "demand_score": None,
            "suggested_platforms": ["GitHub", "LinkedIn", "Personal portfolio site"],
            "description": (
                f"Consolidate all skills into one end-to-end project "
                f"demonstrating readiness for {title}."
            ),
            "milestone": f"Publish a portfolio project targeting {title} role requirements.",
        })

        return roadmap

    def _enrich_skeleton(
        self,
        skeleton: List[Dict[str, Any]],
        top_route: Dict[str, Any],
        profile_name: Optional[str],
    ) -> List[Dict[str, Any]]:
        """Gemini writes 2-sentence description per phase. Falls back to skeleton on error."""
        title = top_route.get("title", "your target role")
        name = profile_name or "you"

        for phase in skeleton:
            skill = phase["focus_skill"]
            demand = phase.get("demand_score")
            weeks = phase["weeks"]

            if skill == "Integration & Portfolio":
                prompt = f"""You are CRO, the Career Route Oracle.
Respond with 2 sentences only. First sentence: what to build. Second sentence: why it demonstrates readiness for {title}.
Focus: consolidating {name}'s skills into a portfolio project for {title} during {weeks}.
Be specific and encouraging. Do not mention salary or guarantees. Do not invent statistics."""
            else:
                prompt = f"""You are CRO, the Career Route Oracle.
Respond with 2 sentences only. First sentence: what to learn. Second sentence: why it matters for {title}.
Focus skill: {skill}{f' (market demand score: {demand}%)' if demand is not None else ''}.
Explain what to learn and why it matters for {title}. Be specific and actionable.
Do not mention salary or guarantees. Do not invent statistics."""

            try:
                enriched = self._call(prompt, max_tokens=512)
                if enriched:
                    phase["description"] = enriched
            except Exception as e:
                print(f"[WARN] Gemini enrichment failed for {skill}: {e}")
                # Keep skeleton description as fallback

        return skeleton

    # ------------------------------------------------------------------
    # Master method called by main.py
    # ------------------------------------------------------------------
    def generate_cro_response(
        self,
        top_route: Dict[str, Any],
        skill_gaps: List[Dict[str, Any]],
        profile_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Full CRO output: explanation + 12-week roadmap.
        Called by POST /profile in main.py.
        """
        explanation = self.explain_route(top_route, profile_name)
        roadmap = self.generate_roadmap(skill_gaps, top_route, profile_name)

        return {
            "cro_explanation": explanation,
            "roadmap_90_day": roadmap,
            "roadmap_weeks": 12,
            "gemini_live": self.is_live,
        }