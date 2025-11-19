"use client";

import { FormEvent, useEffect, useState } from "react";
import { jsPDF } from "jspdf";

type HistoryItem = {
  id: string;
  createdAt: string;
  text: string;
};

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [loadingOcr, setLoadingOcr] = useState(false);
  const [loadingClean, setLoadingClean] = useState(false);
  const [rawText, setRawText] = useState<string | null>(null);
  const [editedText, setEditedText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

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
          </div>
        </div>
      )}

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
                  onClick={() => {
                    setRawText(item.text);
                    setEditedText(item.text);
                  }}
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
