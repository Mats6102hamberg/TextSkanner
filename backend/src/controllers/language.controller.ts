import { Request, Response } from "express";
import { processLanguageRequest } from "../services/languageProcessor";

export async function handleLanguageProcess(req: Request, res: Response) {
  try {
    const { mode, text } = req.body ?? {};
    console.log("[language/process] mode:", mode, "text length:", text?.length);

    if (!mode || !text) {
      return res.status(400).json({ 
        error: "Både 'mode' och 'text' krävs i request body." 
      });
    }

    const result = await processLanguageRequest({ mode, text });
    return res.json({ result });
  } catch (error) {
    console.error("[language/process] error:", error);
    const message = error instanceof Error ? error.message : "Språkbearbetningen misslyckades";
    return res.status(500).json({ error: message });
  }
}
