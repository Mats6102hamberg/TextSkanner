"use client";

import { useState } from "react";

type DemoChapter = {
  title: string;
  summary: string;
};

export default function MinnesbokPage() {
  const [text, setText] = useState("");
  const [chapters, setChapters] = useState<DemoChapter[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  function handleGenerate() {
    if (!text.trim()) {
      setChapters([]);
      return;
    }

    setIsGenerating(true);

    const sentences = text.split(/[\.\n]+/).filter((sentence) => sentence.trim().length > 0);
    const chunkSize = Math.max(1, Math.ceil(sentences.length / 4));
    const demoChapters: DemoChapter[] = [];

    for (let i = 0; i < sentences.length; i += chunkSize) {
      const chunk = sentences.slice(i, i + chunkSize).join(". ").trim();
      if (!chunk) continue;
      demoChapters.push({
        title: `Kapitel ${demoChapters.length + 1}`,
        summary: chunk.slice(0, 220) + (chunk.length > 220 ? "..." : "")
      });
    }

    setChapters(demoChapters);
    setIsGenerating(false);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-3">
          <h1 className="flex items-center gap-2 text-3xl font-bold text-slate-900 md:text-4xl">
            <span>📚</span>
            <span>Minnesbokgenerering</span>
          </h1>
          <p className="max-w-3xl text-sm text-slate-600 md:text-base">
            Här kan du förbereda en minnesbok genom att klistra in dagboksanteckningar eller texter. Verktyget skapar en första
            enkel kapitelstruktur som du senare kan finslipa och exportera till PDF eller tryck.
          </p>
          <p className="text-xs text-slate-500">Detta är en demo-version – i nästa steg kopplas AI som gör smartare kapitelindelning och färdiga bokutkast.</p>
        </header>

        <section className="grid items-start gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-800">
                Klistra in dina dagboksanteckningar eller minnestext
              </label>
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Skriv eller klistra in text här. Det kan vara anteckningar från olika år, reseberättelser, viktiga minnen..."
                className="min-h-[220px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-500">Tips: du kan senare koppla hit text direkt från Dagboksskannern.</p>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isGenerating ? "Skapar kapitel..." : "Skapa kapitelstruktur (demo)"}
            </button>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-800">Förslag på kapitel och avsnitt</h2>

            <div className="min-h-[220px] rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              {chapters.length === 0 ? (
                <p className="text-sm text-slate-500">
                  När du har klistrat in text och klickat på <span className="font-medium">Skapa kapitelstruktur</span> visas ett första utkast här. Varje kapitel
                  får en rubrik och kort sammanfattning.
                </p>
              ) : (
                <ol className="list-decimal space-y-3 pl-5 text-sm text-slate-800">
                  {chapters.map((chapter, index) => (
                    <li key={index} className="space-y-1">
                      <div className="font-semibold">{chapter.title}</div>
                      <p className="text-xs text-slate-600">{chapter.summary}</p>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <p className="text-xs text-slate-500">
              Nästa steg: lägga till funktion för att spara, redigera och exportera minnesboken som PDF eller tryckoriginal.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
