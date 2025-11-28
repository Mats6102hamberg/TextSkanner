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

  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-3">
          <div className="text-sm uppercase tracking-[0.3em] text-slate-400">Textskanner V2</div>
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Avtalskollen</h1>
            <p className="mt-2 text-base text-slate-600">
              Ladda upp ett avtal eller dokument och få en tydlig genomgång av innehåll, riskpunkter och viktiga villkor. Välj
              mellan snabbkoll utan sparning eller att spara avtalet i portalen.
            </p>
          </div>
          <p className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600">
            <span>🔐</span>
            Inga dokument sparas automatiskt – du väljer själv om något ska sparas.
          </p>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_20px_45px_-30px_rgba(15,23,42,0.4)] sm:p-6">
          <ContractAnalyzerPanel onAnalyze={handleAnalyze} savedContracts={[]} />
        </section>
      </div>
    </main>
  );
}
