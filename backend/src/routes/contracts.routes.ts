import { Router } from "express";
import { analyzeContractText } from "../services/contractAnalyzer";

const router = Router();

router.post("/analyze", async (req, res) => {
  try {
    const { rawText, language } = req.body;

    if (!rawText || typeof rawText !== "string") {
      return res.status(400).json({ error: "rawText krävs" });
    }

    const result = await analyzeContractText(rawText, language);
    return res.json(result);
  } catch (err) {
    console.error("Contract analysis error:", err);
    return res.status(500).json({ error: "Analysis failed" });
  }
});

export default router;
