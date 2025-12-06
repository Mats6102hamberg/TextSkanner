"use client";

import { FormEvent, useMemo, useState } from "react";

type ContractMode = "summary" | "risk" | "clarity" | "party_balance" | "mask";

type ModeState = Record<ContractMode, boolean>;

interface ContractAnalysisData {
  summary?: string;
  simpleExplanation?: string;
  risks?: string[];
  unclearClauses?: string[];
  partyBalance?: string;
  maskSuggestions?: string[];
  warnings?: string[];
}

interface ApiResponse {
  ok: boolean;
  data?: ContractAnalysisData;
  error?: string;
}

const MODE_OPTIONS: { key: ContractMode; label: string }[] = [
  { key: "summary", label: "Sammanfattning" },
  { key: "risk", label: "Risker" },
  { key: "clarity", label: "Otydliga punkter" },
  { key: "party_balance", label: "Vem gynnas mest?" },
  { key: "mask", label: "Maskeringsförslag" }
];

const DEFAULT_LANGUAGE = "sv";

export default function ContractAnalysisPage() {
  const [contractText, setContractText] = useState("");
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [modes, setModes] = useState<ModeState>(() =>
    MODE_OPTIONS.reduce((acc, option) => {
      acc[option.key] = true;
      return acc;
    }, {} as ModeState)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ContractAnalysisData | null>(null);

  const selectedModes = useMemo(() => {
    const active = MODE_OPTIONS.filter((option) => modes[option.key]).map(
      (option) => option.key
    );
    return active.length ? active : MODE_OPTIONS.map((option) => option.key);
  }, [modes]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedText = contractText.trim();
    if (!trimmedText) {
      setError("Avtalstexten måste fyllas i.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const payload = {
        text: trimmedText,
        language: language.trim() || DEFAULT_LANGUAGE,
        modes: selectedModes
      };

      const response = await fetch(
        "/api/textscanner/contract/analyze",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.ok || !data.data) {
        throw new Error(data.error || "Kunde inte analysera avtalet.");
      }

      setResult(data.data);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Ett oväntat fel uppstod vid analysen."
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleMode(mode: ContractMode) {
    setModes((prev) => ({
      ...prev,
      [mode]: !prev[mode]
    }));
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Avtalsanalys</h1>
      <p className="mt-2 text-sm text-gray-600">
        Klistra in ett avtal nedan och välj vilka delar du vill analysera.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium">
            Avtalstext
            <textarea
              className="mt-2 w-full rounded border border-gray-300 p-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none"
              rows={10}
              value={contractText}
              onChange={(event) => setContractText(event.target.value)}
              placeholder="Klistra in hela avtalet här..."
            />
          </label>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex-1 text-sm font-medium">
            Språk
            <input
              type="text"
              className="mt-2 w-full rounded border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              placeholder="sv"
            />
          </label>
        </div>

        <fieldset className="space-y-3 rounded border border-gray-200 p-4">
          <legend className="px-1 text-sm font-medium">
            Välj lägen att analysera
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {MODE_OPTIONS.map((option) => (
              <label
                key={option.key}
                className="flex items-center gap-2 text-sm font-medium"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={modes[option.key]}
                  onChange={() => toggleMode(option.key)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="space-y-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            {loading ? "Analyserar..." : "Analysera avtalet"}
          </button>
          {loading && (
            <p className="text-sm text-gray-500">Analyserar avtalet, vänta...</p>
          )}
        </div>
      </form>

      {result && (
        <div className="mt-10 space-y-6">
          {result.summary && (
            <ResultCard title="Sammanfattning" content={result.summary} />
          )}

          {result.simpleExplanation && (
            <ResultCard
              title="Enkel förklaring"
              content={result.simpleExplanation}
            />
          )}

          {result.risks?.length ? (
            <ResultList title="Risker" items={result.risks} />
          ) : null}

          {result.unclearClauses?.length ? (
            <ResultList
              title="Otydliga punkter"
              items={result.unclearClauses}
            />
          ) : null}

          {result.partyBalance && (
            <ResultCard title="Vem gynnas mest" content={result.partyBalance} />
          )}

          {result.maskSuggestions?.length ? (
            <ResultList
              title="Maskeringsförslag"
              items={result.maskSuggestions}
            />
          ) : null}

          {result.warnings?.length ? (
            <ResultList title="Warnings" items={result.warnings} />
          ) : null}
        </div>
      )}
    </div>
  );
}

function ResultCard({
  title,
  content
}: {
  title: string;
  content: string;
}) {
  return (
    <section className="rounded border border-gray-200 p-4 shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 whitespace-pre-line text-sm text-gray-800">{content}</p>
    </section>
  );
}

function ResultList({
  title,
  items
}: {
  title: string;
  items: string[];
}) {
  return (
    <section className="rounded border border-gray-200 p-4 shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-800">
        {items.map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
