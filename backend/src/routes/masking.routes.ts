import { Router, Request, Response } from "express";
import { maskText, MaskingOptions } from "../services/masking.service";

const router = Router();

/**
 * POST /api/masking/process
 * Body: { text: string, options?: MaskingOptions }
 */
router.post("/process", (req: Request, res: Response) => {
  try {
    const { text, options } = req.body as {
      text?: string;
      options?: MaskingOptions;
    };

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "text is required and must be a string" });
    }

    const result = maskText(text, options);

    return res.json({
      originalText: result.originalText,
      maskedText: result.maskedText,
      changes: result.changes,
    });
  } catch (err) {
    console.error("Masking error:", err);
    return res.status(500).json({ error: "Internal masking error" });
  }
});

export default router;
