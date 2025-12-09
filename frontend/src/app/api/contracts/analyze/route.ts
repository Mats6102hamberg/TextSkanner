// Entry point för Avtalskollens filbaserade analysflöde (stödjer både PDF och bilder)
import { NextRequest, NextResponse } from "next/server";
import { runOcrOnBuffer } from "@/app/api/ocr/route-helpers";
import {
  aggregatedToSummary,
  analyzeContractFromText
} from "@/lib/contracts/analyzeText";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const fileEntry = formData.get("file");
    const mode = typeof formData.get("mode") === "string" ? String(formData.get("mode")) : "quick";
    const saveMode =
      typeof formData.get("saveMode") === "string" ? String(formData.get("saveMode")) : "temp";

    if (!(fileEntry instanceof Blob)) {
      return NextResponse.json(
        { ok: false, error: "Ingen fil mottagen i fältet 'file'." },
        { status: 400 }
      );
    }
    const file = fileEntry as File;
    const fileName = (file as { name?: string }).name ?? "uploaded.pdf";
    const contentType = file.type || "application/octet-stream";

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let rawText: string | null = null;
    if (contentType.startsWith("image/")) {
      // Bilder → OCR
      rawText = await runOcrOnBuffer(buffer, contentType, "auto");
    } else if (contentType === "application/pdf") {
      // PDF → pdf-parse
      rawText = await extractTextFromPdf(buffer);
    } else if (contentType === "text/plain") {
      // Ren textfil → läs som UTF-8
      rawText = buffer.toString("utf8");
    } else {
      return NextResponse.json(
        { ok: false, error: `Unsupported MIME type: ${contentType}` },
        { status: 400 }
      );
    }

    if (!rawText?.trim()) {
      if (contentType === "application/pdf") {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Kunde inte läsa text från PDF:en. Kontrollera kvaliteten eller testa en annan fil."
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { ok: false, error: "Kunde inte läsa text från filen. Kontrollera kvaliteten och försök igen." },
        { status: 422 }
      );
    }

    const { aggregated } = await analyzeContractFromText({
      text: rawText,
      language: "auto",
      modes: undefined
    });

    const summary = aggregatedToSummary(aggregated);

    return NextResponse.json(
      {
        ok: true,
        data: {
          ...summary,
          sourceFileName: fileName,
          mode,
          saveMode
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in /api/contracts/analyze:", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Kunde inte analysera avtalet. Försök igen eller testa en annan fil."
      },
      { status: 500 }
    );
  }
}

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const pdfParseModule = await import("pdf-parse");
    const pdfParse = (pdfParseModule.default ?? pdfParseModule) as unknown as (
      input: Buffer
    ) => Promise<{ text?: string }>;
    const result = await pdfParse(buffer);
    return result.text?.trim() ?? "";
  } catch (error) {
    console.error("PDF-extraktion misslyckades:", error);
    return "";
  }
}

