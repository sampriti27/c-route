"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Compass, Loader2 } from "lucide-react";

import { useAppStore } from "@/lib/store";
import { getSkillGaps, ApiError } from "@/lib/api";
import { CircularGauge } from "@/components/ui/circular-gauge";
import type { SkillGap } from "@/lib/types";

interface RouteDetailProps {
  params: Promise<{ routeId: string }> | { routeId: string };
}

function impactBucket(index: number, total: number): "HIGH" | "MED" | "LOW" {
  const ratio = total <= 1 ? 0 : index / (total - 1);
  if (ratio <= 1 / 3) return "HIGH";
  if (ratio <= 2 / 3) return "MED";
  return "LOW";
}

export default function RouteDetailPage({ params }: RouteDetailProps) {
  const unwrappedParams =
    params && typeof (params as { then?: unknown }).then === "function"
      ? use(params as Promise<{ routeId: string }>)
      : (params as { routeId: string });

  const router = useRouter();
  const { effectiveResult, selectedRouteId, setSelectedRouteId, extractedSkills } = useAppStore();

  const [gaps, setGaps] = useState<SkillGap[]>([]);
  const [gapsLoading, setGapsLoading] = useState(false);
  const [gapsError, setGapsError] = useState<string | null>(null);

  const currentRouteId = unwrappedParams?.routeId || selectedRouteId || "";
  const routes = effectiveResult?.routes ?? [];

  const route = routes.find((r) => r.occupation_id === currentRouteId) || routes[0];

  useEffect(() => {
    if (!route) return;
    let cancelled = false;
    setGapsLoading(true);
    setGapsError(null);

    getSkillGaps(
      extractedSkills.map((s) => s.name),
      route.occupation_id
    )
      .then((result) => {
        if (!cancelled) setGaps(result);
      })
      .catch((err) => {
        if (!cancelled) {
          setGapsError(err instanceof ApiError ? err.message : "Failed to load skill gaps.");
        }
      })
      .finally(() => {
        if (!cancelled) setGapsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [route, extractedSkills]);

  if (!effectiveResult || !route) {
    return (
      <div className="relative min-h-[calc(100vh-5rem)] w-full page-section page-shell bg-radial-subtle flex items-center justify-center">
        <div className="card flex flex-col items-center text-center gap-4 max-w-md">
          <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Compass className="size-6" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">No route selected</h1>
          <p className="text-sm text-slate-400">
            Analyze your profile first to see scored routes.
          </p>
          <Link
            href="/profile"
            className="mt-2 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 transition-colors"
          >
            Go to Profile
          </Link>
        </div>
      </div>
    );
  }

  const scorePct =
    route.route_fit_score > 1 ? route.route_fit_score : route.route_fit_score * 100;
  const rank = routes.findIndex((r) => r.occupation_id === route.occupation_id) + 1;

  const bd = route.breakdown;
  const overlapPct = Math.round((bd.skill_overlap ?? 0) * 1000) / 10;
  const demandPct = Math.round((bd.market_demand ?? 0) * 1000) / 10;
  const velocityPct = bd.velocity_pct ?? Math.round((bd.demand_velocity ?? 0) * 1000) / 10;
  const adjacency = bd.skill_adjacency ?? 0;
  const gapEffortPct = Math.round((bd.gap_effort ?? 0) * 1000) / 10;
  const missingCount = route.missing_skills.length;

  function handleSwitchRoute(newId: string) {
    setSelectedRouteId(newId);
    router.push(`/routes/${newId}`);
  }

  return (
    <div className="relative min-h-[calc(100vh-5rem)] w-full page-section page-shell bg-radial-subtle">
      <div className="mx-auto w-full max-w-6xl flex flex-col gap-10">

        {/* Top Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-[#1b2844]">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                SELECTED ROUTE · #{rank || 1} {rank === 1 ? "BEST FIT" : ""}
              </span>

              {/* Route Switcher Dropdown */}
              <div className="relative inline-block">
                <select
                  value={route.occupation_id}
                  onChange={(e) => handleSwitchRoute(e.target.value)}
                  className="rounded-lg border border-[#1b2844] bg-[#0c1322] px-3 py-1 text-xs font-semibold text-slate-300 focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  {routes.map((r) => (
                    <option key={r.occupation_id} value={r.occupation_id}>
                      {r.title} ({Math.round(r.route_fit_score * 100)}%)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <h1 className="mt-3 font-display text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white">
              {route.title}
            </h1>

            <p className="mt-2.5 text-sm sm:text-base text-slate-400">
              Skill overlap · Market demand · Demand velocity · Adjacency · Gap effort
            </p>
          </div>

          {/* Right: Circular Gauge & CTA */}
          <div className="flex items-center gap-6 sm:gap-8 self-start md:self-center shrink-0">
            <CircularGauge
              score={scorePct}
              size="lg"
              color="#22c55e"
              label="Route Fit"
            />

            <Link
              href="/roadmap"
              className="inline-flex items-center gap-2.5 rounded-xl bg-emerald-500 px-7 py-4 text-base font-bold text-slate-950 shadow-[0_0_25px_-5px_rgba(34,197,94,0.5)] transition-all hover:bg-emerald-400 hover:scale-105"
            >
              <span>View 90-Day Route</span>
              <ArrowRight className="size-5" />
            </Link>
          </div>
        </div>

        {/* 2 Balanced Side-by-Side Cards (Equal Height Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 items-stretch">

          {/* Left Card: ROUTE FIT BREAKDOWN */}
          <div className="card flex flex-col justify-between backdrop-blur-md shadow-2xl">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-5 border-b border-[#1b2844]">
                ROUTE FIT BREAKDOWN
              </h2>

              <div className="mt-8 flex flex-col gap-6">

                {/* 1. Skill Overlap */}
                <div>
                  <div className="flex items-center justify-between text-sm sm:text-base font-medium mb-2">
                    <span className="text-slate-300">Skill Overlap (×0.40)</span>
                    <span className="font-bold text-emerald-400">{overlapPct}%</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-[#162238] overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.min(100, overlapPct)}%` }} />
                  </div>
                </div>

                {/* 2. Market Demand */}
                <div>
                  <div className="flex items-center justify-between text-sm sm:text-base font-medium mb-2">
                    <span className="text-slate-300">Market Demand (×0.25)</span>
                    <span className="font-bold text-sky-400">{demandPct}%</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-[#162238] overflow-hidden">
                    <div className="h-full rounded-full bg-sky-400" style={{ width: `${Math.min(100, demandPct)}%` }} />
                  </div>
                </div>

                {/* 3. Demand Velocity */}
                <div>
                  <div className="flex items-center justify-between text-sm sm:text-base font-medium mb-2">
                    <span className="text-slate-300">Demand Velocity (×0.15)</span>
                    <span className="font-bold text-teal-400">
                      {velocityPct >= 0 ? "+" : ""}
                      {velocityPct}% YoY
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-[#162238] overflow-hidden">
                    <div className="h-full rounded-full bg-teal-400" style={{ width: `${Math.min(100, Math.max(0, velocityPct))}%` }} />
                  </div>
                </div>

                {/* 4. Skill Adjacency */}
                <div>
                  <div className="flex items-center justify-between text-sm sm:text-base font-medium mb-2">
                    <span className="text-slate-300">Skill Adjacency (×0.10)</span>
                    <span className="font-bold text-purple-400">{adjacency.toFixed(2)}</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-[#162238] overflow-hidden">
                    <div className="h-full rounded-full bg-purple-400" style={{ width: `${Math.min(100, adjacency * 100)}%` }} />
                  </div>
                </div>

                {/* 5. Gap Effort Penalty */}
                <div>
                  <div className="flex items-center justify-between text-sm sm:text-base font-medium mb-2">
                    <span className="text-slate-300">Gap Effort Penalty (×0.10)</span>
                    <span className="font-bold text-red-400">-{missingCount} skills</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-[#162238] overflow-hidden">
                    <div className="h-full rounded-full bg-red-400" style={{ width: `${Math.min(100, gapEffortPct)}%` }} />
                  </div>
                </div>

              </div>
            </div>

            {/* Footnote */}
            <p className="mt-10 text-xs text-slate-500">
              All factors sourced from <span className="font-semibold text-sky-400">BigQuery</span> <code className="text-slate-400">croute_market</code> dataset
            </p>
          </div>

          {/* Right Card: SKILL GAPS · RANKED BY MARKET DEMAND */}
          <div className="card flex flex-col justify-between backdrop-blur-md shadow-2xl">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-5 border-b border-[#1b2844]">
                SKILL GAPS · RANKED BY MARKET DEMAND
              </h2>

              {gapsLoading && (
                <div className="mt-8 flex items-center justify-center gap-2.5 text-sm text-slate-400 py-6">
                  <Loader2 className="size-4 animate-spin" />
                  Loading live skill gaps…
                </div>
              )}

              {!gapsLoading && gapsError && (
                <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-400">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <span>{gapsError}</span>
                </div>
              )}

              {!gapsLoading && !gapsError && gaps.length === 0 && (
                <p className="mt-6 text-sm text-slate-400">
                  No skill gaps — your current skills already cover every requirement for this route.
                </p>
              )}

              {!gapsLoading && !gapsError && gaps.length > 0 && (
                <div className="mt-6 flex flex-col gap-5">
                  {gaps.map((gap, idx) => {
                    const impact = impactBucket(idx, gaps.length);
                    const demandPctGap = Math.round(gap.demand_score * 100);

                    return (
                      <div key={gap.skill_id} className="flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">

                          <div className="flex items-center gap-2.5">
                            <span className="text-sm sm:text-base font-bold text-white">
                              {gap.skill_name}
                            </span>

                            {/* Impact Badge */}
                            <span
                              className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                                impact === "HIGH"
                                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                                  : impact === "MED"
                                  ? "bg-slate-800 text-slate-300 border border-slate-700"
                                  : "bg-slate-900 text-slate-500"
                              }`}
                            >
                              {impact} impact
                            </span>
                          </div>

                          <span className="text-xs sm:text-sm font-medium text-slate-400">
                            {demandPctGap}% demand
                          </span>
                        </div>

                        {/* Progress meter */}
                        <div className="h-2 w-full rounded-full bg-[#162238] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-sky-400 transition-all"
                            style={{ width: `${Math.min(100, demandPctGap)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Insight */}
            <div className="mt-8 pt-5 border-t border-[#1b2844] flex items-center justify-between text-xs sm:text-sm text-slate-400">
              <span>Skills remaining to close this route:</span>
              <span className="font-bold text-amber-400 text-sm sm:text-base">{gaps.length}</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
