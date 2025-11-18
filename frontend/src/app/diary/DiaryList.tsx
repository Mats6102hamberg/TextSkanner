"use client";

import { useRouter } from "next/navigation";

export type DiaryEntry = {
  id: string;
  createdAt: string;
  originalText: string;
  translatedText?: string | null;
};

type Props = {
  entries: DiaryEntry[];
  onDeleted?: (id: string) => void;
};

export function DiaryList({ entries, onDeleted }: Props) {
  const router = useRouter();

  async function handleDelete(id: string) {
    const ok = confirm("Vill du verkligen radera den här skanningen?");
    if (!ok) return;

    try {
      const res = await fetch(`/api/diary/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        alert("Kunde inte radera posten. Försök igen.");
        return;
      }

      onDeleted?.(id);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Ett fel uppstod vid raderingen.");
    }
  }

  if (entries.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        Inga sparade inlägg ännu. Skanna en dagbokssida till vänster så dyker de upp här.
      </p>
    );
  }

  return (
    <div className="space-y-3 mt-2">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="flex items-start justify-between rounded-xl border border-neutral-700 bg-neutral-900/70 p-3"
        >
          <div className="pr-3">
            <div className="text-xs text-neutral-400">
              {new Date(entry.createdAt).toLocaleString("sv-SE")}
            </div>
            <div className="text-sm font-medium mb-1">
              {entry.originalText.slice(0, 80)}
              {entry.originalText.length > 80 ? "…" : ""}
            </div>
            {entry.translatedText && (
              <div className="text-xs text-neutral-300 line-clamp-2">
                {entry.translatedText}
              </div>
            )}
          </div>

          <button
            onClick={() => handleDelete(entry.id)}
            className="ml-2 text-neutral-400 hover:text-red-400 transition"
            title="Radera den här skanningen"
          >
            🗑
          </button>
        </div>
      ))}
    </div>
  );
}
