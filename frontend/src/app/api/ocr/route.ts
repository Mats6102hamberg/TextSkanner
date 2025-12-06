import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const MAX_RAW_TEXT_PREVIEW = 1000;
const SUMMARY_INPUT_LIMIT = 4000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const fileEntry = formData.get("file");
    const file = fileEntry instanceof Blob ? (fileEntry as File) : null;
    const language = ((formData.get("language") as string | null) || "auto").trim();

    if (!file) {
      return NextResponse.json(
        { error: "Ingen fil mottagen i Dagboksscanner." },
        { status: 400 }
      );
    }

    const mime = file.type || "";
    if (!mime.includes("pdf") && !mime.startsWith("image/")) {
      return NextResponse.json(
        {
          error: `Ogiltigt filformat (${mime || "okänd"}). Ladda upp PDF eller bild.`
        },
        { status: 415 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const text = await runOcrOnBuffer(buffer, mime, language);

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "OCR hittade ingen text i PDF:en." },
        { status: 422 }
      );
    }

    const rawPreview = text.slice(0, MAX_RAW_TEXT_PREVIEW);
    const warnings: string[] = [];

    let maskedText: string;
    try {
      maskedText = maskSensitiveText(text);
    } catch (maskError) {
      console.error("Maskering misslyckades:", maskError);
      warnings.push("Maskeringen misslyckades – visar originaltext.");
      maskedText = text;
    }

    let summary: string | null = null;
    try {
      summary = await summarizeDiary(maskedText ?? text, language);
    } catch (summaryError) {
      console.error("Sammanfattning misslyckades:", summaryError);
      warnings.push("Sammanfattning misslyckades – visar endast text.");
    }

    return NextResponse.json({
      ok: true,
      rawText: rawPreview,
      maskedText,
      summary,
      warnings: warnings.length ? warnings : undefined,
      debug: {
        name: file.name,
        type: mime,
        size: buffer.byteLength
      }
    });
  } catch (error) {
    console.error("Dagboksscanner POST error:", error);
    return NextResponse.json(
      { error: "Något gick fel i Dagboksscannern (serverfel)." },
      { status: 500 }
    );
  }
}

async function runOcrOnBuffer(buffer: Buffer, mime: string, language: string) {
  const base64 = buffer.toString("base64");
  const sourceLanguageInstruction =
    language === "auto"
      ? "Försök först avgöra vilket språk texten är på. Läs sedan av all text så noggrant som möjligt."
      : `Texten är på språket "${language}". Läs av den exakt som den står.`;

  const prompt = `
${sourceLanguageInstruction}

Regler:
- Returnera bara råtexten från dokumentet/bilden.
- Ta inte med egna kommentarer eller rubriker.
- Översätt inte texten.
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: {
              url: `data:${mime};base64,${base64}`
            }
          }
        ]
      }
    ]
  });

  return completion.choices[0]?.message?.content?.trim() ?? "";
}

function maskSensitiveText(input: string | null | undefined): string {
  if (!input || !input.trim()) {
    return input ?? "";
  }

  return input
    .replace(/\b(\d{6}|\d{8})[-+]\d{4}\b/g, "[MASKERAT PERSONNUMMER]")
    .replace(/\b(?:\+46|0)([\s-]?\d){7,}\b/g, "[MASKERAT TELEFONNUMMER]")
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}/g, "[MASKERAD E-POST]")
    .replace(/\b([A-ZÅÄÖ][a-zåäö]+(?:gatan|vägen|gränden|road|street|avenue))\s+\d+[A-Z]?\b/g,
      "[MASKERAD ADRESS]")
    .replace(/\b\d{6}-\d{4}\b/g, "[MASKERAT ORGNR]")
    .replace(/\b\d{3,5}[- ]?\d{4}\b/g, "[MASKERAT KONTONR]");
}

async function summarizeDiary(text: string, language: string) {
  if (!text || !text.trim()) {
    return null;
  }

  const summaryInput = text.slice(0, SUMMARY_INPUT_LIMIT);
  const systemPrompt =
    language === "auto"
      ? "Du skriver korta, tydliga sammanfattningar av dagbokstext."
      : `Du skriver korta sammanfattningar av dagbokstext på språket \"${language}\".`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: `Sammanfatta kärnan i följande text på högst 3 meningar:\n\n${summaryInput}`
      }
    ]
  });

  return completion.choices[0]?.message?.content?.trim() ?? null;
}
