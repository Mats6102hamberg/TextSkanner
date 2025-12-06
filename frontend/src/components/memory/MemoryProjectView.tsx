"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useMemoryProject } from "@/hooks/useMemoryStorage";
import type { MemoryBook, MemoryChapter, MemoryEntry } from "@/lib/memory/types";

interface Props {
  id: string;
}

export function MemoryProjectView({ id }: Props) {
  const { project, saveBook } = useMemoryProject(id);
  const [localBook, setLocalBook] = useState<MemoryBook | null>(null);
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    if (project && !localBook) {
      setLocalBook(project.book);
    }
  }, [project, localBook]);

  if (!project && !localBook) {
    return (
      <section className="mx-auto max-w-5xl p-6">
        <p className="text-sm text-gray-600">Laddar minnesprojekt…</p>
      </section>
    );
  }

  if (!project && localBook === null) {
    return (
      <section className="mx-auto max-w-5xl p-6">
        <p className="text-sm text-red-600">Kunde inte hitta detta minnesprojekt i webbläsaren.</p>
        <Link href="/minnen" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
          Tillbaka till mina minnesprojekt
        </Link>
      </section>
    );
  }

  if (!localBook) {
    return null;
  }

  const chapters = localBook.chapters;
  const selectedChapter = chapters[selectedChapterIndex];

  function updateChapter(index: number, updater: (chapter: MemoryChapter) => MemoryChapter) {
    setLocalBook((prev) => {
      if (!prev) return prev;
      const newChapters = [...prev.chapters];
      newChapters[index] = updater(newChapters[index]);
      return { ...prev, chapters: newChapters };
    });
  }

  function updateEntry(
    chapterIndex: number,
    entryIndex: number,
    updater: (entry: MemoryEntry) => MemoryEntry
  ) {
    updateChapter(chapterIndex, (chapter) => {
      const newEntries = [...chapter.entries];
      newEntries[entryIndex] = updater(newEntries[entryIndex]);
      return { ...chapter, entries: newEntries };
    });
  }

  async function handleSave() {
    if (!localBook) return;
    setSaving(true);
    setSavedMessage(null);
    try {
      await saveBook(localBook);
      setSavedMessage("Ändringarna är sparade.");
      setTimeout(() => setSavedMessage(null), 2500);
    } finally {
      setSaving(false);
    }
  }

  async function handleGeneratePdf() {
    if (!localBook || !project) return;
    setPdfLoading(true);
    setPdfError(null);

    try {
      await saveBook(localBook);

      const res = await fetch("/api/memory/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          book: localBook,
          meta: {
            title: project.title,
            personName: project.personName,
            timeSpan: project.timeSpan,
          },
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`PDF-API svarade ${res.status}: ${text}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      const safeTitle =
        project.title?.replace(/[^\w\d-_]+/g, "_").slice(0, 50) || "minnesbok";
      a.download = `${safeTitle}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("[memory-ui] PDF-fel:", err);
      setPdfError(err?.message ?? "Något gick fel när PDF:en skulle skapas.");
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-4 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-gray-500">
            <Link href="/minnen" className="hover:underline">
              &larr; Till mina minnesprojekt
            </Link>
          </p>
          <h1 className="text-2xl font-semibold">{project?.title}</h1>
          <p className="text-xs text-gray-500">
            {project?.personName && <span>{project.personName} · </span>}
            {project?.timeSpan && <span>{project.timeSpan} · </span>}
            <span>{project?.mode}</span>
          </p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            {savedMessage && (
              <span className="text-xs text-green-600">{savedMessage}</span>
            )}
            {pdfError && (
              <span className="text-xs text-red-600 max-w-xs text-right">
                {pdfError}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving || pdfLoading}
              className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
            >
              {saving ? "Sparar…" : "Spara ändringar"}
            </button>
            <button
              onClick={handleGeneratePdf}
              disabled={pdfLoading || !localBook}
              className="rounded-xl border bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {pdfLoading ? "Skapar PDF…" : "Skapa PDF"}
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-4 md:flex-row">
        <aside className="md:w-1/4">
          <div className="rounded-2xl border bg-white p-3 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold">Kapitel</h2>
            <ul className="space-y-1 text-sm">
              {chapters.map((ch, idx) => {
                const isActive = idx === selectedChapterIndex;
                return (
                  <li key={idx}>
                    <button
                      type="button"
                      onClick={() => setSelectedChapterIndex(idx)}
                      className={[
                        "flex w-full items-center justify-between rounded-xl px-2 py-1 text-left",
                        isActive ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50",
                      ].join(" ")}
                    >
                      <span className="line-clamp-1">{ch.title || `Kapitel ${idx + 1}`}</span>
                      <span className="text-[11px] text-gray-400">{ch.entries.length} avsnitt</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        <main className="md:w-3/4">
          <div className="space-y-4 rounded-2xl border bg-white p-4 shadow-sm">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-600">Kapiteltitel</label>
              <input
                type="text"
                value={selectedChapter.title}
                onChange={(e) =>
                  updateChapter(selectedChapterIndex, (ch) => ({
                    ...ch,
                    title: e.target.value,
                  }))
                }
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />

              <label className="mt-3 block text-xs font-semibold text-gray-600">
                Sammanfattning (2–3 meningar)
              </label>
              <textarea
                value={selectedChapter.summary ?? ""}
                onChange={(e) =>
                  updateChapter(selectedChapterIndex, (ch) => ({
                    ...ch,
                    summary: e.target.value,
                  }))
                }
                rows={3}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <hr className="my-2" />

            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Texter i kapitlet</h3>
              {selectedChapter.entries.map((entry, entryIndex) => (
                <div key={entryIndex} className="space-y-2 rounded-2xl border bg-gray-50 p-3">
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span>
                      {entry.date || "Odaterad"} · {entry.sourceId ? `Källa: ${entry.sourceId}` : "Okänd källa"}
                    </span>
                  </div>

                  {entry.rawText && (
                    <details className="text-[11px] text-gray-500">
                      <summary className="cursor-pointer select-none">Visa ursprunglig text</summary>
                      <p className="mt-1 whitespace-pre-wrap">{entry.rawText}</p>
                    </details>
                  )}

                  <label className="block text-[11px] font-semibold text-gray-600">Text i boken</label>
                  <textarea
                    value={entry.bookText}
                    onChange={(e) =>
                      updateEntry(selectedChapterIndex, entryIndex, (en) => ({ ...en, bookText: e.target.value }))
                    }
                    rows={6}
                    className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}

              {selectedChapter.entries.length === 0 && (
                <p className="text-xs text-gray-500">Det finns inga texter i detta kapitel ännu.</p>
              )}
            </div>
          </div>
        </main>
      </div>
    </section>
  );
}
