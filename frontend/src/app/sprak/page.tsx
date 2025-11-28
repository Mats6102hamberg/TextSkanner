"use client";

import { useState } from "react";

import { PageShell } from "@/components/layout/PageShell";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { processLanguage, type LanguageMode } from "@/services/apiClient";

const MODES: { label: string; description: string; mode: LanguageMode }[] = [
  { label: "Klarspråk", description: "Gör texten enklare", mode: "simplify" },
  { label: "Sammanfatta", description: "Plocka ut det viktigaste", mode: "summarize" },
  { label: "Översätt till engelska", description: "Naturlig engelsk ton", mode: "translate_en" }
];

export default function SprakPage() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [mode, setMode] = useState<LanguageMode>("simplify");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleProcess(selectedMode?: LanguageMode) {
    const currentMode = selectedMode ?? mode;
    if (!inputText.trim()) {
      setError("Klistra in lite text först.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setMode(currentMode);
      setOutputText("");

      const response = await processLanguage(currentMode, inputText.trim());
      setOutputText(response.result ?? "");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Språkanalysen misslyckades";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <PageShell
      title="Språkverktyg"
      subtitle="Justera ton, nivå och tydlighet i dina texter. Från klarspråk till mer formellt – med stöd för olika språk på sikt."
    >
      <section className="grid gap-8 md:grid-cols-[2fr,1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Arbeta med din text</CardTitle>
            <CardDescription>Klistra in texten du vill förbättra. Välj sedan hur du vill att texten ska låta.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#374151]" htmlFor="language-input">
                  Ursprunglig text
                </label>
                <textarea
                  id="language-input"
                  value={inputText}
                  onChange={(event) => setInputText(event.target.value)}
                  className="min-h-[200px] w-full rounded-xl border border-[#D0D6DB] bg-white px-3 py-2 text-sm text-[#111111] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4A90E2]"
                  placeholder="Klistra in eller skriv din text här..."
                />
                {error === "Klistra in lite text först." && (
                  <p className="text-sm font-medium text-[#B42318]">Klistra in text innan du väljer åtgärd.</p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-[#374151]">Välj läge</span>
                  <div className="flex flex-wrap gap-2">
                    {MODES.map((option) => (
                      <Button
                        key={option.mode}
                        variant={mode === option.mode ? "primary" : "secondary"}
                        size="sm"
                        className="justify-between"
                        disabled={isLoading}
                        onClick={() => setMode(option.mode)}
                      >
                        <span className="text-left">
                          {option.label}
                          <span className="block text-xs font-normal text-[#E0E7EF]">
                            {option.description}
                          </span>
                        </span>
                        {mode === option.mode && !isLoading && <span className="text-xs font-semibold">Aktiv</span>}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-[#374151]">Språk (framtida stöd)</span>
                  <select className="rounded-xl border border-[#D0D6DB] bg-white px-3 py-2 text-sm text-[#111111] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4A90E2]">
                    <option>Svenska</option>
                    <option>Engelska</option>
                    <option>Fler språk senare…</option>
                  </select>
                </div>
              </div>

              <div>
                <Button onClick={() => handleProcess()} disabled={isLoading}>
                  {isLoading ? "Bearbetar..." : "Bearbeta text"}
                </Button>
              </div>

              {error && error !== "Klistra in lite text först." && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Förslag på förbättrad text</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-2 text-xs text-[#9CA3AF]">
                {isLoading ? "Analysen pågår..." : "Resultatet visas nedan när bearbetningen är klar."}
              </p>
              <p className="text-sm text-[#4B5563]">
                När AI-funktionen är aktiv kan du jämföra din ursprungliga text med det nya förslaget och välja det som passar bäst för
                mottagaren.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tips när du arbetar med språk</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-[#4B5563]">
                <li>• Utgå alltid från din egen röst – AI:n ger bara förslag.</li>
                <li>• Läs igenom texten högt för att höra om den känns naturlig.</li>
                <li>• Anpassa alltid ton och nivå efter den som ska läsa texten.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Bearbetad text</CardTitle>
            <CardDescription>Resultatet från senaste körningen.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="min-h-[200px] whitespace-pre-wrap rounded-2xl border border-[#E2E6EB] bg-[#F9FAFB] p-4 text-sm text-[#111111]">
              {outputText || (isLoading ? "Bearbetar texten..." : "Resultatet visas här när du bearbetat texten.")}
            </pre>
          </CardContent>
        </Card>
      </section>
    </PageShell>
  );
}
