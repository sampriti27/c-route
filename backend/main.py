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

# Ensure backend directory is in sys.path
BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from scorer import RouteScorer, get_scorer


# --------------------------------------------------------------------------
# Request & Response Models
# --------------------------------------------------------------------------
class ProfileRequest(BaseModel):
    """User profile request payload for career route scoring."""

    skills: List[str] = Field(
        default_factory=list,
        description="List of current skills held by the user",
        validation_alias=AliasChoices("skills", "current_skills"),
    )
    target: Optional[str] = Field(
        default=None,
        description="Target career direction or domain focus (e.g. 'analytics', 'finance', 'product')",
        validation_alias=AliasChoices("target", "target_direction"),
    )
    candidate_destinations: Optional[List[str]] = Field(
        default=None,
        description="Optional list of destination titles or occupation IDs to evaluate",
    )
    score_all: bool = Field(
        default=True,
        description="If True, scores all occupations in catalog; if False, filters to candidates/target direction",
    )
    profile_id: Optional[str] = None
    name: Optional[str] = None
    education: Optional[str] = None
    experience_years: Optional[float] = None

    model_config = {
        "populate_by_name": True,
        "extra": "ignore",
        "json_schema_extra": {
            "example": {
                "name": "Aisha",
                "education": "B.Com graduate",
                "skills": ["Excel", "Finance Basics", "Communication", "PowerPoint"],
                "target": "analytics",
                "experience_years": 0,
                "score_all": True,
            }
        },
    }


class HealthResponse(BaseModel):
    """Health check status response."""

    status: str
    service: str
    scorer_ready: bool
    occupations_count: int
    skills_count: int
    data_source: str
    live_bigquery: bool


class ProfileResponse(BaseModel):
    """Ranked career routes response."""

    status: str = "success"
    profile_name: Optional[str] = None
    target_direction: Optional[str] = None
    total_routes: int
    routes: List[Dict[str, Any]]


# --------------------------------------------------------------------------
# Application Lifespan (Startup / Shutdown)
# --------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Initializes RouteScorer singleton and warms up market intelligence cache
    at application startup.
    """
    print("[INFO] Starting C.Route API server...")
    scorer = get_scorer()
    print(
        f"[INFO] RouteScorer ready. Loaded {len(scorer.occupations)} occupations, "
        f"{len(scorer.skills)} skills. Live BQ: {scorer.bq.is_live}"
    )
    yield
    print("[INFO] Shutting down C.Route API server...")


# --------------------------------------------------------------------------
# FastAPI Application Initialization
# --------------------------------------------------------------------------
app = FastAPI(
    title="C.Route API",
    description="Deterministic Route Fit scoring engine for career pathways. 'Data decides. AI explains.'",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------------------------------
# API Routes
# --------------------------------------------------------------------------
@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["System"],
    summary="Service health and scorer status",
)
async def health_check() -> HealthResponse:
    """Returns backend health status, market data counts, and BigQuery connection mode."""
    try:
        scorer = get_scorer()
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
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Health check failed: {str(e)}",
        )


@app.post(
    "/profile",
    response_model=ProfileResponse,
    tags=["Scoring"],
    summary="Score and rank career routes for a user profile",
)
async def score_profile_endpoint(payload: ProfileRequest) -> ProfileResponse:
    """
    Accepts user skills and optional target direction, computes deterministic 5-factor
    Route Fit scores across career destinations, and returns ranked routes.
    """
    if not payload.skills:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="At least one skill must be provided in 'skills' or 'current_skills'.",
        )

    try:
        scorer = get_scorer()
        ranked_routes = scorer.score_profile(
            current_skills=payload.skills,
            candidate_destinations=payload.candidate_destinations,
            target_direction=payload.target,
            score_all=payload.score_all,
        )

        return ProfileResponse(
            status="success",
            profile_name=payload.name,
            target_direction=payload.target,
            total_routes=len(ranked_routes),
            routes=ranked_routes,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error scoring profile: {str(e)}",
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
