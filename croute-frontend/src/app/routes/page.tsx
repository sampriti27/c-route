"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Bot, Compass } from "lucide-react";

import { useAppStore } from "@/lib/store";
import { CircularGauge } from "@/components/ui/circular-gauge";
import type { Route } from "@/lib/types";

export default function RoutesPage() {
  const router = useRouter();
  const { effectiveResult, setSelectedRouteId } = useAppStore();

  function handleSelectRoute(route: Route) {
    setSelectedRouteId(route.occupation_id);
    router.push(`/routes/${route.occupation_id}`);
  }

  if (!effectiveResult) {
    return (
      <div className="relative min-h-[calc(100vh-5rem)] w-full page-section page-shell bg-radial-subtle flex items-center justify-center">
        <div className="card flex flex-col items-center text-center gap-4 max-w-md">
          <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Compass className="size-6" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">No profile analyzed yet</h1>
          <p className="text-sm text-slate-400">
            Submit your skills on the Profile step to get scored routes from the live market data.
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

  const routes = effectiveResult.routes;
  const profileName = effectiveResult.profile_name || "you";

  return (
    <div className="relative min-h-[calc(100vh-5rem)] w-full page-section page-shell bg-radial-subtle">
      <div className="mx-auto w-full max-w-6xl flex flex-col gap-8">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1b2844]">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              CAREER ROUTES
            </span>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Career Routes for <span className="text-emerald-400">{profileName}</span>
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Scored against live BigQuery market demand · {routes.length} viable routes identified
            </p>
          </div>

          <Link
            href="/profile"
            className="self-start sm:self-auto rounded-xl border border-[#1b2844] bg-[#0c1322] px-4 py-2 text-xs sm:text-sm font-semibold text-slate-400 hover:border-emerald-500/50 hover:text-white transition-colors"
          >
            ← Edit Profile
          </Link>
        </div>

        {/* CRO Explanation Banner */}
        {effectiveResult.cro_explanation && (
          <div className="flex items-start gap-4 rounded-2xl border border-emerald-500/30 bg-[#081a13]/80 p-6 sm:p-7 backdrop-blur">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Bot className="size-5" />
            </div>
            <div className="text-sm leading-relaxed text-slate-300">
              <span className="font-bold text-emerald-400 mr-2">CRO Mentor Note:</span>
              {effectiveResult.cro_explanation}
            </div>
          </div>
        )}

        {/* Ranked Route Cards List */}
        <div className="flex flex-col gap-5 md:gap-6 mt-2">
          {routes.map((route, idx) => {
            const rank = idx + 1;
            const isTopFit = rank === 1;
            const scorePct = route.route_fit_score > 1 ? route.route_fit_score : route.route_fit_score * 100;
            const velocity = route.breakdown.velocity_pct || 10;
            const demandPct = Math.round((route.breakdown.market_demand || 0.8) * 100);

            let ringColor = "#22c55e";
            if (rank === 2) ringColor = "#38bdf8";
            if (rank === 3) ringColor = "#fbbf24";
            if (rank === 4) ringColor = "#a855f7";
            if (rank === 5) ringColor = "#2dd4bf";

            return (
              <div
                key={route.occupation_id}
                onClick={() => handleSelectRoute(route)}
                className={`group relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6 rounded-2xl p-6 sm:p-8 lg:p-9 transition-all duration-200 cursor-pointer shadow-xl ${
                  isTopFit
                    ? "border border-emerald-500/80 bg-[#081c14] shadow-[0_0_30px_-5px_rgba(34,197,94,0.25)] hover:border-emerald-400 hover:shadow-[0_0_35px_-3px_rgba(34,197,94,0.35)]"
                    : "border border-[#1b2844] bg-[#0c1322] hover:border-slate-600 hover:bg-[#0f182c]"
                }`}
              >
                {/* Left: Rank Badge & Title & Tags */}
                <div className="flex items-start sm:items-center gap-5 flex-1">
                  
                  {/* Rank Number Badge */}
                  <div
                    className={`flex size-12 sm:size-14 shrink-0 items-center justify-center rounded-2xl font-display text-xl font-black ${
                      isTopFit
                        ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-400"
                        : "bg-[#111b2e] border border-[#1b2844] text-slate-400"
                    }`}
                  >
                    #{rank}
                  </div>

                  {/* Title & Metadata */}
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="font-display text-xl sm:text-2xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                        {route.title}
                      </h2>

                      {isTopFit && (
                        <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-0.5 text-xs font-bold text-emerald-400">
                          Best Fit
                        </span>
                      )}

                      <span className="text-xs sm:text-sm text-slate-400 font-medium">
                        {route.matched_count || route.matched_skills.length} /{" "}
                        {route.required_count || 6} skills matched
                      </span>

                      <span className="rounded-full bg-sky-500/15 border border-sky-500/30 px-3 py-0.5 text-xs font-semibold text-sky-400">
                        Demand {demandPct}%
                      </span>
                    </div>

                    {/* Matched / Missing pills */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                      <span className="text-slate-500 font-medium">Have:</span>
                      {route.matched_skills.slice(0, 3).map((s) => (
                        <span key={s} className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400 border border-emerald-500/20">
                          {s}
                        </span>
                      ))}
                      {route.missing_skills.length > 0 && (
                        <>
                          <span className="text-slate-500 font-medium ml-1">Gaps:</span>
                          {route.missing_skills.slice(0, 2).map((s) => (
                            <span key={s} className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-slate-400 border border-slate-700">
                              {s}
                            </span>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Velocity Bar + Circular Score Gauge */}
                <div className="flex items-center gap-6 sm:gap-8 self-end md:self-center shrink-0">
                  
                  {/* Velocity Bar */}
                  <div className="hidden sm:flex flex-col items-end gap-1.5 text-right">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                      <span>Velocity</span>
                      <span className="text-emerald-400">+{velocity}% YoY</span>
                    </div>
                    <div className="h-2 w-28 rounded-full bg-[#162238] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-400"
                        style={{ width: `${Math.min(100, velocity * 4)}%` }}
                      />
                    </div>
                  </div>

                  {/* Circular Score Gauge */}
                  <CircularGauge
                    score={scorePct}
                    size="md"
                    color={ringColor}
                    label="Route Fit"
                  />

                  {/* Arrow indicator */}
                  <div className="text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1.5 transition-all">
                    <ArrowRight className="size-5" />
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
