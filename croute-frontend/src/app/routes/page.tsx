"use client";

import Link from "next/link";
import { Bot, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Route } from "@/lib/types";

function fitColor(score: number): string {
  if (score >= 0.45) return "#6366f1";
  if (score >= 0.3) return "#f59e0b";
  return "#ef4444";
}

function fitLabel(score: number): string {
  if (score >= 0.45) return "Strong Fit";
  if (score >= 0.3) return "Moderate Fit";
  return "Stretch Route";
}

function RouteCard({ route, rank }: { route: Route; rank: number }) {
  const score = route.route_fit_score;
  const scorePct = Math.round(score * 1000) / 10;
  const color = fitColor(score);

  return (
    <Card className="border border-brand-border bg-brand-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-display text-lg font-bold text-brand-text">
            #{rank} {route.title}
          </span>
          {route.target_direction_match && (
            <Badge className="bg-brand-green-dim text-brand-green">✓ Direction match</Badge>
          )}
          <Badge className="bg-brand-blue-dim text-brand-blue">
            {route.category.charAt(0).toUpperCase() + route.category.slice(1)}
          </Badge>
        </div>
        <div className="shrink-0 text-right">
          <span className="text-xl font-extrabold" style={{ color }}>
            {scorePct}%
          </span>
          <span className="ml-1.5 text-xs text-brand-muted">Route Fit</span>
        </div>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-brand-surface2">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${scorePct}%`, backgroundColor: color }}
        />
      </div>

      <div className="mt-2 text-xs text-brand-muted">
        <span className="font-semibold text-brand-teal">{fitLabel(score)}</span>
        {route.matched_count !== undefined && route.required_count !== undefined && (
          <> · {route.matched_count}/{route.required_count} skills matched</>
        )}
        {route.breakdown.market_demand !== undefined && (
          <> · Market demand: {Math.round(route.breakdown.market_demand * 100)}%</>
        )}
        {route.breakdown.velocity_pct !== undefined && (
          <> · Velocity: +{Math.round(route.breakdown.velocity_pct * 10) / 10}%</>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs text-brand-muted">✓ Have:</span>
        {route.matched_skills.length > 0 ? (
          route.matched_skills.map((s) => (
            <Badge key={s} className="bg-brand-green-dim text-brand-green">
              {s}
            </Badge>
          ))
        ) : (
          <span className="text-xs text-brand-border">—</span>
        )}
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs text-brand-muted">⚡ Gap:</span>
        {route.missing_skills.length > 0 ? (
          route.missing_skills.map((s) => (
            <Badge key={s} className="bg-brand-purple-dim text-brand-purple">
              {s}
            </Badge>
          ))
        ) : (
          <span className="text-xs text-brand-green">No gaps</span>
        )}
      </div>

      <div className="mt-4">
        <Button
          render={<Link href={`/routes/${route.occupation_id}`} />}
          nativeButton={false}
          variant="outline"
          size="sm"
          className="border-brand-border text-brand-text hover:bg-brand-surface2"
        >
          Explore Route →
        </Button>
      </div>
    </Card>
  );
}

export default function RoutesPage() {
  const { result } = useAppStore();

  if (!result) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
        <p className="text-brand-muted">
          No routes to show yet — complete your profile first.
        </p>
        <Button
          render={<Link href="/profile" />}
          nativeButton={false}
          className="bg-brand-green text-brand-bg hover:bg-brand-green/90"
        >
          Go to Profile →
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <h1 className="font-display text-2xl font-bold text-brand-text">
        🧭 Career Routes for <span className="text-brand-green">{result.profile_name}</span>
      </h1>
      <p className="mt-1 text-sm text-brand-muted">
        Scored against live BigQuery market demand · {result.total_routes} routes · Direction:{" "}
        <span className="font-semibold text-brand-text">{result.target_direction || "all"}</span>
      </p>

      {result.gemini_live && (
        <Badge className="mt-3 bg-brand-green-dim text-brand-green">
          <Sparkles className="size-3" /> Gemini live · BigQuery connected
        </Badge>
      )}

      {result.cro_explanation && (
        <div
          className={cn(
            "mt-5 rounded-xl border border-brand-purple/40 p-5 text-[15px] leading-relaxed text-brand-text",
            "bg-gradient-to-br from-[#1e1b4b] to-[#2d1b69]"
          )}
        >
          <div className="mb-1 flex items-center gap-1.5 font-semibold text-brand-purple">
            <Bot className="size-4" /> CRO says
          </div>
          {result.cro_explanation}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-4">
        {result.routes.map((route, i) => (
          <RouteCard key={route.occupation_id} route={route} rank={i + 1} />
        ))}
      </div>

      <div className="mt-8">
        <Button
          render={<Link href="/profile" />}
          nativeButton={false}
          variant="ghost"
          className="text-brand-muted"
        >
          ← Edit Profile
        </Button>
      </div>
    </div>
  );
}
