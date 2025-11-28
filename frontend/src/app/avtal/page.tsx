"use client";

import { FormEvent, useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import type { ContractAnalysisResult, ContractRiskLevel } from "@/types/contracts";

const palette = {
  primary: "#0A3A5E",
  accent: "#2B89D1",
  background: "#F7F9FB",
  text: "#1A1A1A"
};

const RISK_COLORS: Record<ContractRiskLevel, string> = {
  low: "#4CAF50",
  medium: "#FFC107",
  high: "#D32F2F"
};

const RISK_LABELS: Record<ContractRiskLevel, string> = {
  low: "Låg risk",
  medium: "Medelrisk",
  high: "Hög risk"
};

function RiskBadge({
  level,
  label
}: {
  level: ContractRiskLevel;
  label?: string;
}) {
  return (
    <span
      style={{
        backgroundColor: RISK_COLORS[level],
        color: "#fff",
        borderRadius: 999,
        padding: "0.35rem 0.9rem",
        fontWeight: 600,
        fontSize: "0.85rem",
        textTransform: "uppercase",
        letterSpacing: "0.03em"
      }}
    >
      {label ?? RISK_LABELS[level]}
    </span>
  );
}

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
  const [analysis, setAnalysis] = useState<ContractAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [openSectionId, setOpenSectionId] = useState<string | null>(null);
  const [saveMode, setSaveMode] = useState<"quick" | "portal">("quick");

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
      setAnalysis(null);
      setAnalysisError(null);
      setOpenSectionId(null);
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

  async function handleAnalyzeContract() {
    if (!editedText.trim()) {
      setAnalysisError("Lägg till text att analysera först.");
      return;
    }

    try {
      setIsAnalyzing(true);
      setAnalysisError(null);

      const res = await fetch("/api/contracts/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: editedText.trim(), language: "sv" })
      });

      const data: ContractAnalysisResult = await res.json();

      if (!res.ok) {
        throw new Error((data as any)?.error || "Kunde inte analysera avtalet.");
      }

      setAnalysis(data);
      setOpenSectionId(null);
    } catch (err: any) {
      setAnalysis(null);
      setAnalysisError(err?.message || "Kunde inte analysera avtalet just nu.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  function toggleSection(sectionId: string) {
    setOpenSectionId((prev) => (prev === sectionId ? null : sectionId));
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

      <section
        style={{
          borderRadius: 16,
          background: "#ffffff",
          padding: "20px",
          marginBottom: "24px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 12px 30px rgba(10,58,94,0.08)",
          color: palette.text
        }}
      >
        <h2 style={{ fontSize: "1.25rem", marginBottom: "0.75rem", color: palette.primary }}>
          📄 Ladda upp ett avtal eller dokument
        </h2>
        <p style={{ marginBottom: "0.5rem", lineHeight: 1.5 }}>
          Välj ett avtal i PDF- eller textformat och klicka på <strong>"Analysera avtal"</strong>. Du får en sammanfattning,
          riskbedömning och tolkning av nyckelvillkor.
        </p>
        <p style={{ marginBottom: "1rem", lineHeight: 1.5 }}>
          💡 Du väljer själv om avtalet ska sparas eller inte. All skanning är lokal till sessionen tills du aktivt väljer att spara.
        </p>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <label
            style={{
              flex: "1 1 220px",
              border: saveMode === "quick" ? "2px solid #0A3A5E" : "1px solid #cbd5f5",
              borderRadius: 12,
              padding: "14px",
              background: saveMode === "quick" ? "#E8F4FF" : "#f8fafc",
              cursor: "pointer"
            }}
          >
            <input
              type="radio"
              name="save-mode"
              value="quick"
              checked={saveMode === "quick"}
              onChange={() => setSaveMode("quick")}
              style={{ marginRight: "0.5rem" }}
            />
            <strong>Snabbkoll</strong>
            <p style={{ fontSize: "0.85rem", marginTop: "0.35rem", color: "#475467" }}>
              Avtalet sparas inte. Perfekt för känsliga dokument.
            </p>
          </label>

          <label
            style={{
              flex: "1 1 220px",
              border: saveMode === "portal" ? "2px solid #0A3A5E" : "1px solid #cbd5f5",
              borderRadius: 12,
              padding: "14px",
              background: saveMode === "portal" ? "#E8F4FF" : "#f8fafc",
              cursor: "pointer"
            }}
          >
            <input
              type="radio"
              name="save-mode"
              value="portal"
              checked={saveMode === "portal"}
              onChange={() => setSaveMode("portal")}
              style={{ marginRight: "0.5rem" }}
            />
            <strong>Spara i portalen</strong>
            <p style={{ fontSize: "0.85rem", marginTop: "0.35rem", color: "#475467" }}>
              Avtalet lagras så att du kan återkomma, köra ny analys och jämföra versioner.
            </p>
          </label>
        </div>

        <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#475467" }}>
          🔐 All skanning är lokal till sessionen tills du själv väljer att spara.
        </p>
      </section>

      <form onSubmit={handleScan} style={{ marginBottom: "1.5rem" }}>
        <p style={{ marginBottom: "0.75rem", color: "#475467" }}>
          Du kan nu ladda in ett avtal. Välj fil, klicka <strong>Analysera</strong> och bestäm om dokumentet ska sparas eller inte.
        </p>
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
              <button
                type="button"
                onClick={handleAnalyzeContract}
                disabled={isAnalyzing || !editedText.trim()}
                style={{
                  padding: "10px 18px",
                  borderRadius: 999,
                  border: "none",
                  backgroundColor: palette.primary,
                  color: "#fff",
                  cursor:
                    isAnalyzing || !editedText.trim() ? "not-allowed" : "pointer",
                  opacity: isAnalyzing || !editedText.trim() ? 0.75 : 1,
                  fontWeight: 600,
                  boxShadow: "0 6px 16px rgba(10,58,94,0.35)"
                }}
              >
                {isAnalyzing ? "Analyserar..." : "Analysera avtal (beta)"}
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

            {analysisError && (
              <div
                style={{
                  marginTop: "1rem",
                  padding: "0.85rem 1rem",
                  borderRadius: 12,
                  backgroundColor: "#FCE8E6",
                  color: "#B42318",
                  fontWeight: 500
                }}
              >
                {analysisError}
              </div>
            )}
          </div>

          {renderAnalysisPanel()}
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

  function renderAnalysisPanel() {
    if (!analysis) return null;

    const summaryCards = [
      { key: "short", title: "Kort sammanfattning", text: analysis.summaries.short },
      { key: "medium", title: "Mellanlång sammanfattning", text: analysis.summaries.medium },
      { key: "detailed", title: "Detaljerad analys", text: analysis.summaries.detailed },
      { key: "explainLike12", title: "Explain like 12", text: analysis.summaries.explainLike12 }
    ];

    const insightItems = [
      { title: "Parter", values: analysis.detectedParties },
      { title: "Datum", values: analysis.detectedDates },
      { title: "Belopp", values: analysis.detectedAmounts }
    ].filter((item) => Array.isArray(item.values) && item.values.length > 0);

    return (
      <section
        style={{
          marginTop: "2rem",
          backgroundColor: palette.background,
          borderRadius: 24,
          padding: "24px 28px",
          color: palette.text,
          boxShadow: "0 20px 45px rgba(10,58,94,0.08)"
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "1.5rem"
          }}
        >
          <div>
            <p style={{ color: palette.accent, fontWeight: 600, letterSpacing: "0.08em" }}>
              Avtalsanalys (beta)
            </p>
            <h2 style={{ color: palette.primary, fontSize: "1.5rem", marginTop: "0.25rem" }}>
              Övergripande riskbild
            </h2>
            {analysis.overallRiskReason && (
              <p style={{ marginTop: "0.35rem", maxWidth: "600px" }}>
                {analysis.overallRiskReason}
              </p>
            )}
          </div>
          <RiskBadge
            level={analysis.overallRisk}
            label={`Övergripande: ${RISK_LABELS[analysis.overallRisk]}`}
          />
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1rem"
          }}
        >
          {summaryCards.map((card) => (
            <div
              key={card.key}
              style={{
                backgroundColor: "#fff",
                borderRadius: 12,
                padding: "1rem 1.25rem",
                boxShadow: "0 10px 30px rgba(10,58,94,0.08)"
              }}
            >
              <p style={{ fontWeight: 600, color: palette.primary, marginBottom: "0.5rem" }}>
                {card.title}
              </p>
              <p style={{ lineHeight: 1.5 }}>{card.text}</p>
            </div>
          ))}
        </div>

        {insightItems.length > 0 && (
          <div style={{ marginTop: "1.75rem" }}>
            <h3 style={{ color: palette.primary, marginBottom: "0.75rem" }}>Identifierade fakta</h3>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              {insightItems.map((item) => (
                <div
                  key={item.title}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 16,
                    padding: "0.85rem 1.2rem",
                    boxShadow: "0 8px 20px rgba(10,58,94,0.08)"
                  }}
                >
                  <p style={{ fontWeight: 600, color: palette.accent }}>{item.title}</p>
                  <div style={{ marginTop: "0.35rem", display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                    {item.values!.map((value) => (
                      <span
                        key={`${item.title}-${value}`}
                        style={{
                          backgroundColor: palette.background,
                          padding: "0.25rem 0.6rem",
                          borderRadius: 999,
                          fontSize: "0.85rem",
                          color: palette.primary,
                          fontWeight: 500
                        }}
                      >
                        {value}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <h3 style={{ color: palette.primary }}>Viktiga sektioner</h3>
            <span style={{ color: palette.accent, fontWeight: 600 }}>
              {analysis.sections.length} st
            </span>
          </div>
          <div
            style={{
              marginTop: "1rem",
              borderRadius: 18,
              backgroundColor: "#fff",
              boxShadow: "0 15px 35px rgba(10,58,94,0.08)"
            }}
          >
            {analysis.sections.length === 0 ? (
              <p style={{ padding: "1.25rem", color: "#666" }}>
                Inga sektioner identifierades i analysen.
              </p>
            ) : (
              analysis.sections.map((section, index) => {
                const isOpen = openSectionId === section.id;
                return (
                  <div
                    key={section.id}
                    style={{
                      borderBottom:
                        index === analysis.sections.length - 1 ? "none" : "1px solid #E5E7EB"
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSection(section.id)}
                      style={{
                        width: "100%",
                        background: "transparent",
                        border: "none",
                        padding: "1rem 1.5rem",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        cursor: "pointer"
                      }}
                    >
                      <div style={{ textAlign: "left" }}>
                        <p style={{ fontWeight: 600, color: palette.text }}>
                          {section.heading || `Sektion ${index + 1}`}
                        </p>
                        <p style={{ color: "#6B7280", fontSize: "0.9rem" }}>
                          {section.category || "Kategori okänd"}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        {section.important && (
                          <span
                            style={{
                              padding: "0.2rem 0.6rem",
                              borderRadius: 999,
                              backgroundColor: palette.accent,
                              color: "#fff",
                              fontSize: "0.75rem",
                              fontWeight: 600
                            }}
                          >
                            Viktig
                          </span>
                        )}
                        <RiskBadge level={section.riskLevel} />
                        <span style={{ fontSize: "1.4rem", color: palette.primary }}>
                          {isOpen ? "−" : "+"}
                        </span>
                      </div>
                    </button>
                    {isOpen && (
                      <div style={{ padding: "0 1.5rem 1.5rem", lineHeight: 1.5 }}>
                        <p style={{ marginBottom: "0.75rem" }}>{section.text}</p>
                        {section.riskReason && (
                          <p style={{ color: "#475467" }}>
                            <strong>Varför:</strong> {section.riskReason}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div
          style={{
            marginTop: "2rem",
            borderRadius: 18,
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            padding: "1.25rem",
            boxShadow: "0 10px 25px rgba(10,58,94,0.06)"
          }}
        >
          <h3 style={{ margin: 0, color: palette.primary }}>📁 Sparade avtal</h3>
          <p style={{ margin: "0.5rem 0", color: "#475467", lineHeight: 1.5 }}>
            Här ligger dokument du valt att spara efter analys. Du kan när som helst öppna dem, göra ny analys eller ta bort dem.
          </p>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>📌 Tips: Spara endast avtal du behöver följa upp över tid.</p>

          <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              type="button"
              style={{
                flex: "1 1 160px",
                borderRadius: 10,
                backgroundColor: palette.primary,
                color: "#fff",
                border: "none",
                padding: "0.6rem 1rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Öppna avtal
            </button>
            <button
              type="button"
              style={{
                flex: "1 1 160px",
                borderRadius: 10,
                backgroundColor: palette.accent,
                color: "#fff",
                border: "none",
                padding: "0.6rem 1rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Ny analys
            </button>
            <button
              type="button"
              style={{
                flex: "1 1 160px",
                borderRadius: 10,
                backgroundColor: "#fff",
                color: palette.text,
                border: "1px solid #cbd5f5",
                padding: "0.6rem 1rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Ta bort
            </button>
          </div>
        </div>

        <div
          style={{
            marginTop: "2rem",
            borderRadius: 18,
            border: "1px solid #e2e8f0",
            backgroundColor: "#fff",
            padding: "1.5rem",
            boxShadow: "0 15px 35px rgba(10,58,94,0.08)",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem"
          }}
        >
          <h3 style={{ margin: 0, color: palette.primary }}>Analysklar! 🎉</h3>
          <p style={{ margin: 0, color: "#475467", lineHeight: 1.5 }}>
            Här är din avtalsgenomgång med sammanfattning, riskpunkter och viktiga delar att hålla koll på. Vad vill du göra med dokumentet?
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
            <button
              type="button"
              onClick={() => setSaveMode("portal")}
              style={{
                flex: "1 1 220px",
                border: saveMode === "portal" ? "2px solid #0A3A5E" : "1px solid #cbd5f5",
                borderRadius: 14,
                padding: "1rem",
                textAlign: "left",
                backgroundColor: saveMode === "portal" ? "#E8F4FF" : "#f8fafc",
                cursor: "pointer"
              }}
            >
              <strong style={{ display: "block", color: palette.primary }}>🔹 Spara avtalet i portalen</strong>
              <span style={{ fontSize: "0.9rem", color: "#475467" }}>
                Lagra avtalet så att du kan återkomma, analysera igen eller följa upp förändringar.
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSaveMode("quick")}
              style={{
                flex: "1 1 220px",
                border: saveMode === "quick" ? "2px solid #0A3A5E" : "1px solid #cbd5f5",
                borderRadius: 14,
                padding: "1rem",
                textAlign: "left",
                backgroundColor: saveMode === "quick" ? "#E8F4FF" : "#f8fafc",
                cursor: "pointer"
              }}
            >
              <strong style={{ display: "block", color: palette.primary }}>🔹 Behåll endast snabbkollen</strong>
              <span style={{ fontSize: "0.9rem", color: "#475467" }}>
                Avtalet raderas när du lämnar sidan. Inget sparas automatiskt.
              </span>
            </button>
          </div>

          <p style={{ margin: 0, color: "#475467", fontSize: "0.9rem" }}>
            🔐 All skanning är lokal tills du aktivt väljer att spara.
          </p>
        </div>
      </section>
    );
  }
}
