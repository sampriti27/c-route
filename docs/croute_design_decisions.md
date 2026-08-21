# C.Route — Design Decisions

**Version:** 1.0 | **Checkpoint 1** | 20 Aug 2026  
**Author:** Solo build — Patchamomma 2026

---

## 1. Route Fit Formula — Rationale

C.Route scores every candidate career destination using a deterministic five-factor formula:

```
Route Fit = 0.40 × skill_overlap
          + 0.25 × market_demand
          + 0.15 × demand_velocity
          + 0.10 × skill_adjacency
          − 0.10 × gap_effort
```

Every input to this formula is sourced from BigQuery. Gemini receives the scored output and explains it in natural language — it never generates the score itself.

### Why these five factors?

**Skill Overlap (40%)** is the dominant factor because the match between a person's current skills and a role's requirements is the strongest predictor of career fit. This is grounded in Person-Job Fit (P-J Fit) theory, one of the most replicated findings in organisational psychology. A high overlap means the user can move fast, onboard quickly, and succeed sooner. It is weighted highest because Route Fit is fundamentally a measure of *readiness*, not just desirability.

**Market Demand (25%)** reflects labour economics: a route with strong fit but low market demand leads nowhere. Demand data (sourced from job posting analysis) tells us how many real opportunities exist in the market for a given occupation-skill combination. It is weighted second because fit without opportunity has no practical value.

**Demand Velocity (15%)** captures the trajectory of a skill's importance over time — whether demand is rising, stable, or declining. A user who invests time learning a skill with rapidly growing demand is making a better long-term career decision than one learning a stagnating skill, even if current demand is similar. This is analogous to momentum indicators in financial markets, applied to labour markets.

**Skill Adjacency (10%)** is grounded in economic complexity research, particularly Hidalgo et al.'s work on capability adjacency in product space. Moving into roles that require skills *near* your current skills is significantly easier than crossing skill clusters — even when direct overlap is low. Adjacency captures this "bridge potential" and ensures C.Route can surface non-obvious but achievable routes.

**Gap Effort penalty (−10%)** applies a small cost for the number of missing required skills. It does not disqualify high-gap routes — aspirational destinations should still surface — but it creates a visible friction that reflects the real time and effort cost of a large skill gap. The penalty is intentionally small so that ambitious routes remain discoverable.

### Why these specific weights?

The weights are a reasoned design choice informed by the theoretical importance of each factor, not the output of an empirical regression. No large-scale dataset of individual career outcomes with ground-truth results exists to calibrate against. What matters for the MVP is that:

1. The formula is **transparent** — every number is explainable.
2. Every input is **traceable** to a BigQuery row — no factor is fabricated by AI.
3. The weights are **tunable** — in a production system, outcome data (did the user get the job? were they satisfied?) would be used to calibrate weights over time via a feedback loop.

This is the same principle behind established scoring models in credit, risk, and hiring — theory-grounded weights calibrated over time with real outcome data.

---

## 2. "Data decides. AI explains." — Core Architectural Principle

C.Route deliberately separates two responsibilities that most AI career tools conflate:

| Layer | Responsibility | Tool |
|---|---|---|
| Data layer | Generate market facts, scores, metrics | BigQuery |
| AI layer | Interpret evidence, explain reasoning, generate language | Gemini |

Gemini is never asked "which career should this person choose?" It is given structured evidence — a Route Fit score, a ranked skill gap list, market demand numbers — and asked to explain that evidence in a way that is helpful and human.

This separation exists for three reasons:

**Credibility.** Market statistics that come from a database are verifiable. Statistics that come from a language model are not. Users and judges can audit a BigQuery query. They cannot audit a hallucination.

**Explainability.** When a user asks "why is Data Engineer my top route?", C.Route can point to exact numbers: "You match 7 of 9 required skills. SQL demand grew 18% YoY. Python and BigQuery are adjacent to skills you already have." That answer is only possible if the numbers came from data, not inference.

**Trust.** Career decisions have real consequences. A tool that invents market statistics, even convincingly, is actively harmful. C.Route's architecture makes AI hallucination of market facts structurally impossible — Gemini only sees outputs from the data layer, never the raw question.

---

## 3. Multi-Agent Architecture — Why Each Agent Exists

C.Route uses four specialised agents plus an orchestrator, built on Google ADK. Every agent has a single, clear responsibility. No agent was added because "multi-agent sounds impressive."

| Agent | Owns | Uses |
|---|---|---|
| Profile Agent | Skill extraction from free text | Gemini (structured output) |
| Market Agent | Labor market evidence retrieval | BigQuery queries |
| Career Agent | Route scoring and ranking | Deterministic formula + BQ data |
| Skill Gap Agent | Gap identification and prioritisation | Set difference + demand weighting |
| Planner / CRO | 90-day roadmap + mentor dialogue | Gemini + scored route data |
| Orchestrator | Request routing + response assembly | Google ADK |

The Market Agent and Career Agent are kept separate because one retrieves raw evidence (a data concern) and the other applies business logic to that evidence (a scoring concern). Mixing them would make the scoring logic harder to test, audit, and tune independently.

---

*This document is a living reference. It will be updated at each checkpoint as decisions evolve.*
