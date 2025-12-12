import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const runtime = "nodejs";

type CreateChapterRequest = {
  entryIds: string[];
};

type CreateChapterResponse = {
  ok: boolean;
  error?: string;
  chapterId?: string;
  preview?: {
    title: string;
    summary: string;
    keyMoments: string[];
    tags: string[];
  };
};

export async function POST(req: NextRequest): Promise<NextResponse<CreateChapterResponse>> {
  try {
    const body = (await req.json()) as CreateChapterRequest;

    if (!body.entryIds || body.entryIds.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Minst ett dagboksinlägg krävs." },
        { status: 400 }
      );
    }

    // Hämta dagboksinlägg från DB
    const entries = await prisma.diaryEntry.findMany({
      where: {
        id: { in: body.entryIds }
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    if (entries.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Inga dagboksinlägg hittades." },
        { status: 404 }
      );
    }

    // Sammanfoga text från alla inlägg
    const combinedText = entries
      .map((entry) => {
        const text = entry.storyText || entry.clarifiedText || entry.originalText || entry.text;
        const date = entry.entryDate ? new Date(entry.entryDate).toLocaleDateString('sv-SE') : '';
        return date ? `${date}: ${text}` : text;
      })
      .join("\n\n");

    // Samla alla tags
    const allTags = entries.flatMap((entry) => entry.tags || []);
    const uniqueTags = [...new Set(allTags)];

    // Generera kapitel med OpenAI
    const prompt = `Du är en författare som skapar minnesböcker från dagboksinlägg.

Dagboksinlägg:
${combinedText}

Skapa ett minnesbok-kapitel baserat på dessa inlägg. Svara ENDAST med valid JSON i detta format:
{
  "title": "Kapitelrubrik (max 60 tecken)",
  "chapterText": "Fullständig kapiteltext som sammanfogar inläggen till en sammanhängande berättelse (minst 200 ord)",
  "summary": "Kort sammanfattning (max 100 ord)",
  "keyMoments": ["Viktigt ögonblick 1", "Viktigt ögonblick 2", "Viktigt ögonblick 3"]
}

Skriv på svenska. Gör texten personlig och berättande.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Du är en professionell författare som skapar minnesböcker. Svara alltid med valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");

    if (!result.title || !result.chapterText) {
      return NextResponse.json(
        { ok: false, error: "AI kunde inte generera kapitel." },
        { status: 500 }
      );
    }

    // Spara kapitel i DB
    const chapter = await prisma.memoryBookChapter.create({
      data: {
        title: result.title,
        chapterText: result.chapterText,
        summary: result.summary || null,
        tags: uniqueTags,
        diaryEntryIds: body.entryIds,
        keyMoments: result.keyMoments || []
      }
    });

    return NextResponse.json({
      ok: true,
      chapterId: chapter.id,
      preview: {
        title: result.title,
        summary: result.summary || "",
        keyMoments: result.keyMoments || [],
        tags: uniqueTags
      }
    });
  } catch (error) {
    console.error("Fel vid skapande av minnesbok-kapitel:", error);
    return NextResponse.json(
      { ok: false, error: "Kunde inte skapa kapitel." },
      { status: 500 }
    );
  }
}
