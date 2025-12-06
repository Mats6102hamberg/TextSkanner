import { Router, Request, Response } from "express";
import { analyzeContractText } from "../services/contractAnalyzer";
import { maskSensitiveData } from "../utils/masking";

const router = Router();

type AnalyzeContractRequestBody = {
  rawText?: string;
  language?: string;
};

router.post(
  "/analyze",
  async (
    req: Request<unknown, unknown, AnalyzeContractRequestBody>,
    res: Response
  ) => {
    try {
      const { rawText, language } = req.body;

      if (!rawText || typeof rawText !== "string") {
        return res.status(400).json({ error: "rawText krävs" });
      }

      const maskedText = maskSensitiveData(rawText);
      const analysis = await analyzeContractText(maskedText, language);

      return res.json({
        maskedText,
        analysis,
      });
    } catch (err) {
      console.error("Contract analysis error:", err);
      return res.status(500).json({ error: "Analysis failed" });
    }
  }
);

export default router;
