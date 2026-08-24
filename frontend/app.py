"""
C.Route — Streamlit Frontend
Screens: Home → Profile → Routes → Route Detail → Roadmap
API: POST http://localhost:8000/profile
"""

import streamlit as st
import requests

# ── Config ────────────────────────────────────────────────────────────────────
API_BASE = "http://localhost:8000"

st.set_page_config(
    page_title="C.Route",
    page_icon="🗺️",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# ── Global CSS ────────────────────────────────────────────────────────────────
st.markdown("""
<style>
  #MainMenu, footer, header { visibility: hidden; }
  html, body, [class*="css"] { font-family: 'Inter', sans-serif; }

  .route-card {
    background: #1a1a2e;
    border: 1px solid #2d2d4e;
    border-radius: 12px;
    padding: 20px 24px;
    margin-bottom: 14px;
  }
  .fit-bar-bg {
    background: #2d2d4e;
    border-radius: 999px;
    height: 8px;
    width: 100%;
    margin: 6px 0 12px 0;
  }
  .fit-bar-fill {
    height: 8px;
    border-radius: 999px;
  }
  .badge-match {
    background: #14532d;
    color: #4ade80;
    border-radius: 6px;
    padding: 2px 8px;
    font-size: 11px;
    font-weight: 600;
    margin-left: 8px;
  }
  .badge-category {
    background: #1e3a5f;
    color: #93c5fd;
    border-radius: 6px;
    padding: 2px 8px;
    font-size: 11px;
    font-weight: 600;
  }
  .pill-have {
    display: inline-block;
    background: #14532d;
    color: #4ade80;
    border-radius: 999px;
    padding: 2px 10px;
    font-size: 12px;
    margin: 2px;
  }
  .pill-gap {
    display: inline-block;
    background: #4a1942;
    color: #f9a8d4;
    border-radius: 999px;
    padding: 2px 10px;
    font-size: 12px;
    margin: 2px;
  }
  .week-card {
    background: #1a1a2e;
    border-left: 3px solid #6366f1;
    border-radius: 0 8px 8px 0;
    padding: 12px 18px;
    margin-bottom: 10px;
  }
  .cro-box {
    background: linear-gradient(135deg, #1e1b4b, #2d1b69);
    border: 1px solid #4338ca;
    border-radius: 12px;
    padding: 20px 24px;
    color: #c7d2fe;
    font-size: 15px;
    line-height: 1.6;
  }
  .stButton > button {
    background: linear-gradient(135deg, #6366f1, #a855f7);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 0.5rem 1.5rem;
    font-weight: 600;
  }
</style>
""", unsafe_allow_html=True)

# ── Session state ─────────────────────────────────────────────────────────────
for k, v in {"page": "home", "result": None, "selected_route_idx": 0}.items():
    if k not in st.session_state:
        st.session_state[k] = v


def go(page):
    st.session_state.page = page
    st.rerun()


def fit_color(score):
    if score >= 0.45:
        return "#6366f1"
    elif score >= 0.30:
        return "#f59e0b"
    return "#ef4444"


def fit_label(score):
    if score >= 0.45:
        return "Strong Fit"
    elif score >= 0.30:
        return "Moderate Fit"
    return "Stretch Route"


def pills(skills, cls):
    return "".join(f'<span class="{cls}">{s}</span>' for s in skills)


def call_api(name, skills, target_direction):
    payload = {
        "name": name,
        "skills": skills,
        "target_direction": target_direction or None,
    }
    try:
        r = requests.post(f"{API_BASE}/profile", json=payload, timeout=30)
        r.raise_for_status()
        return r.json()
    except requests.exceptions.ConnectionError:
        st.error("Cannot reach the backend. Is uvicorn running on port 8000?")
    except requests.exceptions.Timeout:
        st.error("Backend timed out (30s). Try again.")
    except requests.exceptions.HTTPError as e:
        st.error(f"API error {e.response.status_code}: {e.response.text}")
    return None


# ── Screen 1: Home ────────────────────────────────────────────────────────────
def screen_home():
    st.markdown("<br>", unsafe_allow_html=True)
    col_l, col_c, col_r = st.columns([1, 2, 1])
    with col_c:
        st.markdown("""
        <div style="text-align:center; padding:60px 0 40px 0;">
          <div style="font-size:52px; margin-bottom:12px;">🗺️</div>
          <h1 style="font-size:42px; font-weight:800; margin:0; color:#e0e7ff;">C.Route</h1>
          <p style="font-size:18px; color:#818cf8; margin:8px 0 6px 0; font-style:italic;">
            Your career. Your route. Your next move.
          </p>
          <p style="font-size:15px; color:#94a3b8; max-width:440px; margin:16px auto 40px auto; line-height:1.7;">
            C.Route analyses live market demand and your skills to map the highest-fit
            career routes — then builds a personalised 90-day plan to get you there.
          </p>
        </div>
        """, unsafe_allow_html=True)

        c1, c2, c3 = st.columns([1, 1.2, 1])
        with c2:
            if st.button("Find Your Route →", use_container_width=True):
                go("profile")

        st.markdown("<br><br>", unsafe_allow_html=True)
        v1, v2, v3 = st.columns(3)
        for col, icon, title, desc in [
            (v1, "📊", "Data-Driven", "Scores backed by BigQuery market signals — not guesswork."),
            (v2, "🧭", "Multi-Route", "See every viable path, ranked by real fit to your skills."),
            (v3, "📅", "90-Day Plan", "CRO builds a personalised roadmap tied to skill gaps."),
        ]:
            with col:
                st.markdown(f"""
                <div style="text-align:center; padding:20px; background:#1a1a2e;
                            border-radius:12px; border:1px solid #2d2d4e;">
                  <div style="font-size:28px;">{icon}</div>
                  <p style="font-weight:700; color:#e0e7ff; margin:8px 0 4px 0;">{title}</p>
                  <p style="font-size:13px; color:#94a3b8; margin:0;">{desc}</p>
                </div>
                """, unsafe_allow_html=True)


# ── Screen 2: Profile ─────────────────────────────────────────────────────────
def screen_profile():
    col_l, col_c, col_r = st.columns([1, 2, 1])
    with col_c:
        st.markdown("<br>", unsafe_allow_html=True)
        st.markdown("## 👤 Tell us about yourself")
        st.caption("C.Route uses this to score your fit against live market demand data.")
        st.markdown("<br>", unsafe_allow_html=True)

        name = st.text_input("Your name", placeholder="e.g. Aisha")
        skills_raw = st.text_area(
            "Your current skills",
            placeholder="Excel, SQL, Finance Basics, PowerPoint, Communication",
            height=100,
            help="Comma-separated list.",
        )
        target = st.selectbox(
            "Career direction (optional)",
            options=["", "analytics", "finance", "marketing", "product", "operations"],
            format_func=lambda x: "No preference — show all" if x == "" else x.capitalize(),
        )

        st.markdown("<br>", unsafe_allow_html=True)
        col_back, col_space, col_next = st.columns([1, 1, 1])
        with col_back:
            if st.button("← Back"):
                go("home")
        with col_next:
            if st.button("Calculate Routes →", use_container_width=True):
                if not name.strip():
                    st.warning("Please enter your name.")
                    return
                if not skills_raw.strip():
                    st.warning("Please enter at least one skill.")
                    return
                skills = [s.strip() for s in skills_raw.split(",") if s.strip()]
                with st.spinner("Analysing market data and scoring your routes…"):
                    result = call_api(name.strip(), skills, target)
                if result and result.get("status") == "success":
                    st.session_state.result = result
                    st.session_state.selected_route_idx = 0
                    go("routes")


# ── Screen 3: Routes ──────────────────────────────────────────────────────────
def screen_routes():
    result = st.session_state.result
    if not result:
        go("profile")
        return

    routes = result["routes"]
    st.markdown(f"## 🧭 Career Routes for **{result['profile_name']}**")
    st.caption(
        f"Scored against live BigQuery market demand · "
        f"{result['total_routes']} routes · "
        f"Direction: **{result['target_direction'] or 'all'}**"
    )

    if result.get("gemini_live"):
        st.success("✓ Gemini live · BigQuery connected", icon="🟢")

    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown(f"""
    <div class="cro-box">
      <strong style="color:#a5b4fc;">🤖 CRO says</strong><br>
      {result["cro_explanation"]}
    </div>
    """, unsafe_allow_html=True)
    st.markdown("<br>", unsafe_allow_html=True)

    for i, route in enumerate(routes):
        score = route["route_fit_score"]
        score_pct = round(score * 100, 1)
        color = fit_color(score)
        label = fit_label(score)
        match_badge = '<span class="badge-match">✓ Direction match</span>' if route["target_direction_match"] else ""
        cat_badge = f'<span class="badge-category">{route["category"].capitalize()}</span>'
        matched_pills = pills(route["matched_skills"], "pill-have")
        missing_pills = pills(route["missing_skills"], "pill-gap")

        st.markdown(f"""
        <div class="route-card">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <span style="font-size:18px; font-weight:700; color:#e0e7ff;">#{i+1} {route["title"]}</span>
              {match_badge} &nbsp;{cat_badge}
            </div>
            <div style="text-align:right;">
              <span style="font-size:22px; font-weight:800; color:{color};">{score_pct}%</span>
              <span style="font-size:13px; color:#94a3b8; margin-left:6px;">Route Fit</span>
            </div>
          </div>
          <div class="fit-bar-bg">
            <div class="fit-bar-fill" style="width:{score_pct}%; background:{color};"></div>
          </div>
          <div style="font-size:13px; color:#94a3b8; margin-bottom:10px;">
            <strong style="color:#6ee7b7;">{label}</strong> &nbsp;·&nbsp;
            {route["matched_count"]}/{route["required_count"]} skills matched &nbsp;·&nbsp;
            Market demand: {round(route["breakdown"]["market_demand"] * 100)}% &nbsp;·&nbsp;
            Velocity: +{round(route["breakdown"]["velocity_pct"], 1)}%
          </div>
          <div style="margin-bottom:6px;">
            <span style="font-size:12px; color:#64748b; margin-right:6px;">✓ Have:</span>
            {matched_pills if matched_pills else '<span style="color:#475569;font-size:12px;">—</span>'}
          </div>
          <div>
            <span style="font-size:12px; color:#64748b; margin-right:6px;">⚡ Gap:</span>
            {missing_pills if missing_pills else '<span style="color:#4ade80;font-size:12px;">No gaps</span>'}
          </div>
        </div>
        """, unsafe_allow_html=True)

        col_detail, _ = st.columns([1, 4])
        with col_detail:
            if st.button("Explore Route →", key=f"detail_{i}"):
                st.session_state.selected_route_idx = i
                go("route_detail")

    st.markdown("<br>")
    if st.button("← Edit Profile"):
        go("profile")


# ── Screen 4: Route Detail ────────────────────────────────────────────────────
def screen_route_detail():
    result = st.session_state.result
    if not result:
        go("routes")
        return

    route = result["routes"][st.session_state.selected_route_idx]
    bd = route["breakdown"]
    score_pct = round(route["route_fit_score"] * 100, 1)
    color = fit_color(route["route_fit_score"])

    st.markdown(f"## 📍 {route['title']}")
    st.markdown(
        f"<span style='font-size:32px; font-weight:800; color:{color};'>{score_pct}% Route Fit</span>",
        unsafe_allow_html=True,
    )
    st.markdown("<br>", unsafe_allow_html=True)

    st.markdown("### 📊 Market Evidence")
    st.caption("Source: BigQuery `croute_market` · Synthetic dataset · Period: 2026")
    m1, m2, m3, m4 = st.columns(4)
    m1.metric("Market Demand", f"{round(bd['market_demand'] * 100)}%")
    m2.metric("Demand Velocity", f"+{round(bd['velocity_pct'], 1)}%")
    m3.metric("Total Job Signals", f"{int(bd['total_demand']):,}")
    m4.metric("Skill Adjacency", f"{round(bd['skill_adjacency'] * 100)}%")
    if bd.get("top_adjacency_pair"):
        st.caption(f"Top adjacency edge: **{bd['top_adjacency_pair']}**")

    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown("### ⚖️ Route Fit Breakdown")
    st.caption("Formula: 0.40×overlap + 0.25×demand + 0.15×velocity + 0.10×adjacency − 0.10×gap")

    wc = route["weighted_contributions"]
    factors = [
        ("Skill Overlap (×0.40)", wc["overlap_contrib"], "#6366f1"),
        ("Market Demand (×0.25)", wc["demand_contrib"], "#8b5cf6"),
        ("Demand Velocity (×0.15)", wc["velocity_contrib"], "#a855f7"),
        ("Skill Adjacency (×0.10)", wc["adjacency_contrib"], "#d946ef"),
        ("Gap Penalty (−0.10)", wc["gap_penalty"], "#ef4444"),
    ]
    for label, val, c in factors:
        bar_pct = abs(val) * 100
        prefix = "−" if val < 0 else "+"
        st.markdown(f"""
        <div style="margin-bottom:8px;">
          <div style="display:flex; justify-content:space-between; font-size:13px; color:#94a3b8;">
            <span>{label}</span>
            <span style="color:{c}; font-weight:700;">{prefix}{abs(round(val*100,1))}%</span>
          </div>
          <div class="fit-bar-bg">
            <div style="height:8px; border-radius:999px; width:{bar_pct:.1f}%; background:{c};"></div>
          </div>
        </div>
        """, unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown("### ⚡ Skill Gaps")
    col_have, col_gap = st.columns(2)
    with col_have:
        st.markdown("**✓ You already have**")
        st.markdown(
            " ".join(f'<span class="pill-have">{s}</span>' for s in route["matched_skills"]),
            unsafe_allow_html=True,
        )
    with col_gap:
        st.markdown("**Missing — prioritised by demand**")
        if route["missing_skills"]:
            st.markdown(
                " ".join(f'<span class="pill-gap">{s}</span>' for s in route["missing_skills"]),
                unsafe_allow_html=True,
            )
        else:
            st.success("No skill gaps — you're ready to apply!")

    st.markdown("<br>", unsafe_allow_html=True)
    col_back, col_roadmap, _ = st.columns([1, 1.5, 3])
    with col_back:
        if st.button("← All Routes"):
            go("routes")
    with col_roadmap:
        if st.button("View 90-Day Roadmap →", use_container_width=True):
            go("roadmap")


# ── Screen 5: Roadmap ─────────────────────────────────────────────────────────
def screen_roadmap():
    result = st.session_state.result
    if not result:
        go("routes")
        return

    route = result["routes"][st.session_state.selected_route_idx]
    roadmap = result["roadmap_90_day"]

    st.markdown(f"## 📅 90-Day Roadmap → **{route['title']}**")
    st.caption(f"Built by CRO · {result['roadmap_weeks']} weeks")
    st.markdown(f"""
    <div class="cro-box" style="margin-bottom:24px;">
      <strong style="color:#a5b4fc;">🤖 CRO</strong><br>
      {result["cro_explanation"]}
    </div>
    """, unsafe_allow_html=True)

    for week in roadmap:
        demand_str = (
            f"Demand: {round(week['demand_score'])}%" if week.get("demand_score") else "Capstone"
        )
        platforms = " · ".join(week.get("suggested_platforms", []))
        st.markdown(f"""
        <div class="week-card">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:13px; color:#818cf8; font-weight:600;">{week['weeks']}</span>
            <span style="font-size:12px; color:#64748b;">{demand_str}</span>
          </div>
          <div style="font-size:17px; font-weight:700; color:#e0e7ff; margin:4px 0;">{week['focus_skill']}</div>
          <div style="font-size:13px; color:#94a3b8; margin-bottom:6px;">{week['description']}</div>
          <div style="font-size:12px; color:#6ee7b7;">✓ Milestone: {week['milestone']}</div>
          <div style="font-size:12px; color:#475569; margin-top:4px;">📚 {platforms}</div>
        </div>
        """, unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)
    col_back, col_home, _ = st.columns([1, 1, 3])
    with col_back:
        if st.button("← Route Detail"):
            go("route_detail")
    with col_home:
        if st.button("🔄 Start Over"):
            st.session_state.result = None
            go("home")


# ── Router ────────────────────────────────────────────────────────────────────
pages = {
    "home": screen_home,
    "profile": screen_profile,
    "routes": screen_routes,
    "route_detail": screen_route_detail,
    "roadmap": screen_roadmap,
}
pages.get(st.session_state.page, screen_home)()
