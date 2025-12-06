import { NextRequest, NextResponse } from "next/server";

import type { FamilyMagic, MemorySourceEntry } from "@/lib/memory/types";

const SYSTEM_PROMPT = `
Du är en släktforskare och berättande redaktör.
Du får dagboksanteckningar och ska analysera relationer, platser och teman.

REGLER:
- Lista viktiga personer (namn) och räkna hur många gånger de nämns.
- Försök gissa relation/roll (mamma, pappa, bror, vän, kollega osv) när det framgår.
- Lista centrala platser (stadsdelar, adresser, hem, läger osv).
- Identifiera återkommande teman (t.ex. barndom, förändring, mod, rädsla...).
- Försök dra ut tidsinformation (tidigaste och senaste datum) och beskriv perioden kort.
- Returnera ALLTID giltig JSON exakt enligt följande interface:
  {
    "persons": [{ "name": string, "mentioned": number, "guessedRole"?: string }],
    "places": string[],
    "themes": string[],
    "earliestDate"?: string,
    "latestDate"?: string,
    "timelineSummary"?: string
  }
`;

function buildUserPrompt(entries: MemorySourceEntry[]) {
  const base = entries
    .map((entry, index) => {
      const meta = entry.date ? ` (datum: ${entry.date})` : "";
      return `# Text ${index + 1}${meta}\n${entry.text}`;
    })
    .join("\n\n");

  return `${base}\n\nExtrahera nu personer, platser, teman och tidslinje enligt reglerna.`;
}

interface Body {
  entries?: MemorySourceEntry[];
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    const entries = body.entries ?? [];

    if (!entries.length) {
      return NextResponse.json(
        { error: "Minst en dagbokstext krävs." },
        { status: 400 }
      );
    }

    const userPrompt = buildUserPrompt(entries);

    const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        temperature: 0.3,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!openAiRes.ok) {
      const text = await openAiRes.text();
      console.error("family-magic openai error", text);
      return NextResponse.json(
        { error: "Kunde inte ta fram släktmagi.", details: text },
        { status: 500 }
      );
    }

    const data = await openAiRes.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    let parsed: FamilyMagic;
    try {
      parsed = JSON.parse(content) as FamilyMagic;
    } catch (err) {
      console.error("family-magic parse error", err, content);
      return NextResponse.json(
        { error: "Modellen returnerade ogiltig JSON.", raw: content },
        { status: 500 }
      );
    }

    parsed.persons = Array.isArray(parsed.persons) ? parsed.persons : [];
    parsed.places = Array.isArray(parsed.places) ? parsed.places : [];
    parsed.themes = Array.isArray(parsed.themes) ? parsed.themes : [];

    return NextResponse.json(parsed, { status: 200 });
  } catch (err) {
    console.error("family-magic route error", err);
    return NextResponse.json(
      { error: "Internt serverfel vid släktmagi." },
      { status: 500 }
    );
  }
}
