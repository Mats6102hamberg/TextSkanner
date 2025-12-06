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
    keyPoints
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

export async function scanDiaryPage(file: File): Promise<{ text: string }> {
  const formData = new FormData();
  formData.append("file", file);

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api/ocr`, {
      method: "POST",
      body: formData
    });
  } catch (err) {
    throw new Error("Kunde inte nå servern. Är backend igång på port 3001?");
  }

  if (!res.ok) {
    throw new Error(`OCR-motorn svarade med fel (status ${res.status}).`);
  }

  return res.json();
}
