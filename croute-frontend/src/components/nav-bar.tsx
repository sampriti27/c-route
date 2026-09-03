"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

interface NavStep {
  step: number;
  label: string;
  href: string;
  isActive: (pathname: string) => boolean;
}

const NAV_STEPS: NavStep[] = [
  {
    step: 1,
    label: "Landing",
    href: "/",
    isActive: (p) => p === "/",
  },
  {
    step: 2,
    label: "Profile",
    href: "/profile",
    isActive: (p) => p === "/profile",
  },
  {
    step: 3,
    label: "Routes",
    href: "/routes",
    isActive: (p) => p === "/routes",
  },
  {
    step: 4,
    label: "Route Detail",
    href: "/routes",
    isActive: (p) => p.startsWith("/routes/") && p !== "/routes",
  },
  {
    step: 5,
    label: "Roadmap",
    href: "/roadmap",
    isActive: (p) => p === "/roadmap",
  },
  {
    step: 6,
    label: "CRO + What-if",
    href: "/cro",
    isActive: (p) => p === "/cro",
  },
];

export function NavBar() {
  const pathname = usePathname();
  const { selectedRouteId } = useAppStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-brand-border bg-[#070b14]/95 backdrop-blur-md">
      <nav className="page-shell flex h-20 items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 font-display text-2xl font-black tracking-tight text-white transition-opacity hover:opacity-90 shrink-0"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Compass className="size-5 text-emerald-400" strokeWidth={2.5} />
          </div>
          <span>
            C<span className="text-emerald-400">.</span>Route
          </span>
        </Link>

        {/* Stepper Navigation */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 overflow-x-auto py-2 pr-2 sm:pr-4 no-scrollbar [scroll-padding-inline-end:1rem]">
          {NAV_STEPS.map((item) => {
            const active = item.isActive(pathname);
            const targetHref =
              item.step === 4 && selectedRouteId
                ? `/routes/${selectedRouteId}`
                : item.href;

            return (
              <Link
                key={item.step}
                href={targetHref}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-medium transition-all duration-150 whitespace-nowrap",
                  active
                    ? "border border-emerald-500 bg-emerald-950/60 text-emerald-400 font-bold shadow-[0_0_20px_-3px_rgba(34,197,94,0.35)]"
                    : "border border-[#1b2844] bg-[#0c1322] text-slate-400 hover:border-slate-700 hover:text-slate-200 hover:bg-[#111b2e]"
                )}
              >
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded text-xs font-bold",
                    active
                      ? "bg-emerald-500 text-slate-950"
                      : "bg-[#162238] text-slate-400"
                  )}
                >
                  {item.step}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
