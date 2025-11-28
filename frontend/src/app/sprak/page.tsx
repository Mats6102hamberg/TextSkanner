"use client";

import { useState } from "react";

import { processLanguage, type LanguageMode } from "@/services/apiClient";

const MODES: { mode: LanguageMode; label: string; description: string }[] = [
  { mode: "simplify", label: "Förenkla text", description: "Gör texten lättare att förstå" },
  { mode: "summarize", label: "Sammanfatta", description: "Plocka ut det viktigaste" },
  { mode: "translate_en", label: "Översätt till engelska", description: "Få en enkel engelsk version" }
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
    <main className="min-h-screen bg-[#f8fafc] px-6 py-12">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-3 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Textskanner V2</p>
          <h1 className="text-4xl font-bold text-slate-900">🌍 Språk & översättning</h1>
          <p className="text-base text-slate-600">
            Klistra in text, välj en språkförbättring och låt assistenten förenkla, sammanfatta eller översätta åt dig.
          </p>
        </header>

        <section className="grid gap-6 rounded-3xl bg-white p-6 shadow-[0_20px_50px_-25px_rgba(15,23,42,0.2)] md:grid-cols-2">
          <div className="flex flex-col space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-800" htmlFor="language-input">
                  Klistra in texten här
                </label>
                <span className="text-xs text-slate-400">Max ~3 000 tecken</span>
              </div>
              <textarea
                id="language-input"
                value={inputText}
                onChange={(event) => setInputText(event.target.value)}
                placeholder="Skriv eller klistra in stycket du vill bearbeta..."
                className="min-h-[260px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <p className="text-xs text-slate-500">Tips: efter bearbetningen kan du föra över texten till Minnesbok eller andra moduler.</p>
            {error === "Skriv in text först." && (
              <p className="text-sm font-medium text-rose-500">Klistra in lite text innan du väljer en åtgärd.</p>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Välj åtgärd</h2>
            <div className="space-y-3">
              {MODES.map((option) => (
                <button
                  key={option.mode}
                  type="button"
                  onClick={() => handleProcess(option.mode)}
                  disabled={isLoading}
                  className={`w-full rounded-2xl border px-5 py-4 text-left transition hover:-translate-y-1 hover:shadow-lg ${
                    mode === option.mode
                      ? "border-blue-600 bg-blue-50 shadow-inner"
                      : "border-slate-200 bg-white"
                  } ${isLoading ? "cursor-not-allowed opacity-70" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-base font-semibold text-slate-900">{option.label}</p>
                      <p className="text-xs text-slate-500">{option.description}</p>
                    </div>
                    {mode === option.mode && <span className="text-xs font-semibold text-blue-600">Aktiv</span>}
                  </div>
                </button>
              ))}
            </div>
            {error && error !== "Skriv in text först." && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                Något gick fel, försök igen.
              </div>
            )}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-800">Snabbtips</p>
              • Förenkla långa mejl innan du svarar.<br />• Sammanfatta mötesanteckningar.<br />• Översätt textutdrag till engelska.
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Resultat</p>
              <h3 className="text-2xl font-semibold text-slate-900">{isLoading ? "Arbetar..." : "Bearbetad text"}</h3>
            </div>
            {mode && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {mode === "simplify" && "Förenklad"}
                {mode === "summarize" && "Sammanfattad"}
                {mode === "translate_en" && "Engelsk version"}
              </span>
            )}
          </div>
          <pre className="mt-4 min-h-[220px] whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900">
            {outputText || (isLoading ? "Bearbetar texten..." : "Resultatet visas här när du valt en åtgärd.")}
          </pre>
        </section>
      </div>
    </main>
  );
}
