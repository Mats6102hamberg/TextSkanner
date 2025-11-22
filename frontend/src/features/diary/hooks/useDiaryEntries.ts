import { useEffect, useState } from "react";
import type { DiaryEntry } from "@/types/diary";
import { getDiaryEntries } from "@/services/diaryApi";

export function useDiaryEntries(initialEntries?: DiaryEntry[]) {
  const [entries, setEntries] = useState<DiaryEntry[]>(initialEntries ?? []);
  const [loading, setLoading] = useState(!initialEntries);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const data = await getDiaryEntries();
        if (!cancelled) {
          setEntries(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError("Kunde inte hämta dagboksinlägg");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { entries, loading, error, setEntries };
}
