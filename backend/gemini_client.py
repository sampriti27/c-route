"""
C.Route — Gemini AI Client
CRO (Career Route Oracle) — explains route recommendations and generates 90-day roadmaps.
"Data decides. AI explains." Gemini receives pre-computed numbers — it never invents them.
"""

import json
import logging
import os
import re
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

# --------------------------------------------------------------------------
# Constants
# --------------------------------------------------------------------------
MODEL_ID = "gemini-flash-latest"  # Update if project board changes

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
            logger.warning("google-genai not installed. GeminiClient in offline mode.")
            return

        if not self.api_key:
            logger.warning("GEMINI_API_KEY not set. GeminiClient in offline mode.")
            return

        try:
            self.client = genai.Client(api_key=self.api_key)
            self.is_live = True
            logger.info("GeminiClient ready — model: %s", self.model_id)
        except Exception:
            logger.exception("GeminiClient init failed. Falling back to offline mode.")

    # ------------------------------------------------------------------
    # Internal: raw Gemini call
    # ------------------------------------------------------------------
    def _call(self, prompt: str, max_tokens: int = 768) -> str:
        """Single Gemini call at temperature=0 for consistency.

        thinking_budget is capped at 1 (the minimum gemini-3.6-flash accepts —
        0 is rejected outright with a 400 INVALID_ARGUMENT, which was silently
        swallowed by the except-and-fallback in every caller, so CRO looked
        "alive" but was actually serving the same hardcoded template answer
        for every question). A budget of 1 still keeps reasoning tokens near
        zero for these short data-to-prose synthesis tasks.
        """
        if not self.is_live or not self.client:
            return ""
        logger.debug("Calling Gemini model=%s max_tokens=%d prompt_chars=%d", self.model_id, max_tokens, len(prompt))
        response = self.client.models.generate_content(
            model=self.model_id,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.0,
                max_output_tokens=max_tokens,
                thinking_config=types.ThinkingConfig(thinking_budget=1),
            ),
        )
        if response.candidates and response.candidates[0].finish_reason == "MAX_TOKENS":
            logger.warning("Gemini response hit max_output_tokens=%d and was truncated.", max_tokens)
        return (response.text or "").strip()

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
        except Exception:
            logger.exception("explain_route failed for route=%s; using fallback explanation.", top_route.get("occupation_id"))
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
            logger.info("Gemini offline — returning deterministic roadmap skeleton (%d phases).", len(skeleton))
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
        """
        Gemini writes a 2-sentence description per roadmap phase — in ONE call
        for the whole roadmap instead of one call per phase (was up to 6 calls
        per profile analysis, burning the free-tier daily quota fast). Falls
        back to the deterministic skeleton description per-phase on any
        parse/call failure.
        """
        title = top_route.get("title", "your target role")
        name = profile_name or "you"

        phases_desc = []
        for i, phase in enumerate(skeleton):
            skill = phase["focus_skill"]
            demand = phase.get("demand_score")
            weeks = phase["weeks"]
            focus = (
                f"consolidating {name}'s skills into a portfolio project for {title}"
                if skill == "Integration & Portfolio"
                else f"learning {skill}{f' (market demand score: {demand}%)' if demand is not None else ''} for {title}"
            )
            phases_desc.append(f'{i}. {weeks} — {focus}')

        prompt = f"""You are CRO, the Career Route Oracle, writing a {len(skeleton)}-phase learning roadmap toward {title} for {name}.

For EACH phase below, write exactly 2 sentences: first sentence what to do, second sentence why it matters for {title}.
Be specific and actionable. Do not mention salary or guarantees. Do not invent statistics not given here.

PHASES:
{chr(10).join(phases_desc)}

Return STRICT JSON only — no markdown fences, no commentary — as:
{{"phases": [{{"index": 0, "description": "..."}}, {{"index": 1, "description": "..."}}, ...]}}
One entry per phase above, in order, matched by "index"."""

        try:
            raw = self._call(prompt, max_tokens=1536)
            data = self._parse_json_object(raw)
            entries = data.get("phases") if data else None
            if isinstance(entries, list):
                for entry in entries:
                    if not isinstance(entry, dict):
                        continue
                    idx = entry.get("index")
                    description = entry.get("description")
                    if isinstance(idx, int) and 0 <= idx < len(skeleton) and isinstance(description, str) and description.strip():
                        skeleton[idx]["description"] = description.strip()
        except Exception:
            logger.exception("Gemini roadmap enrichment failed for route=%s; keeping skeleton descriptions.", top_route.get("occupation_id"))
            # Keep skeleton descriptions as fallback

        return skeleton

    # ------------------------------------------------------------------
    # Free-form Q&A (CRO chat / What-if page)
    # ------------------------------------------------------------------
    def answer_question(
        self,
        question: str,
        route: Dict[str, Any],
        profile_name: Optional[str] = None,
    ) -> str:
        """
        Answers a free-form user question about a single scored route.
        Grounded in the same real breakdown numbers as explain_route —
        Gemini narrates the data, it never invents its own figures.
        """
        if not self.is_live:
            return self._fallback_answer(question, route, profile_name)

        name = profile_name or "you"
        title = route.get("title", "this role")
        fit = round(route.get("route_fit_score", 0) * 100, 1)
        matched = route.get("matched_skills", [])
        missing = route.get("missing_skills", [])
        bd = route.get("breakdown", {})
        top_adjacency_pair = bd.get("top_adjacency_pair")

        prompt = f"""You are CRO, the Career Route Oracle for C.Route — a data-driven career navigation system.
The user is already mid-conversation with you in a chat panel.

Answer the user's QUESTION directly and specifically in 3–5 sentences, using ONLY the data provided below.
DO NOT invent market statistics, salaries, job counts, or timelines not present in this data.
DO NOT start with a greeting ("Hello {name}") — the conversation is already open, jump straight into the answer.
DO NOT use vague filler like "several factors," "various skills," or "a combination of things" — name the
exact skill(s) and number(s) from the data that answer the question.
If the question asks about difficulty, effort, or realism of closing gaps, reason from GAP EFFORT and the
number of MISSING SKILLS — do not just repeat the fit score.

USER: {name}
QUESTION: {question}

ROUTE UNDER DISCUSSION: {title}
ROUTE FIT SCORE: {fit}%
MATCHED SKILLS: {', '.join(matched) if matched else 'None'}
MISSING SKILLS: {', '.join(missing) if missing else 'None'}
MARKET DEMAND: {round(bd.get('market_demand', 0) * 100, 1)}%
SKILL OVERLAP: {round(bd.get('skill_overlap', 0) * 100, 1)}%
DEMAND VELOCITY: {round(bd.get('demand_velocity', 0) * 100, 1)}% growth
SKILL ADJACENCY: {round(bd.get('skill_adjacency', 0), 2)}{f" (strongest pair: {top_adjacency_pair})" if top_adjacency_pair else ""}
GAP EFFORT: {round(bd.get('gap_effort', 0), 2) if bd.get('gap_effort') is not None else 'Not available'}

Rules: Never invent numbers not shown above. Answer the actual question asked — do not give a generic route
summary. Tone: confident, data-grounded, direct mentor. No greeting, no sign-off."""

        try:
            result = self._call(prompt, max_tokens=768)
            return result if result else self._fallback_answer(question, route, profile_name)
        except Exception:
            logger.exception("answer_question failed for route=%s; using fallback answer.", route.get("occupation_id"))
            return self._fallback_answer(question, route, profile_name)

    def _fallback_answer(self, question: str, route: Dict, profile_name: Optional[str]) -> str:
        title = route.get("title", "this role")
        fit = round(route.get("route_fit_score", 0) * 100, 1)
        missing = route.get("missing_skills", [])
        return (
            f"For {title}, the current Route Fit score is {fit}%. "
            f"Closing the gap on {', '.join(missing[:2]) if missing else 'the remaining required skills'} "
            f"is the most direct lever to raise it further."
        )

    # ------------------------------------------------------------------
    # Profile Extraction (resume / free-text -> structured profile)
    # ------------------------------------------------------------------
    def extract_profile_from_text(self, text: str) -> Dict[str, Any]:
        """
        Parses free-form resume/profile text into the structured fields
        ProfileRequest expects: name, current_role, education, experience_years,
        skills, target_direction. Used by both the free-text profile form and
        the /extract-profile resume-upload endpoint.
        """
        if not self.is_live:
            return self._fallback_extract_profile(text)

        prompt = f"""You are a resume parser for C.Route, a data-driven career navigation system.

Extract the following fields from the resume/profile text below and return STRICT JSON only —
no markdown fences, no commentary, no trailing text.

{{
  "name": string or null,
  "current_role": string or null (their most recent/current job title, e.g. "Junior Finance Executive"),
  "education": string or null,
  "experience_years": number or null,
  "skills": array of short skill name strings (e.g. "Excel", "Python", "Financial Modeling"),
  "target_direction": string or null (the career field/role the person is aiming for, if stated or implied)
}}

RESUME/PROFILE TEXT:
\"\"\"
{text[:8000]}
\"\"\"

Return ONLY the JSON object."""

        try:
            raw = self._call(prompt, max_tokens=1024)
            data = self._parse_json_object(raw)
            if data is None:
                return self._fallback_extract_profile(text)
            skills = [s.strip() for s in data.get("skills") or [] if isinstance(s, str) and s.strip()]
            return {
                "name": data.get("name") or None,
                "current_role": data.get("current_role") or None,
                "education": data.get("education") or None,
                "experience_years": data.get("experience_years"),
                "skills": skills,
                "target_direction": data.get("target_direction") or None,
                "gemini_live": True,
            }
        except Exception:
            logger.exception("extract_profile_from_text failed; using offline fallback extraction.")
            return self._fallback_extract_profile(text)

    def _parse_json_object(self, raw: str) -> Optional[Dict[str, Any]]:
        if not raw:
            return None
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if not match:
            return None
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            return None

    def _fallback_extract_profile(self, text: str) -> Dict[str, Any]:
        """Best-effort offline extraction — used when Gemini is unavailable."""
        skills: List[str] = []
        try:
            from scorer import get_scorer
            scorer = get_scorer()
            normalized = text.lower()
            for skill in scorer.skills.values():
                skill_name = skill.get("skill_name", "")
                if skill_name and skill_name.lower() in normalized:
                    skills.append(skill_name)
        except Exception:
            logger.exception("Offline skill matching failed during profile extraction fallback.")

        years_match = re.search(r"(\d+(?:\.\d+)?)\s*\+?\s*years?", text, re.IGNORECASE)
        experience_years = float(years_match.group(1)) if years_match else None

        first_line = next((line.strip() for line in text.splitlines() if line.strip()), None)
        name = first_line if first_line and len(first_line) <= 60 else None

        education = None
        for line in text.splitlines():
            if re.search(r"\b(bachelor|b\.?com|b\.?sc|b\.?tech|master|m\.?ba|degree|diploma)\b", line, re.IGNORECASE):
                education = line.strip()
                break

        current_role = None
        role_keywords = r"\b(analyst|manager|executive|engineer|intern|associate|consultant|developer|coordinator|specialist|lead|director)\b"
        for line in text.splitlines():
            stripped = line.strip()
            if stripped and stripped != name and len(stripped) <= 60 and re.search(role_keywords, stripped, re.IGNORECASE):
                current_role = stripped
                break

        return {
            "name": name,
            "current_role": current_role,
            "education": education,
            "experience_years": experience_years,
            "skills": skills,
            "target_direction": None,
            "gemini_live": False,
        }

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
        logger.info(
            "Generating CRO response for occupation_id=%s gemini_live=%s",
            top_route.get("occupation_id"), self.is_live,
        )
        explanation = self.explain_route(top_route, profile_name)
        roadmap = self.generate_roadmap(skill_gaps, top_route, profile_name)

        return {
            "cro_explanation": explanation,
            "roadmap_90_day": roadmap,
            "roadmap_weeks": 12,
            "gemini_live": self.is_live,
        }