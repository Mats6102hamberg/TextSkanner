"use client";

import { FormEvent, useState } from "react";

type DiaryMode = "original" | "readable" | "story";

interface DiaryResultData {
  text: string;
  summary?: string;
  simpleExplanation?: string;
  warnings?: string[];
}

interface ApiResponse {
  ok: boolean;
  data?: DiaryResultData;
  error?: string;
}

const LANGUAGE_OPTIONS = [
  { label: "Svenska", value: "sv" },
  { label: "Engelska", value: "en" },
  { label: "Franska", value: "fr" },
  { label: "Tyska", value: "de" },
  { label: "Spanska", value: "es" }
];

export default function DiaryScannerPage() {
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("sv");
  const [mode, setMode] = useState<DiaryMode>("readable");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DiaryResultData | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmed = text.trim();
    if (!trimmed) {
      setError("Klistra in dagbokstext först.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const payload = {
        text: trimmed,
        language: language || "sv",
        mode
      };

      const response = await fetch("/api/textscanner/diary/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.ok || !data.data) {
        throw new Error(data.error || "Kunde inte bearbeta dagbokstexten.");
      }

      setResult(data.data);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Ett oväntat fel uppstod vid bearbetningen."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
          Dagboksscanner
        </p>
        <h1 className="text-3xl font-semibold">Digitalisera och förädla dagbokstext</h1>
        <p className="text-sm text-gray-600">
          Klistra in dagbokstext, så hjälper Textscanner dig att rätta OCR-fel och göra
          texten läsbar, skriva om den i en mer berättande form och bevara dagboken som
          digital text. <strong>OBS:</strong> Texten kan förädlas språkligt men innehållet
          ändras inte i sak.
        </p>
      </header>

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <label className="text-sm font-medium">Klistra in dagbokstext</label>
            <textarea
              className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm shadow-sm focus:border-indigo-500 focus:bg-white focus:outline-none"
              rows={12}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Skriv eller klistra in en dagbokssida..."
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Språk
              <select
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none"
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <p className="text-sm font-medium">Bearbetningsläge</p>
              <div className="mt-2 space-y-2 rounded-xl border border-slate-200 p-3 text-sm">
                <label className="flex gap-2">
                  <input
                    type="radio"
                    name="mode"
                    value="original"
                    checked={mode === "original"}
                    onChange={() => setMode("original")}
                  />
                  Original (behåll, rätta OCR)
                </label>
                <label className="flex gap-2">
                  <input
                    type="radio"
                    name="mode"
                    value="readable"
                    checked={mode === "readable"}
                    onChange={() => setMode("readable")}
                  />
                  Läsbar text (gör det lättare att läsa)
                </label>
                <label className="flex gap-2">
                  <input
                    type="radio"
                    name="mode"
                    value="story"
                    checked={mode === "story"}
                    onChange={() => setMode("story")}
                  />
                  Berättelse (mer roman-känsla)
                </label>
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            {loading ? "Bearbetar dagbokstext..." : "Bearbeta dagbokstext"}
          </button>
        </form>

        <DiaryResult result={result} loading={loading} />
      </div>
    </div>
  );
}

function DiaryResult({
  result,
  loading
}: {
  result: DiaryResultData | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-gray-600 shadow-sm">
        Bearbetar dagbokstext…
      </section>
    );
  }

  if (!result) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-gray-500 shadow-sm">
        Klistra in dagbokstext och klicka på “Bearbeta dagbokstext” för att se resultatet här.
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {result.summary && (
        <ResultBlock title="Kort sammanfattning" content={result.summary} />
      )}
      {result.simpleExplanation && (
        <ResultBlock title="Förklaring" content={result.simpleExplanation} />
      )}

      <div className="rounded-xl bg-slate-50 p-4">
        <h2 className="text-base font-semibold">Bearbetad text</h2>
        <p className="mt-2 whitespace-pre-line text-sm text-gray-800">{result.text}</p>
      </div>

      {result.warnings?.length ? (
        <div className="rounded-xl bg-amber-50 p-4 text-sm">
          <h3 className="font-semibold text-amber-800">Varningar</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-amber-900">
            {result.warnings.map((warning, index) => (
              <li key={`warning-${index}`}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function ResultBlock({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-gray-800">{content}</p>
    </div>
  );
}
