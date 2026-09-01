"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, ListChecks, Plus, Sparkles, X } from "lucide-react";

import { postProfile } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import type { ExtractedSkill } from "@/lib/mock-data";

export default function ProfilePage() {
  const router = useRouter();
  const {
    setResult,
    userProfile,
    setUserProfile,
    extractedSkills,
    setExtractedSkills,
    loadSampleProfile,
  } = useAppStore();

  const [name, setName] = useState(userProfile.name);
  const [backgroundText, setBackgroundText] = useState(userProfile.background);
  const [currentRole, setCurrentRole] = useState(userProfile.currentRole);
  const [targetDirection, setTargetDirection] = useState(userProfile.targetDirection);

  const [newSkillInput, setNewSkillInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Wake the backend as soon as the page mounts so it's warm by the time the user submits.
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`).catch(() => {});
  }, []);

  // Add custom skill pill
  function handleAddSkill() {
    if (!newSkillInput.trim()) return;
    if (extractedSkills.some((s) => s.name.toLowerCase() === newSkillInput.trim().toLowerCase())) {
      setNewSkillInput("");
      return;
    }
    const newSkill: ExtractedSkill = {
      name: newSkillInput.trim(),
      category: "Technical",
      proficiency: "Moderate",
    };
    setExtractedSkills([...extractedSkills, newSkill]);
    setNewSkillInput("");
  }

  // Remove skill pill
  function handleRemoveSkill(skillName: string) {
    setExtractedSkills(extractedSkills.filter((s) => s.name !== skillName));
  }

  // Quick preset loading — fills the form only, does not call the backend
  function handleLoadSample() {
    loadSampleProfile();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (extractedSkills.length === 0) {
      setError("Add at least one skill before analyzing your profile.");
      return;
    }

    setLoading(true);

    setUserProfile({
      name: name.trim(),
      background: backgroundText,
      currentRole,
      targetDirection,
    });

    try {
      const targetParam = targetDirection.trim() || undefined;

      const apiResult = await postProfile({
        name: name.trim() || undefined,
        skills: extractedSkills.map((s) => s.name),
        target: targetParam,
      });

      setResult(apiResult);
      router.push("/routes");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Something went wrong scoring your profile.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-5rem)] w-full page-section page-shell bg-radial-subtle">
      <div className="mx-auto w-full max-w-7xl">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-14 items-start">

          {/* Left Column: Form Controls (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-8">

            {/* Header / Subtitle */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                  STEP 1 OF 2
                </span>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  <Sparkles className="size-3.5 text-emerald-400" />
                  Fill Example Profile (Aisha)
                </button>
              </div>

              <h1 className="mt-3 font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
                Tell us where you are
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-400">
                Describe your background for context, then list your skills below — they're what gets scored against live market data.
              </p>
            </div>

            {/* Background Textarea Box */}
            <div>
              <label
                htmlFor="background"
                className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3"
              >
                YOUR BACKGROUND
              </label>
              <textarea
                id="background"
                rows={7}
                value={backgroundText}
                onChange={(e) => setBackgroundText(e.target.value)}
                placeholder="Describe your current work, tools, and career objectives..."
                className="w-full rounded-2xl border border-[#1b2844] bg-[#0c1322] p-5 text-sm leading-relaxed text-slate-200 placeholder:text-slate-500 focus:border-emerald-500 focus:bg-[#0f182c] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner min-h-[170px]"
              />
            </div>

            {/* Name, Current Role & Target Direction */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5"
                >
                  YOUR NAME (OPTIONAL)
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aisha"
                  className="w-full rounded-xl border border-[#1b2844] bg-[#0c1322] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>

              <div>
                <label
                  htmlFor="currentRole"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5"
                >
                  CURRENT ROLE
                </label>
                <input
                  id="currentRole"
                  type="text"
                  value={currentRole}
                  onChange={(e) => setCurrentRole(e.target.value)}
                  placeholder="e.g. Junior Finance Executive"
                  className="w-full rounded-xl border border-[#1b2844] bg-[#0c1322] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>

              <div>
                <label
                  htmlFor="targetDirection"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5"
                >
                  TARGET DIRECTION (OPTIONAL)
                </label>
                <select
                  id="targetDirection"
                  value={targetDirection}
                  onChange={(e) => setTargetDirection(e.target.value)}
                  className="w-full rounded-xl border border-[#1b2844] bg-[#0c1322] px-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer"
                >
                  <option value="">No preference — show all</option>
                  <option value="analytics">Analytics / Data</option>
                  <option value="finance">Finance</option>
                  <option value="marketing">Marketing</option>
                  <option value="product">Product</option>
                  <option value="operations">Operations</option>
                </select>
              </div>
            </div>

            {/* Error banner if any */}
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-400">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-emerald-500 px-8 py-3.5 text-base font-bold text-slate-950 shadow-[0_0_25px_-5px_rgba(34,197,94,0.5)] transition-all hover:bg-emerald-400 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              >
                <span>{loading ? "Analyzing Profile…" : "Analyze My Profile"}</span>
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>

          {/* Right Column: Your Skills (5 cols) */}
          <div className="lg:col-span-5">
            <div className="card backdrop-blur-md">

              <div className="flex items-center justify-between pb-5 border-b border-[#1b2844]">
                <div className="flex items-center gap-2.5">
                  <ListChecks className="size-5 text-emerald-400" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    YOUR SKILLS
                  </h2>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                  {extractedSkills.length} added
                </span>
              </div>

              {/* Skills List */}
              {extractedSkills.length > 0 ? (
                <div className="mt-5 flex flex-col gap-3">
                  {extractedSkills.map((skill) => (
                    <div
                      key={skill.name}
                      className="group flex items-center justify-between rounded-xl border border-emerald-500/30 bg-[#081b14]/70 px-4 py-3.5 transition-all hover:border-emerald-500/60 hover:bg-[#0a231b]"
                    >
                      <span className="font-semibold text-emerald-400 text-sm">
                        {skill.name}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill.name)}
                        className="text-slate-500 hover:text-red-400 transition-colors p-0.5"
                        title="Remove skill"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-5 text-sm text-slate-500">
                  No skills added yet — add at least one below to score your profile.
                </p>
              )}

              {/* Add custom skill input */}
              <div className="mt-5 flex items-center gap-2">
                <input
                  type="text"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  placeholder="e.g. SQL, Excel, Power BI..."
                  className="flex-1 rounded-xl border border-[#1b2844] bg-[#070b14] px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="flex size-9 items-center justify-center rounded-xl bg-[#111b2e] border border-[#1b2844] text-slate-300 hover:border-emerald-500/50 hover:text-emerald-400 transition-colors"
                >
                  <Plus className="size-4" />
                </button>
              </div>

              {/* Explanatory Footer Note */}
              <p className="mt-8 text-xs leading-relaxed text-slate-500">
                Skills are matched against C.Route&apos;s live market database when you analyze your profile.
              </p>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
