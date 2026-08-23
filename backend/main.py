"""
C.Route — Backend API Server
FastAPI Application serving career route recommendations and Route Fit scoring.
"Data decides. AI explains."
"""

import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import AliasChoices, BaseModel, Field

BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from scorer import RouteScorer, get_scorer
from gemini_client import GeminiClient, get_gemini_client


# --------------------------------------------------------------------------
# Request & Response Models
# --------------------------------------------------------------------------
class ProfileRequest(BaseModel):
    skills: List[str] = Field(
        default_factory=list,
        validation_alias=AliasChoices("skills", "current_skills"),
    )
    target: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("target", "target_direction"),
    )
    candidate_destinations: Optional[List[str]] = None
    score_all: bool = True
    profile_id: Optional[str] = None
    name: Optional[str] = None
    education: Optional[str] = None
    experience_years: Optional[float] = None

    model_config = {
        "populate_by_name": True,
        "extra": "ignore",
    }


class HealthResponse(BaseModel):
    status: str
    service: str
    scorer_ready: bool
    occupations_count: int
    skills_count: int
    data_source: str
    live_bigquery: bool
    gemini_live: bool


class ProfileResponse(BaseModel):
    status: str = "success"
    profile_name: Optional[str] = None
    target_direction: Optional[str] = None
    total_routes: int
    routes: List[Dict[str, Any]]
    cro_explanation: Optional[str] = None
    roadmap_90_day: Optional[List[Dict[str, Any]]] = None
    roadmap_weeks: Optional[int] = None
    gemini_live: Optional[bool] = None


# --------------------------------------------------------------------------
# Lifespan
# --------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[INFO] Starting C.Route API server...")
    scorer = get_scorer()
    gemini = get_gemini_client()
    print(
        f"[INFO] RouteScorer ready — {len(scorer.occupations)} occupations, "
        f"{len(scorer.skills)} skills. Live BQ: {scorer.bq.is_live}"
    )
    print(f"[INFO] GeminiClient ready — Live: {gemini.is_live}")
    yield
    print("[INFO] Shutting down C.Route API server.")


# --------------------------------------------------------------------------
# App
# --------------------------------------------------------------------------
app = FastAPI(
    title="C.Route API",
    description="Deterministic Route Fit scoring engine. 'Data decides. AI explains.'",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------------------------------
# Routes
# --------------------------------------------------------------------------
@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check() -> HealthResponse:
    try:
        scorer = get_scorer()
        gemini = get_gemini_client()
        return HealthResponse(
            status="healthy",
            service="c-route-backend",
            scorer_ready=scorer is not None,
            occupations_count=len(scorer.occupations) if scorer else 0,
            skills_count=len(scorer.skills) if scorer else 0,
            data_source=(
                f"BigQuery ({scorer.bq.project_id}.{scorer.bq.dataset_id})"
                if scorer and scorer.bq.is_live
                else "Offline Fallback (Seed Dataset)"
            ),
            live_bigquery=scorer.bq.is_live if scorer else False,
            gemini_live=gemini.is_live,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")


@app.post("/profile", response_model=ProfileResponse, tags=["Scoring"])
async def score_profile_endpoint(payload: ProfileRequest) -> ProfileResponse:
    if not payload.skills:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="At least one skill must be provided.",
        )

    try:
        scorer = get_scorer()
        gemini = get_gemini_client()

        # Step 1 — Deterministic scoring (data decides)
        ranked_routes = scorer.score_profile(
            current_skills=payload.skills,
            candidate_destinations=payload.candidate_destinations,
            target_direction=payload.target,
            score_all=payload.score_all,
        )

        # Step 2 — Skill gaps for top route (data decides order)
        cro_output = {}
        if ranked_routes:
            top_route = ranked_routes[0]
            top_occ_id = top_route.get("occupation_id", "")
            skill_gaps = scorer.compute_skill_gaps(payload.skills, top_occ_id)

            # Step 3 — Gemini explains (AI explains)
            cro_output = gemini.generate_cro_response(
                top_route=top_route,
                skill_gaps=skill_gaps,
                profile_name=payload.name,
            )

        return ProfileResponse(
            status="success",
            profile_name=payload.name,
            target_direction=payload.target,
            total_routes=len(ranked_routes),
            routes=ranked_routes,
            **cro_output,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error scoring profile: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)