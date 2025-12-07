"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type {
  FamilyRelationsState,
  MemoryBookAnalysis
} from "@/services/apiClient";

const MISSING_ANALYSIS_MESSAGE =
  "Ingen minnesboksanalys hittades. Gå via Minnesboken först.";

export default function RelationsPage() {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<MemoryBookAnalysis | null>(null);
  const [centralLabel, setCentralLabel] = useState("Jag");
  const [relationMap, setRelationMap] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedAnalysis = sessionStorage.getItem("slaktmagi:analysis");
      if (storedAnalysis) {
        const parsed = JSON.parse(storedAnalysis) as MemoryBookAnalysis;
        setAnalysis(parsed);
      } else {
        setError(MISSING_ANALYSIS_MESSAGE);
      }

      const storedRelations = sessionStorage.getItem("slaktmagi:relations");
      if (storedRelations) {
        const parsedState = JSON.parse(storedRelations) as FamilyRelationsState;
        if (parsedState.centralLabel) {
          setCentralLabel(parsedState.centralLabel);
        }
        const map: Record<string, string> = {};
        for (const relation of parsedState.relations) {
          map[relation.personName] = relation.relationLabel;
        }
        setRelationMap(map);
      }
    } catch (storageError) {
      console.error("Kunde inte läsa sparat relationsträd:", storageError);
      setError(MISSING_ANALYSIS_MESSAGE);
    }
  }, []);

  const people = useMemo(() => analysis?.people ?? [], [analysis]);

  function handleRelationChange(personName: string, value: string) {
    setRelationMap((prev) => ({ ...prev, [personName]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!analysis) {
      setError(MISSING_ANALYSIS_MESSAGE);
      return;
    }

    const state: FamilyRelationsState = {
      centralLabel: centralLabel.trim() || "Jag",
      relations: people.map((person) => ({
        personName: person.name,
        relationLabel: relationMap[person.name]?.trim() ?? ""
      }))
    };

    try {
      sessionStorage.setItem("slaktmagi:relations", JSON.stringify(state));
    } catch (storageError) {
      console.error("Kunde inte spara relationsträdet:", storageError);
      setError("Kunde inte spara relationerna lokalt. Försök igen.");
      return;
    }

    router.push("/slaktmagi/trad");
  }

  return (
    <section className="mx-auto mt-10 max-w-5xl rounded-3xl border border-black/5 bg-white p-6 shadow-xl sm:p-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-500">
          SläktMagi · Relationer
        </p>
        <h1 className="text-2xl font-semibold text-gray-900">Bygg relationsträdet</h1>
        <p className="text-sm text-gray-600">
          Utgå från personerna i Minnesbokens analys och ange hur de hänger ihop med dig eller den
          centralperson du väljer.
        </p>
      </header>

      {error && (
        <div className="mt-6 space-y-3">
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
          {error === MISSING_ANALYSIS_MESSAGE && (
            <button
              type="button"
              onClick={() => router.push("/minnesbok")}
              className="inline-flex items-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Gå till Minnesboken
            </button>
          )}
        </div>
      )}

      {analysis && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-gray-900">Bok: {analysis.bookTitle}</h2>
            {analysis.toneSummary && (
              <p className="mt-1 text-sm text-gray-600">{analysis.toneSummary}</p>
            )}
          </section>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900" htmlFor="central-label">
              Centralperson
            </label>
            <input
              id="central-label"
              type="text"
              value={centralLabel}
              onChange={(event) => setCentralLabel(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
            <p className="text-xs text-gray-500">
              Exempel: "Jag", "Vår familj", "Mormor" eller ett namn.
            </p>
          </div>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-base font-semibold text-gray-900">Personer i minnesboken</h3>
            <p className="text-xs text-gray-600">
              Skriv vilken relation varje person har till {centralLabel || "dig"}. Lämna tomt om du är
              osäker – personen visas ändå i trädet.
            </p>

            <div className="space-y-4">
              {people.map((person) => (
                <article key={person.name} className="rounded-2xl border border-white/60 bg-white p-4 shadow-sm">
                  <div className="text-sm font-semibold text-gray-900">{person.name}</div>
                  {person.description && (
                    <p className="text-xs text-gray-600">{person.description}</p>
                  )}
                  <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Relation till {centralLabel || "centralpersonen"}
                    <input
                      type="text"
                      value={relationMap[person.name] ?? ""}
                      onChange={(event) => handleRelationChange(person.name, event.target.value)}
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                      placeholder="Exempel: mamma, kusin, vän"
                    />
                  </label>
                </article>
              ))}

              {!people.length && (
                <p className="text-sm text-gray-600">
                  Minnesboken hittade inga personer i analysen. Lägg till personer först för att kunna skapa
                  ett relationsträd.
                </p>
              )}
            </div>
          </section>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Visa relationsträd
          </button>
        </form>
      )}
    </section>
  );
}
