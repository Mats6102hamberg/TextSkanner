"use client";

import { ContractAnalyzerPanel } from "@/components/ContractAnalyzerPanel";
import { analyzeContract } from "@/services/apiClient";
import type { AnalyzeMode } from "@/types/contracts";

export default function AvtalPage() {
  async function handleAnalyze(file: File, mode: AnalyzeMode) {
    const result = await analyzeContract(file, mode);
    return {
      summary: result.summary,
      risks: result.risks ?? [],
      keyPoints: result.keyPoints ?? []
    };
  }

  return <ContractAnalyzerPanel onAnalyze={handleAnalyze} savedContracts={[]} />;
}
