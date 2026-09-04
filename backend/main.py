"""
C.Route — Backend API Server
FastAPI Application serving career route recommendations and Route Fit scoring.
"Data decides. AI explains."
"""

import logging
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import AliasChoices, BaseModel, Field

BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from scorer import RouteScorer, get_scorer
from gemini_client import GeminiClient, get_gemini_client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


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
    # Set by the What-If simulator: it only needs the recomputed route_fit_score,
    # not a fresh CRO explanation + roadmap. Skipping Gemini here avoids burning
    # ~7 calls (1 explanation + up to 6 roadmap phases) on every skill toggle.
    skip_cro: bool = False

    model_config = {
        "populate_by_name": True,
        "extra": "ignore",
    }


class SkillGapsRequest(BaseModel):
    skills: List[str] = Field(default_factory=list)
    occupation_id: str

    model_config = {"extra": "ignore"}


class AskRequest(BaseModel):
    question: str
    occupation_id: str
    skills: List[str] = Field(default_factory=list)
    target: Optional[str] = None
    name: Optional[str] = None

    model_config = {"extra": "ignore"}


class AskResponse(BaseModel):
    answer: str


class HealthResponse(BaseModel):
    status: str
    service: str
    scorer_ready: bool
    occupations_count: int
    skills_count: int
    data_source: str
    live_bigquery: bool
    gemini_live: bool


class ExtractProfileResponse(BaseModel):
    status: str = "success"
    name: Optional[str] = None
    current_role: Optional[str] = None
    education: Optional[str] = None
    experience_years: Optional[float] = None
    skills: List[str] = Field(default_factory=list)
    target_direction: Optional[str] = None
    gemini_live: bool = False


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
    logger.info("Starting C.Route API server...")
    scorer = get_scorer()
    gemini = get_gemini_client()
    logger.info(
        "RouteScorer ready — %d occupations, %d skills. Live BQ: %s",
        len(scorer.occupations), len(scorer.skills), scorer.bq.is_live,
    )
    logger.info("GeminiClient ready — Live: %s", gemini.is_live)
    yield
    logger.info("Shutting down C.Route API server.")


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
    allow_credentials=False,
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
        logger.exception("Health check failed.")
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")


@app.post("/profile", response_model=ProfileResponse, tags=["Scoring"])
async def score_profile_endpoint(payload: ProfileRequest) -> ProfileResponse:
    if not payload.skills:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="At least one skill must be provided.",
        )

    logger.info(
        "POST /profile — name=%s skills=%d target=%s skip_cro=%s",
        payload.name, len(payload.skills), payload.target, payload.skip_cro,
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
        if ranked_routes and not payload.skip_cro:
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
        logger.exception("Error scoring profile for name=%s", payload.name)
        raise HTTPException(status_code=500, detail=f"Error scoring profile: {str(e)}")


def _extract_text_from_upload(filename: str, raw_bytes: bytes) -> str:
    """Extracts raw text from an uploaded resume file (.pdf or .txt)."""
    suffix = Path(filename).suffix.lower()

    if suffix == ".txt":
        return raw_bytes.decode("utf-8", errors="ignore")

    if suffix == ".pdf":
        try:
            from PyPDF2 import PdfReader
        except ImportError as e:
            raise HTTPException(
                status_code=500,
                detail="PDF support not installed on server (PyPDF2 missing).",
            ) from e

        import io
        reader = PdfReader(io.BytesIO(raw_bytes))
        return "\n".join(page.extract_text() or "" for page in reader.pages)

    raise HTTPException(
        status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
        detail="Only .pdf and .txt files are supported.",
    )


@app.post("/extract-profile", response_model=ExtractProfileResponse, tags=["Scoring"])
async def extract_profile_endpoint(file: UploadFile = File(...)) -> ExtractProfileResponse:
    """Extracts a structured profile (name, skills, education, ...) from an uploaded resume."""
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="No file provided.")

    raw_bytes = await file.read()
    if not raw_bytes:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Uploaded file is empty.")

    logger.info("POST /extract-profile — filename=%s size_bytes=%d", file.filename, len(raw_bytes))

    text = _extract_text_from_upload(file.filename, raw_bytes)
    if not text.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Could not extract any text from the uploaded file.",
        )

    try:
        gemini = get_gemini_client()
        extracted = gemini.extract_profile_from_text(text)
        return ExtractProfileResponse(status="success", **extracted)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error extracting profile from filename=%s", file.filename)
        raise HTTPException(status_code=500, detail=f"Error extracting profile: {str(e)}")


@app.post("/admin/reload", response_model=HealthResponse, tags=["System"])
async def reload_market_data() -> HealthResponse:
    """Forces the RouteScorer singleton to reload occupations/skills/demand from BigQuery."""
    logger.info("POST /admin/reload — forcing market data refresh.")
    try:
        scorer = get_scorer(force_refresh=True)
        gemini = get_gemini_client()
        return HealthResponse(
            status="reloaded",
            service="c-route-backend",
            scorer_ready=scorer is not None,
            occupations_count=len(scorer.occupations),
            skills_count=len(scorer.skills),
            data_source=(
                f"BigQuery ({scorer.bq.project_id}.{scorer.bq.dataset_id})"
                if scorer.bq.is_live
                else "Offline Fallback (Seed Dataset)"
            ),
            live_bigquery=scorer.bq.is_live,
            gemini_live=gemini.is_live,
        )
    except Exception as e:
        logger.exception("Market data reload failed.")
        raise HTTPException(status_code=500, detail=f"Reload failed: {str(e)}")


@app.post("/skill-gaps", response_model=List[Dict[str, Any]], tags=["Scoring"])
async def skill_gaps_endpoint(payload: SkillGapsRequest) -> List[Dict[str, Any]]:
    logger.info("POST /skill-gaps — occupation_id=%s skills=%d", payload.occupation_id, len(payload.skills))
    try:
        scorer = get_scorer()
        if payload.occupation_id not in scorer.occupations:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Unknown occupation_id: {payload.occupation_id}",
            )
        return scorer.compute_skill_gaps(payload.skills, payload.occupation_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error computing skill gaps for occupation_id=%s", payload.occupation_id)
        raise HTTPException(status_code=500, detail=f"Error computing skill gaps: {str(e)}")


@app.post("/ask", response_model=AskResponse, tags=["Scoring"])
async def ask_endpoint(payload: AskRequest) -> AskResponse:
    if not payload.question.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="question must not be empty.",
        )

    logger.info("POST /ask — occupation_id=%s question_chars=%d", payload.occupation_id, len(payload.question))
    try:
        scorer = get_scorer()
        gemini = get_gemini_client()

        if payload.occupation_id not in scorer.occupations:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Unknown occupation_id: {payload.occupation_id}",
            )

        user_skill_ids = scorer._map_user_skills(payload.skills)
        route = scorer.score_occupation(
            payload.occupation_id, user_skill_ids, target_direction=payload.target
        )
        answer = gemini.answer_question(payload.question, route, profile_name=payload.name)
        return AskResponse(answer=answer)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error answering question for occupation_id=%s", payload.occupation_id)
        raise HTTPException(status_code=500, detail=f"Error answering question: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)