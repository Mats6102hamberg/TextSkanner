"use client";

import React, { useEffect, useState } from "react";

type DiaryEntry = {
  id: string;
  text: string;
  createdAt: string;
  imageUrl?: string | null;
};

type LanguageOption = {
  code: string;
  label: string;
};

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "auto", label: "Auto – försök känna av" },
  { code: "sv", label: "Svenska" },
  { code: "en", label: "Engelska" },
  { code: "fr", label: "Franska" },
  { code: "es", label: "Spanska" },
  { code: "de", label: "Tyska" },
  { code: "da", label: "Danska" },
  { code: "no", label: "Norska" },
  { code: "fi", label: "Finska" }
];

function formatDate(value: string) {
  return new Date(value).toLocaleString("sv-SE", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [ocrText, setOcrText] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>("auto");

  useEffect(() => {
    const loadEntries = async () => {
      try {
        const res = await fetch("/api/diary", { cache: "no-store" });
        if (!res.ok) return;
        const data: DiaryEntry[] = await res.json();
        setEntries(data);
      } catch (err) {
        console.error("Kunde inte ladda dagboksinlägg:", err);
      }
    };

    loadEntries();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setError(null);
    setSuccess(null);
  };

  const handleScan = async () => {
    if (!file) {
      setError("Välj en bild först.");
      return;
    }

    setIsScanning(true);
    setError(null);
    setSuccess(null);
    setOcrText("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("language", language);

      const ocrRes = await fetch("/api/ocr", {
        method: "POST",
        body: formData
      });

      if (!ocrRes.ok) {
        throw new Error("Kunde inte tolka bilden");
      }

      const ocrData = await ocrRes.json();
      const text: string = ocrData.text || ocrData.result || ocrData.content || "";

      if (!text) {
        throw new Error("Inget textresultat från OCR");
      }

      setOcrText(text);

      const saveRes = await fetch("/api/diary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          imageUrl: null
        })
      });

      if (!saveRes.ok) {
        console.error(await saveRes.text());
        setError("Texten lästes in, men kunde inte sparas i databasen.");
      } else {
        const newEntry: DiaryEntry = await saveRes.json();
        setEntries((prev) => [newEntry, ...prev]);
        setSuccess("Inlägget är sparat i din dagbok.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Något gick fel vid skanningen.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-col gap-1">
          <h1 className="text-3xl md:text-4xl font-bold">Dagboksskanner</h1>
          <p className="text-slate-400 text-sm md:text-base">
            Ladda upp en dagbokssida, låt AI läsa den och spara texten i din
            digitala dagbok.
          </p>
        </div>
      </header>

      <main className="flex-1 px-4 md:px-6 py-6">
        <div className="max-w-6xl mx-auto grid gap-6 md:grid-cols-[minmax(0,1.4fr),minmax(0,1fr)]">
          <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-lg shadow-black/40 flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
              <label className="inline-flex items-center gap-2 text-sm font-medium">
                <span className="px-3 py-2 rounded-md border border-slate-600 bg-slate-800 cursor-pointer hover:bg-slate-700">
                  Välj fil
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </span>
                <span className="text-slate-400 truncate max-w-[240px] md:max-w-[320px]">
                  {file ? file.name : "Ingen fil har valts"}
                </span>
              </label>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-300 whitespace-nowrap">Språk:</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-xs md:text-sm text-slate-100"
                >
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <option key={opt.code} value={opt.code}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleScan}
                disabled={isScanning || !file}
                className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold transition-colors"
              >
                {isScanning ? "Skannar..." : "Skanna dagbokssida"}
              </button>
            </div>

            {error && (
              <div className="rounded-md bg-red-500/10 border border-red-500/60 px-3 py-2 text-sm text-red-100">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-md bg-emerald-500/10 border border-emerald-500/60 px-3 py-2 text-sm text-emerald-100">
                {success}
              </div>
            )}

            <div className="flex-1 flex flex-col gap-2 min-h-[260px]">
              <h2 className="text-lg font-semibold">OCR-resultat</h2>
              <p className="text-xs text-slate-400">
                Texten nedan är direkt från skanningen. Du kan redigera den innan du
                kopierar eller använder den vidare.
              </p>
              <textarea
                value={ocrText}
                onChange={(e) => setOcrText(e.target.value)}
                className="mt-1 flex-1 min-h-[200px] w-full rounded-lg bg-slate-950/60 border border-slate-800 px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500/80"
                placeholder="Skanna en bild för att se texten här."
              />
            </div>
          </section>

          <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-lg shadow-black/40 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Mina dagboksinlägg</h2>
              <span className="text-xs text-slate-400">{entries.length} st sparade</span>
            </div>

            {entries.length === 0 ? (
              <p className="text-sm text-slate-400">
                Inga sparade inlägg ännu. Skanna en dagbokssida till vänster så dyker
                de upp här.
              </p>
            ) : (
              <div className="flex flex-col gap-3 max-h-[460px] overflow-y-auto pr-1">
                {entries.map((entry) => (
                  <article
                    key={entry.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-3 hover:border-indigo-500/70 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-medium text-slate-300">
                        {formatDate(entry.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-200 whitespace-pre-line">
                      {entry.text.length > 220 ? entry.text.slice(0, 220) + "…" : entry.text}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
