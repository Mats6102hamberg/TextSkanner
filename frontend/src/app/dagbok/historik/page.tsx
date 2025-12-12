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
import { getDiaryEntries, createMemoryBookChapter, extractFamilyEntities, saveFamilyDraft, type DiaryEntry, type MemoryBookChapter, type ExtractedEntities } from "@/services/apiClient";

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

export default function HistorikPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [isCreatingChapter, setIsCreatingChapter] = useState(false);
  const [createdChapter, setCreatedChapter] = useState<MemoryBookChapter | null>(null);
  const [isExtractingEntities, setIsExtractingEntities] = useState(false);
  const [extractedEntities, setExtractedEntities] = useState<ExtractedEntities | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [savedDraftId, setSavedDraftId] = useState<string | null>(null);

  useEffect(() => {
    loadEntries();
  }, [selectedMood]);

  async function loadEntries() {
    setLoading(true);
    setError(null);

    const response = await getDiaryEntries(50, selectedMood || undefined);

    if (!response.ok) {
      setError(response.error || "Kunde inte ladda dagboksinlägg.");
      setLoading(false);
      return;
    }

    setEntries(response.entries || []);
    setLoading(false);
  }

  function toggleEntrySelection(entryId: string) {
    setSelectedEntries((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  }

  async function handleCreateChapter() {
    if (selectedEntries.size === 0) {
      setError("Välj minst ett dagboksinlägg.");
      return;
    }

    setIsCreatingChapter(true);
    setError(null);

    const response = await createMemoryBookChapter(Array.from(selectedEntries));

    if (!response.ok) {
      setError(response.error || "Kunde inte skapa kapitel.");
      setIsCreatingChapter(false);
      return;
    }

    setCreatedChapter(response.chapter || null);
    setIsCreatingChapter(false);
  }

  function handleClosePreview() {
    setCreatedChapter(null);
    setSelectedEntries(new Set());
  }

  async function handleExtractEntities() {
    if (selectedEntries.size === 0) {
      setError("Välj minst ett dagboksinlägg.");
      return;
    }

    setIsExtractingEntities(true);
    setError(null);

    const response = await extractFamilyEntities(Array.from(selectedEntries));

    if (!response.ok) {
      setError(response.error || "Kunde inte extrahera entiteter.");
      setIsExtractingEntities(false);
      return;
    }

    setExtractedEntities(response.entities || null);
    setIsExtractingEntities(false);
  }

  function handleCloseEntities() {
    setExtractedEntities(null);
    setSavedDraftId(null);
    setSelectedEntries(new Set());
  }

  async function handleSaveDraft() {
    if (!extractedEntities) return;

    setIsSavingDraft(true);
    setError(null);

    const response = await saveFamilyDraft(Array.from(selectedEntries), extractedEntities);

    if (!response.ok) {
      setError(response.error || "Kunde inte spara utkast.");
      setIsSavingDraft(false);
      return;
    }

    setSavedDraftId(response.id || null);
    setIsSavingDraft(false);
  }

  // Filtrera på sökfråga
  const filteredEntries = entries.filter((entry) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      entry.text?.toLowerCase().includes(searchLower) ||
      entry.originalText?.toLowerCase().includes(searchLower) ||
      entry.summary?.toLowerCase().includes(searchLower)
    );
  });

  // Gruppera efter månad
  const entriesByMonth = filteredEntries.reduce((acc, entry) => {
    const date = entry.entryDate ? new Date(entry.entryDate) : new Date(entry.createdAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(entry);
    return acc;
  }, {} as Record<string, DiaryEntry[]>);

  const sortedMonths = Object.keys(entriesByMonth).sort().reverse();

  // Statistik
  const totalEntries = entries.length;
  const moodCounts = entries.reduce((acc, entry) => {
    if (entry.detectedMood) {
      acc[entry.detectedMood] = (acc[entry.detectedMood] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <PageShell
      title="Dagbokshistorik"
      subtitle="Alla dina sparade dagboksinlägg. Sök, filtrera och utforska dina minnen."
    >
      {/* Släktmagin entiteter modal */}
      {extractedEntities && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-w-3xl w-full max-h-[85vh] overflow-auto">
            <CardHeader>
              <CardTitle>🧬 Släktmagin - Extraherade entiteter</CardTitle>
              <CardDescription>Personer, platser, datum och händelser från dina dagboksinlägg</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Personer */}
              {extractedEntities.persons.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">👥 Personer ({extractedEntities.persons.length})</h4>
                  <div className="space-y-2">
                    {extractedEntities.persons.map((person, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">{person.name}</p>
                            <p className="text-sm text-slate-600">{person.description}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            person.confidence > 0.8 ? 'bg-green-100 text-green-700' :
                            person.confidence > 0.5 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {(person.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Platser */}
              {extractedEntities.places.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">📍 Platser ({extractedEntities.places.length})</h4>
                  <div className="space-y-2">
                    {extractedEntities.places.map((place, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">{place.name}</p>
                            <p className="text-sm text-slate-600">{place.description}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            place.confidence > 0.8 ? 'bg-green-100 text-green-700' :
                            place.confidence > 0.5 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {(place.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Datum */}
              {extractedEntities.dates.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">📅 Datum ({extractedEntities.dates.length})</h4>
                  <div className="space-y-2">
                    {extractedEntities.dates.map((dateEvent, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">
                              {dateEvent.date || (dateEvent.dateText ? `"${dateEvent.dateText}"` : "Okänt datum")}
                            </p>
                            <p className="text-sm text-slate-600">{dateEvent.description}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            dateEvent.confidence > 0.8 ? 'bg-green-100 text-green-700' :
                            dateEvent.confidence > 0.5 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {(dateEvent.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Händelser */}
              {extractedEntities.events.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">🎯 Händelser ({extractedEntities.events.length})</h4>
                  <div className="space-y-2">
                    {extractedEntities.events.map((event, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">{event.title}</p>
                            <p className="text-sm text-slate-600">{event.description}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            event.confidence > 0.8 ? 'bg-green-100 text-green-700' :
                            event.confidence > 0.5 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {(event.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Relationer */}
              {extractedEntities.relationships.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">🔗 Relationer ({extractedEntities.relationships.length})</h4>
                  <div className="space-y-2">
                    {extractedEntities.relationships.map((rel, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">{rel.person1} → {rel.person2}</p>
                            <p className="text-sm text-slate-600">{rel.type}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            rel.confidence > 0.8 ? 'bg-green-100 text-green-700' :
                            rel.confidence > 0.5 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {(rel.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                {savedDraftId ? (
                  <>
                    <div className="flex-1 rounded-lg bg-green-50 border border-green-200 p-3">
                      <p className="text-sm font-medium text-green-900">✅ Utkast sparat!</p>
                      <p className="text-xs text-green-700 mt-1">ID: {savedDraftId}</p>
                    </div>
                    <Button onClick={() => router.push("/slaktmagin/utkast")} variant="primary">
                      Öppna utkast
                    </Button>
                    <Button onClick={handleCloseEntities} variant="secondary">
                      Stäng
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={handleSaveDraft}
                      disabled={isSavingDraft}
                      variant="primary"
                    >
                      {isSavingDraft ? "Sparar..." : "✅ Spara som utkast"}
                    </Button>
                    <Button onClick={handleCloseEntities} variant="secondary">
                      Stäng
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Kapitel-preview modal */}
      {createdChapter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-auto">
            <CardHeader>
              <CardTitle>✨ Minnesbok-kapitel skapat!</CardTitle>
              <CardDescription>Ditt nya kapitel har sparats</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{createdChapter.title}</h3>
                {createdChapter.summary && (
                  <p className="mt-2 text-sm text-slate-700">{createdChapter.summary}</p>
                )}
              </div>

              {createdChapter.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {createdChapter.tags.map((tag: string, idx: number) => (
                    <span key={idx} className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button onClick={() => router.push("/minnesbok/kapitel")} variant="primary">
                  📖 Visa i Minnesbok
                </Button>
                <Button onClick={handleClosePreview} variant="secondary">
                  Stäng
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Statistik */}
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-slate-900">{totalEntries}</p>
              <p className="text-sm text-slate-600">Totalt antal inlägg</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              {topMood ? (
                <>
                  <p className="text-4xl">{getMoodEmoji(topMood[0])}</p>
                  <p className="text-sm text-slate-600 capitalize">
                    Vanligaste känsla: {topMood[0]} ({topMood[1]}x)
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-600">Ingen känslodata ännu</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <Button onClick={() => router.push("/dagbok")} size="md">
                ➕ Nytt inlägg
              </Button>
              {selectedEntries.size > 0 && (
                <div className="text-xs text-slate-600">
                  {selectedEntries.size} inlägg valda
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Skapa kapitel-knapp */}
      {selectedEntries.size > 0 && (
        <section className="mt-6">
          <Card className="border-indigo-200 bg-indigo-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-indigo-900">
                    {selectedEntries.size} dagboksinlägg valda
                  </p>
                  <p className="text-sm text-indigo-700">
                    Skapa ett minnesbok-kapitel från dessa inlägg
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setSelectedEntries(new Set())}
                    variant="secondary"
                    size="sm"
                  >
                    Avmarkera alla
                  </Button>
                  <Button
                    onClick={handleExtractEntities}
                    disabled={isExtractingEntities}
                    variant="secondary"
                    size="md"
                  >
                    {isExtractingEntities ? "Extraherar..." : "🧬 Skicka till Släktmagin"}
                  </Button>
                  <Button
                    onClick={handleCreateChapter}
                    disabled={isCreatingChapter}
                    variant="primary"
                    size="md"
                  >
                    {isCreatingChapter ? "Skapar..." : "📖 Skapa Minnesbok-kapitel"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Sök och filter */}
      <section className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Sök och filtrera</CardTitle>
            <CardDescription>Hitta specifika dagboksinlägg</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Sök i text</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Sök efter ord eller fraser..."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Filtrera på känsla</label>
                <select
                  value={selectedMood}
                  onChange={(e) => setSelectedMood(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                >
                  <option value="">Alla känslor</option>
                  <option value="glad">😊 Glad</option>
                  <option value="ledsen">😢 Ledsen</option>
                  <option value="stressad">😰 Stressad</option>
                  <option value="tacksam">🙏 Tacksam</option>
                  <option value="arg">😠 Arg</option>
                  <option value="rädd">😨 Rädd</option>
                  <option value="neutral">😐 Neutral</option>
                  <option value="hoppfull">🌟 Hoppfull</option>
                  <option value="ensam">😔 Ensam</option>
                  <option value="energisk">⚡ Energisk</option>
                </select>
              </div>
            </div>

            {searchQuery && (
              <p className="text-sm text-slate-600">
                Visar {filteredEntries.length} av {entries.length} inlägg
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Dagboksinlägg */}
      <section className="mt-6 space-y-6">
        {loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"></div>
              <p className="mt-4 text-sm text-slate-600">Laddar dagboksinlägg...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-sm text-red-600">{error}</p>
              <Button onClick={loadEntries} size="sm" className="mt-4">
                Försök igen
              </Button>
            </CardContent>
          </Card>
        ) : filteredEntries.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-lg font-medium text-slate-900">
                {searchQuery || selectedMood ? "Inga matchande inlägg" : "Inga dagboksinlägg ännu"}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {searchQuery || selectedMood
                  ? "Prova att ändra dina sökkriterier"
                  : "Börja med att skanna din första dagbokssida!"}
              </p>
              <Button onClick={() => router.push("/dagbok")} size="md" className="mt-4">
                Skanna dagbokssida
              </Button>
            </CardContent>
          </Card>
        ) : (
          sortedMonths.map((monthKey) => {
            const [year, month] = monthKey.split("-");
            const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("sv-SE", {
              year: "numeric",
              month: "long"
            });

            return (
              <div key={monthKey}>
                <h2 className="mb-4 text-xl font-semibold capitalize text-slate-900">{monthName}</h2>
                <div className="space-y-4">
                  {entriesByMonth[monthKey].map((entry) => {
                    const displayDate = entry.entryDate
                      ? new Date(entry.entryDate).toLocaleDateString("sv-SE")
                      : new Date(entry.createdAt).toLocaleDateString("sv-SE");

                    return (
                      <Card key={entry.id} className={selectedEntries.has(entry.id) ? "border-indigo-300 bg-indigo-50" : ""}>
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-3">
                            {/* Checkbox */}
                            <input
                              type="checkbox"
                              checked={selectedEntries.has(entry.id)}
                              onChange={() => toggleEntrySelection(entry.id)}
                              className="mt-1 h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />

                            <div className="flex-1">
                              {/* Datum och känsla */}
                              <div className="mb-3 flex flex-wrap items-center gap-3">
                                <span className="text-sm font-medium text-slate-600">📅 {displayDate}</span>
                                {entry.detectedMood && (
                                  <span className="flex items-center gap-1 text-sm">
                                    <span className="text-lg">{getMoodEmoji(entry.detectedMood)}</span>
                                    <span className="capitalize text-slate-700">{entry.detectedMood}</span>
                                    {entry.moodScore !== null && entry.moodScore !== undefined && (
                                      <span className="text-xs text-slate-500">
                                        ({entry.moodScore > 0 ? "+" : ""}
                                        {(entry.moodScore * 100).toFixed(0)}%)
                                      </span>
                                    )}
                                  </span>
                                )}
                              </div>

                              {/* Sammanfattning eller text */}
                              {entry.summary ? (
                                <p className="text-sm text-slate-700">{entry.summary}</p>
                              ) : (
                                <p className="line-clamp-3 text-sm text-slate-700">
                                  {entry.text || entry.originalText}
                                </p>
                              )}

                              {/* Tags */}
                              {entry.tags && entry.tags.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {entry.tags.map((tag, idx) => (
                                    <span
                                      key={idx}
                                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                // TODO: Visa detaljer eller redigera
                                alert(`Inlägg ID: ${entry.id}\n\nFunktion för att visa/redigera kommer snart!`);
                              }}
                            >
                              Visa
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </section>
    </PageShell>
  );
}
