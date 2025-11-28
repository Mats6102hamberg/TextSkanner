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

type DemoChapter = {
  title: string;
  summary: string;
};

export default function MinnesbokPage() {
  const [text, setText] = useState("");
  const [chapters, setChapters] = useState<DemoChapter[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  function handleGenerate() {
    if (!text.trim()) {
      setChapters([]);
      return;
    }

    setIsGenerating(true);

    const sentences = text.split(/[\.\n]+/).filter((sentence) => sentence.trim().length > 0);
    const chunkSize = Math.max(1, Math.ceil(sentences.length / 4));
    const demoChapters: DemoChapter[] = [];

    for (let i = 0; i < sentences.length; i += chunkSize) {
      const chunk = sentences.slice(i, i + chunkSize).join(". ").trim();
      if (!chunk) continue;
      demoChapters.push({
        title: `Kapitel ${demoChapters.length + 1}`,
        summary: chunk.slice(0, 220) + (chunk.length > 220 ? "..." : "")
      });
    }

    setChapters(demoChapters);
    setIsGenerating(false);
  }

  return (
    <PageShell
      title="Minnesbokgenerering"
      subtitle="Klistra in dagboksanteckningar eller texter och låt verktyget föreslå kapitel. Perfekt för livsberättelser eller projekt du vill spara."
    >
      <section className="grid gap-8 md:grid-cols-[2fr,1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Klistra in din text</CardTitle>
            <CardDescription>Lägg in några stycken – verktyget delar upp dem i kapitel.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-[#4B5563]">
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Skriv eller klistra in text här. Det kan vara anteckningar från olika år, reseberättelser, viktiga minnen..."
              className="min-h-[220px] w-full rounded-2xl border border-[#D0D6DB] bg-white px-3 py-2 text-sm text-[#111111] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4A90E2]"
            />
            <p className="text-xs text-[#6B7280]">Tips: du kan senare koppla hit text direkt från Dagboksskannern.</p>
            <Button onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? "Skapar kapitel..." : "Skapa kapitelstruktur (demo)"}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Förslag på kapitel och avsnitt</CardTitle>
              <CardDescription>Visas när du kört demoknappen.</CardDescription>
            </CardHeader>
            <CardContent>
              {chapters.length === 0 ? (
                <p className="text-sm text-[#4B5563]">
                  När du har klistrat in text och klickat på <span className="font-medium">Skapa kapitelstruktur</span> visas ett första utkast här. Varje kapitel får en rubrik och kort sammanfattning.
                </p>
              ) : (
                <ol className="list-decimal space-y-3 pl-5 text-sm text-[#111111]">
                  {chapters.map((chapter, index) => (
                    <li key={index} className="space-y-1">
                      <div className="font-semibold">{chapter.title}</div>
                      <p className="text-xs text-[#6B7280]">{chapter.summary}</p>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Exempel på användning</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-[#4B5563]">
                <li>• Stressdagbok – se vad som återkommer i din vardag.</li>
                <li>• Tacksamhetsdagbok – förstärk det som fungerar bra.</li>
                <li>• Terapidagbok – ta med dig mönster in i samtal.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Nästa steg</CardTitle>
            <CardDescription>Så tar du kapitelutkastet vidare.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-[#4B5563]">
            <p>• Lägg in kapitlen i Minnesbok-modulen när AI-stödet är klart.</p>
            <p>• Exportera texten till PDF eller dela med familjen.</p>
            <p>• Kombinera med bilder, scannade kort och ljud om du vill.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Planerad funktionalitet</CardTitle>
            <CardDescription>Vad som byggs härnäst.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-[#4B5563]">
            <p>• AI som föreslår kapitelrubriker med tidslinje.</p>
            <p>• Mallar för "År för år", "Relationer" eller "Resor".</p>
            <p>• Export till tryckfärdig PDF direkt från plattformen.</p>
          </CardContent>
        </Card>
      </section>
    </PageShell>
  );
}
