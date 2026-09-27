# C.Route (Career Route) 🧭

> **"Your career. Your route. Your next move."**  
> *A data-driven career navigation engine powered by BigQuery labor market intelligence and Google Gemini.*

---

## 📌 Overview

**C.Route** is an intelligent career navigation system that eliminates guesswork and generic advice for fresh graduates and early-career professionals. 

Traditional platforms (e.g., job boards) focus on backward-looking matching—recommending roles strictly based on what you have already done. Chatbots, on the other hand, provide generic, ungrounded advice with high risk of hallucinating market statistics.

C.Route operates like a **GPS for careers**:
1. **Evaluates where you are** (your verified skills and capability profile).
2. **Analyzes where the labor market is heading** (demand trends, growth velocity, and skill adjacency).
3. **Calculates your optimal route** using a deterministic, transparent scoring formula.
4. **Delivers an actionable 90-day roadmap** and interactive AI mentoring to get you there.

---

## 💡 Core Philosophy: *"Data decides. AI explains."*

C.Route strictly separates quantitative decision-making from natural language explanation:

```
┌──────────────────────────────────────┐
│       BigQuery Analytics Layer       │  ◄── Data Layer: Generates objective market facts,
│ (Demand Share, Velocity, Adjacency)  │      growth trends, and candidate route metrics.
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│     Deterministic Scoring Engine     │  ◄── Business Logic: Calculates 5-factor Route Fit
│           (RouteScorer)              │      scores with zero AI hallucination.
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│          Google Gemini / CRO         │  ◄── AI Layer: Interprets verified scores,
│       (Career Route Oracle)          │      explains trade-offs, and builds 90-day roadmaps.
└──────────────────────────────────────┘
```

- **Verifiable & Credible**: Market numbers originate directly from BigQuery queries, not generative inferences.
- **Explainable**: Every route recommendation can be traced to exact numbers (e.g., 67% skill overlap, +18% YoY demand velocity).
- **Safe & Grounded**: AI hallucinations of labor market conditions are structurally impossible.

---

## 📐 The Route Fit Scoring Formula

Every candidate destination is evaluated using a transparent five-factor model grounded in Person-Job Fit theory and economic complexity research:

$$\text{Route Fit} = 0.40 \cdot \text{Overlap} + 0.25 \cdot \text{Demand} + 0.15 \cdot \text{Velocity} + 0.10 \cdot \text{Adjacency} - 0.10 \cdot \text{Gap Penalty}$$

| Factor | Weight | Description | Grounding |
|---|:---:|---|---|
| **Skill Overlap** | **40%** | Proportion of target role requirements already possessed. | Person-Job (P-J) Fit theory; primary readiness indicator. |
| **Market Demand** | **25%** | Share of active job postings requiring target skills in the market. | Labor economics; ensures recommendations lead to real jobs. |
| **Demand Velocity** | **15%** | Period-over-period growth momentum of required skill demand. | Momentum indicators; rewards forward-looking career investments. |
| **Skill Adjacency** | **10%** | Co-occurrence strength between current skills and target skills. | Economic complexity theory (Hidalgo et al.); measures bridge potential. |
| **Gap Effort Penalty** | **−10%** | Small friction penalty proportional to missing required skills. | Reflects effort cost while keeping ambitious paths discoverable. |

---

## 🤖 Multi-Agent Architecture

C.Route uses a modular multi-agent structure where each agent owns a specific decision boundary:

- **`ProfileAgent`**: Parses raw text or uploaded resumes (`.pdf`, `.txt`) using Gemini structured output to extract verified skills, education, and target direction.
- **`MarketAgent`**: Queries BigQuery analytical views to retrieve real-time occupation requirements, demand shares, and skill co-occurrence frequencies.
- **`SkillGapAgent`**: Performs set-difference analysis to identify missing capabilities and prioritizes them by market impact and learning adjacency.
- **`PlannerAgent (CRO)`**: The Career Route Oracle—generates personalized 90-day milestone roadmaps, curated resource recommendations, and natural-language route explanations.
- **`CRouteOrchestrator`**: Orchestrates the agent pipeline, coordinates end-to-end user navigation runs, and powers the interactive What-If simulation engine.

---

## ✨ Key Features

- 📄 **Smart Resume & Skill Extraction**: Instant parsing of PDF and text resumes into structured capability profiles.
- 🎯 **Ranked Route Discovery**: Discover destinations ranked by the 5-factor Route Fit score with transparent explanations.
- 📊 **Career Radar & Market Signals**: Real-time visibility into market demand share, hiring velocity, and skill adjacency.
- 🔍 **Prioritized Skill Gap Analysis**: Clear breakdown of missing requirements categorized by critical vs. adjacent skills.
- 🗺️ **Personalized 90-Day Roadmap**: Week-by-week execution plans broken into clear milestone phases, project deliverables, and recommended learning platforms.
- 🧪 **Interactive What-If Simulator**: Toggle skills or switch target roles to immediately observe live score recalibrations.
- 💬 **CRO Career Advisor Chat (`/ask`)**: Ask follow-up career questions answered by an AI advisor strictly grounded in market data.
- 🛡️ **Offline Seed-Data Fallback**: Seamless fallback to local curated datasets when Google Cloud credentials or BigQuery connections are offline.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, React 19)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components & Icons**: Lucide React, Base UI, Framer Motion
- **Networking**: Axios

### Backend & Analytics
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11+)
- **Data Engine**: [Google Cloud BigQuery](https://cloud.google.com/bigquery) (or offline JSON/SQL seed fallback)
- **Generative AI**: [Google Gemini](https://ai.google.dev/) (`gemini-flash-latest` via official `google-genai` SDK)
- **Validation & Parsing**: Pydantic v2, PyPDF2
- **Server**: Uvicorn

---

## 📁 Repository Structure

```text
c-route/
├── backend/                  # FastAPI backend service
│   ├── agents.py             # Multi-agent architecture (Profile, Market, SkillGap, Planner)
│   ├── bq_client.py          # BigQuery integration + local seed fallback client
│   ├── gemini_client.py      # Gemini AI client (CRO explanations & roadmap generation)
│   ├── main.py               # REST API endpoints & application lifecycle
│   ├── requirements.txt      # Python dependencies
│   └── scorer.py             # 5-factor deterministic Route Fit scoring engine
├── croute-frontend/          # Next.js frontend application
│   ├── src/
│   │   ├── app/              # Next.js App Router (Landing, Profile, Routes, Roadmap, CRO)
│   │   └── lib/              # API clients, state store, and types
│   ├── package.json          # Frontend dependencies & scripts
│   └── tailwind.config.ts    # Tailwind styling configuration
├── data/                     # Seed data, SQL schemas, analytical queries, and test profiles
│   ├── queries/              # BigQuery view queries (demand, velocity, adjacency)
│   ├── schema/               # BigQuery table schemas
│   ├── seed.sql              # Seed SQL data
│   └── test_profiles/        # Sample personas for testing and demos
├── docs/                     # Architectural diagrams, design decisions, and Q&A documents
├── scripts/                  # Helper and evaluation scripts
├── tests/                    # Backend API and scoring unit tests
├── docker-compose.yml        # Multi-container local orchestration
└── README.md                 # Project documentation
```

---

## 🚀 Quickstart Guide

### Prerequisites
- **Node.js**: v18+ (Node 20+ recommended)
- **Python**: v3.11+
- **Gemini API Key**: Obtainable from [Google AI Studio](https://aistudio.google.com/)
- *(Optional)* **Google Cloud Account**: Configured with BigQuery credentials (the app automatically falls back to local seed data if not configured)

---

### 1. Environment Configuration

Create a `.env` file in the root directory (or inside `backend/`):

```bash
# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# (Optional) BigQuery Configuration
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
BIGQUERY_PROJECT_ID=your-gcp-project-id
BIGQUERY_DATASET=croute_market
```

For the frontend, specify the backend endpoint if different from default:
Create `croute-frontend/.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

### 2. Run with Docker (Recommended)

To start both the frontend and backend using Docker Compose:

```bash
docker-compose up --build
```

- Frontend: `http://localhost:3000`
- Backend API Docs: `http://localhost:8000/docs`

---

### 3. Run Locally

#### A. Start Backend (FastAPI)

```bash
# 1. Create and activate a virtual environment
python -m venv venv

# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# 2. Install dependencies
pip install -r backend/requirements.txt

# 3. Start the FastAPI server
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

The API will be available at `http://localhost:8000`. You can inspect the Swagger UI at `http://localhost:8000/docs`.

#### B. Start Frontend (Next.js)

```bash
# 1. Navigate to the frontend directory
cd croute-frontend

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 📡 Key API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | System health, BigQuery live status, and indexed entity counts |
| `POST` | `/profile` | Full profile evaluation: scores routes, runs agents, generates 90-day plan |
| `POST` | `/extract-profile` | Extracts structured profile & skills from an uploaded `.pdf` or `.txt` resume |
| `POST` | `/whatif` | Fast deterministic simulation of alternate career routes without LLM latency |
| `POST` | `/skill-gaps` | Computes missing skills and priority ranking for a target occupation |
| `POST` | `/ask` | Interactive Q&A with CRO mentor regarding a specific route recommendation |
| `POST` | `/admin/reload` | Forces reload and cache refresh of market data from BigQuery |

---

## 🧪 Running Tests

Run the test suite to verify the scoring engine and backend endpoints:

```bash
# Run backend tests
pytest tests/
```

---

## 📄 License

This project is licensed under the MIT License.
