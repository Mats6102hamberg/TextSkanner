import type {
  FamilyMagic,
  MemoryBook,
  MemoryMode,
  MemorySourceEntry,
} from "./types";

async function postJson<T>(url: string, payload: unknown, fallbackMessage: string): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || fallbackMessage);
  }

  return res.json() as Promise<T>;
}

export async function generateMemoryBook(
  entries: MemorySourceEntry[],
  mode: MemoryMode = "structured",
): Promise<MemoryBook> {
  if (!entries.length) {
    throw new Error("Minst ett dagboksdokument krävs för att skapa en minnesbok.");
  }

  return postJson<MemoryBook>("/api/memory/structure", { entries, mode }, "Kunde inte generera minnesbok.");
}

export async function generateFamilyMagic(entries: MemorySourceEntry[]): Promise<FamilyMagic> {
  if (!entries.length) {
    throw new Error("Minst ett dagboksdokument krävs för släktmagi.");
  }

  return postJson<FamilyMagic>("/api/memory/family-magic", { entries }, "Kunde inte skapa släktmagi.");
}
