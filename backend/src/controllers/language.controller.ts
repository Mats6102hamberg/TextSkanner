import { Request, Response } from "express";

export function handleLanguageProcess(req: Request, res: Response) {
  const { mode, text } = req.body ?? {};
  console.log("[language/process] mode:", mode, "text:", text);
  return res.json({ result: "Språk-endpointen svarar (dummy)." });
}
