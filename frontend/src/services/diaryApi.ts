import { z } from "zod";
import { type DiaryEntry } from "@/types/diary";

const rawDiaryEntrySchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  text: z.string().nullable().optional(),
  originalText: z.string().nullable().optional(),
  translatedText: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional()
});

type RawDiaryEntry = z.infer<typeof rawDiaryEntrySchema>;

const rawDiaryEntriesSchema = z.array(rawDiaryEntrySchema);

export async function getDiaryEntries(): Promise<DiaryEntry[]> {
  const res = await fetch("/api/diary", { cache: "no-store" });

  if (!res.ok) {
    throw new Error("Kunde inte hämta dagboksinlägg");
  }

  const data = await res.json();
  const parsed = rawDiaryEntriesSchema.parse(data);

  return parsed.map((entry: RawDiaryEntry) => ({
    id: entry.id,
    createdAt: entry.createdAt,
    originalText: entry.originalText ?? entry.text ?? "",
    translatedText: entry.translatedText ?? null,
    imageUrl: entry.imageUrl ?? null
  }));
}

export async function deleteDiaryEntry(id: string) {
  const res = await fetch(`/api/diary/${id}`, {
    method: "DELETE"
  });

  if (!res.ok) {
    throw new Error("Misslyckades att ta bort dagboksinlägg");
  }
}
