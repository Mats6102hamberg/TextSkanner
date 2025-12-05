"use client";

import { FormEvent, useState } from "react";

type MaskingOptions = {
  maskNames: boolean;
  maskAddresses: boolean;
  maskPersonIds: boolean;
  maskContact: boolean;
  maskAccounts: boolean;
  maskOrgIds: boolean;
  maskAll: boolean;
};

type MaskingResult = {
  originalText: string;
  maskedText: string;
  maskSuggestions: string[];
  warnings?: string[];
};

interface ApiResponse {
  ok: boolean;
  data?: MaskingResult;
  error?: string;
}

const defaultOptions: MaskingOptions = {
  maskNames: true,
  maskAddresses: true,
  maskPersonIds: true,
  maskContact: true,
  maskAccounts: true,
  maskOrgIds: true,
  maskAll: true
};

const LANGUAGE_OPTIONS = [
  { label: "Svenska", value: "sv" },
  { label: "Engelska", value: "en" },
  { label: "Franska", value: "fr" },
  { label: "Tyska", value: "de" },
  { label: "Spanska", value: "es" }
];

export default function MaskingPage() {
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("sv");
  const [options, setOptions] = useState<MaskingOptions>(defaultOptions);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MaskingResult | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmed = text.trim();
    if (!trimmed) {
      setError("Klistra in text att maskera.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const payload = {
        text: trimmed,
        language: language || "sv",
        options
      };

      const response = await fetch("/api/textscanner/masking/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = (await response.json()) as ApiResponse;
      if (!response.ok || !data.ok || !data.data) {
        throw new Error(data.error || "Kunde inte maskera texten.");
      }

      setResult(data.data);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Ett oväntat fel uppstod vid maskeringen."
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleOption(key: keyof MaskingOptions) {
    setOptions((prev) => {
      if (key === "maskAll") {
        const nextAll = !prev.maskAll;
        return {
          maskAll: nextAll,
          maskNames: nextAll ? true : prev.maskNames,
          maskAddresses: nextAll ? true : prev.maskAddresses,
          maskPersonIds: nextAll ? true : prev.maskPersonIds,
          maskContact: nextAll ? true : prev.maskContact,
          maskAccounts: nextAll ? true : prev.maskAccounts,
          maskOrgIds: nextAll ? true : prev.maskOrgIds
        };
      }

      const updated = { ...prev, [key]: !prev[key], maskAll: false } as MaskingOptions;
      return updated;
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
          Maskering
        </p>
        <h1 className="text-3xl font-semibold">Maskering – skydda känslig information</h1>
        <p className="text-sm text-gray-600">
          Klistra in text så hjälper Textscanner dig att maskera känsliga uppgifter som
          personnummer, namn, adresser och kontaktinformation. Verktyget använder AI för att
          hitta och föreslå maskeringar.
        </p>
        <p className="text-xs text-amber-700">
          Viktigt: Denna funktion hjälper dig att hitta och maskera känslig information, men
          du är själv ansvarig för att kontrollera att allt som måste skyddas verkligen är
          maskerat innan du delar dokumentet.
        </p>
      </header>

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <label className="text-sm font-medium">Klistra in text att maskera</label>
            <textarea
              className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm shadow-sm focus:border-indigo-500 focus:bg-white focus:outline-none"
              rows={10}
              value={text}
              onChange={(event) => setText(event.target.value)}
              required
              placeholder="Skriv eller klistra in text som innehåller känsliga uppgifter..."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Språk (hint)
              <select
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none"
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-sm font-semibold">Maskeringsval</p>
            <div className="mt-4 grid gap-2 text-sm">
              <OptionRow
                label="Maskera personnummer"
                checked={options.maskPersonIds}
                onChange={() => toggleOption("maskPersonIds")}
              />
              <OptionRow
                label="Maskera namn"
                checked={options.maskNames}
                onChange={() => toggleOption("maskNames")}
              />
              <OptionRow
                label="Maskera adresser"
                checked={options.maskAddresses}
                onChange={() => toggleOption("maskAddresses")}
              />
              <OptionRow
                label="Maskera kontaktuppgifter (telefon & e-post)"
                checked={options.maskContact}
                onChange={() => toggleOption("maskContact")}
              />
              <OptionRow
                label="Maskera kontonummer"
                checked={options.maskAccounts}
                onChange={() => toggleOption("maskAccounts")}
              />
              <OptionRow
                label="Maskera organisationsnummer"
                checked={options.maskOrgIds}
                onChange={() => toggleOption("maskOrgIds")}
              />
              <OptionRow
                label="Maskera allt ovan"
                checked={options.maskAll}
                onChange={() => toggleOption("maskAll")}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            {loading ? "Maskerar text…" : "Maskera text"}
          </button>
        </form>

        <MaskingResult result={result} loading={loading} />
      </div>
    </div>
  );
}

function OptionRow({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4" />
      {label}
    </label>
  );
}

function MaskingResult({
  result,
  loading
}: {
  result: MaskingResult | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-gray-600 shadow-sm">
        Maskerar text…
      </section>
    );
  }

  if (!result) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-gray-500 shadow-sm">
        Klistra in text och klicka på “Maskera text” för att se resultat här.
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="rounded-xl bg-slate-50 p-4">
        <h2 className="text-base font-semibold">Originaltext</h2>
        <div className="mt-2 whitespace-pre-wrap text-sm text-gray-800">
          {result.originalText}
        </div>
      </div>

      <div className="rounded-xl bg-slate-900 p-4 text-slate-50">
        <h2 className="text-base font-semibold">Maskerad text</h2>
        <div className="mt-2 whitespace-pre-wrap text-sm">
          {result.maskedText}
        </div>
      </div>

      {result.maskSuggestions.length ? (
        <div className="rounded-xl bg-slate-50 p-4">
          <h3 className="text-base font-semibold">Förslag från AI</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-800">
            {result.maskSuggestions.map((suggestion, index) => (
              <li key={`mask-${index}`}>{suggestion}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {result.warnings?.length ? (
        <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          <h3 className="font-semibold">Varningar</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {result.warnings.map((warning, index) => (
              <li key={`warning-${index}`}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
