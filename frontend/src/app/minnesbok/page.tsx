"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  generateMemoryBook,
  type MemoryBookResponse
} from "@/services/apiClient";

export default function MinnesbokPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MemoryBookResponse | null>(null);
  const [language, setLanguage] = useState<string>("sv");
  const [progress, setProgress] = useState<string>("");

  const totalSizeLabel = useMemo(() => {
    if (!files.length) return null;
    const totalMb = files.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024);
    return `${files.length} fil${files.length > 1 ? "er" : ""} · ${totalMb.toFixed(1)} MB`;
  }, [files]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextFiles = event.target.files ? Array.from(event.target.files) : [];
    setFiles(nextFiles);
    setError(null);
    setResult(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!files.length) {
      setError("Ladda upp minst en dagboksfil.");
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setProgress("Läser in filer...");

    try {
      // Simulera progress för bättre UX
      setTimeout(() => setProgress("Kör OCR på dagbokssidor..."), 1000);
      setTimeout(() => setProgress("Maskerar känslig information..."), 3000);
      setTimeout(() => setProgress("Analyserar innehåll med AI..."), 5000);
      setTimeout(() => setProgress("Skapar kapitel och tidslinje..."), 8000);

      const response = await generateMemoryBook(files, language);
      setLoading(false);
      setProgress("");

      if (!response.ok) {
        setError(response.error ?? "Minnesboken kunde inte genereras.");
        return;
      }

      setResult(response);
    } catch (err) {
      setLoading(false);
      setProgress("");
      setError("Ett oväntat fel uppstod. Försök igen.");
    }
  }

  const analysis = result?.analysis;
  const showFilmButton = Boolean(analysis && !loading && !error);

  function handleSendToFilm() {
    if (!analysis) return;
    try {
      sessionStorage.setItem("slaktmagi:analysis", JSON.stringify(analysis));
    } catch (storageError) {
      console.error("Kunde inte spara analysen för filmplanen:", storageError);
    }
    router.push("/slaktmagi/film");
  }

  return (
    <section className="mx-auto mt-10 flex max-w-5xl flex-col gap-6 rounded-3xl border border-black/5 bg-white p-6 shadow-xl sm:p-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
          Minnesbok · Dagbok till bok
        </p>
        <h1 className="text-2xl font-semibold text-gray-900">Minnesbok</h1>
        <p className="text-sm text-gray-600">
          Ladda upp dina dagboksfiler som PDF eller bilder. Minnesboken läser in texten, maskerar
          känslig information och strukturerar materialet till kapitel, tidslinje och återkommande teman.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-6">
        <div className="space-y-2 text-sm">
          <label className="font-medium text-gray-900">
            Ladda upp dagboksfiler
            <input
              type="file"
              multiple
              accept="application/pdf,image/*"
              onChange={handleFileChange}
              className="mt-2 block w-full cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
            />
          </label>
          {totalSizeLabel && (
            <p className="text-xs text-gray-500">{totalSizeLabel}</p>
          )}
          <p className="text-xs text-gray-500">
            Tips: kombinera flera år eller teman – Minnesboken grupperar innehållet åt dig.
          </p>
        </div>

        <div className="space-y-2 text-sm">
          <label className="font-medium text-gray-900">
            Språk för analysen
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="sv">Svenska</option>
              <option value="en">English</option>
              <option value="no">Norsk</option>
              <option value="da">Dansk</option>
              <option value="auto">Auto-detektera språk</option>
            </select>
          </label>
          <p className="text-xs text-gray-500">
            Välj vilket språk analysen ska skrivas på. Auto-detektering identifierar dagbokens språk.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {loading ? "Skapar minnesbok…" : "Skapa minnesbok"}
        </button>

        {loading && progress && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
              <p className="text-sm text-blue-900">{progress}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {!error && result?.warning && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {result.warning}
          </div>
        )}
      </form>

      {analysis && (
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
            <h2 className="text-xl font-semibold text-gray-900">{analysis.bookTitle}</h2>
            {analysis.subtitle && (
              <p className="mt-1 text-sm text-gray-600">{analysis.subtitle}</p>
            )}
            <p className="mt-3 text-sm text-gray-700">{analysis.toneSummary}</p>
            {showFilmButton && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleSendToFilm}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Gör film av den här berättelsen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!analysis) return;
                    try {
                      sessionStorage.setItem(
                        "slaktmagi:analysis",
                        JSON.stringify(analysis)
                      );
                    } catch (storageError) {
                      console.error(
                        "Kunde inte spara analysen för relationsträdet:",
                        storageError
                      );
                    }
                    router.push("/slaktmagi/relationer");
                  }}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Bygg relationsträd
                </button>
              </div>
            )}
          </section>

          {analysis.chapters.length ? (
            <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <h3 className="text-base font-semibold text-gray-900">Kapitel</h3>
              <div className="space-y-4">
                {analysis.chapters.map((chapter, index) => (
                  <article key={`chapter-${index}`} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-500">
                      Kapitel {index + 1}
                    </div>
                    <p className="mt-1 text-base font-semibold text-gray-900">{chapter.title}</p>
                    <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">{chapter.summary}</p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {analysis.timeline.length ? (
            <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <h3 className="text-base font-semibold text-gray-900">Tidslinje</h3>
              <ul className="space-y-2">
                {analysis.timeline.map((item, index) => (
                  <li key={`timeline-${index}`} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2">
                    <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                    <p className="text-sm text-gray-700">{item.description}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {analysis.people.length ? (
            <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <h3 className="text-base font-semibold text-gray-900">Personer i minnesboken</h3>
              <ul className="space-y-2">
                {analysis.people.map((person, index) => (
                  <li key={`person-${index}`} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2">
                    <p className="text-sm font-semibold text-gray-900">{person.name}</p>
                    <p className="text-sm text-gray-700">{person.description}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {analysis.themes.length ? (
            <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <h3 className="text-base font-semibold text-gray-900">Teman</h3>
              <div className="flex flex-wrap gap-2">
                {analysis.themes.map((theme, index) => (
                  <span
                    key={`theme-${index}`}
                    className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {result?.maskedText && (
            <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <h3 className="text-base font-semibold text-gray-900">Maskerad dagbokstext</h3>
              <details className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm text-gray-800">
                <summary className="cursor-pointer text-xs font-semibold text-gray-600">
                  Visa texten
                </summary>
                <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap text-xs text-gray-700">
                  {result.maskedText}
                </pre>
              </details>
            </section>
          )}

          {result?.rawText && (
            <details className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-gray-800">
              <summary className="cursor-pointer text-xs font-semibold text-gray-600">
                Visa råtext (endast för kontroll)
              </summary>
              <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-xs text-gray-600">
                {result.rawText}
              </pre>
            </details>
          )}
        </div>
      )}
    </section>
  );
}
