"use client";

import { useState } from "react";

import { PageShell } from "@/components/layout/PageShell";
import { ContractAnalyzerPanel } from "@/components/ContractAnalyzerPanel";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { analyzeContract } from "@/services/apiClient";
import type {
  AnalyzeMode,
  ContractAnalysisSummaryResult
} from "@/types/contracts";

type ProsperoSubmissionStatus = "idle" | "sending" | "sent" | "error";

export default function AvtalPage() {
  const [result, setResult] = useState<ContractAnalysisSummaryResult | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [prosperoConsent, setProsperoConsent] = useState(false);
  const [prosperoStatus, setProsperoStatus] = useState<ProsperoSubmissionStatus>("idle");
  const [prosperoError, setProsperoError] = useState<string | null>(null);

  async function handleAnalyze(file: File, mode: AnalyzeMode) {
    setResult(null);
    setDocumentId(null);
    setProsperoConsent(false);
    setProsperoStatus("idle");
    setProsperoError(null);
    const analysis = await analyzeContract(file, mode);
    setResult(analysis);
    setDocumentId(globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`);
    return {
      summary: analysis.summary,
      risks: analysis.risks ?? [],
      keyPoints: analysis.keyPoints ?? []
    };
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
      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Så funkar analysen</CardTitle>
            <CardDescription>Tre steg till en tydlig bild av avtalet.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-[#4B5563]">
            <p>1. Välj "Snabbkoll" om du bara vill läsa – då sparas inget.</p>
            <p>2. Välj "Spara i portalen" om du behöver historik och delning.</p>
            <p>3. Läs igenom sammanfattning, risker och rekommendationer direkt i panelen.</p>
            <p className="text-xs text-[#6B7280]">Tips: lägg till en kort sammanfattning i Språkverktyget om du behöver ett enklare språk för andra.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Välj arbetssätt</CardTitle>
            <CardDescription>Snabbt läge eller lagring i portalen.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-[#4B5563]">
            <div className="rounded-2xl border border-[#E2E6EB] bg-[#F9FAFB] p-4">
              <p className="font-semibold text-[#111111]">Snabbkoll (inget sparas)</p>
              <p>Perfekt när du bara behöver en snabb genomgång innan ett samtal eller beslut.</p>
            </div>
            <div className="rounded-2xl border border-[#E2E6EB] bg-[#F9FAFB] p-4">
              <p className="font-semibold text-[#111111]">Spara i portalen</p>
              <p>Ger historik, delningslänkar och möjlighet att bygga upp ett bibliotek av avtal.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <a href="#analyzer">Starta analys</a>
              </Button>
              <Button variant="secondary" asChild>
                <a href="/foretag">Visa företagsupplägg</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="analyzer">
        <Card>
          <ContractAnalyzerPanel
            file={file}
            onFileChange={setFile}
            error={error}
            onErrorChange={setError}
            onAnalyze={handleAnalyze}
            savedContracts={[]}
          />
        </Card>
      </section>

      {result?.finance && (
        <section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-gray-900">
          <h2 className="text-sm font-semibold text-emerald-900">
            Ekonomisk översikt
          </h2>
          <dl className="mt-2 space-y-1">
            <div className="flex justify-between gap-4">
              <dt className="text-gray-600">Namn</dt>
              <dd className="font-medium">{result.finance.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-600">Kategori</dt>
              <dd className="font-medium">
                {result.finance.category === "boende"
                  ? "Boende"
                  : result.finance.category === "abonnemang"
                  ? "Abonnemang"
                  : result.finance.category === "lån"
                  ? "Lån"
                  : result.finance.category === "bil"
                  ? "Bil"
                  : "Övrigt"}
              </dd>
            </div>
            {typeof result.finance.fixedMonthlyCost === "number" && (
              <div className="flex justify-between gap-4">
                <dt className="text-gray-600">Månadskostnad</dt>
                <dd className="font-medium">
                  {result.finance.fixedMonthlyCost} kr/mån
                </dd>
              </div>
            )}
            {typeof result.finance.bindingMonths === "number" && (
              <div className="flex justify-between gap-4">
                <dt className="text-gray-600">Bindningstid</dt>
                <dd className="font-medium">
                  {result.finance.bindingMonths} månader
                </dd>
              </div>
            )}
            {typeof result.finance.upfrontFee === "number" && (
              <div className="flex justify-between gap-4">
                <dt className="text-gray-600">Startavgift</dt>
                <dd className="font-medium">
                  {result.finance.upfrontFee} kr
                </dd>
              </div>
            )}
          </dl>
        </section>
      )}

      {result && (
        <ProsperoExportPanel
          consent={prosperoConsent}
          onConsentChange={setProsperoConsent}
          status={prosperoStatus}
          onSend={handleSendToProspero}
          disabled={!documentId}
          error={prosperoError}
        />
      )}

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tips för bättre resultat</CardTitle>
            <CardDescription>Underlätta jobbet för AI:n.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-[#4B5563]">
            <p>• Se till att avtalet är läsbart – rensa bort foton med blänk eller låg upplösning.</p>
            <p>• Lägg gärna till ett kort sammanhang i beskrivningen när du sparar i portalen.</p>
            <p>• Kombinera analysen med Språkverktyget för att ta fram enklare förklaringar.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Börja med rätt avtal</CardTitle>
            <CardDescription>Exempel på vanliga användningsfall.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-[#4B5563]">
            <p>• Uppdragsbeskrivningar för familjehem eller konsulenter.</p>
            <p>• Konsultavtal där du vill se riskpunkter innan signering.</p>
            <p>• Samarbetsavtal mellan föreningar, företag eller kommuner.</p>
          </CardContent>
        </Card>
      </section>
    </PageShell>
  );
}

interface ProsperoExportPanelProps {
  consent: boolean;
  onConsentChange: (value: boolean) => void;
  status: ProsperoSubmissionStatus;
  onSend: () => void;
  disabled?: boolean;
  error: string | null;
}

function ProsperoExportPanel({
  consent,
  onConsentChange,
  status,
  onSend,
  disabled,
  error
}: ProsperoExportPanelProps) {
  const buttonLabel =
    status === "sent"
      ? "Avtalet är skickat till Prospero"
      : status === "sending"
        ? "Skickar…"
        : "Skicka avtalet till Prospero";

  const buttonDisabled =
    disabled || !consent || status === "sending" || status === "sent";

  return (
    <section className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-emerald-900">
          Dela strukturerad data till Prospero
        </h2>
        <p className="text-sm text-slate-600">
          Endast strukturerade fält – t.ex. lön, anställningsform, tjänstepension och risk-taggar –
          skickas till Prospero för planering. Själva avtalet eller råtexten lämnar aldrig
          Textscanner.
        </p>
      </div>

      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          checked={consent}
          onChange={(event) => onConsentChange(event.target.checked)}
        />
        <span>
          Jag godkänner att strukturerad avtalsdata (t.ex. lön, tjänstepension, anställningsform
          och risk-taggar) delas med Prospero för ekonomisk planering. Själva avtalet skickas inte
          vidare.
        </span>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={onSend}
        disabled={buttonDisabled}
        className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {buttonLabel}
      </button>
    </section>
  );
}
