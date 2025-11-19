"use client";

import { FormEvent, useEffect, useState } from "react";
import { jsPDF } from "jspdf";

type HistoryItem = {
  id: string;
  createdAt: string;
  text: string;
};

type DiaryEntry = {
  id: string;
  createdAt: string;
  originalText: string;
  translatedText?: string | null;
};

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [loadingOcr, setLoadingOcr] = useState(false);
  const [loadingClean, setLoadingClean] = useState(false);
  const [rawText, setRawText] = useState<string | null>(null);
  const [editedText, setEditedText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("dagbok-history");
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch {
        // ignorera fel
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("dagbok-history", JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    async function fetchEntries() {
      try {
        const res = await fetch("/api/diary", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data)) return;
        setEntries(
          data.map((item) => ({
            id: item.id,
            createdAt: item.createdAt,
            originalText: typeof item.text === "string" ? item.text : "",
            translatedText: typeof item.translatedText === "string" ? item.translatedText : null
          }))
        );
      } catch (err) {
        console.error("Kunde inte hämta sparade skanningar:", err);
      }
    }

    fetchEntries();
  }, []);

  function addToHistory(text: string) {
    const item: HistoryItem = {
      id: `${Date.now()}`,
      createdAt: new Date().toLocaleString("sv-SE"),
      text
    };
    setHistory((prev) => [item, ...prev].slice(0, 10));
  }

  async function handleScan(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setRawText(null);
    setEditedText("");

    if (!file) {
      setError("Välj en bild först.");
      return;
    }

    try {
      setLoadingOcr(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/ocr", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        setError("Kunde inte skanna dagbokssidan.");
        return;
      }

      const original = typeof data.original === "string" ? data.original : data.text ?? "";
      const translated = typeof data.translated === "string" ? data.translated : "";
      const finalRaw = original ?? "";
      const finalEdited = translated || finalRaw || "";

      setRawText(finalRaw);
      setEditedText(finalEdited);
      addToHistory(finalEdited || finalRaw);
    } catch (err: any) {
      setError(err.message || "Något gick fel vid OCR.");
    } finally {
      setLoadingOcr(false);
    }
  }

  async function handleClean() {
    if (!editedText.trim()) return;
    try {
      setLoadingClean(true);
      setError(null);

      const res = await fetch("/api/clean", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: editedText })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Fel vid städning.");
      }

      setEditedText(data.cleanedText);
    } catch (err: any) {
      setError(err.message || "Något gick fel vid städning.");
    } finally {
      setLoadingClean(false);
    }
  }

  async function handleCopy() {
    if (!editedText) return;
    try {
      await navigator.clipboard.writeText(editedText);
      alert("Texten kopierad till urklipp.");
    } catch {
      alert("Kunde inte kopiera texten (webbläsarbegränsning).");
    }
  }

  function handleDownloadPdf() {
    if (!editedText) return;
    const doc = new jsPDF();
    const margin = 10;
    const maxWidth = 180;

    const lines = doc.splitTextToSize(editedText, maxWidth);
    doc.text(lines, margin, margin + 10);

    doc.save("dagbok-ocr.pdf");
  }

  function handleSendEmail() {
    if (!editedText) return;
    const subject = encodeURIComponent("Dagboks-OCR " + new Date().toLocaleDateString("sv-SE"));
    const body = encodeURIComponent(editedText);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  function handleUseText(original: string, translated?: string | null) {
    setRawText(original);
    setEditedText(translated || original || "");
  }

  async function handleDeleteEntry(id: string) {
    const confirmed = confirm("Vill du ta bort den här skanningen?");
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/diary?id=${id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        alert("Kunde inte ta bort skanningen. Försök igen.");
        return;
      }

      setEntries((prev) => prev.filter((entry) => entry.id !== id));
    } catch (err) {
      console.error(err);
      alert("Ett fel uppstod vid borttagning.");
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1.5rem" }}>Dagboksskanner</h1>

      <form onSubmit={handleScan} style={{ marginBottom: "1.5rem" }}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <button
          type="submit"
          style={{
            display: "block",
            marginTop: "20px",
            padding: "10px 24px",
            background: "#2563eb",
            color: "white",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            fontSize: "1rem"
          }}
          disabled={loadingOcr}
        >
          {loadingOcr ? "Tolkar bild..." : "Skanna dagbokssida"}
        </button>
      </form>

      {error && <p style={{ color: "red", marginBottom: "1rem" }}>{error}</p>}

      {(rawText || editedText) && (
        <div className="space-y-6 mt-6">
          <div>
            <h3 className="text-lg font-semibold text-neutral-200">
              OCR ORIGINAL (språk upptäcks automatiskt)
            </h3>
            <textarea
              value={rawText ?? ""}
              onChange={(e) => setRawText(e.target.value)}
              rows={8}
              className="w-full rounded-md bg-neutral-900 border border-neutral-700 p-3 text-sm text-neutral-100"
              placeholder="Här visas texten som OCR hittade…"
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-neutral-200">SVENSK ÖVERSÄTTNING</h3>
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              rows={8}
              className="w-full rounded-md bg-neutral-900 border border-neutral-700 p-3 text-sm text-neutral-100"
              placeholder="Här visas den svenska versionen…"
            />

            <div className="flex flex-wrap gap-3 mt-4 text-sm">
              <button
                type="button"
                onClick={handleCopy}
                className="px-4 py-2 rounded-md bg-neutral-800 text-white hover:bg-neutral-700 transition"
              >
                Kopiera text
              </button>
              <button
                type="button"
                onClick={handleClean}
                disabled={loadingClean}
                className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loadingClean ? "Städar..." : "Städa/formattera text"}
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="px-4 py-2 rounded-md bg-slate-600 text-white hover:bg-slate-500 transition"
              >
                Ladda ner som PDF
              </button>
              <button
                type="button"
                onClick={handleSendEmail}
                className="px-4 py-2 rounded-md bg-pink-600 text-white hover:bg-pink-500 transition"
              >
                Skicka som e-post
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: "2rem" }}>
        <h3>Skanningar sparade i databasen</h3>
        {entries.length === 0 ? (
          <p style={{ color: "#6b7280", marginTop: "0.5rem" }}>
            Inga sparade skanningar ännu. Använd sidan "Dagbok" för att spara nya poster.
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {entries.map((entry) => (
              <li
                key={entry.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: "0.75rem 1rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "0.75rem"
                }}
              >
                <button
                  onClick={() => handleUseText(entry.originalText, entry.translatedText)}
                  style={{
                    flex: 1,
                    background: "none",
                    border: "none",
                    textAlign: "left",
                    padding: 0,
                    cursor: "pointer"
                  }}
                >
                  <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                    {new Date(entry.createdAt).toLocaleString("sv-SE")}
                  </div>
                  <div style={{ fontWeight: 500 }}>
                    {entry.originalText.slice(0, 140)}
                    {entry.originalText.length > 140 ? "…" : ""}
                  </div>
                  {entry.translatedText && (
                    <div style={{ fontSize: "0.85rem", color: "#4b5563", marginTop: "0.25rem" }}>
                      {entry.translatedText.slice(0, 160)}
                      {entry.translatedText.length > 160 ? "…" : ""}
                    </div>
                  )}
                </button>

                <button
                  onClick={() => handleDeleteEntry(entry.id)}
                  title="Ta bort den här skanningen"
                  style={{
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    fontSize: "1.2rem"
                  }}
                >
                  🗑
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {history.length > 0 && (
        <div>
          <h3>Tidigare skanningar (lokal historik)</h3>
          <ul style={{ paddingLeft: "1.2rem" }}>
            {history.map((item) => (
              <li key={item.id} style={{ marginBottom: "0.5rem" }}>
                <strong>{item.createdAt}</strong>{" "}
                –{" "}
                <span
                  style={{ cursor: "pointer", textDecoration: "underline" }}
                  onClick={() => handleUseText(item.text)}
                >
                  ladda in
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
