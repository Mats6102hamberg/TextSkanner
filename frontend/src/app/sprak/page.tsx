"use client";

import { useState } from "react";

import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { processLanguage, type LanguageMode } from "@/services/apiClient";

const MODES: { mode: LanguageMode; label: string; description: string }[] = [
  { mode: "simplify", label: "Förenkla text", description: "Gör texten lättare att förstå" },
  { mode: "summarize", label: "Sammanfatta", description: "Plocka ut det viktigaste" },
  { mode: "translate_en", label: "Översätt till engelska", description: "Få en enkel engelsk version" }
];

export default function SprakPage() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [mode, setMode] = useState<LanguageMode>("simplify");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleProcess(selectedMode: LanguageMode) {
    if (!inputText.trim()) {
      setError("Skriv in text först.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setMode(selectedMode);
      setOutputText("");

      const response = await processLanguage(selectedMode, inputText.trim());
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
      title="Språk & översättning"
      subtitle="Klistra in text, välj en språkåtgärd och få ett tydligt resultat som du kan dela eller bearbeta vidare."
    >
      <section className="grid gap-6 md:grid-cols-[1.3fr,0.7fr]">
        <Card>
          <CardHeader>
            <CardTitle>Börja här</CardTitle>
            <CardDescription>Klistra in din text och välj en åtgärd.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-[#4B5563]">
            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-[#111111]" htmlFor="language-input">
                  Inmatningsfält
                </label>
                <span className="text-xs text-[#6B7280]">Max ~3 000 tecken</span>
              </div>
              <textarea
                id="language-input"
                value={inputText}
                onChange={(event) => setInputText(event.target.value)}
                placeholder="Skriv eller klistra in texten du vill förenkla, sammanfatta eller översätta..."
                className="mt-2 min-h-[220px] w-full rounded-2xl border border-[#E2E6EB] bg-[#F9FAFB] px-4 py-3 text-sm text-[#111111] focus:border-[#4A90E2] focus:outline-none focus:ring-2 focus:ring-[#4A90E2]/30"
              />
              <p className="mt-2 text-xs text-[#6B7280]">Tips: du kan även klistra in text direkt från Dagboksskannern eller Avtalskollen.</p>
              {error === "Skriv in text först." && <p className="text-sm font-medium text-[#B42318]">Klistra in text innan du väljer åtgärd.</p>}
            </div>

            <div className="space-y-3">
              {MODES.map((option) => (
                <Button
                  key={option.mode}
                  type="button"
                  size="lg"
                  variant={mode === option.mode ? "primary" : "secondary"}
                  disabled={isLoading}
                  className="w-full justify-between"
                  onClick={() => handleProcess(option.mode)}
                >
                  <span>
                    {option.label}
                    <span className="block text-xs font-normal text-[#E2E6EB] sm:inline sm:pl-2 sm:text-[0.7rem]">
                      {option.description}
                    </span>
                  </span>
                  {mode === option.mode && !isLoading && <span className="text-xs font-semibold">Aktiv</span>}
                </Button>
              ))}
            </div>

            {error && error !== "Skriv in text först." && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">Något gick fel, försök igen.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Snabbtips</CardTitle>
            <CardDescription>Så får du mer nytta av språkverktyget.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-[#4B5563]">
            <p>• Förenkla myndighetsbrev innan du skickar dem till familjer eller klienter.</p>
            <p>• Sammanfatta mötesanteckningar och mejla som punktlista.</p>
            <p>• Översätt korta textstycken till enkel engelska när det behövs.</p>
            <p className="text-xs text-[#6B7280]">Koppla ihop texten med Minnesbok eller Avtalskollen när du vill återanvända resultatet.</p>
          </CardContent>
        </Card>
      </section>

      <section className="rounded-3xl border border-[#E2E6EB] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#6B7280]">Resultat</p>
            <h3 className="text-2xl font-semibold text-[#111111]">{isLoading ? "Arbetar..." : "Bearbetad text"}</h3>
          </div>
          {mode && (
            <span className="rounded-full bg-[#EEF2F7] px-3 py-1 text-xs font-medium text-[#1E4A7A]">
              {mode === "simplify" && "Förenklad"}
              {mode === "summarize" && "Sammanfattad"}
              {mode === "translate_en" && "Engelsk version"}
            </span>
          )}
        </div>
        <pre className="mt-4 min-h-[220px] whitespace-pre-wrap rounded-2xl border border-[#E2E6EB] bg-[#F9FAFB] p-4 text-sm text-[#111111]">
          {outputText || (isLoading ? "Bearbetar texten..." : "Resultatet visas här när du valt en åtgärd.")}
        </pre>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Börja använda direkt</CardTitle>
            <CardDescription>Tre snabba arbetssätt.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-[#4B5563]">
            <p>1. Kopiera text från Dagboksskannern och förenkla till vardagsspråk.</p>
            <p>2. Sätt ihop mötesanteckningar till en kort sammanfattning.</p>
            <p>3. Översätt en mall till engelska för klienter eller kollegor.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Håll ihop flödet</CardTitle>
            <CardDescription>Kombinera språkverktyget med andra moduler.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-[#4B5563]">
            <p>• Skicka resultatet till Minnesbok för att bygga kapitel.</p>
            <p>• Lägg till språkförklaringar i Avtalskollen innan du delar.</p>
            <p>• Exportera texten som backup och återanvänd i dokument eller mejl.</p>
          </CardContent>
        </Card>
      </section>
    </PageShell>
  );
}
