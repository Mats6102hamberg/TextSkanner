import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const runtime = "nodejs";

type CreateChapterRequest = {
  entryIds: string[];
};

export async function POST(req: NextRequest) {
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

    // Sammanfoga text (prioritet: storyText > clarifiedText > originalText)
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
  "content": "Fullständig kapiteltext som sammanfogar inläggen till en sammanhängande berättelse (minst 200 ord)",
  "summary": "Kort sammanfattning (max 100 ord)"
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

    if (!result.title || !result.content) {
      return NextResponse.json(
        { ok: false, error: "AI kunde inte generera kapitel." },
        { status: 500 }
      );
    }

    // Spara kapitel i DB
    const chapter = await prisma.memoryBookChapter.create({
      data: {
        title: result.title,
        content: result.content,
        summary: result.summary || null,
        tags: uniqueTags,
        sourceEntryIds: body.entryIds
      }
    });

    return NextResponse.json({
      ok: true,
      chapter: {
        id: chapter.id,
        title: chapter.title,
        content: chapter.content,
        summary: chapter.summary,
        tags: chapter.tags,
        sourceEntryIds: chapter.sourceEntryIds,
        createdAt: chapter.createdAt,
        updatedAt: chapter.updatedAt
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

export async function GET(req: NextRequest) {
  try {
    const chapters = await prisma.memoryBookChapter.findMany({
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json({
      ok: true,
      chapters
    });
  } catch (error) {
    console.error("Fel vid hämtning av kapitel:", error);
    return NextResponse.json(
      { ok: false, error: "Kunde inte hämta kapitel." },
      { status: 500 }
    );
  }
}
