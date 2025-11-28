"use client";

import { useState } from "react";

import { processLanguage, type LanguageMode } from "@/services/apiClient";

const MODES: { mode: LanguageMode; label: string; description: string }[] = [
  { mode: "simplify", label: "Förenkla text", description: "Gör texten lättare att förstå" },
  { mode: "summarize", label: "Sammanfatta", description: "Plocka ut det viktigaste" },
  { mode: "translate_en", label: "Översätt till engelska", description: "Enkel engelsk version" }
];

export default function SprakPage() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [mode, setMode] = useState<LanguageMode>("simplify");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleProcess(selectedMode: LanguageMode) {
    if (!inputText.trim()) {
      setError("Skriv in text först.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setMode(selectedMode);
      setOutputText("");

      const response = await processLanguage(selectedMode, inputText.trim());
      setOutputText(response.result ?? "");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Språkanalysen misslyckades";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">🌍 Språk & översättning</h1>
          <p className="text-sm text-slate-600">
            Klistra in text, välj vad du vill göra och låt assistenten förenkla, sammanfatta eller översätta åt dig.
          </p>
        </header>

        <section className="space-y-4 rounded-xl border bg-white p-6 shadow-sm">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800" htmlFor="language-input">
              Din text
            </label>
            <textarea
              id="language-input"
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
              placeholder="Klistra in text här..."
              className="min-h-[200px] w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-200"
            />
            <p className="text-xs text-slate-500">Tips: du kan senare skicka texten vidare till Minnesboks-funktionen.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {MODES.map((option) => (
              <button
                key={option.mode}
                type="button"
                onClick={() => handleProcess(option.mode)}
                disabled={isLoading}
                className={`rounded-lg border px-4 py-3 text-left text-sm transition ${
                  mode === option.mode ? "border-blue-600 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"
                } ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                <div className="font-semibold text-slate-900">{option.label}</div>
                <p className="mt-1 text-xs text-slate-500">{option.description}</p>
              </button>
            ))}
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800" htmlFor="language-output">
              Resultat
            </label>
            <textarea
              id="language-output"
              value={outputText}
              onChange={(event) => setOutputText(event.target.value)}
              placeholder={isLoading ? "Bearbetar texten..." : "Här visas resultatet."}
              className="min-h-[180px] w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-200"
            />
          </div>
        </section>
      </div>
    </main>
  );
}
