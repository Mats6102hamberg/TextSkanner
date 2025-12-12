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
  const [showSourceIds, setShowSourceIds] = useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

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

  function toggleDescription(id: string) {
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }

  function truncateText(text: string, maxLength: number = 100): { text: string; isTruncated: boolean } {
    if (text.length <= maxLength) {
      return { text, isTruncated: false };
    }
    return { text: text.substring(0, maxLength) + "...", isTruncated: true };
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

  // Filtrera timeline items baserat på sök
  const filteredTimelineItems = useMemo(() => {
    if (!searchQuery.trim()) return timelineItems;

    const query = searchQuery.toLowerCase();
    return timelineItems.filter(item => {
      // Sök i titel
      if (item.title.toLowerCase().includes(query)) return true;
      
      // Sök i plats
      if (item.place?.toLowerCase().includes(query)) return true;
      
      // Sök i personer
      if (item.persons.some(p => p.toLowerCase().includes(query))) return true;
      
      // Sök i event descriptions
      if (item.entities.events?.some(e => 
        e.title.toLowerCase().includes(query) || 
        e.description.toLowerCase().includes(query)
      )) return true;
      
      return false;
    });
  }, [timelineItems, searchQuery]);

  // Statistik
  const stats = useMemo(() => {
    const totalEvents = filteredTimelineItems.length;
    const allPersons = new Set<string>();
    
    drafts.forEach(draft => {
      draft.entities.persons?.forEach(p => allPersons.add(p.name));
    });

    return {
      totalDrafts: drafts.length,
      totalEvents,
      totalPersons: allPersons.size
    };
  }, [drafts, filteredTimelineItems]);

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
                    {selectedItem.entities.persons.map((person, idx) => {
                      const descId = `person-${idx}`;
                      const isExpanded = expandedDescriptions.has(descId);
                      const { text, isTruncated } = truncateText(person.description);
                      
                      return (
                        <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <p className="font-medium text-slate-900">{person.name}</p>
                          <p className="text-sm text-slate-600">
                            {isExpanded ? person.description : text}
                          </p>
                          {isTruncated && (
                            <button
                              onClick={() => toggleDescription(descId)}
                              className="text-xs text-indigo-600 hover:text-indigo-800 mt-1"
                            >
                              {isExpanded ? "Visa mindre" : "Visa mer"}
                            </button>
                          )}
                        </div>
                      );
                    })}
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
                    {selectedItem.entities.places.map((place, idx) => {
                      const descId = `place-${idx}`;
                      const isExpanded = expandedDescriptions.has(descId);
                      const { text, isTruncated } = truncateText(place.description);
                      
                      return (
                        <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <p className="font-medium text-slate-900">{place.name}</p>
                          <p className="text-sm text-slate-600">
                            {isExpanded ? place.description : text}
                          </p>
                          {isTruncated && (
                            <button
                              onClick={() => toggleDescription(descId)}
                              className="text-xs text-indigo-600 hover:text-indigo-800 mt-1"
                            >
                              {isExpanded ? "Visa mindre" : "Visa mer"}
                            </button>
                          )}
                        </div>
                      );
                    })}
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
                    {selectedItem.entities.events.map((event, idx) => {
                      const descId = `event-${idx}`;
                      const isExpanded = expandedDescriptions.has(descId);
                      const { text, isTruncated } = truncateText(event.description);
                      
                      return (
                        <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <p className="font-medium text-slate-900">{event.title}</p>
                          <p className="text-sm text-slate-600">
                            {isExpanded ? event.description : text}
                          </p>
                          {isTruncated && (
                            <button
                              onClick={() => toggleDescription(descId)}
                              className="text-xs text-indigo-600 hover:text-indigo-800 mt-1"
                            >
                              {isExpanded ? "Visa mindre" : "Visa mer"}
                            </button>
                          )}
                        </div>
                      );
                    })}
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
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-700">
                    Källor: {selectedItem.sourceEntryIds.length} dagboksinlägg
                  </p>
                  <button
                    onClick={() => setShowSourceIds(!showSourceIds)}
                    className="text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    {showSourceIds ? "Dölj IDs" : "Visa IDs"}
                  </button>
                </div>
                {showSourceIds && (
                  <div className="mt-2 p-2 bg-slate-50 rounded border border-slate-200">
                    <p className="text-xs text-slate-600 font-mono break-all">
                      {selectedItem.sourceEntryIds.join(", ")}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={() => {
                  setSelectedItem(null);
                  setShowSourceIds(false);
                  setExpandedDescriptions(new Set());
                }} variant="primary">
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

      {/* Sök */}
      <section className="mt-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Sök efter person, plats eller händelse..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
                >
                  Rensa
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="mt-2 text-xs text-slate-500">
                Visar {filteredTimelineItems.length} av {timelineItems.length} händelser
              </p>
            )}
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
                          {item.date ? (
                            <div className="mb-2">
                              <p className="text-sm font-medium text-slate-700">
                                {new Date(item.date).toLocaleDateString('sv-SE', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </p>
                              <p className="text-xs text-slate-400">
                                {item.date}
                              </p>
                            </div>
                          ) : item.dateText ? (
                            <div className="mb-2">
                              <p className="text-sm font-medium text-slate-700 italic">
                                "{item.dateText}"
                              </p>
                              <p className="text-xs text-orange-600">
                                Osäkert datum
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs font-medium text-slate-500 mb-2">
                              Okänt datum
                            </p>
                          )}

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
