// Typed mirrors of backend/main.py and backend/scorer.py response shapes.

export interface ProfileRequest {
  name?: string;
  skills: string[];
  target?: string;
  candidate_destinations?: string[];
  score_all?: boolean;
  profile_id?: string;
  education?: string;
  experience_years?: number;
}

export interface RouteBreakdown {
  skill_overlap: number;
  market_demand: number;
  total_demand: number;
  demand_velocity: number;
  velocity_pct: number;
  skill_adjacency: number;
  top_adjacency_pair: string | null;
  gap_effort: number;
}

export interface WeightedContributions {
  overlap_contrib: number;
  demand_contrib: number;
  velocity_contrib: number;
  adjacency_contrib: number;
  gap_penalty: number;
}

export interface Route {
  occupation_id: string;
  title: string;
  category: string;
  target_direction_match: boolean;
  route_fit_score: number;
  matched_count?: number;
  required_count?: number;
  matched_skills: string[];
  missing_skills: string[];
  // Empty object when the occupation has zero required skills — see scorer.score_occupation.
  breakdown: Partial<RouteBreakdown>;
  weighted_contributions?: WeightedContributions;
}

export interface RoadmapWeek {
  weeks: string;
  focus_skill: string;
  demand_score: number | null;
  suggested_platforms: string[];
  description: string;
  milestone: string;
}

export interface ProfileResponse {
  status: string;
  profile_name?: string | null;
  target_direction?: string | null;
  total_routes: number;
  routes: Route[];
  cro_explanation?: string | null;
  roadmap_90_day?: RoadmapWeek[] | null;
  roadmap_weeks?: number | null;
  gemini_live?: boolean | null;
}

export interface HealthResponse {
  status: string;
  service: string;
  scorer_ready: boolean;
  occupations_count: number;
  skills_count: number;
  data_source: string;
  live_bigquery: boolean;
  gemini_live: boolean;
}

export const TARGET_DIRECTIONS = [
  "analytics",
  "finance",
  "marketing",
  "product",
  "operations",
] as const;

export type TargetDirection = (typeof TARGET_DIRECTIONS)[number];
