"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { PageShell } from "@/components/layout/PageShell";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { scanDiaryPage, saveDiaryEntry, type OcrScanResponse } from "@/services/apiClient";
 
type ActiveSource = "original" | "clarified" | "story";
type TransformMode = "clarify" | "story";
type ForwardTarget = "language-tool" | "memory-book" | "pdf";

const sourceOptions: { label: string; value: ActiveSource }[] = [
  { label: "Ursprunglig text", value: "original" },
  { label: "Lättläst version", value: "clarified" },
  { label: "Story-version", value: "story" }
];

const moduleActions: { label: string; target: ForwardTarget }[] = [
  { label: "Skicka till Språkverktyget", target: "language-tool" },
  { label: "Lägg in i Minnesbok", target: "memory-book" },
  { label: "Exportera som PDF", target: "pdf" }
];

const targetLabels: Record<ForwardTarget, string> = {
  "language-tool": "Språkverktyget",
  "memory-book": "Minnesboken",
  pdf: "PDF-exporten"
};

function getMoodEmoji(mood: string): string {
  const moodEmojis: Record<string, string> = {
    glad: "😊",
    ledsen: "😢",
    stressad: "😰",
    tacksam: "🙏",
    arg: "😠",
    rädd: "😨",
    neutral: "😐",
    hoppfull: "🌟",
    ensam: "😔",
    energisk: "⚡"
  };
  return moodEmojis[mood.toLowerCase()] || "💭";
}

export default function DagbokPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<OcrScanResponse | null>(null);
  const [originalText, setOriginalText] = useState("");
  const [clarifiedText, setClarifiedText] = useState("");
  const [storyText, setStoryText] = useState("");
  const [activeSource, setActiveSource] = useState<ActiveSource>("original");
  const [isScanning, setIsScanning] = useState(false);
  const [isLoadingClarify, setIsLoadingClarify] = useState(false);
  const [isLoadingStory, setIsLoadingStory] = useState(false);
  const [isForwarding, setIsForwarding] = useState<ForwardTarget | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [forwardMessage, setForwardMessage] = useState<string | null>(null);
  const [detectedLanguage] = useState("svenska");
  const [outputLanguage, setOutputLanguage] = useState("svenska");
  const [progressMessage, setProgressMessage] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const hasOriginalText = Boolean(originalText.trim());
  const hasClarifiedText = Boolean(clarifiedText.trim());
  const hasStoryText = Boolean(storyText.trim());
  const currentText =
    activeSource === "clarified"
      ? clarifiedText
      : activeSource === "story"
        ? storyText
        : originalText;
  const hasCurrentText = Boolean(currentText.trim());
  const hasMaskedSuggestion = Boolean(
    result?.maskedText &&
      result.maskedText.trim() &&
      result.maskedText.trim() !== originalText.trim()
  );
  const hasSummary = Boolean(result?.summary && result.summary.trim());
  const hasWarnings = Boolean(result?.warnings?.length);
  const hasInsights = hasMaskedSuggestion || hasSummary || hasWarnings;

  // Cleanup preview URL när komponenten unmountas
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const resetTextLayers = () => {
    setOriginalText("");
    setClarifiedText("");
    setStoryText("");
    setActiveSource("original");
    setForwardMessage(null);
    setErrorMessage(null);
  };

  // Skapa förhandsvisning när fil väljs
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setFile(nextFile);
    setUploadError(null);
    setResult(null);
    resetTextLayers();

    // Skapa preview URL
    if (nextFile) {
      // Rensa gammal preview URL om den finns
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      const url = URL.createObjectURL(nextFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  async function handleScan() {
    if (!file) {
      setUploadError("Välj en bild eller PDF först.");
      return;
    }

    try {
      setIsScanning(true);
      setUploadError(null);
      setResult(null);
      resetTextLayers();
      setProgressMessage("Läser in fil...");

      setTimeout(() => setProgressMessage("Kör OCR med AI..."), 500);
      setTimeout(() => setProgressMessage("Extraherar text..."), 2000);

      const response = await scanDiaryPage(file);
      const text = response?.rawText ?? "";
      setOriginalText(text);
      setResult(response);
      setProgressMessage("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Något gick fel";
      setUploadError(message);
      setProgressMessage("");
    } finally {
      setIsScanning(false);
    }
  }

  async function handleTransform(mode: TransformMode) {
    if (!originalText.trim()) {
      setErrorMessage("Ladda in text med Dagboksscannern innan du använder AI-funktionerna.");
      return;
    }

    const setLoading = mode === "clarify" ? setIsLoadingClarify : setIsLoadingStory;
    setLoading(true);

    try {
      setErrorMessage(null);
      setForwardMessage(null);
      
      const modeLabel = mode === "clarify" ? "lättläst version" : "berättelse";
      setProgressMessage(`Skapar ${modeLabel} med AI...`);

      // Konvertera UI-språk till språkkod
      const languageMap: Record<string, string> = {
        "svenska": "sv",
        "engelska": "en",
        "franska": "fr",
        "spanska": "es"
      };
      const languageCode = languageMap[outputLanguage] || "sv";

      const response = await fetch("/api/dagbok/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          mode, 
          text: originalText,
          language: languageCode
        })
      });

      if (!response.ok) {
        throw new Error("AI-transformeringen misslyckades. Försök igen om en stund.");
      }

      const data = (await response.json()) as { text?: string; error?: string };

      if (!data.text) {
        throw new Error(data.error ?? "Kunde inte skapa textversionen.");
      }

      if (mode === "clarify") {
        setClarifiedText(data.text);
        setActiveSource("clarified");
      } else {
        setStoryText(data.text);
        setActiveSource("story");
      }
      setProgressMessage("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ett oväntat fel uppstod.";
      setErrorMessage(message);
      setProgressMessage("");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveDiary() {
    if (!originalText.trim()) {
      setErrorMessage("Ingen text att spara. Skanna en dagbokssida först.");
      return;
    }

    try {
      setIsSaving(true);
      setSaveMessage(null);
      setErrorMessage(null);

      const saveData = {
        originalText,
        clarifiedText: clarifiedText || undefined,
        storyText: storyText || undefined,
        text: currentText,
        summary: result?.summary || undefined,
        entryDate: result?.entryDate || undefined,
        detectedMood: result?.detectedMood || undefined,
        moodScore: result?.moodScore || undefined,
        imageUrl: previewUrl || undefined
      };

      const response = await saveDiaryEntry(saveData);

      if (!response.ok) {
        setErrorMessage(response.error || "Kunde inte spara dagboksinlägget.");
        return;
      }

      setSaveMessage("✅ Dagboksinlägg sparat!");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ett oväntat fel uppstod.";
      setErrorMessage(message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleForward(target: ForwardTarget) {
    if (!currentText.trim()) {
      setErrorMessage("Välj eller generera en textversion innan du skickar den vidare.");
      return;
    }

    try {
      setIsForwarding(target);
      setErrorMessage(null);
      setForwardMessage(null);

      const response = await fetch("/api/router/forward-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "dagbok",
          target,
          variant: activeSource,
          text: currentText.trim()
        })
      });

      if (!response.ok) {
        throw new Error("Kunde inte skicka texten vidare just nu.");
      }

      const data = (await response.json()) as { ok?: boolean; error?: string };

      if (!data.ok) {
        throw new Error(data.error ?? "Modulkopplingen misslyckades.");
      }

      setForwardMessage(`${targetLabels[target]} tar nu hand om den valda texten.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ett oväntat fel uppstod.";
      setErrorMessage(message);
    } finally {
      setIsForwarding(null);
    }
  }

  const router = useRouter();

  return (
    <PageShell
      title="Dagboksskanner"
      subtitle="Samla, strukturera och förstå dina dagbokstexter över tid. Perfekt för reflektion, personlig utveckling eller livsberättelser."
    >
      {/* Snabblänkar */}
      <div className="mb-6 flex gap-3">
        <Button onClick={() => router.push("/dagbok/historik")} variant="secondary" size="sm">
          📚 Visa historik
        </Button>
      </div>
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
                onChange={handleFileSelect}
                className="w-full rounded-xl border border-[#CBD5DF] bg-white px-3 py-2 text-sm file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-[#1E4A7A] file:px-4 file:py-2 file:text-white"
              />
              {file && <p className="text-xs text-[#6B7280]">Vald fil: {file.name}</p>}
            </div>

            {/* Förhandsvisning av inskannad bild/PDF */}
            {previewUrl && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#111111]">Förhandsvisning</p>
                <div className="rounded-xl border border-[#CBD5DF] bg-slate-50 p-3">
                  {file?.type.includes("pdf") ? (
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <svg className="h-12 w-12 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                      </svg>
                      <div>
                        <p className="font-medium">PDF-dokument</p>
                        <p className="text-xs text-slate-500">{file.name}</p>
                      </div>
                    </div>
                  ) : (
                    <img 
                      src={previewUrl} 
                      alt="Förhandsvisning av dagbokssida" 
                      className="max-h-96 w-full rounded-lg object-contain"
                    />
                  )}
                </div>
              </div>
            )}

            <Button onClick={handleScan} disabled={isScanning} size="md">
              {isScanning ? "Skannar..." : "Skanna dagbokssida"}
            </Button>

            {isScanning && progressMessage && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                  <p className="text-sm text-blue-900">{progressMessage}</p>
                </div>
              </div>
            )}

            {uploadError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {uploadError}
              </div>
            )}

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

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Språkinställningar</CardTitle>
              <CardDescription>Välj språk för AI-versionerna efter skanningen.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-700">
                <span className="font-semibold">Upptäckt språk:</span> {detectedLanguage}
              </p>
              <label className="block text-sm font-medium text-slate-800">
                Önskat språk för AI-texter
                <select
                  value={outputLanguage}
                  onChange={(event) => setOutputLanguage(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                >
                  <option value="svenska">Svenska</option>
                  <option value="engelska">Engelska</option>
                  <option value="franska">Franska</option>
                  <option value="spanska">Spanska</option>
                </select>
              </label>
              <p className="text-xs text-slate-500">
                Välj vilket språk du vill att AI-texterna (lättläst/story) ska skrivas på.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ursprunglig text</CardTitle>
              <CardDescription>
                Råtexten från din senaste skanning. {isEditing ? "Redigera texten nedan." : "Klicka 'Redigera' för att ändra."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Datum och känslor */}
              {hasOriginalText && (result?.entryDate || result?.detectedMood) && (
                <div className="flex flex-wrap gap-3 rounded-xl border border-indigo-100 bg-indigo-50 p-3">
                  {result?.entryDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-indigo-600">📅</span>
                      <span className="font-medium text-indigo-900">{new Date(result.entryDate).toLocaleDateString('sv-SE')}</span>
                    </div>
                  )}
                  {result?.detectedMood && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-lg">{getMoodEmoji(result.detectedMood)}</span>
                      <span className="font-medium text-indigo-900 capitalize">{result.detectedMood}</span>
                      {result?.moodScore !== undefined && (
                        <span className="text-xs text-indigo-600">
                          ({result.moodScore > 0 ? '+' : ''}{(result.moodScore * 100).toFixed(0)}%)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Redigerbar text */}
              <div className="max-h-[360px] overflow-auto rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-800">
                {hasOriginalText ? (
                  isEditing ? (
                    <textarea
                      value={originalText}
                      onChange={(e) => setOriginalText(e.target.value)}
                      className="min-h-[300px] w-full resize-none bg-transparent text-sm leading-relaxed focus:outline-none"
                    />
                  ) : (
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed">{originalText}</pre>
                  )
                ) : (
                  <p className="text-slate-500">Här visas texten så fort du har skannat en sida.</p>
                )}
              </div>

              {/* Redigera och Spara knappar */}
              {hasOriginalText && (
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => setIsEditing(!isEditing)}
                    size="sm"
                    variant="secondary"
                  >
                    {isEditing ? "✓ Klar" : "✏️ Redigera"}
                  </Button>
                  <Button
                    onClick={handleSaveDiary}
                    disabled={isSaving}
                    size="sm"
                    variant="primary"
                  >
                    {isSaving ? "Sparar..." : "💾 Spara dagboksinlägg"}
                  </Button>
                </div>
              )}

              {saveMessage && (
                <div className="rounded-2xl border border-green-200 bg-green-50 p-3 text-sm text-green-900">
                  {saveMessage}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => handleTransform("clarify")}
                  disabled={!hasOriginalText || isLoadingClarify}
                  size="md"
                >
                  {isLoadingClarify ? "Bearbetar..." : "Gör texten mer lättläst"}
                </Button>
                <Button
                  onClick={() => handleTransform("story")}
                  disabled={!hasOriginalText || isLoadingStory}
                  size="md"
                  variant="secondary"
                >
                  {isLoadingStory ? "Bearbetar..." : "Gör om till berättelse"}
                </Button>
              </div>

              {(isLoadingClarify || isLoadingStory) && progressMessage && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                    <p className="text-sm text-blue-900">{progressMessage}</p>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  {errorMessage}
                </div>
              )}
            </CardContent>
          </Card>

          {hasClarifiedText && (
            <Card>
              <CardHeader>
                <CardTitle>Förklarad / lättläst version</CardTitle>
                <CardDescription>AI:n gör originaltexten tydligare att läsa.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-80 overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-800">
                  {clarifiedText}
                </div>
              </CardContent>
            </Card>
          )}

          {hasStoryText && (
            <Card>
              <CardHeader>
                <CardTitle>Story-version</CardTitle>
                <CardDescription>Mer berättande ton baserat på samma innehåll.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-80 overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-800">
                  {storyText}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vad vill du göra med den valda texten?</CardTitle>
              <CardDescription>Välj version och skicka vidare till nästa steg.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-800">Välj aktiv text</p>
                <div className="flex flex-wrap gap-2">
                  {sourceOptions.map((option) => {
                    const isDisabled =
                      option.value === "clarified"
                        ? !hasClarifiedText
                        : option.value === "story"
                          ? !hasStoryText
                          : !hasOriginalText;
                    const isActive = activeSource === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setActiveSource(option.value)}
                        disabled={isDisabled}
                        className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                          isActive
                            ? "border-sky-600 bg-sky-50 text-sky-900 shadow-sm"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        } ${isDisabled ? "cursor-not-allowed opacity-40" : ""}`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                {moduleActions.map((action) => (
                  <Button
                    key={action.target}
                    variant="secondary"
                    size="md"
                    disabled={!hasCurrentText || isForwarding === action.target}
                    onClick={() => handleForward(action.target)}
                    className="w-full justify-start gap-2"
                  >
                    {isForwarding === action.target ? "Skickar..." : action.label}
                  </Button>
                ))}
                {!hasCurrentText && (
                  <p className="text-xs text-slate-500">Generera eller välj en textversion för att aktivera knapparna.</p>
                )}
                {forwardMessage && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                    {forwardMessage}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {hasInsights && (
            <Card>
              <CardHeader>
                <CardTitle>Maskering & sammanfattning</CardTitle>
                <CardDescription>Förslag som kom med OCR-resultatet.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasMaskedSuggestion && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900">Maskerad text</p>
                      <span className="text-xs text-slate-500">Automatiskt förslag</span>
                    </div>
                    <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-sm text-slate-800">
                      {result?.maskedText}
                    </pre>
                  </div>
                )}

                {hasSummary && (
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-950">
                    <p className="font-semibold">Sammanfattning</p>
                    <p className="mt-2 whitespace-pre-line">{result?.summary}</p>
                  </div>
                )}

                {hasWarnings && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    <p className="font-semibold">Notiser från Dagboksscannern</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {result?.warnings?.map((warning, index) => (
                        <li key={`warning-${index}`}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </PageShell>
  );
}
