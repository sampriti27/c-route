"""
C.Route — Standalone Scoring Demo Script
Demonstrates deterministic Route Fit scoring on Aisha's test profile.
"""

import json
import sys
from pathlib import Path

# Add project root and backend to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from scorer import get_scorer


def run_aisha_demo():
    """Loads Aisha's profile and runs the deterministic Route Fit scoring engine across all occupations."""
    profile_path = PROJECT_ROOT / "data" / "test_profiles" / "aisha.json"

    if not profile_path.exists():
        print(f"Error: Profile not found at {profile_path}")
        return

    with open(profile_path, "r", encoding="utf-8") as f:
        profile = json.load(f)

    scorer = get_scorer()
    routes = scorer.score_profile(
        current_skills=profile.get("current_skills", []),
        candidate_destinations=profile.get("candidate_destinations"),
        target_direction=profile.get("target_direction"),
        score_all=True,
    )

    # Pretty Terminal Output
    print("=" * 80)
    print("  C.Route - Career Route Fit Scoring Engine")
    print("  Architecture: Data decides. AI explains.")
    print("=" * 80)
    print("\n[PROFILE LOADED]")
    print(f"  User:            {profile.get('name')} ({profile.get('education')})")
    print(f"  Experience:      {profile.get('experience_years')} years")
    print(f"  Current Skills:  {', '.join(profile.get('current_skills', []))}")
    print(f"  Target Focus:    {profile.get('target_direction')}")
    print(f"  Data Source:     BigQuery (`{scorer.bq.project_id}.{scorer.bq.dataset_id}`)")
    print(f"  Live BigQuery:   {'Connected' if scorer.bq.is_live else 'Offline Fallback (Seed Dataset)'}")

    print("\n" + "-" * 80)
    print(f"{'RANK':<5} {'CAREER DESTINATION':<24} {'CATEGORY':<12} {'ROUTE FIT':<10} {'MATCH':<8} {'DEMAND':<8} {'ADJACENCY':<10}")
    print("-" * 80)

    for i, route in enumerate(routes, 1):
        fit_str = f"{route['route_fit_score'] * 100:.1f}% ({route['route_fit_score']:.4f})"
        match_str = f"{route['matched_count']}/{route['required_count']}"
        demand_str = f"{route['breakdown']['market_demand'] * 100:.1f}%"
        adj_str = f"{route['breakdown']['skill_adjacency']:.4f}"
        print(f" #{i:<4} {route['title']:<24} {route['category']:<12} {fit_str:<10} {match_str:<8} {demand_str:<8} {adj_str:<10}")

    print("-" * 80)

    # Deep-dive on top recommendation
    top = routes[0]
    print(f"\n[TOP RECOMMENDED ROUTE: {top['title'].upper()}]")
    print(f"  * Route Fit Score:       {top['route_fit_score']:.4f} / 1.0000 ({top['route_fit_score'] * 100:.1f}%)")
    print(f"  * Matched Skills ({top['matched_count']}/{top['required_count']}): {', '.join(top['matched_skills'])}")
    print(f"  * Missing Skills (Gap):  {', '.join(top['missing_skills'])}")

    bd = top["breakdown"]
    wc = top["weighted_contributions"]
    print("\n  [5-Factor Score Breakdown]")
    print(f"    1. Skill Overlap (40%):   {bd['skill_overlap']:.4f}  --> +{wc['overlap_contrib']:.4f}")
    print(f"    2. Market Demand (25%):   {bd['market_demand']:.4f}  --> +{wc['demand_contrib']:.4f} (Total Demand: {bd['total_demand']} postings)")
    print(f"    3. Demand Velocity (15%): {bd['demand_velocity']:.4f}  --> +{wc['velocity_contrib']:.4f} (YoY Growth: +{bd['velocity_pct']}%)")
    adj_detail = f" ({bd['top_adjacency_pair']})" if bd.get("top_adjacency_pair") else ""
    print(f"    4. Skill Adjacency (10%): {bd['skill_adjacency']:.4f}  --> +{wc['adjacency_contrib']:.4f}{adj_detail}")
    print(f"    5. Gap Effort (-10%):     {bd['gap_effort']:.4f}  --> {wc['gap_penalty']:.4f}")
    print(f"    ---------------------------------------------------")
    print(f"    Total Route Fit Score:    {top['route_fit_score']:.4f}")

    print("\n" + "=" * 80)
    print("  Scoring engine executed successfully for all 5 occupations.")
    print("=" * 80)


if __name__ == "__main__":
    run_aisha_demo()
