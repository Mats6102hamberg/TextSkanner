import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Ingen fil mottagen." },
        { status: 400 }
      );
    }

    // Gör om filen till Base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!
    });

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Du får nu en bild av en dagbokssida. " +
                "Ignorera allt annat och transkribera ALL text exakt. " +
                "Behåll radbrytningar. Svara bara med texten."
            },
            {
              type: "image_url",
              image_url: {
                url: dataUrl
              }
            }
          ]
        }
      ]
    });

    const content = response.choices[0].message.content;

    return NextResponse.json({ text: content });
  } catch (error: any) {
    console.error("OCR ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Okänt OCR-fel" },
      { status: 500 }
    );
  }
}
