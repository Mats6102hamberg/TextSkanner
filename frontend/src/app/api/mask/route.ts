import { NextRequest, NextResponse } from "next/server";

import { maskSensitiveData } from "@/lib/maskSensitiveData";
import { runOcrOnBuffer } from "../ocr/route-helpers";

export const runtime = "nodejs";

type MaskingSuccessResponse = {
  ok: true;
  rawText: string;
  maskedText: string;
  warning: string | null;
};

type MaskingErrorResponse = {
  ok: false;
  error: string;
};

type MaskingResponse = MaskingSuccessResponse | MaskingErrorResponse;

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      return await handleFileMasking(req);
    }

    return await handleTextMasking(req);
  } catch (error) {
    console.error("/api/mask error:", error);
    return NextResponse.json<MaskingErrorResponse>(
      { ok: false, error: "Maskerings-API:t misslyckades (serverfel)." },
      { status: 500 }
    );
  }
}

async function handleTextMasking(req: NextRequest) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch (error) {
    console.error("/api/mask json error:", error);
    return NextResponse.json<MaskingErrorResponse>(
      { ok: false, error: "Skicka text att maskera som JSON ({ text })." },
      { status: 400 }
    );
  }

  const text =
    typeof payload === "object" && payload !== null && typeof (payload as { text?: unknown }).text === "string"
      ? ((payload as { text?: string }).text ?? "").trim()
      : "";

  if (!text) {
    return NextResponse.json<MaskingErrorResponse>(
      { ok: false, error: "Klistra in text att maskera." },
      { status: 400 }
    );
  }

  const masked = await safeMask(text);
  return NextResponse.json<MaskingSuccessResponse>({ ok: true, ...masked });
}

async function handleFileMasking(req: NextRequest) {
  const formData = await req.formData();
  const fileEntry = formData.get("file");
  const file = fileEntry instanceof Blob ? (fileEntry as File) : null;

  if (!file) {
    return NextResponse.json<MaskingErrorResponse>(
      { ok: false, error: "Ingen fil mottagen för maskering." },
      { status: 400 }
    );
  }

  const mime = file.type || "";
  if (!isSupportedMime(mime)) {
    return NextResponse.json<MaskingErrorResponse>(
      { ok: false, error: "Ogiltigt filformat. Ladda upp PDF eller bild." },
      { status: 415 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const text = await runOcrOnBuffer(buffer, mime, "auto");

  if (!text || !text.trim()) {
    return NextResponse.json<MaskingErrorResponse>(
      { ok: false, error: "Kunde inte läsa text ur filen." },
      { status: 422 }
    );
  }

  const masked = await safeMask(text);
  return NextResponse.json<MaskingSuccessResponse>({ ok: true, ...masked });
}

async function safeMask(text: string) {
  try {
    const maskedText = await maskSensitiveData(text);
    return {
      rawText: text,
      maskedText,
      warning: null as string | null
    };
  } catch (error) {
    console.error("Maskering misslyckades:", error);
    return {
      rawText: text,
      maskedText: text,
      warning: "Maskeringen misslyckades – kontrollera texten innan du delar."
    };
  }
}

function isSupportedMime(mime: string) {
  if (!mime) {
    return false;
  }

  if (mime.includes("pdf")) {
    return true;
  }

  if (mime.startsWith("image/")) {
    return true;
  }

  return false;
}
