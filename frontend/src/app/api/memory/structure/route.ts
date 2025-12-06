import { NextRequest, NextResponse } from "next/server";
import {
  MemoryBook,
  MemoryMode,
  MemorySourceEntry,
} from "@/lib/memory/types";

const SYSTEM_PROMPT = `
Du är en erfaren biografiredaktör.
Du får dagbokstexter och ska skapa en struktur för en minnesbok.

REGLER (gemensamma):
- Ändra inte fakta eller hitta på stora nya händelser.
- Du får korta ned, slå ihop eller förtydliga text.
- Skriv på enkel, varm svenska.
- Returnera ALLTID giltig JSON, utan extra kommentarer.
`;

// En hjälpfunktion för att bygga användarprompten utifrån valt läge
function buildUserPrompt(mode: MemoryMode, entries: MemorySourceEntry[]): string {
  const baseText = entries
    .map((entry, index) => {
      const meta = entry.date ? `, datum: ${entry.date}` : "";
      return `# Anteckning ${index + 1} (id: ${entry.id}${meta})\n${entry.text}`;
    })
    .join("\n\n");

  if (mode === "raw") {
    return `
LÄGE: RÅTEXTBOK

Du får dagbokstexter. Gör följande:
1. Rätta stavfel försiktigt.
2. Behåll datum och ordning.
3. Dela upp i stycken där det är naturligt.
4. Skapa INGA rubriker eller kapitel.

Returnera JSON på formen:

{
  "mode": "raw",
  "chapters": [
    {
      "title": "Dagboksanteckningar",
      "summary": "",
      "entries": [
        {
          "sourceId": "ID_FRÅN_INPUT",
          "date": "YYYY-MM-DD eller null",
          "rawText": "ursprunglig text",
          "bookText": "renskriven version"
        }
      ]
    }
  ]
}

Här är texterna:
${baseText}
`;
  }

  if (mode === "story") {
    return `
LÄGE: BERÄTTELSEBOK

Du får dagbokstexter. Gör följande:
1. Skriv en sammanhängande berättelse i jag-form.
2. Följ händelserna i texterna, hitta inte på nya stora händelser.
3. Du får lägga till korta övergångar ("några dagar senare", "under den här perioden" osv).
4. Dela upp i kapitel med rubriker och en kort sammanfattning per kapitel.

Returnera JSON på formen:

{
  "mode": "story",
  "chapters": [
    {
      "title": "Kapitelrubrik",
      "summary": "2-3 meningar om kapitlet",
      "entries": [
        {
          "sourceId": "valfri representativ id eller tom sträng",
          "date": null,
          "rawText": null,
          "bookText": "själva berättelsetexten för detta kapitel"
        }
      ]
    }
  ]
}

Här är texterna:
${baseText}
`;
  }

  return `
LÄGE: STRUKTURERAD MINNESBOK

Du får dagbokstexter. Gör följande:
1. Gruppera anteckningarna tematiskt eller kronologiskt i kapitel.
2. Ge varje kapitel en kort rubrik.
3. Skriv en 2–3 meningar lång sammanfattning (summary) per kapitel.
4. Under varje kapitel, sortera dagboksanteckningarna i rimlig ordning.
5. Behåll förstapersonsperspektiv ("jag") om det finns.

Returnera JSON på formen:

{
  "mode": "structured",
  "chapters": [
    {
      "title": "Kapitelrubrik",
      "summary": "2-3 meningar om kapitlet",
      "entries": [
        {
          "sourceId": "ID_FRÅN_INPUT",
          "date": "YYYY-MM-DD eller null",
          "rawText": "ursprunglig text",
          "bookText": "bearbetad text för boken"
        }
      ]
    }
  ]
}

Här är texterna:
${baseText}
`;
}

interface RequestBody {
  mode?: MemoryMode;
  entries: MemorySourceEntry[];
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody;
    const mode: MemoryMode = body.mode ?? "structured";
    const entries = body.entries ?? [];

    if (!entries.length) {
      return NextResponse.json(
        { error: "Minst en dagbokstext krävs." },
        { status: 400 }
      );
    }

    const userPrompt = buildUserPrompt(mode, entries);

    // --- KOPPLA MOT OPENAI (eller annan modell) ---
    // Justera endpoint, model och nyckel efter ditt setup.
    const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.4
      })
    });

    if (!openAiRes.ok) {
      const errorText = await openAiRes.text();
      console.error("OpenAI error:", errorText);
      return NextResponse.json(
        { error: "Kunde inte generera minnesbok.", details: errorText },
        { status: 500 }
      );
    }

    const data = await openAiRes.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    let parsed: MemoryBook;
    try {
      parsed = JSON.parse(content) as MemoryBook;
    } catch (err) {
      console.error("JSON-parse-fel från modellen:", err, content);
      return NextResponse.json(
        { error: "Modellen returnerade ogiltig JSON.", raw: content },
        { status: 500 }
      );
    }

    if (!parsed.chapters || !Array.isArray(parsed.chapters)) {
      return NextResponse.json(
        { error: "Svar saknar chapters-fält.", raw: parsed },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed, { status: 200 });
  } catch (err) {
    console.error("Minnes-API-fel:", err);
    return NextResponse.json(
      { error: "Internt serverfel i minnes-API:t." },
      { status: 500 }
    );
  }
}
