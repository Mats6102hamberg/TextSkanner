"use client";

import { FormEvent, useState } from "react";

import {
  maskFile,
  maskText,
  type MaskingResultResponse
} from "@/services/apiClient";

type MaskMode = "text" | "file";

export default function MaskeringPage() {
  const [mode, setMode] = useState<MaskMode>("text");
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [maskedText, setMaskedText] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);

  const isTextMode = mode === "text";
  const fileLabel = selectedFile
    ? `${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`
    : "Ingen fil vald";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setWarning(null);
    setMaskedText(null);
    setRawText(null);

    setLoading(true);
    let response: MaskingResultResponse;

    if (isTextMode) {
      response = await maskText(inputText);
    } else {
      response = await maskFile(selectedFile);
    }

    setLoading(false);

    if (!response.ok) {
      setError(response.error ?? "Maskeringen misslyckades.");
      return;
    }

    setMaskedText(response.maskedText ?? null);
    setRawText(response.rawText ?? null);
    setWarning(response.warning ?? null);
  }

  return (
    <section className="mx-auto mt-10 max-w-5xl rounded-3xl border border-black/5 bg-white p-6 shadow-xl sm:p-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
          Textskanner · Maskeringsverktyg
        </p>
        <h1 className="text-2xl font-semibold text-gray-900">Maskera känslig information</h1>
        <p className="text-sm text-gray-600">
          Klistra in text eller ladda upp en fil så maskerar TextSkanner personnummer, adresser, kontaktuppgifter
          och andra känsliga detaljer innan du delar dokumentet vidare.
        </p>
      </header>

      <div className="mt-6 flex gap-2">
        {(["text", "file"] as MaskMode[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setMode(value);
              setError(null);
              setWarning(null);
            }}
            className={`inline-flex flex-1 items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition ${
              mode === value
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {value === "text" ? "Text" : "Fil"}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {warning && !error && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {warning}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-6">
        {isTextMode ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900" htmlFor="mask-text-input">
              Klistra in text att maskera
            </label>
            <textarea
              id="mask-text-input"
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
              className="min-h-[160px] w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="Skriv eller klistra in text som innehåller personnummer, adresser eller andra känsliga uppgifter..."
            />
            <p className="text-xs text-gray-500">
              Tips: du kan klistra in flera stycken text. Maskeringen görs lokalt innan du delar vidare.
            </p>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <label className="font-medium text-gray-900">
              Ladda upp fil att maskera
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setSelectedFile(file);
                  setError(null);
                  setWarning(null);
                }}
                className="mt-2 block w-full cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
              />
            </label>
            <p className="text-xs text-gray-500">{fileLabel}</p>
            <p className="text-xs text-gray-500">Stöd för PDF och bilder (JPG, PNG). Maskeringen görs innan texten presenteras.</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || (isTextMode ? !inputText.trim() : !selectedFile)}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {loading ? "Maskerar..." : isTextMode ? "Maskera text" : "Maskera fil"}
        </button>
      </form>

      {maskedText && (
        <div className="mt-8 space-y-6">
          <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
            <h2 className="text-base font-semibold text-gray-900">Maskerad text</h2>
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-gray-800">
              {maskedText}
            </pre>
          </section>

          {rawText && (
            <details className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-gray-800">
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-gray-500">
                Visa råtext (endast för kontroll)
              </summary>
              <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-100 bg-white p-4 text-xs text-gray-700">
                {rawText}
              </pre>
            </details>
          )}
        </div>
      )}
    </section>
  );
}
