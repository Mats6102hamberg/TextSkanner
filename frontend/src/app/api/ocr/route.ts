import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const language = (formData.get("language") as string | null) || "auto";

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "Ingen fil mottagen" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");

    const sourceLanguageInstruction =
      language === "auto"
        ? "Försök först avgöra vilket språk texten är på. Läs sedan av all text så noggrant som möjligt."
        : `Texten i bilden är på språket med kod "${language}". Läs av all text så noggrant som möjligt.`;

    const translationInstruction = `När texten är avläst ska du översätta allt till svenska. Om den redan är på svenska skriver du den som den är. Behåll radbrytningar där det är naturligt och använd modern, tydlig svenska.`;

    const prompt = `

${sourceLanguageInstruction}

${translationInstruction}

Regler:
- Skriv bara själva texten från bilden.
- Ta inte med egna kommentarer, tolkningar eller rubriker.
- Svara endast med texten, på svenska.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:${(file as any).type};base64,${base64}`
              }
            }
          ]
        }
      ]
    });

    const originalText = completion.choices[0]?.message?.content?.trim() ?? "";

    if (!originalText) {
      throw new Error("OCR-svaret innehöll ingen text");
    }

    const translated = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Du är en översättare. Översätt all inkommande text till svenska."
        },
        {
          role: "user",
          content: originalText
        }
      ]
    });

    const swedishText = translated.choices[0]?.message?.content?.trim() ?? originalText;

    return NextResponse.json({
      original: originalText,
      translated: swedishText
    });
  } catch (error) {
    console.error("OCR-route error:", error);
    return NextResponse.json(
      { error: "Ett fel uppstod vid OCR-tolkningen." },
      { status: 500 }
    );
  }
}
