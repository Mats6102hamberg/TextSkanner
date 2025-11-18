"use client";

import { useState } from "react";

export default function DiaryPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError("");
    setResult("");
    setSaved(false);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/diary", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Något gick fel");
        setLoading(false);
        return;
      }

      setResult(data.text);
      setSaved(true);
    } catch (err) {
      setError("Serverfel, försök igen.");
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: "3rem" }}>
      <h1>Dagboksskanner</h1>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <button
        onClick={handleUpload}
        style={{
          marginTop: "20px",
          padding: "15px 30px",
          backgroundColor: "#3569f7",
          color: "white",
          borderRadius: "10px",
          border: "none",
          fontSize: "18px",
          cursor: "pointer"
        }}
      >
        Skanna dagbokssida
      </button>

      {loading && <p style={{ marginTop: "20px" }}>⏳ Skannar sidan...</p>}

      {error && (
        <p style={{ marginTop: "20px", color: "red" }}>⚠️ {error}</p>
      )}

      {result && (
        <div style={{ marginTop: "25px" }}>
          <h3>Resultat:</h3>
          <pre
            style={{
              background: "#f5f5f5",
              padding: "15px",
              whiteSpace: "pre-wrap",
              borderRadius: "8px"
            }}
          >
            {result}
          </pre>
        </div>
      )}

      {saved && (
        <p style={{ marginTop: "20px", color: "green" }}>
          ✔️ Sparat i databasen!
        </p>
      )}
    </div>
  );
}
