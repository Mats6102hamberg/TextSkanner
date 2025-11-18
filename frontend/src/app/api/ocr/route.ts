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

    const langText =
      language === "auto"
        ? "Försök först avgöra vilket språk texten är på. Läs sedan av all text så noggrant som möjligt, på originalspråket."
        : `Texten i bilden är på språket med kod "${language}". Läs av all text så noggrant som möjligt, och skriv den på originalspråket utan översättning.`;

    const prompt = `
${langText}

Regler:
- Skriv bara själva texten från bilden.
- Ta inte med egna kommentarer, tolkningar eller rubriker.
- Behåll radbrytningar där det är naturligt.
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

    const text = completion.choices[0]?.message?.content ?? "";

    return NextResponse.json({
      text,
      language
    });
  } catch (error) {
    console.error("OCR-route error:", error);
    return NextResponse.json(
      { error: "Ett fel uppstod vid OCR-tolkningen." },
      { status: 500 }
    );
  }
}
