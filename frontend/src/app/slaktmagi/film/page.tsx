"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  generateFamilyFilm,
  type FamilyFilmPlan,
  type MemoryBookAnalysis
} from "@/services/apiClient";

const missingAnalysisMessage =
  "Ingen minnesboksanalys hittades. Gå via Minnesboken och skapa en berättelse först.";

const toneOptions = [
  { value: "ljus", label: "Ljus" },
  { value: "vemodig", label: "Vemodig" },
  { value: "lekfull", label: "Lekfull" }
];

const lengthOptions: { value: "short" | "medium" | "long"; label: string }[] = [
  { value: "short", label: "Kort (3–5 minuter)" },
  { value: "medium", label: "Mellan (5–8 minuter)" },
  { value: "long", label: "Längre (8–12 minuter)" }
];

export default function FamilyFilmPage() {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<MemoryBookAnalysis | null>(null);
  const [tone, setTone] = useState("ljus");
  const [length, setLength] = useState<"short" | "medium" | "long">("medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<FamilyFilmPlan | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("slaktmagi:analysis");
      if (stored) {
        const parsed = JSON.parse(stored) as MemoryBookAnalysis;
        setAnalysis(parsed);
        setError(null);
        return;
      }
      setError(missingAnalysisMessage);
    } catch (err) {
      console.error("Kunde inte läsa sparad analys:", err);
      setError(missingAnalysisMessage);
    }
  }, []);

  async function handleCreatePlan() {
    if (!analysis) {
      setError(missingAnalysisMessage);
      return;
    }

    setLoading(true);
    setError(null);
    setPlan(null);

    const response = await generateFamilyFilm(analysis, { tone, length });
    setLoading(false);

    if (!response.ok) {
      setError(response.error ?? "Kunde inte skapa filmplan.");
      return;
    }

    setPlan(response.plan ?? null);
  }

  async function handleCopyNarration() {
    if (!plan?.narration) return;
    if (!navigator?.clipboard) {
      setCopyState("error");
      return;
    }
    try {
      await navigator.clipboard.writeText(plan.narration);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2500);
    } catch (copyError) {
      console.error(copyError);
      setCopyState("error");
    }
  }

  return (
    <section className="mx-auto mt-10 max-w-5xl rounded-3xl border border-black/5 bg-white p-6 shadow-xl sm:p-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-rose-500">
          SläktMagi · Filmplan
        </p>
        <h1 className="text-2xl font-semibold text-gray-900">Gör film av din berättelse</h1>
        <p className="text-sm text-gray-600">
          Sidan tar Minnesbokens analys och bygger ett manus samt en scenlista för en familjefilm – redo
          att användas som storyboard eller voice-over.
        </p>
      </header>

      {error && (
        <div className="mt-6 space-y-3">
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
          {error === missingAnalysisMessage && (
            <button
              type="button"
              className="inline-flex items-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              onClick={() => router.push("/minnesbok")}
            >
              Gå till Minnesboken
            </button>
          )}
        </div>
      )}

      {analysis && (
        <div className="mt-6 space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-gray-900">{analysis.bookTitle}</h2>
            {analysis.subtitle && (
              <p className="text-sm text-gray-600">{analysis.subtitle}</p>
            )}
            <p className="mt-3 text-sm text-gray-700">{analysis.toneSummary}</p>
          </section>

          <form
            className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              handleCreatePlan();
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-gray-900">
                Ton
                <select
                  value={tone}
                  onChange={(event) => setTone(event.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  {toneOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium text-gray-900">
                Längd
                <select
                  value={length}
                  onChange={(event) => setLength(event.target.value as "short" | "medium" | "long")}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  {lengthOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {loading ? "Skapar filmplan…" : "Skapa filmplan"}
            </button>
          </form>
        </div>
      )}

      {plan && (
        <div className="mt-8 space-y-6">
          <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{plan.filmTitle}</h2>
                <p className="text-sm text-gray-600">
                  Beräknad längd: {plan.estimatedLengthMinutes} minuter
                </p>
              </div>
              {plan.warning && (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                  {plan.warning}
                </span>
              )}
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-gray-900">Manus (berättarröst)</h3>
              <button
                type="button"
                onClick={handleCopyNarration}
                className="inline-flex items-center rounded-2xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
              >
                {copyState === "copied"
                  ? "Kopierat"
                  : copyState === "error"
                    ? "Kunde inte kopiera"
                    : "Kopiera manus"}
              </button>
            </div>
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-gray-800">
              {plan.narration}
            </pre>
          </section>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="text-base font-semibold text-gray-900">Scener</h3>
            <div className="space-y-3">
              {plan.scenes.map((scene) => (
                <article
                  key={scene.index}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="text-sm font-semibold text-gray-900">
                    Scen {scene.index}: {scene.title}
                  </div>
                  <p className="mt-2 text-sm text-gray-700">{scene.description}</p>
                  <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Voice-over
                    </p>
                    <p className="mt-1 text-sm text-gray-700">{scene.voiceOver}</p>
                  </div>
                  <span className="mt-2 inline-flex rounded-full bg-slate-900/5 px-3 py-1 text-xs font-medium text-slate-700">
                    Stämning: {scene.mood}
                  </span>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
