import Link from "next/link";
import { ArrowRight } from "lucide-react";

const STAT_METRICS = [
  { value: "25", label: "Occupations Mapped" },
  { value: "35", label: "Skills Tracked" },
  { value: "2", label: "Market Periods" },
  { value: "5", label: "Scoring Factors" },
];

const FLOW_STEPS = [
  "Profile",
  "Career Radar",
  "Routes",
  "Route Fit",
  "Skill Gap",
  "90-Day Route",
  "What-if",
];

export default function LandingPage() {
  return (
    <div className="relative min-h-[calc(100vh-5rem)] w-full flex flex-col items-center justify-center bg-grid-dots bg-radial-glow py-20 md:py-28 page-shell overflow-x-hidden">
      {/* Ambient background blur glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-[650px] rounded-full bg-emerald-500/10 blur-[140px]" />
      <div className="pointer-events-none absolute top-1/2 -right-40 size-[450px] rounded-full bg-sky-500/5 blur-[120px]" />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center text-center">
        
        {/* Big Typographic Hero */}
        <div className="flex flex-col items-center space-y-2 md:space-y-3">
          <h1 className="font-display text-5xl sm:text-7xl md:text-8xl font-black tracking-tight text-white leading-none">
            Your career.
          </h1>
          <h1 className="font-display text-5xl sm:text-7xl md:text-8xl font-black tracking-tight text-emerald-400 drop-shadow-[0_0_35px_rgba(34,197,94,0.4)] leading-none">
            Your route.
          </h1>
          <h1 className="font-display text-5xl sm:text-7xl md:text-8xl font-black tracking-tight text-white leading-none">
            Your next move.
          </h1>
        </div>

        {/* Subtitle */}
        <p className="mt-8 md:mt-10 max-w-2xl text-base sm:text-lg leading-relaxed text-slate-400 font-normal">
          Real market data. Explainable routes. A 90-day plan that moves you
          forward — not a one-time recommendation, but a navigation loop.
        </p>

        {/* 4 Stat Metric Cards */}
        <div className="mt-10 md:mt-12 grid w-full max-w-3xl grid-cols-2 gap-5 sm:grid-cols-4 sm:gap-6">
          {STAT_METRICS.map((stat) => (
            <div
              key={stat.label}
              className="group flex flex-col items-center justify-center rounded-2xl border border-[#1b2844] bg-[#0c1322]/90 px-5 py-5 backdrop-blur transition-all duration-200 hover:border-emerald-500/50 hover:bg-[#0f182c] shadow-lg"
            >
              <span className="font-display text-3xl sm:text-4xl font-black text-white transition-colors group-hover:text-emerald-400">
                {stat.value}
              </span>
              <span className="mt-1.5 text-xs font-medium text-slate-400">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="mt-12 md:mt-16">
          <Link
            href="/profile"
            className="group inline-flex items-center gap-2.5 rounded-xl bg-emerald-500 px-9 py-4 text-base font-bold text-slate-950 shadow-[0_0_30px_-5px_rgba(34,197,94,0.6)] transition-all duration-200 hover:bg-emerald-400 hover:scale-105 hover:shadow-[0_0_40px_-3px_rgba(34,197,94,0.8)]"
          >
            <span>Map My Career Route</span>
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-1.5" />
          </Link>
        </div>

        {/* Workflow Breadcrumbs / Step Pills */}
        <div className="mt-14 md:mt-20 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {FLOW_STEPS.map((step, idx) => (
            <div key={step} className="flex items-center gap-2 sm:gap-3">
              <span className="rounded-lg border border-[#1b2844] bg-[#0c1322] px-3.5 py-1.5 text-xs font-medium text-slate-400">
                {step}
              </span>
              {idx < FLOW_STEPS.length - 1 && (
                <span className="text-slate-600 text-xs font-bold">→</span>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
