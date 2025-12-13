import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const runtime = "nodejs";

type ExtractEntitiesRequest = {
  entryIds: string[];
};

type FamilyEntity = {
  type: 'person' | 'place' | 'event' | 'date' | 'relationship';
  name: string;
  details?: string;
  relationships?: {
    type: string;
    to: string;
    details?: string;
  }[];
};

type ExtractEntitiesResponse = {
  ok: boolean;
  error?: string;
  draftId?: string;
  entities?: FamilyEntity[];
};

export async function POST(req: NextRequest): Promise<NextResponse<ExtractEntitiesResponse>> {
  try {
    const body = (await req.json()) as ExtractEntitiesRequest;

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
        return text;
      })
      .join("\n\n");

    // Extrahera entiteter med OpenAI
    const prompt = `Analysera texten och identifiera släktrelaterade entiteter (personer, platser, händelser, datum, relationer). 

Text:
${combinedText}

Svara ENDAST med valid JSON i detta format:
{
  "entities": [
    {
      "type": "person" | "place" | "event" | "date" | "relationship",
      "name": "Namn/identifierare",
      "details": "Ytterligare information",
      "relationships": [
        {
          "type": "Typ av relation",
          "to": "Namn på relaterad entitet",
          "details": "Beskrivning av relationen"
        }
      ]
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Du är en släktforskare som extraherar entiteter från text. Svara alltid med valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");

    if (!result.entities || result.entities.length === 0) {
      return NextResponse.json(
        { ok: false, error: "AI kunde inte extrahera entiteter." },
        { status: 500 }
      );
    }

    // Spara entiteter i DB
    const draft = await prisma.familyEntityDraft.create({
      data: {
        sourceEntryIds: body.entryIds,
        entities: result
      }
    });

    return NextResponse.json({
      ok: true,
      draftId: draft.id,
      entities: result.entities
    });
  } catch (error) {
    console.error("Fel vid extrahering av entiteter:", error);
    return NextResponse.json(
      { ok: false, error: "Kunde inte extrahera entiteter." },
      { status: 500 }
    );
  }
}
