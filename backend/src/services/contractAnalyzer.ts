import type { ContractAnalysisResult } from "../shared/types/contracts";
import { callLLMForContractAnalysis } from "./llmAdapter";

const MIN_TEXT_LENGTH = 50;
const MAX_TEXT_LENGTH = 40000;

export async function analyzeContractText(
  rawText: string,
  language?: string
): Promise<ContractAnalysisResult> {
  if (typeof rawText !== "string") {
    throw new Error("rawText måste vara en sträng");
  }

  const normalized = rawText
    .replace(/[\r\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (!normalized) {
    throw new Error("rawText får inte vara tomt");
  }

  if (normalized.length < MIN_TEXT_LENGTH) {
    throw new Error("rawText är för kort för meningsfull analys");
  }

  if (normalized.length > MAX_TEXT_LENGTH) {
    throw new Error("rawText är för långt – korta ner texten");
  }

  const effectiveLanguage = language?.trim() || "auto";

  return await callLLMForContractAnalysis(normalized, effectiveLanguage);
}
