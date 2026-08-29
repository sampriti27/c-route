"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

interface NavItem {
  label: string;
  href: string;
  /** Returns why this item is disabled, or null if it's reachable right now. */
  disabledReason?: (hasResult: boolean) => string | null;
  /** Matches this item as active for a whole path prefix (e.g. /routes/abc). */
  matchPrefix?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Landing", href: "/" },
  { label: "Profile", href: "/profile" },
  {
    label: "Routes",
    href: "/routes",
    disabledReason: (hasResult) => (hasResult ? null : "Complete your profile first"),
  },
  {
    label: "Route Detail",
    href: "/routes",
    matchPrefix: true,
    disabledReason: (hasResult) => (hasResult ? null : "Complete your profile first"),
  },
  {
    label: "90-Day Roadmap",
    href: "/roadmap",
    disabledReason: (hasResult) => (hasResult ? null : "Complete your profile first"),
  },
  {
    label: "CRO + What If",
    href: "/cro",
    disabledReason: (hasResult) => (hasResult ? null : "Complete your profile first"),
  },
];

export function NavBar() {
  const pathname = usePathname();
  const { result } = useAppStore();
  const hasResult = Boolean(result && result.routes.length > 0);

  return (
    <header className="sticky top-0 z-50 border-b border-brand-border bg-brand-bg/95 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-brand-text"
        >
          <Compass className="size-5 text-brand-green" strokeWidth={2.5} />
          C.Route
        </Link>

        <ul className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = item.matchPrefix
              ? pathname.startsWith(item.href) && pathname !== "/"
              : pathname === item.href;
            const reason = item.disabledReason?.(hasResult) ?? null;
            const isDisabled = Boolean(reason);

            return (
              <li key={item.label}>
                {isDisabled ? (
                  <span
                    title={reason ?? undefined}
                    aria-disabled="true"
                    className="cursor-not-allowed rounded-md px-3 py-1.5 text-sm font-medium text-brand-muted"
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-brand-surface2 hover:text-brand-text",
                      isActive ? "bg-brand-surface2 text-brand-green" : "text-brand-muted"
                    )}
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
