"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuid } from "uuid";

import { useDiaryEntries } from "@/features/diary/hooks/useDiaryEntries";
import type { DiaryEntry } from "@/types/diary";
import { deleteDiaryEntry } from "@/services/diaryApi";
import { generateMemoryBook } from "@/lib/memory/client";
import { createMemoryProject } from "@/lib/memory/storage";
import type { MemorySourceEntry } from "@/lib/memory/types";

type DiaryListProps = {
  entries?: DiaryEntry[];
  initialEntries?: DiaryEntry[];
};

export function DiaryList({ entries: externalEntries, initialEntries }: DiaryListProps) {
  const { entries, loading, error, setEntries } = useDiaryEntries(
    externalEntries ?? initialEntries
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [memoryLoading, setMemoryLoading] = useState(false);
  const [memoryError, setMemoryError] = useState<string | null>(null);
  const router = useRouter();

  async function handleDelete(id: string) {
    const prev = entries;
    setEntries((current) => current.filter((entry) => entry.id !== id));

    try {
      await deleteDiaryEntry(id);
    } catch (err) {
      setEntries(prev);
      console.error(err);
      alert("Kunde inte ta bort inlägget, försök igen.");
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Laddar dagboksinlägg…</p>;
  }

  if (error) {
    return (
      <p className="text-sm text-red-500">
        Kunde inte hämta dagboksinlägg. Uppdatera sidan eller försök igen senare.
      </p>
    );
  }

  const selectedEntries = useMemo(
    () => entries.filter((entry) => selectedIds.includes(entry.id)),
    [entries, selectedIds]
  );

  async function handleCreateMemoryFromSelection() {
    setMemoryLoading(true);
    setMemoryError(null);
    try {
      if (!selectedEntries.length) {
        setMemoryError("Välj minst ett dokument.");
        return;
      }

      const entriesPayload = mapDiaryEntriesToMemoryEntries(selectedEntries);
      const book = await generateMemoryBook(entriesPayload, "structured");
      const id = uuid();
      const title =
        selectedEntries.length === 1
          ? selectedEntries[0].originalText.slice(0, 60) || "Minnesbok från dagbok"
          : `Minnesbok (${selectedEntries.length} dokument)`;

      const project = createMemoryProject({
        id,
        title,
        personName: undefined,
        timeSpan: undefined,
        mode: book.mode,
        book
      });

      setSelectedIds([]);
      router.push(`/minnen/${project.id}`);
    } catch (err) {
      console.error("[dagbok] create memory error", err);
      setMemoryError(
        err instanceof Error
          ? err.message
          : "Något gick fel när minnesboken skulle skapas."
      );
    } finally {
      setMemoryLoading(false);
    }
  }

  if (!entries.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Inga dagboksinlägg ännu. Skanna något och spara för att se historiken här.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-xs text-gray-600">
          {selectedIds.length === 0
            ? "Markera dagboksdokument som du vill bygga en minnesbok av."
            : `${selectedIds.length} dokument valda.`}
        </div>
        <button
          type="button"
          onClick={handleCreateMemoryFromSelection}
          disabled={memoryLoading || selectedIds.length === 0}
          className="rounded-xl border bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {memoryLoading ? "Skapar minnesbok…" : "Skapa minnesbok av valda"}
        </button>
      </div>
      {memoryError && <p className="text-xs text-red-600">{memoryError}</p>}

      {entries.map((entry) => (
        <article
          key={entry.id}
          className="rounded-lg border border-border bg-card p-3 text-sm"
        >
          <div className="flex items-start gap-3">
            <label className="flex flex-1 items-start gap-2 rounded-xl border bg-white p-3 shadow-sm">
              <input
                type="checkbox"
                checked={selectedIds.includes(entry.id)}
                onChange={(event) => {
                  if (event.target.checked) {
                    setSelectedIds((prev) => [...prev, entry.id]);
                  } else {
                    setSelectedIds((prev) => prev.filter((x) => x !== entry.id));
                  }
                }}
                className="mt-1 h-4 w-4 rounded border-gray-300"
              />
              <div className="flex-1">
                <div className="text-sm font-medium line-clamp-1">
                  {entry.originalText.slice(0, 80) || "Onamngivet dokument"}
                </div>
                <div className="text-[11px] text-gray-500">
                  <span>{formatDate(entry.createdAt)} · </span>
                  <span>
                    {entry.translatedText?.slice(0, 120) || entry.originalText.slice(0, 120)}
                  </span>
                </div>
              </div>
            </label>

            <button
              type="button"
              onClick={() => handleDelete(entry.id)}
              className="text-xs text-red-500 hover:text-red-600"
              aria-label="Ta bort dagboksinlägg"
            >
              🗑
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("sv-SE", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

function mapDiaryEntriesToMemoryEntries(entries: DiaryEntry[]): MemorySourceEntry[] {
  return entries.map((entry) => ({
    id: entry.id,
    text: entry.translatedText?.trim() || entry.originalText.trim() || "",
    date: entry.createdAt
  }));
}
