"use client";

import { useState, FormEvent } from "react";
import { runOcrOnImage, type OcrResult } from "@/services/ocrApi";

export function DiaryScanner() {
  const [imageUrl, setImageUrl] = useState("");
  const [result, setResult] = useState<OcrResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!imageUrl.trim()) {
      setError("Klistra in en bildadress (URL) först.");
      return;
    }

    try {
      setLoading(true);
      const data = await runOcrOnImage({ imageUrl: imageUrl.trim() });
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError("Något gick fel vid OCR-anropet.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <h2>Dagboksskanner (testversion)</h2>
      <p>
        Just nu använder vi en mockad OCR i backend. Senare kopplar vi på riktig
        bildtolkning (t.ex. via AI).
      </p>

      <form
        onSubmit={handleSubmit}
        style={{ display: "grid", gap: "0.5rem", marginBottom: "1rem" }}
      >
        <input
          placeholder="Klistra in länk till bild (t.ex. https://...)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          style={{ padding: "0.5rem" }}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Läser..." : "Skanna bild"}
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {result && (
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 6,
            padding: "0.75rem",
            marginTop: "1rem",
            whiteSpace: "pre-wrap"
          }}
        >
          <h3>OCR-resultat</h3>
          <p>{result.text}</p>
          <p style={{ fontSize: "0.8rem", color: "#666" }}>
            Källa: {result.source}, confidence: {result.confidence}
          </p>
        </div>
      )}
    </div>
  );
}
