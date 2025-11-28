"use client";

import { useState } from "react";

import { scanDiaryPage } from "@/services/apiClient";

export default function DagbokPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [resultText, setResultText] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleScan() {
    if (!file) {
      setError("Välj en bild eller PDF först.");
      return;
    }

    try {
      setIsScanning(true);
      setError(null);
      setResultText("");

      const response = await scanDiaryPage(file);
      const text = response?.text ?? "";

      if (!text) {
        throw new Error("OCR gav inget textresultat.");
      }

      setResultText(text);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Något gick fel";
      setError(message);
    } finally {
      setIsScanning(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto space-y-6 max-w-3xl">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">📄 Dagboksskanner</h1>
          <p className="text-sm text-slate-600">
            Skanna handskrivna sidor och gör dem till text. Perfekt för dagböcker, minnen och berättelser. Texten kan sparas eller
            skickas vidare till Minnesboks-generatorn.
          </p>
        </header>

        <section className="space-y-4 rounded-xl border bg-white p-6 shadow-sm">
          <div className="space-y-2">
            <p className="text-sm text-slate-600">👉 Ladda upp en bild eller PDF för att konvertera dagbokstext.</p>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(event) => {
                const selected = event.target.files?.[0] ?? null;
                setFile(selected);
                setResultText("");
                setError(null);
              }}
              className="rounded-md text-sm file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-white"
            />
            {file && <p className="text-xs text-slate-500">Vald fil: {file.name}</p>}
          </div>

          <button
            type="button"
            onClick={handleScan}
            disabled={isScanning}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isScanning ? "Skannar..." : "Skanna dagbokssida"}
          </button>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800" htmlFor="scan-result">
              OCR-resultat
            </label>
            <textarea
              id="scan-result"
              value={resultText}
              onChange={(event) => setResultText(event.target.value)}
              placeholder="Här visas texten från din senaste skanning."
              className="h-60 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-200"
            />
          </div>
        </section>
      </div>
    </main>
  );
}
