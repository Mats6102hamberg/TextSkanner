import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { maskText, getMaskingStats } from "../services/masking.service";

const ocrRequestSchema = z.object({
  imageData: z.string().optional(),
  imageUrl: z.string().url().optional(),
  applyMasking: z.boolean().optional().default(false)
});

export async function ocrFromImage(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const parsed = ocrRequestSchema.parse(req.body);

    if (!parsed.imageData && !parsed.imageUrl) {
      return res.status(400).json({
        error: "Skicka in imageData (base64) eller imageUrl."
      });
    }

    // TODO: här kopplar vi in riktig OCR senare.
    const fakeText =
      "Det här är en test-text från OCR-mock. Senare ersätter vi den med riktig OCR-tolkning av bilden.";

    // Apply masking if requested
    let finalText = fakeText;
    let maskingStats = null;

    if (parsed.applyMasking) {
      const maskingResult = maskText(fakeText);
      finalText = maskingResult.maskedText;
      maskingStats = getMaskingStats(maskingResult);
    }

    res.json({
      text: finalText,
      source: parsed.imageUrl ? "imageUrl" : "imageData",
      confidence: 0.42,
      masking: parsed.applyMasking ? {
        applied: true,
        stats: maskingStats
      } : {
        applied: false
      }
    });
  } catch (err) {
    next(err);
  }
}
