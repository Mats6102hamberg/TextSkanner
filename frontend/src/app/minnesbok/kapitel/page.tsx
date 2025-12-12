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
import { getMemoryBookChapters, type MemoryBookChapter } from "@/services/apiClient";

export default function MinnesbokKapitelPage() {
  const router = useRouter();
  const [chapters, setChapters] = useState<MemoryBookChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<MemoryBookChapter | null>(null);

  useEffect(() => {
    loadChapters();
  }, []);

  async function loadChapters() {
    setLoading(true);
    setError(null);

    const response = await getMemoryBookChapters();

    if (!response.ok) {
      setError(response.error || "Kunde inte ladda kapitel.");
      setLoading(false);
      return;
    }

    setChapters(response.chapters || []);
    setLoading(false);
  }

  return (
    <PageShell
      title="Minnesbok - Kapitel"
      subtitle="Alla dina skapade minnesbok-kapitel från dagboksinlägg."
    >
      {/* Kapitel-detaljer modal */}
      {selectedChapter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-w-3xl w-full max-h-[85vh] overflow-auto">
            <CardHeader>
              <CardTitle>{selectedChapter.title}</CardTitle>
              <CardDescription>
                Skapat: {new Date(selectedChapter.createdAt).toLocaleDateString('sv-SE')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedChapter.summary && (
                <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                  <h4 className="text-sm font-semibold text-indigo-900">Sammanfattning:</h4>
                  <p className="mt-2 text-sm text-indigo-800">{selectedChapter.summary}</p>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Fullständig text:</h4>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap text-slate-700">{selectedChapter.content}</p>
                </div>
              </div>

              {selectedChapter.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">Teman:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedChapter.tags.map((tag, idx) => (
                      <span key={idx} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button onClick={() => setSelectedChapter(null)} variant="primary">
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
              <p className="text-4xl font-bold text-slate-900">{chapters.length}</p>
              <p className="text-sm text-slate-600">Totalt antal kapitel</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Button onClick={() => router.push("/dagbok/historik")} size="md">
                ➕ Skapa nytt kapitel
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

      {/* Kapitel-lista */}
      <section className="mt-8 space-y-4">
        {loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"></div>
              <p className="mt-4 text-sm text-slate-600">Laddar kapitel...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-sm text-red-600">{error}</p>
              <Button onClick={loadChapters} size="sm" className="mt-4">
                Försök igen
              </Button>
            </CardContent>
          </Card>
        ) : chapters.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-lg font-medium text-slate-900">Inga kapitel ännu</p>
              <p className="mt-2 text-sm text-slate-600">
                Börja med att skapa ett kapitel från dina dagboksinlägg!
              </p>
              <Button onClick={() => router.push("/dagbok/historik")} size="md" className="mt-4">
                Gå till Dagbokshistorik
              </Button>
            </CardContent>
          </Card>
        ) : (
          chapters.map((chapter) => (
            <Card key={chapter.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900">{chapter.title}</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(chapter.createdAt).toLocaleDateString('sv-SE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>

                    {chapter.summary && (
                      <p className="mt-3 text-sm text-slate-700 line-clamp-2">{chapter.summary}</p>
                    )}

                    {chapter.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {chapter.tags.slice(0, 5).map((tag, idx) => (
                          <span key={idx} className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700">
                            {tag}
                          </span>
                        ))}
                        {chapter.tags.length > 5 && (
                          <span className="text-xs text-slate-500">+{chapter.tags.length - 5} till</span>
                        )}
                      </div>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setSelectedChapter(chapter)}
                  >
                    Läs
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </section>
    </PageShell>
  );
}
