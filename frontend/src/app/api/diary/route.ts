import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";

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

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Ange id för inlägget som ska tas bort" },
      { status: 400 }
    );
  }

  try {
    await prisma.diaryEntry.delete({
      where: { id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Inlägget hittades inte" },
        { status: 404 }
      );
    }

    console.error("DELETE /api/diary error:", error);
    return NextResponse.json(
      { error: "Kunde inte ta bort dagboksinlägg" },
      { status: 500 }
    );
  }
}
