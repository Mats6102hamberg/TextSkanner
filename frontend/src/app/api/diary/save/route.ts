import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const runtime = "nodejs";

type SaveDiaryRequest = {
  text?: string;
  originalText?: string;
  clarifiedText?: string;
  storyText?: string;
  imageUrl?: string;
  entryDate?: string;
  detectedMood?: string;
  moodScore?: number;
  tags?: string[];
  summary?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SaveDiaryRequest;

    if (!body.originalText && !body.text) {
      return NextResponse.json(
        { error: "Text krävs för att spara dagboksinlägg." },
        { status: 400 }
      );
    }

    // Konvertera entryDate till Date om det finns
    let entryDateObj: Date | undefined;
    if (body.entryDate) {
      try {
        entryDateObj = new Date(body.entryDate);
      } catch (err) {
        console.error("Ogiltigt datum:", body.entryDate);
      }
    }

    const diaryEntry = await prisma.diaryEntry.create({
      data: {
        text: body.text || body.originalText,
        originalText: body.originalText,
        clarifiedText: body.clarifiedText,
        storyText: body.storyText,
        imageUrl: body.imageUrl,
        entryDate: entryDateObj,
        detectedMood: body.detectedMood,
        moodScore: body.moodScore,
        tags: body.tags || [],
        summary: body.summary
      }
    });

    return NextResponse.json({
      ok: true,
      id: diaryEntry.id,
      message: "Dagboksinlägg sparat!"
    });
  } catch (error) {
    console.error("Fel vid sparande av dagboksinlägg:", error);
    return NextResponse.json(
      { error: "Kunde inte spara dagboksinlägget." },
      { status: 500 }
    );
  }
}

// Hämta alla dagboksinlägg
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const mood = searchParams.get("mood");

    const where = mood ? { detectedMood: mood } : {};

    const entries = await prisma.diaryEntry.findMany({
      where,
      orderBy: {
        createdAt: "desc"
      },
      take: limit
    });

    return NextResponse.json({
      ok: true,
      entries
    });
  } catch (error) {
    console.error("Fel vid hämtning av dagboksinlägg:", error);
    return NextResponse.json(
      { error: "Kunde inte hämta dagboksinlägg." },
      { status: 500 }
    );
  }
}
