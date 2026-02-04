import type {
  AnalyzeMode,
  ContractAnalysisSummaryResult
} from "@/types/contracts";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

export type LanguageMode = "simplify" | "summarize" | "translate_en" | "translate_de" | "translate_fr" | "translate_es";

async function handleResponse(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export async function processLanguage(
  mode: LanguageMode,
  text: string
): Promise<{ result: string }> {
  const res = await fetch(`${BASE_URL}/language/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode, text })
  });

  if (!res.ok) {
    throw new Error("Språkanalys misslyckades");
  }

  return res.json();
}

type ContractAnalyzeEnvelope = {
  ok: boolean;
  data?: ContractAnalysisSummaryResult;
  warnings?: string[];
  error?: string;
};

function isContractAnalyzeEnvelope(
  value: unknown
): value is ContractAnalyzeEnvelope {
  return (
    typeof value === "object" &&
    value !== null &&
    "ok" in value &&
    typeof (value as Record<string, unknown>).ok === "boolean"
  );
}

export async function analyzeContract(
  file: File,
  mode: AnalyzeMode,
  saveMode: "temp" | "persist" = "temp"
): Promise<ContractAnalysisSummaryResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("mode", mode);
  formData.append("saveMode", saveMode);

  let res: Response;
  try {
    res = await fetch("/api/contracts/analyze", {
      method: "POST",
      body: formData
    });
  } catch (err) {
    console.error(err);
    throw new Error("Kunde inte nå Avtalskollen. Kontrollera uppkopplingen.");
  }

  let parsed: unknown = null;
  try {
    parsed = await res.json();
  } catch {
    parsed = null;
  }

  if (!res.ok) {
    const errorMessage =
      (parsed && typeof parsed === "object" && "error" in parsed && typeof (parsed as any).error === "string"
        ? ((parsed as any).error as string)
        : "Avtalsanalysen misslyckades.");
    throw new Error(errorMessage);
  }

  if (isContractAnalyzeEnvelope(parsed)) {
    if (!parsed.ok || !parsed.data) {
      throw new Error(parsed.error ?? "Avtalsanalysen misslyckades.");
    }
    return parsed.data;
  }

  return parsed as ContractAnalysisSummaryResult;
}

export async function apiPost(path: string, body: unknown) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  return handleResponse(res);
}

export type OcrScanResponse = {
  ok?: boolean;
  rawText?: string;
  maskedText?: string;
  summary?: string | null;
  entryDate?: string;
  detectedMood?: string;
  moodScore?: number;
  warnings?: string[];
  error?: string;
};

export type DiaryEntry = {
  id: string;
  text?: string | null;
  originalText?: string | null;
  clarifiedText?: string | null;
  storyText?: string | null;
  imageUrl?: string | null;
  entryDate?: Date | null;
  detectedMood?: string | null;
  moodScore?: number | null;
  tags?: string[];
  summary?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SaveDiaryRequest = {
  text?: string;
  originalText?: string;
  clarifiedText?: string;
  storyText?: string;
  imageUrl?: string;
  entryDate?: string;
  detectedMood?: string;
  moodScore?: number;
  tags?: string[];
  summary?: string;
};

export type MaskingResultResponse = {
  ok: boolean;
  error?: string;
  rawText?: string;
  maskedText?: string;
  warning?: string | null;
};

export async function maskText(text: string): Promise<MaskingResultResponse> {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, error: "Klistra in text att maskera." };
  }

  let res: Response;
  try {
    res = await fetch("/api/mask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed })
    });
  } catch (err) {
    console.error(err);
    return {
      ok: false,
      error: "Kunde inte nå maskerings-API:t. Kontrollera uppkopplingen."
    };
  }

  let data: MaskingResultResponse;
  try {
    data = (await res.json()) as MaskingResultResponse;
    console.log("MASK API RAW RESPONSE", data);
  } catch (parseError) {
    console.error(parseError);
    return {
      ok: false,
      error: "Kunde inte tolka svaret från maskerings-API:t."
    };
  }

  if (!res.ok) {
    return {
      ok: false,
      error: data?.error ?? "Maskeringen misslyckades."
    };
  }

  if (data.ok === false) {
    return {
      ok: false,
      error: data.error ?? "Maskeringen misslyckades."
    };
  }

  if (!data.maskedText) {
    return { ok: false, error: "Maskerings-API:t svarade utan maskedText." };
  }

  return {
    ok: true,
    rawText: data.rawText ?? "",
    maskedText: data.maskedText,
    warning: data.warning ?? null
  };
}

export async function maskFile(file: File | null): Promise<MaskingResultResponse> {
  if (!file) {
    return { ok: false, error: "Välj en fil att maskera." };
  }

  const formData = new FormData();
  formData.append("file", file);

  let res: Response;
  try {
    res = await fetch("/api/mask", {
      method: "POST",
      body: formData
    });
  } catch (err) {
    console.error(err);
    return {
      ok: false,
      error: "Kunde inte nå maskerings-API:t. Kontrollera uppkopplingen."
    };
  }

  let data: MaskingResultResponse;
  try {
    data = (await res.json()) as MaskingResultResponse;
    console.log("MASK API RAW RESPONSE", data);
  } catch (parseError) {
    console.error(parseError);
    return {
      ok: false,
      error: "Kunde inte tolka svaret från maskerings-API:t."
    };
  }

  if (!res.ok) {
    return {
      ok: false,
      error: data?.error ?? "Maskeringen misslyckades."
    };
  }

  if (data.ok === false) {
    return {
      ok: false,
      error: data.error ?? "Maskeringen misslyckades."
    };
  }

  if (!data.maskedText) {
    return { ok: false, error: "Maskerings-API:t svarade utan maskedText." };
  }

  return {
    ok: true,
    rawText: data.rawText ?? "",
    maskedText: data.maskedText,
    warning: data.warning ?? null
  };
}

export async function scanDiaryPage(file: File): Promise<OcrScanResponse> {
  const formData = new FormData();
  formData.append("file", file);

  let res: Response;
  try {
    res = await fetch("/api/ocr", {
      method: "POST",
      body: formData
    });
  } catch (err) {
    throw new Error("Kunde inte nå Dagboksscannern. Försök igen om en stund.");
  }

  let data: OcrScanResponse;
  try {
    data = await res.json();
  } catch (parseError) {
    data = { ok: false, error: "Kunde inte tolka svaret från Dagboksscannern." };
  }

  if (!res.ok || data.ok === false) {
    throw new Error(
      data.error || `Dagboksscannern svarade med fel (status ${res.status}).`
    );
  }

  if (!data.rawText || !data.rawText.trim()) {
    throw new Error("OCR hittade ingen text i PDF:en.");
  }

  return data;
}

export type MemoryBookTimelineItem = {
  label: string;
  description: string;
};

export type MemoryBookPerson = {
  name: string;
  description: string;
};

export type MemoryBookAnalysis = {
  bookTitle: string;
  subtitle?: string;
  chapters: MemoryBookChapter[];
  timeline: MemoryBookTimelineItem[];
  people: MemoryBookPerson[];
  themes: string[];
  toneSummary: string;
  warning?: string | null;
};

export type MemoryBookResponse = {
  ok: boolean;
  error?: string;
  source?: "files";
  fileCount?: number;
  rawText?: string;
  maskedText?: string;
  warning?: string | null;
  analysis?: MemoryBookAnalysis;
};

export async function generateMemoryBook(
  files: File[],
  language: string = "sv"
): Promise<MemoryBookResponse> {
  if (!files.length) {
    return { ok: false, error: "Ladda upp minst en dagboksfil." };
  }

  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }
  formData.append("language", language);

  let res: Response;
  try {
    res = await fetch("/api/memory-book", {
      method: "POST",
      body: formData
    });
  } catch (err) {
    console.error(err);
    return {
      ok: false,
      error: "Kunde inte nå Minnesboken. Kontrollera uppkopplingen."
    };
  }

  let data: MemoryBookResponse;
  try {
    data = (await res.json()) as MemoryBookResponse;
  } catch (parseError) {
    console.error(parseError);
    return {
      ok: false,
      error: "Kunde inte tolka svaret från Minnesboken."
    };
  }

  if (!res.ok) {
    return {
      ok: false,
      error: data.error ?? "Minnesboken kunde inte genereras."
    };
  }

  if (!data.analysis || !data.analysis.bookTitle || !data.maskedText) {
    return {
      ok: false,
      error: "API:t svarade utan fullständig minnesboksanalys."
    };
  }

  return { ...data, ok: true };
}

export type FamilyFilmScene = {
  index: number;
  title: string;
  description: string;
  voiceOver: string;
  mood: string;
};

export type FamilyFilmPlan = {
  filmTitle: string;
  estimatedLengthMinutes: number;
  narration: string;
  scenes: FamilyFilmScene[];
  warning?: string | null;
};

export type FamilyFilmResponse = {
  ok: boolean;
  error?: string;
  plan?: FamilyFilmPlan;
};

export type FamilyRelation = {
  personName: string;
  relationLabel: string;
};

export type FamilyRelationsState = {
  centralLabel: string;
  relations: FamilyRelation[];
};

export async function generateFamilyFilm(
  analysis: MemoryBookAnalysis,
  options?: { tone?: string; length?: "short" | "medium" | "long" }
): Promise<FamilyFilmResponse> {
  if (!analysis?.bookTitle) {
    return { ok: false, error: "Ingen minnesboksanalys vald." };
  }

  let res: Response;
  try {
    res = await fetch("/api/family-film", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analysis, options })
    });
  } catch (err) {
    console.error(err);
    return {
      ok: false,
      error: "Kunde inte nå SläktMagi-filmplanen. Kontrollera uppkopplingen."
    };
  }

  let data: FamilyFilmResponse;
  try {
    data = (await res.json()) as FamilyFilmResponse;
  } catch (parseError) {
    console.error(parseError);
    return {
      ok: false,
      error: "Kunde inte tolka svaret från SläktMagi-filmplanen."
    };
  }

  if (!res.ok) {
    return {
      ok: false,
      error: data.error ?? "Filmplanen kunde inte genereras."
    };
  }

  if (!data.plan) {
    return { ok: false, error: "API:t svarade utan filmplan." };
  }

  return { ...data, ok: true };
}

export async function saveDiaryEntry(data: SaveDiaryRequest): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const res = await fetch("/api/diary/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await res.json();
    
    if (!res.ok) {
      return { ok: false, error: result.error || "Kunde inte spara dagboksinlägg." };
    }

    return { ok: true, id: result.id };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Kunde inte nå servern." };
  }
}

export async function getDiaryEntries(limit: number = 20, mood?: string): Promise<{ ok: boolean; entries?: DiaryEntry[]; error?: string }> {
  try {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (mood) params.append("mood", mood);

    const res = await fetch(`/api/diary/save?${params.toString()}`);
    const result = await res.json();

    if (!res.ok) {
      return { ok: false, error: result.error || "Kunde inte hämta dagboksinlägg." };
    }

    return { ok: true, entries: result.entries };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Kunde inte nå servern." };
  }
}

export type MemoryBookChapter = {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  tags: string[];
  sourceEntryIds: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
};

export async function createMemoryBookChapter(entryIds: string[]): Promise<{
  ok: boolean;
  chapter?: MemoryBookChapter;
  error?: string;
}> {
  try {
    const res = await fetch("/api/memorybook/chapters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entryIds })
    });

    const result = await res.json();

    if (!res.ok) {
      return { ok: false, error: result.error || "Kunde inte skapa kapitel." };
    }

    return { ok: true, chapter: result.chapter };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Kunde inte nå servern." };
  }
}

export async function getMemoryBookChapters(): Promise<{
  ok: boolean;
  chapters?: MemoryBookChapter[];
  error?: string;
}> {
  try {
    const res = await fetch("/api/memorybook/chapters");
    const result = await res.json();

    if (!res.ok) {
      return { ok: false, error: result.error || "Kunde inte hämta kapitel." };
    }

    return { ok: true, chapters: result.chapters };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Kunde inte nå servern." };
  }
}

export type FamilyPerson = {
  name: string;
  description: string;
  confidence: number;
};

export type FamilyPlace = {
  name: string;
  description: string;
  confidence: number;
};

export type FamilyDate = {
  date: string | null;
  dateText?: string;
  description: string;
  confidence: number;
};

export type FamilyEvent = {
  title: string;
  description: string;
  confidence: number;
};

export type FamilyRelationship = {
  person1: string;
  person2: string;
  type: string;
  confidence: number;
};

export type ExtractedEntities = {
  persons: FamilyPerson[];
  places: FamilyPlace[];
  dates: FamilyDate[];
  events: FamilyEvent[];
  relationships: FamilyRelationship[];
};

export async function extractFamilyEntities(entryIds: string[]): Promise<{
  ok: boolean;
  entities?: ExtractedEntities;
  error?: string;
}> {
  try {
    const res = await fetch("/api/family/extract-entities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entryIds })
    });

    const result = await res.json();

    if (!res.ok) {
      return { ok: false, error: result.error || "Kunde inte extrahera entiteter." };
    }

    return { ok: true, entities: result.entities };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Kunde inte nå servern." };
  }
}

export type FamilyEntityDraft = {
  id: string;
  sourceEntryIds: string[];
  entities: ExtractedEntities;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export async function saveFamilyDraft(entryIds: string[], entities: ExtractedEntities): Promise<{
  ok: boolean;
  id?: string;
  draft?: FamilyEntityDraft;
  error?: string;
}> {
  try {
    const res = await fetch("/api/family/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entryIds, entities })
    });

    const result = await res.json();

    if (!res.ok) {
      return { ok: false, error: result.error || "Kunde inte spara utkast." };
    }

    return { ok: true, id: result.id, draft: result.draft };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Kunde inte nå servern." };
  }
}

export async function getFamilyDrafts(): Promise<{
  ok: boolean;
  drafts?: FamilyEntityDraft[];
  error?: string;
}> {
  try {
    const res = await fetch("/api/family/drafts");
    const result = await res.json();

    if (!res.ok) {
      return { ok: false, error: result.error || "Kunde inte hämta utkast." };
    }

    return { ok: true, drafts: result.drafts };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Kunde inte nå servern." };
  }
}
