import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { text, imageUrl } = await req.json();

    const entry = await prisma.diaryEntry.create({
      data: {
        text,
        imageUrl
      }
    });

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error("Error creating diary entry:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save entry" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const entries = await prisma.diaryEntry.findMany({
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(entries);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch entries" },
      { status: 500 }
    );
  }
}
