"use client";

import { PageShell } from "@/components/layout/PageShell";
import { ContractAnalyzerPanel } from "@/components/ContractAnalyzerPanel";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
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
          <ContractAnalyzerPanel onAnalyze={handleAnalyze} savedContracts={[]} />
        </Card>
      </section>

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
