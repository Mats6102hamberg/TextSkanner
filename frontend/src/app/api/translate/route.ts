import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = body?.text as string | undefined;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Ingen text skickades in för översättning." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("Saknar OPENAI_API_KEY");
      return NextResponse.json(
        { error: "Servern saknar OPENAI_API_KEY." },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "Du är en professionell översättare. Texten användaren skickar kan vara på engelska, franska, spanska, tyska, persiska, arabiska eller andra språk. Identifiera språket automatiskt och översätt sedan ALL text till naturlig, korrekt svenska. Svara endast med den översatta svenska texten."
          },
          {
            role: "user",
            content: text
          }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI error:", errText);
      return NextResponse.json(
        { error: "Översättningen misslyckades." },
        { status: 500 }
      );
    }

    const data = await response.json();
    const translated = data?.choices?.[0]?.message?.content?.trim() ?? "";

    return NextResponse.json({
      original: text,
      translated
    });
  } catch (err) {
    console.error("Translate route error:", err);
    return NextResponse.json(
      { error: "Internt serverfel i översättningen." },
      { status: 500 }
    );
  }
}
