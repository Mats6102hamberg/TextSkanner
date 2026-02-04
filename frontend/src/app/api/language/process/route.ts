import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const mode = body?.mode as string;
    const text = body?.text as string;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Ingen text skickades in för bearbetning." },
        { status: 400 }
      );
    }

    if (!mode || !["simplify", "summarize", "translate_en", "translate_de", "translate_fr", "translate_es"].includes(mode)) {
      return NextResponse.json(
        { error: "Ogiltigt mode. Använd 'simplify', 'summarize', 'translate_en', 'translate_de', 'translate_fr' eller 'translate_es'." },
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

    let prompt = "";
    let systemMessage = "";

    switch (mode) {
      case "simplify":
        systemMessage = "Du är en expert på klarspråk och textförenkling. Din uppgift är att göra komplexa texter enklare att förstå utan att tappa viktigt innehåll. Använd kortare meningar, enklare ord och tydlig struktur. Svara endast med den förenklade texten.";
        prompt = `Förenkla följande text till klarspråk:\n\n${text}`;
        break;

      case "summarize":
        systemMessage = "Du är en expert på att sammanfatta texter. Din uppgift är att plocka ut det viktigaste innehållet och presentera det i en koncis och tydlig sammanfattning. Svara endast med sammanfattningen.";
        prompt = `Sammanfatta följande text:\n\n${text}`;
        break;

      case "translate_en":
        systemMessage = "Du är en professionell översättare. Översätt följande svenska text till naturlig, korrekt engelska. Behåll ton och innebörd. Svara endast med den översatta engelska texten.";
        prompt = `Översätt följande text till engelska:\n\n${text}`;
        break;

      case "translate_de":
        systemMessage = "Du är en professionell översättare. Översätt följande svenska text till naturlig, korrekt tyska. Behåll ton och innebörd. Svara endast med den översatta tyska texten.";
        prompt = `Översätt följande text till tyska:\n\n${text}`;
        break;

      case "translate_fr":
        systemMessage = "Du är en professionell översättare. Översätt följande svenska text till naturlig, korrekt franska. Behåll ton och innebörd. Svara endast med den översatta franska texten.";
        prompt = `Översätt följande text till franska:\n\n${text}`;
        break;

      case "translate_es":
        systemMessage = "Du är en professionell översättare. Översätt följande svenska text till naturlig, korrekt spanska. Behåll ton och innebörd. Svara endast med den översatta spanska texten.";
        prompt = `Översätt följande text till spanska:\n\n${text}`;
        break;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: mode.startsWith("translate_") ? 0.2 : 0.3,
      messages: [
        {
          role: "system",
          content: systemMessage
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: mode === "summarize" ? 500 : 2000,
    });

    if (!response.choices || response.choices.length === 0) {
      return NextResponse.json(
        { error: "Inget svar från AI-modellen." },
        { status: 500 }
      );
    }

    const result = response.choices[0].message?.content?.trim() || "";

    return NextResponse.json({
      result,
      mode,
      originalLength: text.length,
      resultLength: result.length
    });

  } catch (err) {
    console.error("Language process error:", err);
    return NextResponse.json(
      { error: "Ett internt fel uppstod vid textbearbetningen." },
      { status: 500 }
    );
  }
}
