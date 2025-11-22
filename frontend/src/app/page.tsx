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
  const [emailFeedback, setEmailFeedback] = useState<string | null>(null);

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

  function handleDeleteHistoryItem(id: string) {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("dagbok-history", JSON.stringify(updated));
      }
      return updated;
    });
  }

  function handleClearHistory() {
    setHistory([]);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("dagbok-history");
    }
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

    setEmailFeedback("E-postfönster öppnades. Kontrollera ditt mejlprogram.");
    setTimeout(() => setEmailFeedback(null), 4000);
  }

  function handleUseText(original: string, translated?: string | null) {
    setRawText(original);
    setEditedText(translated || original || "");
  }

  async function handleDeleteEntry(id: string) {
    const confirmed = confirm("Vill du ta bort den här skanningen?");
    if (!confirmed) return;

    // Optimistisk uppdatering - ta bort från UI direkt
    const prevEntries = entries;
    setEntries((prev) => prev.filter((entry) => entry.id !== id));

    try {
      const res = await fetch(`/api/diary/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        // Återställ vid fel
        setEntries(prevEntries);
        alert("Kunde inte ta bort skanningen. Försök igen.");
        return;
      }
    } catch (err) {
      // Återställ vid fel
      setEntries(prevEntries);
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
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-neutral-200">
                OCR ORIGINAL (språk upptäcks automatiskt)
              </h3>
              <button
                type="button"
                onClick={() => setRawText("")}
                className="text-red-400 hover:text-red-300 transition"
                aria-label="Rensa OCR-text"
              >
                🗑️
              </button>
            </div>
            <textarea
              value={rawText ?? ""}
              onChange={(e) => setRawText(e.target.value)}
              rows={8}
              className="w-full rounded-md bg-neutral-900 border border-neutral-700 p-3 text-sm text-neutral-100"
              placeholder="Här visas texten som OCR hittade…"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-neutral-200">SVENSK ÖVERSÄTTNING</h3>
              <button
                type="button"
                onClick={() => setEditedText("")}
                className="text-red-400 hover:text-red-300 transition"
                aria-label="Rensa svensk översättning"
              >
                🗑️
              </button>
            </div>
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
                style={{
                  padding: "10px 18px",
                  borderRadius: 999,
                  border: "none",
                  backgroundColor: "#111827",
                  color: "#ffffff",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(17,24,39,0.3)",
                  fontWeight: 600
                }}
              >
                Kopiera text
              </button>
              <button
                type="button"
                onClick={handleClean}
                disabled={loadingClean}
                style={{
                  padding: "10px 18px",
                  borderRadius: 999,
                  border: "none",
                  backgroundColor: loadingClean ? "#15803d" : "#22c55e",
                  color: "#0f172a",
                  cursor: loadingClean ? "not-allowed" : "pointer",
                  opacity: loadingClean ? 0.8 : 1,
                  fontWeight: 600
                }}
              >
                {loadingClean ? "Städar..." : "Städa/formattera text"}
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                style={{
                  padding: "10px 18px",
                  borderRadius: 999,
                  border: "none",
                  backgroundColor: "#475569",
                  color: "#f8fafc",
                  cursor: "pointer",
                  fontWeight: 600
                }}
              >
                Ladda ner som PDF
              </button>
              <button
                type="button"
                onClick={handleSendEmail}
                style={{
                  padding: "10px 18px",
                  borderRadius: 999,
                  border: "none",
                  backgroundColor: "#db2777",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 600,
                  boxShadow: "0 4px 16px rgba(219,39,119,0.35)"
                }}
              >
                Skicka som e-post
              </button>
            </div>

            {emailFeedback && (
              <div
                role="status"
                style={{
                  marginTop: "0.75rem",
                  padding: "0.65rem 0.85rem",
                  borderRadius: 12,
                  backgroundColor: "#fdf2f8",
                  color: "#be185d",
                  fontSize: "0.9rem",
                  fontWeight: 500
                }}
              >
                {emailFeedback}
              </div>
            )}
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
              <li key={entry.id}>
                <div className="flex items-center justify-between bg-neutral-900 border border-neutral-800 p-3 rounded-lg gap-3">
                  <button
                    type="button"
                    onClick={() => handleUseText(entry.originalText, entry.translatedText)}
                    className="flex-1 text-left"
                  >
                    <p className="text-gray-300 text-sm truncate">{entry.originalText}</p>
                    {entry.translatedText && (
                      <p className="text-gray-400 text-xs truncate mt-1">{entry.translatedText}</p>
                    )}
                    <p className="text-gray-500 text-[0.7rem] mt-1">
                      {new Date(entry.createdAt).toLocaleString("sv-SE")}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteEntry(entry.id)}
                    title="Ta bort den här skanningen"
                    className="text-red-400 hover:text-red-300 transition ml-3"
                    aria-label="Ta bort skanning"
                  >
                    🗑️
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {history.length > 0 && (
        <div>
          <h3>Tidigare skanningar (lokal historik)</h3>
          <button
            type="button"
            onClick={handleClearHistory}
            className="text-red-500 hover:text-red-300 text-sm mb-3"
          >
            🗑️ Töm historik
          </button>
          <ul className="mt-3 space-y-2">
            {history.map((item) => (
              <li key={item.id}>
                <div className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-lg p-3 gap-3">
                  <div className="flex-1 text-sm text-neutral-100">
                    <div className="text-xs text-neutral-500">
                      {item.createdAt}
                    </div>
                    <p className="mt-1 text-sm text-neutral-200 line-clamp-2">
                      {item.text}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleUseText(item.text)}
                      className="mt-2 text-xs text-blue-300 hover:text-blue-200 underline"
                    >
                      Ladda in text
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteHistoryItem(item.id)}
                    className="text-red-400 hover:text-red-300 transition ml-2"
                    aria-label="Ta bort historikpost"
                  >
                    🗑️
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
