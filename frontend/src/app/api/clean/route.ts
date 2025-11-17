import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text: string = body.text;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Ingen text skickades." },
        { status: 400 }
      );
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!
    });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Du får text från en OCR-skanning. " +
                "Städa texten försiktigt: fixa uppenbara radbrytningsfel, ta bort dubbletter," +
                " men behåll samma betydelse och ungefär samma struktur. " +
                "Svara bara med den städade texten på samma språk som input."
            }
          ]
        },
        {
          role: "user",
          content: [{ type: "text", text }]
        }
      ]
    });

    const cleaned = completion.choices[0].message.content || text;

    return NextResponse.json({ cleanedText: cleaned });
  } catch (error: any) {
    console.error("CLEAN ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Fel vid textstädning." },
      { status: 500 }
    );
  }
}
