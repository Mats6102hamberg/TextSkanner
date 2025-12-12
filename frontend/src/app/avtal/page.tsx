"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { AlertCircle, CheckCircle, FileText, FileWarning, Info, Loader2, Upload } from "lucide-react";

import { PageShell } from "@/components/layout/PageShell";
import { analyzeContract } from "@/services/apiClient";
import type {
  AnalyzeMode,
  ContractAnalysisSummaryResult
} from "@/types/contracts";

type ProsperoSubmissionStatus = "idle" | "sending" | "sent" | "error";

type ModeOptionKey = "summary" | "risk" | "clarity" | "party_balance" | "mask";

type ModeState = Record<ModeOptionKey, boolean>;

const MODE_OPTIONS: { key: ModeOptionKey; label: string; description: string }[] = [
  { key: "summary", label: "Sammanfattning", description: "Överblick över hela avtalet" },
  { key: "risk", label: "Risker", description: "Tydliga varningsflaggor" },
  { key: "clarity", label: "Otydliga punkter", description: "Sektioner som bör förtydligas" },
  { key: "party_balance", label: "Vem gynnas?", description: "Balans mellan parterna" },
  { key: "mask", label: "Maskeringsförslag", description: "Personuppgifter att dölja" }
];

export default function AvtalPage() {
  const [result, setResult] = useState<ContractAnalysisSummaryResult | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [contractText, setContractText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [prosperoConsent, setProsperoConsent] = useState(false);
  const [prosperoStatus, setProsperoStatus] = useState<ProsperoSubmissionStatus>("idle");
  const [prosperoError, setProsperoError] = useState<string | null>(null);
  const [mode, setMode] = useState<AnalyzeMode>("quick");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [modeSelections, setModeSelections] = useState<ModeState>(() =>
    MODE_OPTIONS.reduce((acc, option) => {
      acc[option.key] = true;
      return acc;
    }, {} as ModeState)
  );

  const selectedModeCount = useMemo(
    () => Object.values(modeSelections).filter(Boolean).length,
    [modeSelections]
  );

  const fileLabel = useMemo(() => {
    if (!file) return "Ingen fil vald ännu";
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
    return `${file.name} · ${sizeInMb} MB`;
  }, [file]);

  const trimmedContractText = contractText.trim();
  const hasTextInput = trimmedContractText.length > 0;
  const hasFileInput = Boolean(file);
  const shouldWarnTextPriority = hasTextInput && hasFileInput;

  function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    setFile(nextFile);
    setError(null);
    setResult(null);
  }

  function toggleModeSelection(key: ModeOptionKey) {
    setModeSelections((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  }

  async function handleAnalyze(file: File, selectedMode: AnalyzeMode, options?: { sourceText?: string }) {
    setResult(null);
    setDocumentId(null);
    setProsperoConsent(false);
    setProsperoStatus("idle");
    setProsperoError(null);
    const analysis = await analyzeContract(file, selectedMode);
    setResult({
      ...analysis,
      originalText: options?.sourceText ?? analysis.originalText
    });
    setDocumentId(globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`);
    return {
      summary: analysis.summary,
      risks: analysis.risks ?? [],
      keyPoints: analysis.keyPoints ?? []
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatusNotice(null);

    const trimmed = contractText.trim();
    const hasText = trimmed.length > 0;
    const hasFile = Boolean(file);

    if (!hasText && !hasFile) {
      setError("Ladda upp en fil eller klistra in avtalstext innan du analyserar.");
      return;
    }

    const analysisFile = hasText
      ? new File([trimmed], "inmatad-avtalstext.txt", {
          type: "text/plain"
        })
      : (file as File);

    setIsAnalyzing(true);
    try {
      await handleAnalyze(analysisFile, mode, { sourceText: hasText ? trimmed : undefined });
      if (hasText && hasFile) {
        setStatusNotice("Texten prioriterades före filen. Filen används endast som backup.");
      }
    } catch (err) {
      console.error(err);
      setStatusNotice("Text ej helt tydlig – vi visar allt vi kunde tolka.");
      const fallbackSummary =
        "Analysen kunde inte tolka hela dokumentet. Text ej helt tydlig – komplettera gärna manuellt.";
      setResult({
        summary: fallbackSummary,
        risks: [],
        keyPoints: [],
        notes: "text ej helt tydlig",
        originalText: hasText ? trimmed : undefined
      });
      setDocumentId(globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`);
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleSendToProspero() {
    if (!result) {
      setProsperoError("Ingen analys att skicka.");
      return;
    }
    if (!documentId) {
      setProsperoError("Dokumentet saknar id. Kör om analysen och försök igen.");
      return;
    }
    if (!prosperoConsent) {
      setProsperoError("Godkänn delningen innan du skickar.");
      return;
    }

    setProsperoStatus("sending");
    setProsperoError(null);

    try {
      const res = await fetch("/api/prospero/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, analysis: result })
      });

      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error ?? "Misslyckades att skicka avtalet.");
      }

      setProsperoStatus("sent");
    } catch (err) {
      console.error("Skicka till Prospero misslyckades", err);
      setProsperoStatus("error");
      setProsperoError(
        err instanceof Error ? err.message : "Något gick fel vid exporten."
      );
    }
  }

  return (
    <PageShell
      title="Avtalskollen"
      subtitle="Ladda upp ett avtal eller dokument och få risknivåer, sammanfattningar och rekommendationer som är enkla att dela."
    >
      <section className="bg-gray-50 py-10 sm:py-12">
        <div className="mx-auto max-w-6xl space-y-10 px-4">
          <div className="space-y-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">
              Textscanner · Avtalsanalys
            </p>
            <h1 className="text-4xl font-bold text-gray-900">Få kontroll på avtalen på några minuter</h1>
            <p className="text-lg text-gray-600">
              Ladda upp PDF, text eller bilder, få en pedagogisk genomgång och dela tryggt till Prospero.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <form
              onSubmit={handleSubmit}
              className="space-y-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100"
            >
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-gray-900">1. Klistra in avtalstext</h2>
                <p className="text-sm text-gray-600">Texten skickas direkt till analysen och prioriteras om både text och fil finns.</p>
              </div>
              <label className="block rounded-2xl border border-[#e5e5e5] bg-white p-4">
                <span className="text-sm font-semibold text-gray-900">Klistra in hela avtalet här</span>
                <textarea
                  value={contractText}
                  onChange={(event) => setContractText(event.target.value)}
                  className="mt-3 w-full min-h-[300px] rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                  placeholder="Klistra in hela avtalet här…"
                />
                <span className="mt-3 block text-xs text-gray-500">Vi OCR-tolkar automatiskt om text saknas i originalet.</span>
              </label>

              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-gray-900">2. Ladda upp fil (valfritt)</h2>
                <p className="text-sm text-gray-600">
                  Stöd för PDF, Word, TXT, JPG, PNG och fler. Alla dokument OCR-behandlas automatiskt innan analysen.
                </p>
              </div>
              <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 text-center hover:border-indigo-400">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow">
                  <Upload className="h-6 w-6 text-indigo-600" />
                </div>
                <p className="text-sm font-medium text-gray-800">Dra in filen här eller klicka för att välja</p>
                <p className="text-xs text-gray-500">PDF · DOC · DOCX · TXT · JPG · PNG (max 10 MB)</p>
                <label
                  htmlFor="contract-file"
                  className="mt-4 inline-flex cursor-pointer rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500"
                >
                  Välj fil
                  <input
                    id="contract-file"
                    type="file"
                    accept="application/pdf,text/plain,image/*,.doc,.docx"
                    className="sr-only"
                    onChange={handleFileInput}
                  />
                </label>
                <p className="mt-3 text-xs text-gray-500">{fileLabel}</p>
              </div>

              {shouldWarnTextPriority && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  <Info className="h-4 w-4" />
                  Texten prioriteras när både text och fil finns. Filen används endast om texten saknas.
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Analysera</h3>
                  <span className="text-xs text-gray-500">
                    {selectedModeCount} av {MODE_OPTIONS.length} valda
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {MODE_OPTIONS.map((option) => (
                    <label
                      key={option.key}
                      className="flex items-start gap-3 rounded-xl border border-gray-200 p-3 text-sm text-gray-800 hover:border-indigo-400"
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        checked={modeSelections[option.key]}
                        onChange={() => toggleModeSelection(option.key)}
                      />
                      <span>
                        <span className="block font-semibold">{option.label}</span>
                        <span className="text-xs text-gray-500">{option.description}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-900">Välj arbetssätt</p>
                <div className="grid grid-cols-2 gap-3">
                  {(["quick", "save"] as AnalyzeMode[]).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setMode(value)}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                        mode === value
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {value === "quick" ? "Snabbkoll" : "Spara i portalen"}
                      <span className="mt-1 block text-xs font-normal text-gray-500">
                        {value === "quick"
                          ? "Analysen sparas inte – perfekt för känsliga dokument."
                          : "Bygg ett arkiv och följ avtal över tid."}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-gray-200 p-4">
                <label className="flex items-start gap-3 text-sm text-gray-800">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    checked={prosperoConsent}
                    onChange={(event) => setProsperoConsent(event.target.checked)}
                  />
                  <span>
                    <span className="font-semibold">Dela strukturerad data till Prospero</span>
                    <span className="mt-1 block text-xs text-gray-500">
                      Endast extraherade fält delas (inte hela avtalet). Krävs för att kunna skicka analysen senare.
                    </span>
                  </span>
                </label>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              {statusNotice && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  <Info className="h-4 w-4" />
                  {statusNotice}
                </div>
              )}

              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={isAnalyzing || (!hasTextInput && !hasFileInput)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyserar avtalet
                    </>
                  ) : (
                    <>Analysera {hasTextInput ? "text" : hasFileInput ? "fil" : "avtal"}</>
                  )}
                </button>
                <p className="text-xs text-gray-500">Analysen tar vanligtvis under 30 sekunder.</p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <h3 className="flex items-center text-sm font-semibold text-gray-900">
                  <Info className="mr-2 h-4 w-4 text-gray-500" /> Så funkar Avtalskollen
                </h3>
                <ul className="mt-3 space-y-2 text-xs text-gray-600">
                  <li>• Ladda upp filen och välj lägena ovan.</li>
                  <li>• Klicka på Analysera för att få sammanfattning, risker och nyckelpunkter.</li>
                  <li>• Godkänn delningen om du vill skicka resultatet till Prospero.</li>
                </ul>
              </div>
            </form>

            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              {isAnalyzing ? (
                <div className="flex h-full flex-col items-center justify-center space-y-4 py-12 text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                  <p className="text-sm text-gray-600">Vi läser igenom avtalet och sammanställer analysen...</p>
                </div>
              ) : result ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                      <CheckCircle className="h-7 w-7 text-emerald-600" />
                    </div>
                    <h2 className="mt-3 text-2xl font-semibold text-gray-900">Analysklar! 🎯</h2>
                    <p className="text-sm text-gray-500">Här är höjdpunkterna från AI-genomgången.</p>
                  </div>

                  <section className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-900">Sammanfattning</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{result.summary}</p>
                  </section>

                  {result.keyPoints?.length ? (
                    <section className="space-y-2">
                      <h3 className="text-sm font-semibold text-gray-900">Viktiga punkter</h3>
                      <ul className="space-y-1 pl-4 text-sm text-gray-700">
                        {result.keyPoints.map((point, index) => (
                          <li key={`point-${index}`} className="list-disc">
                            {point}
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}

                  {result.risks?.length ? (
                    <section className="space-y-3">
                      <h3 className="text-sm font-semibold text-gray-900">Risker att bevaka</h3>
                      <ul className="space-y-2">
                        {result.risks.map((risk, index) => (
                          <li key={`risk-${index}`} className="flex items-start gap-2 rounded-xl bg-red-50/60 p-3 text-sm text-red-700">
                            <FileWarning className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                            <span>{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}

                  {result.notes && (
                    <section className="space-y-2">
                      <h3 className="text-sm font-semibold text-gray-900">Övriga noteringar</h3>
                      <p className="text-sm text-gray-700">{result.notes}</p>
                    </section>
                  )}

                  {result.finance && (
                    <section className="space-y-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
                      <h3 className="font-semibold">Ekonomiska nycklar</h3>
                      <dl className="mt-2 space-y-1 text-emerald-800">
                        <div className="flex justify-between gap-4">
                          <dt className="text-emerald-700">Namn</dt>
                          <dd className="font-medium">{result.finance.name}</dd>
                        </div>
                        {typeof result.finance.fixedMonthlyCost === "number" && (
                          <div className="flex justify-between gap-4">
                            <dt className="text-emerald-700">Månadskostnad</dt>
                            <dd className="font-medium">{result.finance.fixedMonthlyCost} kr/mån</dd>
                          </div>
                        )}
                        {typeof result.finance.bindingMonths === "number" && (
                          <div className="flex justify-between gap-4">
                            <dt className="text-emerald-700">Bindningstid</dt>
                            <dd className="font-medium">{result.finance.bindingMonths} månader</dd>
                          </div>
                        )}
                        {typeof result.finance.upfrontFee === "number" && (
                          <div className="flex justify-between gap-4">
                            <dt className="text-emerald-700">Startavgift</dt>
                            <dd className="font-medium">{result.finance.upfrontFee} kr</dd>
                          </div>
                        )}
                      </dl>
                    </section>
                  )}

                  <section className="rounded-2xl border border-gray-200 p-4">
                    {prosperoStatus === "sent" ? (
                      <div className="flex items-start gap-3 text-sm text-emerald-700">
                        <CheckCircle className="mt-0.5 h-5 w-5 text-emerald-600" />
                        <div>
                          <p className="font-semibold">✅ Avtalet har delats till Prospero</p>
                          <p className="text-gray-600">Du hittar analysen under "Mina avtal" nästa gång du loggar in.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 text-sm text-gray-700">
                        <p className="font-semibold">Vill du spara analysen i Prospero?</p>
                        <p className="text-gray-600">
                          {prosperoConsent
                            ? "Klicka på knappen nedan så sparas avtalet i ditt bibliotek."
                            : "Godkänn delningen i vänsterpanelen för att aktivera delning."}
                        </p>
                        {prosperoError && <p className="text-sm text-red-600">{prosperoError}</p>}
                        <button
                          type="button"
                          onClick={handleSendToProspero}
                          disabled={!result || !prosperoConsent || prosperoStatus === "sending" || !documentId}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
                        >
                          {prosperoStatus === "sending" ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Skickar...
                            </>
                          ) : (
                            "Skicka analysen till Prospero"
                          )}
                        </button>
                      </div>
                    )}
                  </section>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center space-y-4 py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
                    <FileText className="h-8 w-8 text-indigo-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Din analys visas här</h3>
                  <p className="text-sm text-gray-600">
                    Ladda upp ett avtal i vänsterkolumnen för att se sammanfattning, risker och nyckelpunkter.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
