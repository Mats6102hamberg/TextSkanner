import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const entries = await prisma.diaryEntry.findMany({
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("GET /api/diary error:", error);
    return NextResponse.json(
      { error: "Kunde inte hämta dagboksinlägg" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = typeof body.text === "string" ? body.text.trim() : "";
    const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl : null;

    if (!text) {
      return NextResponse.json(
        { error: "Text saknas" },
        { status: 400 }
      );
    }

    const entry = await prisma.diaryEntry.create({
      data: {
        text,
        imageUrl
      }
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("POST /api/diary error:", error);
    return NextResponse.json(
      { error: "Kunde inte spara dagboksinlägg" },
      { status: 500 }
    );
  }
}
