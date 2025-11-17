import { apiPost } from "./apiClient";

export type OcrResult = {
  text: string;
  source: string;
  confidence: number;
};

export async function runOcrOnImage(payload: {
  imageData?: string;
  imageUrl?: string;
}): Promise<OcrResult> {
  return apiPost("/ocr", payload);
}
