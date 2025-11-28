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
import { scanDiaryPage } from "@/services/apiClient";

export default function DagbokPage() {
  const [file, setFile] = useState<File | null>(null);
  const [resultText, setResultText] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleScan() {
    if (!file) {
      setError("Välj en bild eller PDF först.");
      return;
    }

    try {
      setIsScanning(true);
      setError(null);
      setResultText("");

      const response = await scanDiaryPage(file);
      const text = response?.text ?? "";

      if (!text) {
        throw new Error("OCR gav inget textresultat.");
      }

      setResultText(text);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Något gick fel";
      setError(message);
    } finally {
      setIsScanning(false);
    }
  }

  return (
    <PageShell
      title="Dagboksskanner"
      subtitle="Samla, strukturera och förstå dina dagbokstexter över tid. Perfekt för reflektion, personlig utveckling eller livsberättelser."
    >
      <section className="grid gap-8 md:grid-cols-[1.3fr,0.7fr]">
        <Card>
          <CardHeader>
            <CardTitle>Steg 1: Skanna dagbokssidan</CardTitle>
            <CardDescription>Ladda upp en bild eller PDF så gör OCR-motorn om den till text.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-[#4B5563]">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#111111]">Välj fil</label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null);
                  setResultText("");
                  setError(null);
                }}
                className="w-full rounded-xl border border-[#CBD5DF] bg-white px-3 py-2 text-sm file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-[#1E4A7A] file:px-4 file:py-2 file:text-white"
              />
              {file && <p className="text-xs text-[#6B7280]">Vald fil: {file.name}</p>}
            </div>

            <Button onClick={handleScan} disabled={isScanning} size="md">
              {isScanning ? "Skannar..." : "Skanna dagbokssida"}
            </Button>

            {error && <p className="text-sm font-semibold text-[#B42318]">{error}</p>}

            <p className="text-xs text-[#6B7280]">
              Tips: använd dagsljus eller en jämn belysning för bästa resultat. Du bestämmer själv vad som sparas i efterhand.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Så funkar dagboksskannern</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-[#4B5563]">
                <li>• Fotografera en sida eller exportera dagboken som PDF.</li>
                <li>• Låt systemet hitta texten och visa den för redigering.</li>
                <li>• Skicka vidare till Språkverktyget eller Minnesbok.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Exempel på användning</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-[#4B5563]">
                <li>• Stressdagbok – identifiera återkommande mönster.</li>
                <li>• Tacksamhetsbok – samla det som ger energi.</li>
                <li>• Terapidagbok – ta med utdrag till samtal.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Resultat</CardTitle>
            <CardDescription>Redigera texten direkt eller kopiera den vidare.</CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={resultText}
              onChange={(event) => setResultText(event.target.value)}
              placeholder="Här visas texten från din senaste skanning."
              className="min-h-[240px] w-full rounded-2xl border border-[#E2E6EB] bg-[#F9FAFB] px-4 py-3 text-sm text-[#111111] focus:border-[#4A90E2] focus:outline-none focus:ring-2 focus:ring-[#4A90E2]/30"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Börja härnäst</CardTitle>
            <CardDescription>Koppla texten till andra moduler.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-[#4B5563]">
            <p>• Skicka vidare till Språkverktyget för att förenkla texten.</p>
            <p>• Lägg in i Minnesbok för att skapa kapitel och struktur.</p>
            <p>• Exportera som backup innan du arkiverar originalet.</p>
          </CardContent>
        </Card>
      </section>
    </PageShell>
  );
}
