# C.Route — Hackathon Q&A Master Document
**Purpose:** Preparation for judge questions, mentor reviews, and pitch Q&A
**Status:** Living document — updated after each phase
**Last updated:** 21 Aug 2026

---

## HOW TO USE THIS DOCUMENT
- Read through before every checkpoint
- Add new questions as you think of them
- Mark answers you are not confident about with a warning sign
- Practice saying answers out loud — not just reading them

---

## SECTION 1 — THE PROBLEM AND PRODUCT

**Q: What problem does C.Route solve?**
Fresh graduates leave education with a certificate but no navigation system. They do not know which roles fit their current skills, which skills to learn next, or which direction the market is moving. C.Route gives them a data-driven career map instead of guesswork or expensive coaching.

**Q: Who is your target user?**
Fresh graduates and early-career professionals — especially from non-technical backgrounds — who lack mentorship, structure, and clarity about their next career move. Aligned with Razorpay's Fix My Itch problem: people leaving formal education without a clear career path.

**Q: How is this different from LinkedIn or Naukri?**
Those platforms recommend jobs based on what you have done. C.Route recommends career destinations based on where you could go — and shows you the specific skill gap between here and there, with a 90-day plan to close it. It is navigation, not job matching.

**Q: How is this different from just asking ChatGPT for career advice?**
ChatGPT has no access to market data and no deterministic scoring. Our route scores come from BigQuery analytics — not from a language model's opinion. Gemini is used only for explanation, not decision-making. The separation is architectural, not just philosophical.

**Q: What is the core thesis of C.Route?**
Career guidance should be a navigation loop, not a one-time recommendation. Like Google Maps, C.Route continuously re-evaluates the best route based on where you are, where you want to go, and current market conditions.

**Q: Who would use this?**
Fresh graduates, career switchers, early-career professionals without access to mentors or career coaches. In India, this is hundreds of millions of people entering the workforce annually.

**Q: Who would pay for this?**
B2C: individuals paying for career navigation. B2B: universities offering it as a placement support tool. Corporates using it for internal mobility and upskilling recommendations.

**Q: What happens if the recommendation is wrong?**
The system is transparent by design — every recommendation shows its score breakdown. You can see exactly why Business Analyst scores 0.49: 67% skill overlap, 0.82 demand score. The What-if feature lets users simulate alternative paths. It is not a black box — it is an explainable system.

---

## SECTION 2 — THE DATA

**Q: Why is your data synthetic?**
We used synthetic data deliberately — it lets us control the schema, validate the scoring formula, and build a clean demo without spending time cleaning messy public datasets. The methodology is what matters, not the specific numbers. In production, this layer would be replaced with real job market data from sources like LinkedIn, Naukri, or government labor statistics. The schema is designed to accept real data with zero changes.

**Q: How many occupations and skills do you have?**
5 occupations, 10 skills. Intentionally small and coherent for the hackathon MVP. The scoring engine works identically with 500 occupations — only data volume changes, not architecture.

**Q: What does demand_share mean?**
The proportion of job postings for that occupation that mention a specific skill. A demand_share of 0.91 for SQL in Business Analyst means 91% of BA job postings require SQL. It normalises demand_count across occupations of different sizes.

**Q: Why two time periods? Why not more?**
Two periods is the minimum needed to calculate velocity — the growth direction of a skill. More periods would give trend lines and better forecasting. That is a natural next step. For MVP, two periods proves the concept.

**Q: What is your data source in production?**
Publicly available job posting data — LinkedIn, Naukri, Indeed via APIs or datasets. Government labor statistics like India's Periodic Labour Force Survey. O*NET for occupation-skill taxonomy. The schema is designed to ingest from any of these sources. For the hackathon we use clearly labeled synthetic data that mirrors real data structure.

**Q: Why India geography only?**
Our target user is an Indian graduate entering the workforce — aligned with Razorpay's Fix My Itch problem statement. The geography field exists in the schema precisely so this can be extended to other markets.

**Q: How do you ensure data credibility?**
Every stat shown in the UI has a BigQuery source. Gemini never generates numbers — it only explains numbers that the data layer produced. All synthetic data is clearly labeled as synthetic_v1.

---

## SECTION 3 — THE ARCHITECTURE

**Q: What is your tech stack?**
BigQuery + Python + FastAPI + Gemini (gemini-3.6-flash) + Google ADK + Cloud Run. Frontend: React or Streamlit fallback.

**Q: Why BigQuery?**
Three reasons: it is Google Cloud native and aligned with the hackathon stack; the schema scales to millions of job postings with zero architectural changes; BigQuery views give us a clean separation between raw data and the analytical layer.

**Q: Why views instead of querying tables directly?**
Views serve as a stable contract between the data layer and the Python backend. If the underlying table structure changes, we update the view — the backend code stays unchanged. They also enforce dynamic period logic in one place.

**Q: What are the 3 BigQuery views and what does each do?**
- v_demand_score: total demand and average demand share per occupation, latest period
- v_demand_velocity: growth rate of each skill per occupation, current vs previous period
- v_skill_adjacency: co-occurrence strength between skills, latest period

**Q: Why dynamic MAX(period) instead of hardcoding the year?**
If we add 2027 data tomorrow, every view automatically picks it up. Nothing in the backend changes. Hardcoding a year is a maintenance trap.

**Q: Why Cloud Run for deployment?**
Serverless, scales to zero, no infrastructure management. gcloud run deploy --source . deploys in one command. Right-sized for a hackathon MVP — no Kubernetes, no VMs.

---

## SECTION 4 — THE ROUTE FIT FORMULA

**Q: What is the Route Fit formula?**
Score = 0.40 x skill_overlap + 0.25 x market_demand + 0.15 x demand_velocity + 0.10 x skill_adjacency minus 0.10 x gap_effort

**Q: Where did the weights come from?**
A deliberate design decision based on what drives career fit. Skill overlap at 40% is dominant — if you do not have the skills, the role does not fit regardless of market conditions. Demand at 25% captures market reality. Velocity at 15% rewards forward-looking choices. Adjacency at 10% rewards learnable paths. Gap penalty at 10% discourages wildly unrealistic leaps. These weights are tunable — in production they would be calibrated against outcome data.

**Q: What is skill_overlap?**
The fraction of skills required by a target occupation that the user already has. If a role needs 6 skills and the user has 4 of them, overlap = 4/6 = 0.67.

**Q: What is demand_velocity?**
The growth rate of demand for skills in a target occupation, period over period. A positive velocity means the role's required skills are increasingly in demand.

**Q: What is skill_adjacency?**
A measure of how often skills co-occur in job postings. If SQL and Python always appear together, learning one makes the other easier to acquire. Adjacency rewards users whose existing skills are close to the target role's skills even if they do not have them yet.

**Q: Why not just use Gemini to score the routes?**
Gemini cannot access our market data and would answer from training data — not from current job market signals. Our deterministic scoring engine uses real demand numbers from BigQuery. Gemini's role is to explain what the numbers mean in plain English. Data decides. AI explains.

---

## SECTION 5 — THE AI AND GEMINI LAYER

**Q: What does Gemini actually do in C.Route?**
Three things: extract structured skills from a user's free-text profile, explain route recommendations in plain English, and generate the personalised 90-day roadmap. It never generates market numbers.

**Q: How do you prevent Gemini from hallucinating market statistics?**
Gemini never sees raw market data directly and is never asked to generate numbers. The Python scoring engine generates all metrics from BigQuery. Gemini only receives pre-computed scores and occupation context and explains them. Every stat shown in the UI has a BQ source.

**Q: Which Gemini model are you using?**
gemini-3.6-flash via the google-genai SDK.

**Q: What if Gemini fails during the demo?**
We have pre-cached Gemini responses for Aisha's profile as a fallback. The scoring and skill gap sections work entirely without Gemini — only the explanation and roadmap generation depend on it.

---

## SECTION 6 — THE AGENTS

**Q: Why multi-agent architecture?**
Each agent owns one decision — Market Agent queries data, Career Agent scores routes, Skill Gap Agent identifies gaps, Planner/CRO Agent explains and generates the roadmap. Without this separation, all logic collapses into one function. The separation makes the system debuggable, testable, and extensible.

**Q: Why Google ADK specifically?**
ADK is Google's native framework for building multi-agent systems on Google Cloud. It integrates cleanly with BigQuery and Gemini, and demonstrates intentional use of the Google stack.

**Q: How many agents does C.Route have?**
4 agents + 1 orchestrator: Profile Agent, Market Agent, Career Agent, Planner/CRO Agent, and Orchestrator.

**Q: Why not more agents?**
Every agent must have a clear responsibility, a specific tool, and a decision it owns. We deliberately excluded a Forecast Agent and Simulation Agent — they do not add enough value at this stage to justify the complexity.

---

## SECTION 7 — THE DEMO

**Q: Walk me through the demo.**
1. User opens C.Route and provides their profile — Aisha, commerce grad, Excel/Finance/Communication/PowerPoint
2. C.Route extracts structured skills and builds capability profile
3. Career Radar shows market signals — demand, velocity, adjacency
4. C.Route presents 5 career destinations ranked by Route Fit score
5. User selects Business Analyst — top ranked
6. Route Fit panel explains: 67% skill overlap, strong demand, positive velocity
7. Skill Gap shows missing capabilities: SQL, Power BI ranked by impact
8. CRO generates a 90-day roadmap: weeks 1-4 SQL, weeks 5-8 Power BI
9. User asks: What if I target Data Analyst instead?
10. C.Route shows alternative route — lower fit score, larger skill gap, different roadmap
11. Explain re-routing: if SQL demand spikes next quarter, C.Route updates recommendations automatically

**Q: How long is the demo?**
5 minutes end to end.

**Q: What if something breaks during the demo?**
We have pre-cached responses and screenshots as backup. Code is frozen before demo day. We also have a backup recording if live demo fails.

---

## SECTION 8 — PRODUCT TERMINOLOGY

**Q: What is a Route?**
A path from the user's current capability to a career destination, scored by Route Fit.

**Q: What is a Waypoint?**
A measurable milestone in the 90-day route — a skill learned, a project completed, a certification achieved.

**Q: What is a Route Signal?**
A market data point that affects a route recommendation — demand spike, velocity shift, skill adjacency change.

**Q: What is a Re-route?**
An adaptive recommendation triggered when market conditions change, user progress updates, or goals shift.

**Q: What is CRO?**
C.Route's AI career companion. Powered by Gemini. Explains route recommendations and generates the 90-day roadmap.

**Q: What is Career Radar?**
The market intelligence layer — shows demand, velocity, and skill signals for target occupations. Powered by BigQuery.

---

## SECTION 9 — TOUGH JUDGE QUESTIONS

**Q: What prevents this from being just ChatGPT plus a dashboard?**
ChatGPT has no access to market data and no deterministic scoring. Our route scores come from BigQuery analytics. Gemini is used only for explanation, not decision-making. The dashboard shows numbers Gemini could never generate on its own.

**Q: Can this actually scale?**
The schema scales horizontally — add occupations, skills, geographies, and time periods without changing anything. BigQuery handles petabytes. Cloud Run scales automatically. The only scaling constraint is data sourcing — a business problem, not a technical one.

**Q: Why does this need to be built? Does this already exist?**
Existing tools either match you to jobs (LinkedIn, Naukri) or give generic advice (career blogs, chatbots). No tool shows you a scored, explainable, data-driven path from where you are to where you could go — with a concrete 90-day action plan. That gap is what C.Route fills.

**Q: What is your unfair advantage?**
The combination of deterministic scoring over real market data plus AI explanation is uncommon. Most career tools are either pure recommendation engines (black box) or pure AI chat (no data grounding). C.Route is neither.

**Q: What happens after the hackathon?**
Real data integration (Naukri API, LinkedIn datasets), user accounts with progress tracking, expanded occupation and skill coverage, mobile app, and monetisation via B2B university partnerships.

---

## QUESTIONS I AM NOT YET CONFIDENT ABOUT
(Add here as you identify gaps — revisit before each checkpoint)

---

## CHANGELOG
- 21 Aug 2026: Initial document created. Phase 1 and full product Q&A added.
