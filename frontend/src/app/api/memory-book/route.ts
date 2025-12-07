import { NextRequest, NextResponse } from "next/server";

import { maskSensitiveData } from "@/lib/maskSensitiveData";

import { openai, runOcrOnBuffer } from "../ocr/route-helpers";

export const runtime = "nodejs";

type MemoryBookChapter = {
  title: string;
  summary: string;
  keyMoments: string[];
};

type MemoryBookTimelineItem = {
  label: string;
  description: string;
};

type MemoryBookPerson = {
  name: string;
  description: string;
};

type MemoryBookAnalysis = {
  bookTitle: string;
  subtitle?: string;
  chapters: MemoryBookChapter[];
  timeline: MemoryBookTimelineItem[];
  people: MemoryBookPerson[];
  themes: string[];
  toneSummary: string;
  warning?: string | null;
};

interface MemoryBookResponse {
  ok: boolean;
  error?: string;
  source?: "files";
  fileCount?: number;
  rawText?: string;
  maskedText?: string;
  warning?: string | null;
  analysis?: MemoryBookAnalysis;
}

const MEMORY_BOOK_MODEL =
  process.env.OPENAI_MEMORY_BOOK_MODEL ?? "gpt-4.1-mini";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Skicka dagboksfiler som multipart/form-data (filuppladdning)." },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const fileEntries = formData.getAll("files");
    const files = fileEntries.filter((entry): entry is File => entry instanceof File);

    if (!files.length) {
      return NextResponse.json(
        { error: "Inga dagboksfiler mottagna." },
        { status: 400 }
      );
    }

    if (files.some((file) => !isSupportedMime(file.type || ""))) {
      return NextResponse.json(
        {
          error: "Ogiltigt filformat för en eller flera filer. Ladda upp PDF eller bild."
        },
        { status: 415 }
      );
    }

    const segments: string[] = [];
    const warnings: string[] = [];

    for (const [index, file] of files.entries()) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const text = await runOcrOnBuffer(buffer, file.type || "", "auto");

      if (!text || !text.trim()) {
        warnings.push(`Dagboksfil ${index + 1} kunde inte tydas av OCR.`);
        continue;
      }

      segments.push(`--- Dagboksfil ${index + 1}: ${file.name} ---\n\n${text.trim()}`);
    }

    if (!segments.length) {
      return NextResponse.json(
        {
          error:
            "Kunde inte läsa ut någon text ur dagboksfilerna. Kontrollera att dokumenten är tydliga."
        },
        { status: 422 }
      );
    }

    const combinedRawText = segments.join("\n\n");
    const { rawText, maskedText, warning: maskingWarning } = await safeMask(
      combinedRawText
    );

    if (maskingWarning) {
      warnings.push(maskingWarning);
    }

    const analysis = await analyzeMemoryBookText(maskedText);
    if (analysis.warning) {
      warnings.push(analysis.warning);
    }

    const combinedWarning = warnings.length ? warnings.join(" ") : null;

    const response: MemoryBookResponse = {
      ok: true,
      source: "files",
      fileCount: files.length,
      rawText,
      maskedText,
      warning: combinedWarning,
      analysis
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Minnesbok-route error:", error);
    return NextResponse.json(
      {
        error: "Något gick fel i Minnesboken (serverfel). Försök igen om en stund."
      },
      { status: 500 }
    );
  }
}

function isSupportedMime(mime: string) {
  if (!mime) return false;
  if (mime.includes("pdf")) return true;
  if (mime.startsWith("image/")) return true;
  return false;
}

async function safeMask(text: string) {
  let maskedText = text;
  let warning: string | null = null;

  try {
    maskedText = await maskSensitiveData(text);
  } catch (err) {
    console.error("Maskering misslyckades:", err);
    warning =
      "Maskeringen misslyckades delvis. Texten kan innehålla känsliga uppgifter – kontrollera innan du delar.";
    maskedText = text;
  }

  return {
    rawText: text,
    maskedText,
    warning
  };
}

async function analyzeMemoryBookText(text: string): Promise<MemoryBookAnalysis> {
  const prompt = `Du är Minnesboken. Du omvandlar dagboksanteckningar till en minnesbok.\nReturnera ENDAST JSON som matchar MemoryBookAnalysis-schemat. Max 6 kapitel.`;

  const completion = await openai.chat.completions.create({
    model: MEMORY_BOOK_MODEL,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Du hjälper Textscanner-användare att skapa minnesböcker. Svara alltid med giltig JSON som matchar MemoryBookAnalysis."
      },
      {
        role: "user",
        content: `${prompt}\n\nDagboksmaterial:\n${text}`
      }
    ]
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    return fallbackAnalysis();
  }

  try {
    const parsed = JSON.parse(raw);
    return normalizeAnalysis(parsed);
  } catch (err) {
    console.error("Kunde inte tolka Minnesboken-svaret:", err);
    const fallback = fallbackAnalysis();
    fallback.warning = "AI-svaret kunde inte tolkas som giltig JSON.";
    return fallback;
  }
}

function normalizeAnalysis(input: unknown): MemoryBookAnalysis {
  const data = typeof input === "object" && input ? (input as Record<string, unknown>) : {};
  return {
    bookTitle: normalizeString(data.bookTitle, "Min Minnesbok"),
    subtitle: normalizeOptionalString(data.subtitle),
    chapters: normalizeChapters(data.chapters),
    timeline: normalizeTimeline(data.timeline),
    people: normalizePeople(data.people),
    themes: normalizeStringArray(data.themes),
    toneSummary: normalizeString(
      data.toneSummary,
      "Dagboken präglas av värme, eftertanke och personliga ögonblick."
    ),
    warning: normalizeOptionalString(data.warning)
  };
}

function normalizeChapters(input: unknown): MemoryBookChapter[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((chapter, index) => {
      if (!chapter || typeof chapter !== "object") return null;
      const title = normalizeString((chapter as any).title, `Kapitel ${index + 1}`);
      const summary = normalizeString((chapter as any).summary, "Sammanfattning saknas.");
      const keyMoments = normalizeStringArray((chapter as any).keyMoments);
      return { title, summary, keyMoments };
    })
    .filter(Boolean) as MemoryBookChapter[];
}

function normalizeTimeline(input: unknown): MemoryBookTimelineItem[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const label = normalizeString((item as any).label, "Okänt datum");
      const description = normalizeString((item as any).description, "");
      return { label, description };
    })
    .filter(Boolean) as MemoryBookTimelineItem[];
}

function normalizePeople(input: unknown): MemoryBookPerson[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((person) => {
      if (!person || typeof person !== "object") return null;
      const name = normalizeString((person as any).name, "Namnlös person");
      const description = normalizeString((person as any).description, "");
      return { name, description };
    })
    .filter(Boolean) as MemoryBookPerson[];
}

function normalizeStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter((value) => Boolean(value));
}

function normalizeOptionalString(value: unknown) {
  if (typeof value === "string" && value.trim().length) {
    return value.trim();
  }
  return undefined;
}

function normalizeString(value: unknown, fallback: string) {
  if (typeof value === "string" && value.trim().length) {
    return value.trim();
  }
  return fallback;
}

function fallbackAnalysis(): MemoryBookAnalysis {
  return {
    bookTitle: "Min Minnesbok",
    subtitle: undefined,
    chapters: [],
    timeline: [],
    people: [],
    themes: [],
    toneSummary: "Dagboken präglas av eftertanke och personliga stunder.",
    warning: "Ingen djupanalys kunde genereras."
  };
}
