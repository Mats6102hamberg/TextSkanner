"use client";

import { useState, type FC } from "react";

import type { AnalyzeMode, ContractAnalysisSummaryResult, SavedContractSummary } from "@/types/contracts";

interface ContractAnalyzerPanelProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  error: string | null;
  onErrorChange: (message: string | null) => void;
  onAnalyze: (file: File, mode: AnalyzeMode) => Promise<ContractAnalysisSummaryResult>;
  savedContracts?: SavedContractSummary[];
}

export const ContractAnalyzerPanel: FC<ContractAnalyzerPanelProps> = ({
  file,
  onFileChange,
  error,
  onErrorChange,
  onAnalyze,
  savedContracts = []
}) => {
  const [mode, setMode] = useState<AnalyzeMode>("quick");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ContractAnalysisSummaryResult | null>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    onFileChange(nextFile);
    setAnalysisResult(null);
    onErrorChange(null);
  }

  async function handleAnalyzeClick() {
    if (!file) {
      onErrorChange("Välj ett avtal eller dokument först.");
      return;
    }
    onErrorChange(null);
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const result = await onAnalyze(file, mode);
      setAnalysisResult(result);
    } catch (err) {
      console.error(err);
      onErrorChange("Kunde inte analysera avtalet. Försök igen strax.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-4xl px-4 py-8 space-y-10">
        <section className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-900">
            Avtalskollen – ladda upp ett avtal för analys
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            Här kan du skanna ett avtal eller dokument och få en tydlig genomgång av innehåll, riskpunkter,
            sammanfattning och viktiga paragrafer. Du kan välja mellan att bara göra en snabbkoll (inget sparas)
            eller att spara dokumentet i portalen så du kan återvända senare.
          </p>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm border border-slate-200 space-y-5">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-900">📄 Ladda upp ett avtal eller dokument</h2>
            <p className="text-sm text-slate-600">
              Välj ett avtal i PDF- eller textformat och klicka på <span className="font-medium">Analysera avtal</span>.
              Du får sedan en sammanfattning, riskbedömning och tolkning av nyckelvillkor.
            </p>
            <p className="text-xs text-slate-500">
              💡 Du kan nu ladda in ett avtal. Välj fil → klicka Analysera → välj om dokumentet ska sparas eller inte.
            </p>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Välj fil</label>
              <input
                type="file"
                accept=".pdf,.txt,.doc,.docx"
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700 cursor-pointer"
              />
              {file && (
                <p className="text-xs text-slate-500">
                  Vald fil: <span className="font-medium">{file.name}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-800">Hur vill du använda avtalet?</p>
              <p className="text-xs text-slate-500">🔐 All skanning är lokal till sessionen tills du själv väljer att spara.</p>

              <div className="mt-2 grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setMode("quick")}
                  className={`rounded-lg border px-4 py-3 text-left text-sm ${
                    mode === "quick" ? "border-blue-600 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="font-semibold">Snabbkoll – sparas inte</div>
                  <p className="mt-1 text-xs text-slate-600">
                    Avtalet används bara för denna analys och lagras inte i portalen. Perfekt för känsliga dokument.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setMode("save")}
                  className={`rounded-lg border px-4 py-3 text-left text-sm ${
                    mode === "save" ? "border-blue-600 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="font-semibold">Spara i portalen</div>
                  <p className="mt-1 text-xs text-slate-600">
                    Avtalet lagras så att du kan återkomma, köra ny analys och jämföra versioner.
                  </p>
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</p>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleAnalyzeClick}
                disabled={!file || isAnalyzing}
                className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isAnalyzing ? "Analyserar..." : "Analysera avtal"}
              </button>
              <p className="text-xs text-slate-500">
                {mode === "quick"
                  ? "Läget är just nu: Snabbkoll (avtalet sparas inte)."
                  : "Läget är just nu: Spara i portalen."}
              </p>
            </div>
          </div>
        </section>

        {analysisResult && (
          <section className="rounded-xl bg-white p-6 shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Analysklar! 🎉</h2>
            <p className="text-sm text-slate-600">
              Här är din avtalsgenomgång med sammanfattning, riskpunkter och viktiga delar att vara uppmärksam på.
            </p>

            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Sammanfattning</h3>
                <p className="mt-1 text-sm text-slate-700 whitespace-pre-line">{analysisResult.summary}</p>
              </div>

              {analysisResult.risks?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Riskpunkter</h3>
                  <ul className="mt-1 list-disc pl-5 text-sm text-slate-700 space-y-1">
                    {analysisResult.risks.map((risk, idx) => (
                      <li key={idx}>{risk}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysisResult.keyPoints?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Viktiga delar att notera</h3>
                  <ul className="mt-1 list-disc pl-5 text-sm text-slate-700 space-y-1">
                    {analysisResult.keyPoints.map((pt, idx) => (
                      <li key={idx}>{pt}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-2 text-sm text-slate-700">
              <span>👇 Vad vill du göra med dokumentet?</span>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <span className="font-medium">Spara avtalet i portalen</span> – om läget är satt till <em>Spara</em>.
                </li>
                <li>
                  <span className="font-medium">Behåll endast snabbkollen</span> – avtalet raderas när du lämnar sidan om du inte sparar det.
                </li>
              </ul>
            </div>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">📁 Sparade avtal</h2>
          <p className="text-sm text-slate-600">
            Här ligger dokument du valt att spara efter analys. Du kan när som helst öppna dem, göra ny analys eller ta bort dem.
          </p>

          {savedContracts.length === 0 ? (
            <p className="text-sm text-slate-500">
              Inga sparade avtal ännu. Välj läget <span className="font-medium">Spara i portalen</span> när du analyserar ett avtal för att bygga upp ditt arkiv.
            </p>
          ) : (
            <ul className="space-y-2">
              {savedContracts.map((contract) => (
                <li
                  key={contract.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm"
                >
                  <div>
                    <div className="font-medium text-slate-800">{contract.name}</div>
                    <div className="text-xs text-slate-500">Analyserat: {contract.analyzedAt}</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded-md border border-slate-200 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50">
                      Öppna avtal
                    </button>
                    <button className="rounded-md border border-slate-200 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50">
                      Ny analys
                    </button>
                    <button className="rounded-md border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50">
                      Ta bort
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
};
