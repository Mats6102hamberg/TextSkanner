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
import { getFamilyDrafts, type FamilyEntityDraft } from "@/services/apiClient";

export default function SlaktmaginUtkastPage() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<FamilyEntityDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDraft, setSelectedDraft] = useState<FamilyEntityDraft | null>(null);

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

  return (
    <PageShell
      title="Släktmagin - Utkast"
      subtitle="Alla dina sparade släktforsknings-analyser från dagboksinlägg."
    >
      {/* Utkast-detaljer modal */}
      {selectedDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-w-3xl w-full max-h-[85vh] overflow-auto">
            <CardHeader>
              <CardTitle>🧬 Släktmagin-utkast</CardTitle>
              <CardDescription>
                Skapat: {new Date(selectedDraft.createdAt).toLocaleDateString('sv-SE', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Personer */}
              {selectedDraft.entities.persons.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">
                    👥 Personer ({selectedDraft.entities.persons.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedDraft.entities.persons.map((person, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="font-medium text-slate-900">{person.name}</p>
                        <p className="text-sm text-slate-600">{person.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Platser */}
              {selectedDraft.entities.places.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">
                    📍 Platser ({selectedDraft.entities.places.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedDraft.entities.places.map((place, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="font-medium text-slate-900">{place.name}</p>
                        <p className="text-sm text-slate-600">{place.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Relationer */}
              {selectedDraft.entities.relationships.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">
                    🔗 Relationer ({selectedDraft.entities.relationships.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedDraft.entities.relationships.map((rel, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="font-medium text-slate-900">{rel.person1} → {rel.person2}</p>
                        <p className="text-sm text-slate-600">{rel.type}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button onClick={() => setSelectedDraft(null)} variant="primary">
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
              <p className="text-4xl font-bold text-slate-900">{drafts.length}</p>
              <p className="text-sm text-slate-600">Totalt antal utkast</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Button onClick={() => router.push("/slaktmagin/tidslinje")} size="md" variant="primary">
                🕐 Visa tidslinje
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Button onClick={() => router.push("/dagbok/historik")} size="md">
                ➕ Skapa nytt utkast
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Button onClick={() => router.push("/dagbok")} size="md" variant="secondary">
                📘 Dagboksskanner
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Utkast-lista */}
      <section className="mt-8 space-y-4">
        {loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"></div>
              <p className="mt-4 text-sm text-slate-600">Laddar utkast...</p>
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
        ) : drafts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-lg font-medium text-slate-900">Inga utkast ännu</p>
              <p className="mt-2 text-sm text-slate-600">
                Börja med att extrahera entiteter från dina dagboksinlägg!
              </p>
              <Button onClick={() => router.push("/dagbok/historik")} size="md" className="mt-4">
                Gå till Dagbokshistorik
              </Button>
            </CardContent>
          </Card>
        ) : (
          drafts.map((draft) => {
            const personCount = draft.entities.persons?.length || 0;
            const placeCount = draft.entities.places?.length || 0;
            const relationCount = draft.entities.relationships?.length || 0;

            return (
              <Card key={draft.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900">
                        Släktmagin-analys
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(draft.createdAt).toLocaleDateString('sv-SE', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-700">
                        <span>👥 {personCount} personer</span>
                        <span>📍 {placeCount} platser</span>
                        <span>🔗 {relationCount} relationer</span>
                      </div>

                      <p className="mt-2 text-xs text-slate-500">
                        Baserat på {draft.sourceEntryIds.length} dagboksinlägg
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setSelectedDraft(draft)}
                    >
                      Visa
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </section>
    </PageShell>
  );
}
