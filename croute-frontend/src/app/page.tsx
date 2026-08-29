import Link from "next/link";
import { BarChart3, Compass, Map } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const VALUE_PROPS = [
  {
    icon: BarChart3,
    title: "Data-Driven",
    description: "Scores backed by BigQuery market signals — not guesswork.",
  },
  {
    icon: Compass,
    title: "Multi-Route",
    description: "See every viable path, ranked by real fit to your skills.",
  },
  {
    icon: Map,
    title: "90-Day Plan",
    description: "CRO builds a personalised roadmap tied to skill gaps.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-20">
      <div className="w-full max-w-4xl text-center">
        <div className="mb-3 flex justify-center text-5xl">🗺️</div>
        <h1 className="font-display text-5xl font-extrabold text-brand-text">C.Route</h1>
        <p className="mt-2 font-display text-lg italic text-brand-blue">
          Your career. Your route. Your next move.
        </p>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-brand-muted">
          C.Route analyses live market demand and your skills to map the highest-fit career
          routes — then builds a personalised 90-day plan to get you there.
        </p>

        <Button
          render={<Link href="/profile" />}
          nativeButton={false}
          className="mt-10 h-11 px-6 text-base font-semibold bg-brand-green text-brand-bg hover:bg-brand-green/90"
        >
          Find Your Route →
        </Button>

        <div className="mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-3">
          {VALUE_PROPS.map(({ icon: Icon, title, description }) => (
            <Card
              key={title}
              className="border border-brand-border bg-brand-surface text-center transition-colors hover:border-brand-purple/50"
            >
              <CardContent className="flex flex-col items-center gap-3 px-5 py-8">
                <Icon className="size-7 text-brand-purple" strokeWidth={2} />
                <p className="font-display text-base font-bold text-brand-text">{title}</p>
                <p className="text-sm leading-relaxed text-brand-muted">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
