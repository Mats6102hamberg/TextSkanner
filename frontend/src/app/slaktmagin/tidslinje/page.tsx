"use client";

import { useState, useEffect, useMemo } from "react";
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
import { getFamilyDrafts, type FamilyEntityDraft, type ExtractedEntities } from "@/services/apiClient";

type TimelineItem = {
  draftId: string;
  date: string | null;
  dateText?: string;
  title: string;
  place?: string;
  persons: string[];
  confidence?: number;
  sourceEntryIds: string[];
  entities: ExtractedEntities;
};

export default function SlaktmaginTidslinjePagePage() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<FamilyEntityDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);

  useEffect(() => {
    loadDrafts();
  }, []);

  async function loadDrafts() {
    setLoading(true);
    setError(null);

    const response = await getFamilyDrafts();

    if (!response.ok) {
      setError(response.error || "Kunde inte ladda utkast.");
      setLoading(false);
      return;
    }

    setDrafts(response.drafts || []);
    setLoading(false);
  }

  // Transformera drafts till timeline items
  const timelineItems = useMemo(() => {
    const items: TimelineItem[] = [];

    drafts.forEach((draft) => {
      const entities = draft.entities;

      // Om det finns events, skapa ett item per event
      if (entities.events && entities.events.length > 0) {
        entities.events.forEach((event, idx) => {
          // Hitta matchande datum om det finns
          const matchingDate = entities.dates && entities.dates[idx];
          
          // Beräkna genomsnittlig confidence
          const confidences: number[] = [event.confidence];
          if (entities.persons) {
            confidences.push(...entities.persons.map(p => p.confidence));
          }
          if (entities.places && entities.places[0]) {
            confidences.push(entities.places[0].confidence);
          }
          const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;

          items.push({
            draftId: draft.id,
            date: matchingDate?.date || null,
            dateText: matchingDate?.dateText,
            title: event.title,
            place: entities.places && entities.places[0]?.name,
            persons: entities.persons ? entities.persons.map(p => p.name) : [],
            confidence: avgConfidence,
            sourceEntryIds: draft.sourceEntryIds,
            entities
          });
        });
      } else {
        // Om inga events, skapa ett generiskt item från första datumet
        const firstDate = entities.dates && entities.dates[0];
        
        items.push({
          draftId: draft.id,
          date: firstDate?.date || null,
          dateText: firstDate?.dateText,
          title: firstDate?.description || "Händelse",
          place: entities.places && entities.places[0]?.name,
          persons: entities.persons ? entities.persons.map(p => p.name) : [],
          sourceEntryIds: draft.sourceEntryIds,
          entities
        });
      }
    });

    // Sortera: ISO-datum först (DESC), sedan dateText sist
    return items.sort((a, b) => {
      if (a.date && b.date) {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (a.date && !b.date) return -1;
      if (!a.date && b.date) return 1;
      return 0;
    });
  }, [drafts]);

  // Statistik
  const stats = useMemo(() => {
    const totalEvents = timelineItems.length;
    const allPersons = new Set<string>();
    
    drafts.forEach(draft => {
      draft.entities.persons?.forEach(p => allPersons.add(p.name));
    });

    return {
      totalDrafts: drafts.length,
      totalEvents,
      totalPersons: allPersons.size
    };
  }, [drafts, timelineItems]);

  return (
    <PageShell
      title="Släktmagin - Tidslinje"
      subtitle="Visualisera din familjehistoria i tidsordning."
    >
      {/* Detalj-modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-w-3xl w-full max-h-[85vh] overflow-auto">
            <CardHeader>
              <CardTitle>{selectedItem.title}</CardTitle>
              <CardDescription>
                {selectedItem.date || (selectedItem.dateText ? `"${selectedItem.dateText}"` : "Okänt datum")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Personer */}
              {selectedItem.entities.persons && selectedItem.entities.persons.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">
                    👥 Personer ({selectedItem.entities.persons.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedItem.entities.persons.map((person, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="font-medium text-slate-900">{person.name}</p>
                        <p className="text-sm text-slate-600">{person.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Platser */}
              {selectedItem.entities.places && selectedItem.entities.places.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">
                    📍 Platser ({selectedItem.entities.places.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedItem.entities.places.map((place, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="font-medium text-slate-900">{place.name}</p>
                        <p className="text-sm text-slate-600">{place.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Händelser */}
              {selectedItem.entities.events && selectedItem.entities.events.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">
                    🎯 Händelser ({selectedItem.entities.events.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedItem.entities.events.map((event, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="font-medium text-slate-900">{event.title}</p>
                        <p className="text-sm text-slate-600">{event.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Relationer */}
              {selectedItem.entities.relationships && selectedItem.entities.relationships.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">
                    🔗 Relationer ({selectedItem.entities.relationships.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedItem.entities.relationships.map((rel, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="font-medium text-slate-900">{rel.person1} → {rel.person2}</p>
                        <p className="text-sm text-slate-600">{rel.type}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-xs text-slate-500">
                  Baserat på {selectedItem.sourceEntryIds.length} dagboksinlägg
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={() => setSelectedItem(null)} variant="primary">
                  Stäng
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Statistik */}
      <section className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-900">{stats.totalDrafts}</p>
              <p className="text-sm text-slate-600">Utkast</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-900">{stats.totalEvents}</p>
              <p className="text-sm text-slate-600">Händelser</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-900">{stats.totalPersons}</p>
              <p className="text-sm text-slate-600">Personer</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Button onClick={() => router.push("/slaktmagin/utkast")} size="md" variant="secondary">
                ← Tillbaka till Utkast
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Tidslinje */}
      <section className="mt-8">
        {loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"></div>
              <p className="mt-4 text-sm text-slate-600">Laddar tidslinje...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-sm text-red-600">{error}</p>
              <Button onClick={loadDrafts} size="sm" className="mt-4">
                Försök igen
              </Button>
            </CardContent>
          </Card>
        ) : timelineItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-lg font-medium text-slate-900">Ingen tidslinje ännu</p>
              <p className="mt-2 text-sm text-slate-600">
                Börja med att extrahera entiteter från dina dagboksinlägg!
              </p>
              <Button onClick={() => router.push("/dagbok/historik")} size="md" className="mt-4">
                Gå till Dagbokshistorik
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="relative">
            {/* Vertikal linje */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200"></div>

            {/* Timeline items */}
            <div className="space-y-8">
              {timelineItems.map((item, idx) => (
                <div key={`${item.draftId}-${idx}`} className="relative pl-20">
                  {/* Datum-cirkel */}
                  <div className="absolute left-0 top-0 flex items-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-indigo-100 shadow-md">
                      <span className="text-xs font-semibold text-indigo-900 text-center leading-tight">
                        {item.date ? (
                          <>
                            {new Date(item.date).getDate()}<br />
                            {new Date(item.date).toLocaleDateString('sv-SE', { month: 'short' })}
                          </>
                        ) : (
                          "?"
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Event card */}
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Datum header */}
                          <p className="text-xs font-medium text-slate-500 mb-2">
                            {item.date ? (
                              new Date(item.date).toLocaleDateString('sv-SE', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })
                            ) : item.dateText ? (
                              `"${item.dateText}"`
                            ) : (
                              "Okänt datum"
                            )}
                          </p>

                          {/* Titel */}
                          <h3 className="text-lg font-semibold text-slate-900 mb-2">
                            {item.title}
                          </h3>

                          {/* Plats */}
                          {item.place && (
                            <p className="text-sm text-slate-700 mb-2">
                              📍 {item.place}
                            </p>
                          )}

                          {/* Personer */}
                          {item.persons.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {item.persons.slice(0, 3).map((person, pIdx) => (
                                <span
                                  key={pIdx}
                                  className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                                >
                                  👤 {person}
                                </span>
                              ))}
                              {item.persons.length > 3 && (
                                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                                  +{item.persons.length - 3}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Confidence badge */}
                          {item.confidence && (
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              item.confidence > 0.8 ? 'bg-green-100 text-green-700' :
                              item.confidence > 0.5 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-orange-100 text-orange-700'
                            }`}>
                              {(item.confidence * 100).toFixed(0)}% säkerhet
                            </span>
                          )}
                        </div>

                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSelectedItem(item)}
                          className="ml-4"
                        >
                          Visa detaljer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </PageShell>
  );
}
