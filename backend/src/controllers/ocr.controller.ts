import { Request, Response, NextFunction } from "express";
import { z } from "zod";

const ocrRequestSchema = z.object({
  imageData: z.string().optional(),
  imageUrl: z.string().url().optional()
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

    res.json({
      text: fakeText,
      source: parsed.imageUrl ? "imageUrl" : "imageData",
      confidence: 0.42
    });
  } catch (err) {
    next(err);
  }
}
