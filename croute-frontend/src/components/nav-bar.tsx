"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

interface NavStep {
  label: string;
  href: string;
  isActive: (pathname: string) => boolean;
  isRouteDetail?: boolean;
}

const NAV_STEPS: NavStep[] = [
  {
    label: "Home",
    href: "/",
    isActive: (p) => p === "/",
  },
  {
    label: "Profile",
    href: "/profile",
    isActive: (p) => p === "/profile",
  },
  {
    label: "Routes",
    href: "/routes",
    isActive: (p) => p === "/routes",
  },
  {
    label: "Route Detail",
    href: "/routes",
    isActive: (p) => p.startsWith("/routes/") && p !== "/routes",
    isRouteDetail: true,
  },
  {
    label: "Roadmap",
    href: "/roadmap",
    isActive: (p) => p === "/roadmap",
  },
  {
    label: "Reroute",
    href: "/cro",
    isActive: (p) => p === "/cro",
  },
];

export function NavBar() {
  const pathname = usePathname();
  const { selectedRouteId } = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-brand-border bg-[#070b14]/95 backdrop-blur-md">
      <nav className="page-shell flex h-20 items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 font-display text-2xl font-black tracking-tight text-white transition-opacity hover:opacity-90 shrink-0"
          onClick={() => setMobileOpen(false)}
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Compass className="size-5 text-emerald-400" strokeWidth={2.5} />
          </div>
          <span>
            C<span className="text-emerald-400">.</span>Route
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2.5 lg:gap-3.5 overflow-x-auto py-2 pr-2 lg:pr-4 no-scrollbar [scroll-padding-inline-end:1rem]">
          {NAV_STEPS.map((item) => {
            const active = item.isActive(pathname);
            const targetHref =
              item.isRouteDetail && selectedRouteId
                ? `/routes/${selectedRouteId}`
                : item.href;

            return (
              <Link
                key={item.label}
                href={targetHref}
                className={cn(
                  "rounded-lg px-3.5 py-2 text-xs lg:text-sm font-medium transition-all duration-150 whitespace-nowrap",
                  active
                    ? "border border-emerald-500 bg-emerald-950/60 text-emerald-400 font-bold shadow-[0_0_20px_-3px_rgba(34,197,94,0.35)]"
                    : "border border-[#1b2844] bg-[#0c1322] text-slate-400 hover:border-slate-700 hover:text-slate-200 hover:bg-[#111b2e]"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className="flex md:hidden size-10 items-center justify-center rounded-lg border border-[#1b2844] bg-[#0c1322] text-slate-300 hover:border-slate-700 hover:text-white transition-colors"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {/* Mobile Navigation Panel */}
      {mobileOpen && (
        <div className="md:hidden border-t border-brand-border bg-[#070b14]/98 backdrop-blur-md">
          <div className="page-shell flex flex-col gap-2 py-4">
            {NAV_STEPS.map((item) => {
              const active = item.isActive(pathname);
              const targetHref =
                item.isRouteDetail && selectedRouteId
                  ? `/routes/${selectedRouteId}`
                  : item.href;

              return (
                <Link
                  key={item.label}
                  href={targetHref}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "rounded-lg px-4 py-3 text-sm font-medium transition-all duration-150",
                    active
                      ? "border border-emerald-500 bg-emerald-950/60 text-emerald-400 font-bold shadow-[0_0_20px_-3px_rgba(34,197,94,0.35)]"
                      : "border border-[#1b2844] bg-[#0c1322] text-slate-400 hover:border-slate-700 hover:text-slate-200 hover:bg-[#111b2e]"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
