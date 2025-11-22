"use client";

import React from "react";
import { useDiaryEntries } from "@/features/diary/hooks/useDiaryEntries";
import type { DiaryEntry } from "@/types/diary";
import { deleteDiaryEntry } from "@/services/diaryApi";

type DiaryListProps = {
  entries?: DiaryEntry[];
  initialEntries?: DiaryEntry[];
};

export function DiaryList({ entries: externalEntries, initialEntries }: DiaryListProps) {
  const { entries, loading, error, setEntries } = useDiaryEntries(
    externalEntries ?? initialEntries
  );

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

  if (!entries.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Inga dagboksinlägg ännu. Skanna något och spara för att se historiken här.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <article
          key={entry.id}
          className="rounded-lg border border-border bg-card p-3 text-sm"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <p className="font-medium">{formatDate(entry.createdAt)}</p>
              <p className="whitespace-pre-wrap text-xs text-muted-foreground">
                {entry.originalText}
              </p>
              {entry.translatedText && (
                <p className="mt-1 whitespace-pre-wrap text-xs">
                  <span className="font-semibold">Svensk version:</span>{" "}
                  {entry.translatedText}
                </p>
              )}
            </div>

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
