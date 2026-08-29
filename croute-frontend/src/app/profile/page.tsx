"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, postProfile } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { TARGET_DIRECTIONS } from "@/lib/types";

export default function ProfilePage() {
  const router = useRouter();
  const { setResult } = useAppStore();

  const [name, setName] = useState("");
  const [skillsRaw, setSkillsRaw] = useState("");
  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    const skills = skillsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (skills.length === 0) {
      setError("Please enter at least one skill.");
      return;
    }

    setLoading(true);
    try {
      const result = await postProfile({
        name: name.trim(),
        skills,
        target: target || undefined,
      });
      setResult(result);
      router.push("/routes");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <Card className="w-full max-w-lg border border-brand-border bg-brand-surface">
        <CardHeader>
          <CardTitle className="font-display text-2xl text-brand-text">
            👤 Tell us about yourself
          </CardTitle>
          <CardDescription className="text-brand-muted">
            C.Route uses this to score your fit against live market demand data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-sm font-medium text-brand-text">
                Your name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aisha"
                className="rounded-md border border-brand-border bg-brand-surface2 px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-green/50"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="skills" className="text-sm font-medium text-brand-text">
                Your current skills
              </label>
              <Textarea
                id="skills"
                value={skillsRaw}
                onChange={(e) => setSkillsRaw(e.target.value)}
                placeholder="Excel, SQL, Finance Basics, PowerPoint, Communication"
                className="min-h-24 border-brand-border bg-brand-surface2 text-brand-text placeholder:text-brand-muted"
              />
              <span className="text-xs text-brand-muted">Comma-separated list.</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="target" className="text-sm font-medium text-brand-text">
                Career direction (optional)
              </label>
              <select
                id="target"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="rounded-md border border-brand-border bg-brand-surface2 px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-green/50"
              >
                <option value="">No preference — show all</option>
                {TARGET_DIRECTIONS.map((dir) => (
                  <option key={dir} value={dir}>
                    {dir.charAt(0).toUpperCase() + dir.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <p className="rounded-md border border-brand-red/40 bg-brand-red/10 px-3 py-2 text-sm text-brand-red">
                {error}
              </p>
            )}

            <div className="mt-2 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push("/")}
                className="text-brand-muted"
              >
                ← Back
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-10 px-5 font-semibold bg-brand-green text-brand-bg hover:bg-brand-green/90"
              >
                {loading ? "Analysing…" : "Calculate Routes →"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
