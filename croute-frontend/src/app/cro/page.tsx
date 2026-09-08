"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, Bot, Check, Compass, Loader2, Plus, Send, Sparkles } from "lucide-react";

import { useAppStore } from "@/lib/store";
import { askCro, postProfile, postWhatIf, ApiError } from "@/lib/api";
import { CircularGauge } from "@/components/ui/circular-gauge";
import type { WhatIfResponse } from "@/lib/types";

const PRESET_QUESTIONS = [
  "Which single skill gives me the biggest Route Fit boost?",
  "How realistic is closing my current skill gaps on this roadmap?",
  "What is the market demand velocity for this route right now?",
];

interface ChatMessage {
  sender: "user" | "cro";
  text: string;
}

export default function CroWhatIfPage() {
  const { effectiveResult, selectedRouteId, extractedSkills } = useAppStore();

  const routes = effectiveResult?.routes ?? [];
  const currentRoute = routes.find((r) => r.occupation_id === selectedRouteId) || routes[0];

  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [simulatedScore, setSimulatedScore] = useState<number | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const [whatifOccupation, setWhatifOccupation] = useState("");
  const [whatifLoading, setWhatifLoading] = useState(false);
  const [whatifError, setWhatifError] = useState<string | null>(null);
  const [whatifResult, setWhatifResult] = useState<WhatIfResponse | null>(null);

  const baseScore = currentRoute
    ? currentRoute.route_fit_score > 1
      ? currentRoute.route_fit_score
      : currentRoute.route_fit_score * 100
    : 0;

  useEffect(() => {
    if (!currentRoute) return;
    setChatMessages([
      {
        sender: "cro",
        text: `Hello! I am CRO, your Career Route Oracle. Select skills from your gap list to see how your fit score for ${currentRoute.title} shifts, or ask me anything about this route.`,
      },
    ]);
  }, [currentRoute]);

  useEffect(() => {
    if (!currentRoute) return;

    if (selectedSkills.length === 0) {
      setSimulatedScore(null);
      setSimError(null);
      return;
    }

    let cancelled = false;
    setSimLoading(true);
    setSimError(null);

    postProfile({
      skills: [...extractedSkills.map((s) => s.name), ...selectedSkills],
      candidate_destinations: [currentRoute.occupation_id],
      score_all: false,
      skip_cro: true,
    })
      .then((result) => {
        if (cancelled) return;
        const updated = result.routes.find((r) => r.occupation_id === currentRoute.occupation_id);
        if (updated) {
          setSimulatedScore(
            updated.route_fit_score > 1 ? updated.route_fit_score : updated.route_fit_score * 100
          );
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setSimError(err instanceof ApiError ? err.message : "Failed to recompute score.");
        }
      })
      .finally(() => {
        if (!cancelled) setSimLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSkills, currentRoute]);

  function toggleSkill(skillName: string) {
    setSelectedSkills((prev) =>
      prev.includes(skillName) ? prev.filter((s) => s !== skillName) : [...prev, skillName]
    );
  }

  async function handleRunWhatIf() {
    if (!whatifOccupation.trim() || !currentRoute) return;

    setWhatifLoading(true);
    setWhatifError(null);
    setWhatifResult(null);

    try {
      const result = await postWhatIf({
        skills: extractedSkills.map((s) => s.name),
        whatif_occupation: whatifOccupation,
        name: effectiveResult?.profile_name ?? undefined,
      });
      setWhatifResult(result);
    } catch (err) {
      setWhatifError(err instanceof ApiError ? err.message : "Failed to run what-if scenario.");
    } finally {
      setWhatifLoading(false);
    }
  }

  async function handleSendChat(customText?: string) {
    const textToSend = customText || chatInput;
    if (!textToSend.trim() || !currentRoute) return;

    const userMsg: ChatMessage = { sender: "user", text: textToSend };
    setChatMessages((prev) => [...prev, userMsg]);
    if (!customText) setChatInput("");
    setChatLoading(true);

    try {
      const { answer } = await askCro({
        question: textToSend,
        occupation_id: currentRoute.occupation_id,
        skills: extractedSkills.map((s) => s.name),
        target: effectiveResult?.target_direction ?? undefined,
        name: effectiveResult?.profile_name ?? undefined,
      });
      setChatMessages((prev) => [...prev, { sender: "cro", text: answer }]);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "CRO couldn't answer that just now.";
      setChatMessages((prev) => [...prev, { sender: "cro", text: message }]);
    } finally {
      setChatLoading(false);
    }
  }

  if (!effectiveResult || !currentRoute) {
    return (
      <div className="relative min-h-[calc(100vh-5rem)] w-full page-section page-shell bg-radial-subtle flex items-center justify-center">
        <div className="card flex flex-col items-center text-center gap-4 max-w-md">
          <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Compass className="size-6" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">No route selected yet</h1>
          <p className="text-sm text-slate-400">
            Analyze your profile to unlock the What-if simulator and CRO chat.
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

  const displayScore = simulatedScore ?? baseScore;
  const scoreDelta = (displayScore - baseScore).toFixed(1);
  const candidateSkills = currentRoute.missing_skills;

  const whatifScore = whatifResult
    ? whatifResult.whatif_route.route_fit_score > 1
      ? whatifResult.whatif_route.route_fit_score
      : whatifResult.whatif_route.route_fit_score * 100
    : 0;
  const whatifDelta = (whatifScore - baseScore).toFixed(1);

  return (
    <div className="relative min-h-[calc(100vh-5rem)] w-full page-section page-shell bg-radial-subtle">
      <div className="mx-auto w-full max-w-7xl flex flex-col gap-10">

        {/* Top Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-[#1b2844]">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              SCENARIO SIMULATION & MENTOR
            </span>

            <h1 className="mt-2 font-display text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white">
              Reroute Simulator
            </h1>

            <p className="mt-2.5 text-sm sm:text-base text-slate-400 max-w-2xl">
              Toggle real skill gaps for {currentRoute.title} and re-score against the live scoring engine.
            </p>
          </div>

          {/* Quick status badge */}
          <div className="flex items-center gap-2.5 self-start md:self-center rounded-full bg-emerald-500/10 border border-emerald-500/30 px-4 py-1.5 text-xs sm:text-sm font-semibold text-emerald-400">
            <Sparkles className="size-4" />
            <span>{effectiveResult.gemini_live ? "Live Scoring + CRO Active" : "Live Scoring Active"}</span>
          </div>
        </div>

        {/* 2-Column Grid: What-If Sandbox (Left) + AI Mentor Chat (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-12 items-start">

          {/* Left Column: What-If Simulation (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-8">

            {/* Simulation Score Card */}
            <div className="rounded-2xl border border-emerald-500/50 bg-[#081a13] p-7 sm:p-8 lg:p-9 shadow-[0_0_30px_-5px_rgba(34,197,94,0.25)]">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    TARGET ROUTE: {currentRoute.title.toUpperCase()}
                  </span>
                  <div className="mt-3 flex items-baseline gap-3.5">
                    <span className="font-display text-4xl sm:text-5xl md:text-6xl font-black text-white">
                      {displayScore.toFixed(1)}%
                    </span>
                    {simLoading ? (
                      <Loader2 className="size-5 text-emerald-400 animate-spin" />
                    ) : (
                      selectedSkills.length > 0 && (
                        <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-xs sm:text-sm font-bold text-emerald-400">
                          {Number(scoreDelta) >= 0 ? "+" : ""}
                          {scoreDelta}% Route Fit
                        </span>
                      )
                    )}
                  </div>
                  <p className="mt-3 text-xs sm:text-sm text-slate-400">
                    Base score: <span className="text-slate-300 font-semibold">{baseScore.toFixed(1)}%</span> · With {selectedSkills.length} added skills
                  </p>
                  {simError && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-red-400">
                      <AlertCircle className="size-3.5" /> {simError}
                    </p>
                  )}
                </div>

                <CircularGauge
                  score={displayScore}
                  size="lg"
                  color="#22c55e"
                  label="Simulated"
                />
              </div>
            </div>

            {/* Interactive Skill Selection Cards */}
            <div className="rounded-2xl border border-[#1b2844] bg-[#0c1322] p-7 sm:p-8 lg:p-9 shadow-xl">
              <div className="flex items-center justify-between pb-5 border-b border-[#1b2844]">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    TOGGLE MISSING SKILLS TO SIMULATE IMPACT
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Click to test how acquiring these live gap skills impacts your fit score
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedSkills([])}
                  className="text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  Reset
                </button>
              </div>

              {candidateSkills.length === 0 ? (
                <p className="mt-6 text-sm text-slate-400">
                  No missing skills — you already cover every requirement for this route.
                </p>
              ) : (
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {candidateSkills.map((skillName) => {
                    const isSelected = selectedSkills.includes(skillName);

                    return (
                      <div
                        key={skillName}
                        onClick={() => toggleSkill(skillName)}
                        className={`flex items-center justify-between rounded-xl border p-4 transition-all cursor-pointer shadow-md ${isSelected
                            ? "border-emerald-500 bg-[#082215] text-white shadow-[0_0_20px_-3px_rgba(34,197,94,0.3)]"
                            : "border-[#1b2844] bg-[#08121f] text-slate-300 hover:border-slate-700 hover:bg-[#0a1829]"
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex size-6 items-center justify-center rounded-lg text-xs font-bold ${isSelected
                                ? "bg-emerald-500 text-slate-950"
                                : "bg-[#162238] text-slate-400"
                              }`}
                          >
                            {isSelected ? <Check className="size-3.5 stroke-[3]" /> : <Plus className="size-3.5" />}
                          </div>
                          <span className="text-xs sm:text-sm font-bold">{skillName}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* What-If: Explore a Different Occupation */}
            <div className="rounded-2xl border border-[#1b2844] bg-[#0c1322] p-7 sm:p-8 lg:p-9 shadow-xl">
              <div className="pb-5 border-b border-[#1b2844]">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  WHAT-IF: EXPLORE A DIFFERENT OCCUPATION
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Type an occupation to see your Route Fit score for it, compared against {currentRoute.title}.
                </p>
              </div>

              <div className="mt-5 flex items-center gap-2.5">
                <input
                  type="text"
                  value={whatifOccupation}
                  onChange={(e) => setWhatifOccupation(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleRunWhatIf();
                    }
                  }}
                  placeholder="e.g. Data Analyst"
                  disabled={whatifLoading}
                  className="flex-1 rounded-xl border border-[#1b2844] bg-[#070b14] px-4 py-3 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={handleRunWhatIf}
                  disabled={whatifLoading || !whatifOccupation.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-xs sm:text-sm font-bold text-slate-950 hover:bg-emerald-400 transition-colors disabled:opacity-50 shrink-0"
                >
                  {whatifLoading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  Reroute
                </button>
              </div>

              {whatifError && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-red-400">
                  <AlertCircle className="size-3.5" /> {whatifError}
                </p>
              )}

              {whatifResult && (
                <div className="mt-6 flex flex-col gap-5">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      {whatifResult.whatif_route.title.toUpperCase()}
                    </span>
                    <div className="mt-2 flex items-baseline gap-3">
                      <span className="font-display text-3xl sm:text-4xl font-black text-white">
                        {whatifScore.toFixed(2)}%
                      </span>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs sm:text-sm font-bold ${Number(whatifDelta) >= 0
                            ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-400"
                            : "border-red-500/40 bg-red-500/20 text-red-400"
                          }`}
                      >
                        {Number(whatifDelta) >= 0 ? "↑" : "↓"} {Math.abs(Number(whatifDelta)).toFixed(1)}% vs your best route
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      Your best route ({currentRoute.title}): <span className="text-slate-300 font-semibold">{baseScore.toFixed(1)}%</span>
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                      Matched skills
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {whatifResult.whatif_route.matched_skills.length === 0 ? (
                        <span className="text-xs text-slate-500">None</span>
                      ) : (
                        whatifResult.whatif_route.matched_skills.map((s) => (
                          <span
                            key={s}
                            className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400"
                          >
                            {s}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                      Missing skills
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {whatifResult.whatif_route.missing_skills.length === 0 ? (
                        <span className="text-xs text-slate-500">None — full coverage</span>
                      ) : (
                        whatifResult.whatif_route.missing_skills.map((s) => (
                          <span
                            key={s}
                            className="rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400"
                          >
                            {s}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {whatifResult.skill_gaps.length > 0 && (
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                        Skill gaps to close (ranked by demand)
                      </span>
                      <div className="flex flex-col gap-2">
                        {whatifResult.skill_gaps.map((gap, i) => (
                          <div
                            key={gap.skill_id}
                            className="flex items-center justify-between rounded-lg border border-[#1b2844] bg-[#08121f] px-3.5 py-2.5"
                          >
                            <span className="text-xs sm:text-sm font-semibold text-slate-200">
                              {i + 1}. {gap.skill_name}
                            </span>
                            <span className="text-[11px] font-bold text-slate-400">
                              demand {gap.demand_score.toFixed(1)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: CRO AI Mentor Chat (5 cols) */}
          <div className="lg:col-span-5 flex flex-col rounded-2xl border border-[#1b2844] bg-[#0c1322] p-7 sm:p-8 lg:p-9 shadow-xl">

            {/* Chat Header */}
            <div className="flex items-center gap-3.5 pb-5 border-b border-[#1b2844]">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Bot className="size-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">CRO Career Oracle</h2>
                <p className="text-xs text-slate-400">Grounded in your live Route Fit breakdown</p>
              </div>
            </div>

            {/* Chat Messages Container */}
            <div className="mt-5 flex flex-col gap-3.5 max-h-80 overflow-y-auto pr-1">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col rounded-xl p-3.5 text-xs sm:text-sm leading-relaxed ${msg.sender === "cro"
                      ? "border border-emerald-500/30 bg-[#081a13] text-slate-200"
                      : "border border-[#1b2844] bg-[#111b2e] text-white self-end max-w-[90%]"
                    }`}
                >
                  {msg.sender === "cro" && (
                    <span className="text-[11px] font-bold text-emerald-400 mb-1.5 flex items-center gap-1.5">
                      <Bot className="size-3.5" /> CRO
                    </span>
                  )}
                  {msg.text}
                </div>
              ))}
              {chatLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-400 self-start">
                  <Loader2 className="size-3.5 animate-spin" /> CRO is thinking…
                </div>
              )}
            </div>

            {/* Quick Preset Prompts */}
            <div className="mt-5 pt-4 border-t border-[#1b2844]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2.5">
                SUGGESTED QUESTIONS
              </span>
              <div className="flex flex-col gap-2">
                {PRESET_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    disabled={chatLoading}
                    onClick={() => handleSendChat(q)}
                    className="text-left rounded-xl bg-[#08121f] border border-[#1b2844] p-2.5 text-xs text-slate-300 hover:border-emerald-500/40 hover:text-white transition-colors disabled:opacity-50"
                  >
                    💬 {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Box */}
            <div className="mt-5 flex items-center gap-2.5">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSendChat();
                  }
                }}
                placeholder="Ask CRO anything about this route..."
                disabled={chatLoading}
                className="flex-1 rounded-xl border border-[#1b2844] bg-[#070b14] px-4 py-3 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => handleSendChat()}
                disabled={chatLoading}
                className="flex size-11 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors shrink-0 shadow-md disabled:opacity-50"
              >
                <Send className="size-4" />
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
