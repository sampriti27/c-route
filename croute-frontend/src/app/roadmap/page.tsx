"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle, Compass, Sparkles, Trophy } from "lucide-react";

import { useAppStore } from "@/lib/store";
import type { RoadmapWeek } from "@/lib/types";

interface MonthTheme {
  label: string;
  accentText: string;
  border: string;
  glow: string;
  badgeActive: string;
  badgeUpcoming: string;
  itemActive: string;
  itemIdle: string;
  chip: string;
  iconActive: string;
}

const MONTH_THEMES: MonthTheme[] = [
  {
    label: "Month 1",
    accentText: "text-emerald-400",
    border: "border-emerald-500/50",
    glow: "shadow-[0_0_25px_-5px_rgba(34,197,94,0.15)]",
    badgeActive: "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400",
    badgeUpcoming: "bg-slate-800 border border-slate-700 text-slate-400",
    itemActive: "border-emerald-500/40 bg-[#081f14]/80",
    itemIdle: "border-[#1b2844] bg-[#08121f] hover:border-emerald-500/30 hover:bg-[#0a1829]",
    chip: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    iconActive: "text-emerald-400",
  },
  {
    label: "Month 2",
    accentText: "text-sky-400",
    border: "border-[#1b2844]",
    glow: "shadow-xl",
    badgeActive: "bg-sky-500/20 border border-sky-500/40 text-sky-400",
    badgeUpcoming: "bg-slate-800 border border-slate-700 text-slate-400",
    itemActive: "border-sky-500/40 bg-[#081a29]/80",
    itemIdle: "border-[#1b2844] bg-[#08121f] hover:border-sky-500/30 hover:bg-[#0a1829]",
    chip: "bg-sky-500/20 text-sky-400 border border-sky-500/30",
    iconActive: "text-sky-400",
  },
  {
    label: "Month 3",
    accentText: "text-purple-400",
    border: "border-[#1b2844]",
    glow: "shadow-xl",
    badgeActive: "bg-purple-500/20 border border-purple-500/40 text-purple-400",
    badgeUpcoming: "bg-slate-800 border border-slate-700 text-slate-400",
    itemActive: "border-purple-500/40 bg-[#1c0f2e]/80",
    itemIdle: "border-[#1b2844] bg-[#08121f] hover:border-purple-500/30 hover:bg-[#0a1829]",
    chip: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
    iconActive: "text-purple-400",
  },
];

function bucketByMonth(roadmap: RoadmapWeek[]): RoadmapWeek[][] {
  const buckets: RoadmapWeek[][] = [[], [], []];
  roadmap.forEach((phase, idx) => {
    const start = phase.week_start ?? idx * 3 + 1;
    const monthIdx = start <= 4 ? 0 : start <= 8 ? 1 : 2;
    buckets[monthIdx].push(phase);
  });
  return buckets;
}

export default function RoadmapPage() {
  const { effectiveResult, selectedRouteId } = useAppStore();
  const [completedPhases, setCompletedPhases] = useState<Record<string, boolean>>({});

  function togglePhase(key: string) {
    setCompletedPhases((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  if (!effectiveResult) {
    return (
      <div className="relative min-h-[calc(100vh-5rem)] w-full page-section page-shell bg-radial-subtle flex items-center justify-center">
        <div className="card flex flex-col items-center text-center gap-4 max-w-md">
          <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Compass className="size-6" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">No route selected yet</h1>
          <p className="text-sm text-slate-400">
            Analyze your profile to generate a 90-day route grounded in your skill gaps.
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
  const currentRoute = routes.find((r) => r.occupation_id === selectedRouteId) || routes[0];
  const roadmap = effectiveResult.roadmap_90_day ?? [];
  const months = bucketByMonth(roadmap);

  const completedCount = Object.values(completedPhases).filter(Boolean).length;
  const totalPhases = roadmap.length;
  const progressPercent = totalPhases > 0 ? Math.round((completedCount / totalPhases) * 100) : 0;

  return (
    <div className="relative min-h-[calc(100vh-5rem)] w-full page-section page-shell bg-radial-subtle">
      <div className="mx-auto w-full max-w-7xl flex flex-col gap-10">

        {/* Top Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-[#1b2844]">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              90-DAY ROUTE · {currentRoute.title.toUpperCase()}
            </span>

            <h1 className="mt-2.5 font-display text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white">
              Your Route Forward
            </h1>

            <p className="mt-2.5 text-sm sm:text-base text-slate-400 max-w-2xl">
              {effectiveResult.gemini_live
                ? "Phased milestones generated by CRO · Based on your skill gaps and market demand priorities"
                : "Phased milestones from the deterministic skeleton · CRO enrichment unavailable this session"}
            </p>
          </div>

          {/* Progress Tracker Widget */}
          <div className="flex items-center gap-5 rounded-2xl border border-[#1b2844] bg-[#0c1322] p-5 shrink-0 shadow-xl">
            <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Trophy className="size-6" />
            </div>
            <div>
              <div className="flex items-center justify-between gap-6 text-xs sm:text-sm font-semibold">
                <span className="text-slate-300">Phases Done</span>
                <span className="text-emerald-400 font-bold">
                  {completedCount} / {totalPhases} ({progressPercent}%)
                </span>
              </div>
              <div className="mt-2 h-2 w-44 rounded-full bg-[#162238] overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3 Equal Month Columns */}
        {totalPhases === 0 ? (
          <div className="card text-center text-sm text-slate-400">
            No roadmap phases were returned for this route.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-10 items-start">
            {months.map((phases, monthIdx) => {
              const theme = MONTH_THEMES[monthIdx];
              const isActive = monthIdx === 0;

              return (
                <div
                  key={theme.label}
                  className={`flex flex-col rounded-2xl bg-[#0c1322] p-7 sm:p-8 border ${theme.border} ${theme.glow}`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-[#1b2844]">
                    <div>
                      <h2 className={`font-display text-xl font-bold ${theme.accentText}`}>
                        {theme.label}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
                        {phases.length > 0 ? phases[0].focus_skill : "—"}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                        isActive ? theme.badgeActive : theme.badgeUpcoming
                      }`}
                    >
                      {isActive ? "Active" : "Upcoming"}
                    </span>
                  </div>

                  {/* Phase Cards */}
                  <div className="mt-5 flex flex-col gap-3.5">
                    {phases.length === 0 && (
                      <p className="text-xs text-slate-500">No phases in this window.</p>
                    )}
                    {phases.map((phase) => {
                      const key = phase.weeks;
                      const isDone = Boolean(completedPhases[key]);

                      return (
                        <div
                          key={key}
                          onClick={() => togglePhase(key)}
                          className={`group flex items-start gap-3.5 rounded-xl border p-4 transition-all cursor-pointer shadow-md ${
                            isDone ? theme.itemActive : theme.itemIdle
                          }`}
                        >
                          <button type="button" className={`mt-0.5 shrink-0 text-slate-500 ${isDone ? theme.iconActive : ""}`}>
                            {isDone ? (
                              <CheckCircle2 className={`size-5 ${theme.iconActive}`} />
                            ) : (
                              <Circle className="size-5" />
                            )}
                          </button>

                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <span className={`rounded px-2 py-0.5 text-xs font-bold ${theme.chip}`}>
                                {phase.weeks}
                              </span>
                              <span className="text-xs sm:text-sm font-semibold text-slate-200 group-hover:text-white leading-snug">
                                {phase.focus_skill}
                              </span>
                            </div>
                            <span className="text-xs text-slate-400 leading-relaxed">
                              {phase.description}
                            </span>
                            <span className={`text-xs font-medium ${theme.accentText}/80`}>
                              {phase.milestone}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Next Step Banner */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-6 rounded-2xl border border-emerald-500/30 bg-[#081a13] p-6 shadow-xl">
          <div className="flex items-center gap-4">
            <Sparkles className="size-6 text-emerald-400 shrink-0" />
            <p className="text-sm sm:text-base text-slate-300">
              Want to see how adding new skills shifts your route fit? Test scenarios in the simulator.
            </p>
          </div>
          <Link
            href="/cro"
            className="inline-flex items-center gap-2.5 rounded-xl bg-emerald-500 px-7 py-3.5 text-sm sm:text-base font-bold text-slate-950 shadow-[0_0_20px_-3px_rgba(34,197,94,0.4)] transition-all hover:bg-emerald-400 hover:scale-105 shrink-0"
          >
            <span>Simulate What-If Scenarios</span>
            <ArrowRight className="size-4" />
          </Link>
        </div>

      </div>
    </div>
  );
}
