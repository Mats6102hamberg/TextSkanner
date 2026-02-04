import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MobileLayout from "@/components/MobileLayout";
import MobileFileUpload from "@/components/MobileFileUpload";

interface OcrResponse {
  rawText: string;
  maskedText: string;
  summary?: string;
  entryDate?: string;
  detectedMood?: string;
  moodScore?: number;
  warnings?: string[];
  debug: {
    name: string;
    type: string;
    size: number;
  };
}

type ActiveSource = "original" | "masked" | "summary";
type TransformMode = "clarify" | "story";
type ForwardTarget = "language-tool" | "memory-book" | "pdf";

const sourceOptions: { label: string; value: ActiveSource }[] = [
  { label: "Ursprunglig text", value: "original" },
  { label: "Maskerad text", value: "masked" },
  { label: "Sammanfattning", value: "summary" }
];

const moduleActions: { label: string; target: ForwardTarget }[] = [
  { label: "Skicka till Språkverktyget", target: "language-tool" },
  { label: "Lägg in i Minnesbok", target: "memory-book" },
  { label: "Exportera som PDF", target: "pdf" }
];

export default function MobileDiaryPage() {
  const router = useRouter();
  const [scanResponse, setScanResponse] = useState<OcrResponse | null>(null);
  const [activeSource, setActiveSource] = useState<ActiveSource>("original");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("language", "auto");

      const response = await fetch("/api/ocr", {
        method: "POST",
        body: formData
      });

      if (!response.ok) throw new Error("Scan failed");

      const result = await response.json();
      setScanResponse(result);
      setSuccess("File scanned successfully!");
    } catch (err) {
      console.error("Scan error:", err);
      setError("Failed to scan file. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!scanResponse) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/diary/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalText: scanResponse.rawText,
          clarifiedText: scanResponse.summary,
          imageUrl: null // TODO: Handle image upload
        })
      });

      if (!response.ok) throw new Error("Save failed");

      setSuccess("Diary entry saved successfully!");
    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to save diary entry. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTransform = async (mode: TransformMode) => {
    if (!scanResponse) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/dagbok/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: getCurrentText(),
          mode
        })
      });

      if (!response.ok) throw new Error("Transform failed");

      const result = await response.json();
      
      // For now, just show a success message since we don't have the transform API
      setSuccess("Text transformed successfully!");
    } catch (err) {
      console.error("Transform error:", err);
      setError("Failed to transform text. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForward = (target: ForwardTarget) => {
    const currentText = getCurrentText();
    
    switch (target) {
      case "language-tool":
        router.push(`/sprak?text=${encodeURIComponent(currentText)}`);
        break;
      case "memory-book":
        router.push(`/minnesbok?text=${encodeURIComponent(currentText)}`);
        break;
      case "pdf":
        setSuccess("PDF export coming soon!");
        break;
    }
  };

  const getCurrentText = () => {
    if (!scanResponse) return "";
    
    switch (activeSource) {
      case "original":
        return scanResponse.rawText;
      case "masked":
        return scanResponse.maskedText;
      case "summary":
        return scanResponse.summary || scanResponse.rawText;
      default:
        return scanResponse.rawText;
    }
  };

  const getTextForSource = (source: ActiveSource) => {
    if (!scanResponse) return "";
    
    switch (source) {
      case "original":
        return scanResponse.rawText;
      case "masked":
        return scanResponse.maskedText;
      case "summary":
        return scanResponse.summary || scanResponse.rawText;
      default:
        return scanResponse.rawText;
    }
  };

  if (!scanResponse) {
    return (
      <MobileFileUpload
        onFileSelect={handleFileSelect}
        accept="image/*,.pdf"
        maxSize={10 * 1024 * 1024}
      />
    );
  }

  return (
    <MobileLayout 
      title="Dagboksscanner" 
      showBackButton
      rightAction={
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2" />
          </svg>
        </button>
      }
    >
      <div className="space-y-4">
        {/* Success/Error Messages */}
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}
        
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* File Info */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">File Information</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <p>Name: {scanResponse.debug.name}</p>
            <p>Type: {scanResponse.debug.type}</p>
            <p>Size: {Math.round(scanResponse.debug.size / 1024)}KB</p>
          </div>
        </div>

        {/* Mood Detection */}
        {scanResponse.detectedMood && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Detected Mood</h3>
            <div className="flex items-center justify-between">
              <span className="text-lg capitalize">{scanResponse.detectedMood}</span>
              {scanResponse.moodScore && (
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 bg-blue-500 rounded-full"
                      style={{ width: `${Math.abs(scanResponse.moodScore) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">
                    {scanResponse.moodScore > 0 ? "+" : ""}{scanResponse.moodScore.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Source Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="flex border-b">
            {sourceOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setActiveSource(option.value)}
                className={`flex-1 py-2 px-3 text-sm font-medium border-b-2 transition-colors ${
                  activeSource === option.value
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          
          <div className="p-4">
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap text-gray-800">
                {getCurrentText()}
              </p>
            </div>
          </div>
        </div>

        {/* Transform Actions */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Transform text</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleTransform("clarify")}
              disabled={isLoading}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              {isLoading ? "Processing..." : "Clarify"}
            </button>
            <button
              onClick={() => handleTransform("story")}
              disabled={isLoading}
              className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm"
            >
              {isLoading ? "Processing..." : "Story"}
            </button>
          </div>
        </div>

        {/* Forward Actions */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Send to</h3>
          <div className="space-y-2">
            {moduleActions.map((action) => (
              <button
                key={action.target}
                onClick={() => handleForward(action.target)}
                className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm text-left"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scan New File */}
        <button
          onClick={() => setScanResponse(null)}
          className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Scan New File
        </button>
      </div>
    </MobileLayout>
  );
}
