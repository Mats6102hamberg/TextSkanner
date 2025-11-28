"use client";

import { useState } from "react";

import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { scanDiaryPage } from "@/services/apiClient";

export default function DagbokPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [resultText, setResultText] = useState("");
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
      subtitle="Gör handskrivna eller tryckta dagbokssidor till redigerbar text. Perfekt för minnesböcker, journaling eller terapi."
    >
      <section className="grid gap-6 md:grid-cols-[1.2fr,0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Så funkar det</CardTitle>
            <CardDescription>Ladda upp en bild eller PDF så tolkar OCR-motorn texten åt dig.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-[#4B5563]">
            <ol className="space-y-2">
              <li>1. Fotografera eller skanna en dagbokssida.</li>
              <li>2. Ladda upp filen nedan och starta skanningen.</li>
              <li>3. Redigera resultatet direkt eller skicka vidare till Minnesbok.</li>
            </ol>
            <div className="space-y-2">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(event) => {
                  const selected = event.target.files?.[0] ?? null;
                  setFile(selected);
                  setResultText("");
                  setError(null);
                }}
                className="w-full rounded-lg border border-[#CBD5DF] bg-white px-3 py-2 text-sm file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-[#1E4A7A] file:px-4 file:py-2 file:text-white"
              />
              {file && <p className="text-xs text-[#6B7280]">Vald fil: {file.name}</p>}
            </div>
            <Button onClick={handleScan} disabled={isScanning} size="md">
              {isScanning ? "Skannar..." : "Skanna dagbokssida"}
            </Button>
            {error && <p className="text-sm font-semibold text-[#B42318]">{error}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tips innan du skannar</CardTitle>
            <CardDescription>Maximera träffsäkerheten.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-[#4B5563]">
            <p>• Använd dagsljus eller en lampa för att undvika skuggor.</p>
            <p>• Se till att hela sidan syns och att texten är rak.</p>
            <p>• Har du flera sidor? Skanna dem i tur och ordning och klistra in i Minnesbok.</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Resultat</CardTitle>
            <CardDescription>Redigera direkt i fältet eller kopiera texten vidare.</CardDescription>
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
            <CardDescription>Koppla dagbokstexten till nästa modul.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-[#4B5563]">
            <p>• Skicka texten till Språkverktyget för att förenkla eller översätta.</p>
            <p>• Lägg in texten i Minnesbok för att få kapitel och struktur.</p>
            <p>• Exportera texten som backup innan du kastar originalet.</p>
          </CardContent>
        </Card>
      </section>
    </PageShell>
  );
}
