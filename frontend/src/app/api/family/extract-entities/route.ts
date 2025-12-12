import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const runtime = "nodejs";

type ExtractEntitiesRequest = {
  entryIds: string[];
};

type Person = {
  name: string;
  description: string;
  confidence: number;
};

type Place = {
  name: string;
  description: string;
  confidence: number;
};

type DateEvent = {
  date: string | null;
  dateText?: string;
  description: string;
  confidence: number;
};

type Event = {
  title: string;
  description: string;
  confidence: number;
};

type Relationship = {
  person1: string;
  person2: string;
  type: string;
  confidence: number;
};

type ExtractedEntities = {
  persons: Person[];
  places: Place[];
  dates: DateEvent[];
  events: Event[];
  relationships: Relationship[];
};

export async function POST(req: NextRequest) {
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

    // Sammanfoga text (prioritet: storyText > clarifiedText > originalText)
    const combinedText = entries
      .map((entry) => {
        const text = entry.storyText || entry.clarifiedText || entry.originalText || entry.text;
        const date = entry.entryDate ? new Date(entry.entryDate).toLocaleDateString('sv-SE') : '';
        return date ? `${date}: ${text}` : text;
      })
      .join("\n\n");

    // Extrahera entiteter med OpenAI
    const prompt = `Du är en expert på släktforskning och genealogi. Analysera följande dagboksinlägg och extrahera information om personer, platser, datum, händelser och relationer.

VIKTIGT: Författaren av dagboken heter Mats. Använd alltid "Mats" istället för "Skribenten", "Jag", "författaren" etc.

Dagboksinlägg:
${combinedText}

Extrahera följande information och svara ENDAST med valid JSON i detta format:
{
  "persons": [
    {
      "name": "Personens namn",
      "description": "Kort beskrivning av personen baserat på texten",
      "confidence": 0.95
    }
  ],
  "places": [
    {
      "name": "Platsens namn",
      "description": "Kort beskrivning av platsen",
      "confidence": 0.90
    }
  ],
  "dates": [
    {
      "date": "YYYY-MM-DD eller YYYY-MM eller YYYY (ISO 8601 format), eller null om datum inte kan extraheras",
      "dateText": "Original fras om date är null (t.ex. 'en ljus dag', 'i somras')",
      "description": "Vad som hände detta datum",
      "confidence": 0.85
    }
  ],
  "events": [
    {
      "title": "Händelsens titel",
      "description": "Beskrivning av händelsen",
      "confidence": 0.80
    }
  ],
  "relationships": [
    {
      "person1": "Person A (använd Mats för författaren)",
      "person2": "Person B",
      "type": "Relationstyp: mor, far, syster, bror, dotter, son, mormor, morfar, farmor, farfar, kusin, vän, kollega, partner, make, maka",
      "confidence": 0.75
    }
  ]
}

REGLER:
- dates[].date MÅSTE vara ISO 8601 format (YYYY-MM-DD, YYYY-MM, eller YYYY) eller null
- Om datum inte kan extraheras exakt, sätt date=null och lägg originalfrasen i dateText
- Använd ALLTID "Mats" för författaren/skribenten i relationships
- Relationstyper ska vara specifika svenska termer (se lista ovan)
- Confidence ska vara mellan 0 och 1, där 1 är helt säker
- Om du inte hittar någon information i en kategori, returnera en tom array`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Du är en expert på släktforskning. Extrahera strukturerad information från dagbokstexter. Svara alltid med valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}") as ExtractedEntities;

    // Postprocessing: Normalisera namn och validera datum
    function normalizePersonName(name: string): string {
      const writerAliases = ["skribenten", "jag", "författaren", "berättaren"];
      const lowerName = name.toLowerCase().trim();
      if (writerAliases.includes(lowerName)) {
        return "Mats";
      }
      return name;
    }

    function isValidISODate(dateStr: string): boolean {
      if (!dateStr) return false;
      // Check ISO 8601 formats: YYYY-MM-DD, YYYY-MM, YYYY
      const isoRegex = /^\d{4}(-\d{2}(-\d{2})?)?$/;
      return isoRegex.test(dateStr);
    }

    // Normalisera relationships
    const normalizedRelationships = (result.relationships || []).map(rel => ({
      ...rel,
      person1: normalizePersonName(rel.person1),
      person2: normalizePersonName(rel.person2)
    }));

    // Validera och fixa dates
    const validatedDates = (result.dates || []).map(dateEvent => {
      if (dateEvent.date && !isValidISODate(dateEvent.date)) {
        // Datum är inte ISO-format, flytta till dateText
        return {
          date: null,
          dateText: dateEvent.date,
          description: dateEvent.description,
          confidence: dateEvent.confidence
        };
      }
      return dateEvent;
    });

    // Validera att alla fält finns
    const entities: ExtractedEntities = {
      persons: result.persons || [],
      places: result.places || [],
      dates: validatedDates,
      events: result.events || [],
      relationships: normalizedRelationships
    };

    return NextResponse.json({
      ok: true,
      entities
    });
  } catch (error) {
    console.error("Fel vid extraktion av entiteter:", error);
    return NextResponse.json(
      { ok: false, error: "Kunde inte extrahera entiteter." },
      { status: 500 }
    );
  }
}
