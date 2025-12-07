import type {
  AnalyzeMode,
  ContractAnalysisResult,
  ContractAnalysisSummaryResult
} from "@/types/contracts";

const BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";

export type LanguageMode = "simplify" | "summarize" | "translate_en";

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

function mapToSummaryResult(data: ContractAnalysisResult): ContractAnalysisSummaryResult {
  const summary =
    data?.summaries?.short ||
    data?.summaries?.medium ||
    "Ingen sammanfattning kunde genereras.";

  const risks = (data?.sections || [])
    .filter((section) => section?.riskLevel && section?.text)
    .map((section) => {
      const title = section.heading || section.category || "Sektion";
      const reason = section.riskReason ? ` – ${section.riskReason}` : "";
      return `${title}: ${section.riskLevel.toUpperCase()}${reason}`;
    });

  const keyPoints = (data?.sections || [])
    .slice(0, 5)
    .map((section) => section.text.trim())
    .filter(Boolean);

  return {
    summary,
    risks,
    keyPoints,
    finance: data?.finance ?? null
  };
}

export async function analyzeContract(
  file: File,
  mode: AnalyzeMode
): Promise<ContractAnalysisSummaryResult> {
  const form = new FormData();
  form.append("file", file);
  form.append("mode", mode);

  const res = await fetch(`${BASE_URL}/contracts/analyze`, {
    method: "POST",
    body: form
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Kunde inte analysera avtalet");
  }

  const data: ContractAnalysisResult = await res.json();
  return mapToSummaryResult(data);
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
  warnings?: string[];
  error?: string;
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

export type MemoryBookChapter = {
  title: string;
  summary: string;
  keyMoments: string[];
};

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
  files: File[]
): Promise<MemoryBookResponse> {
  if (!files.length) {
    return { ok: false, error: "Ladda upp minst en dagboksfil." };
  }

  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }

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
