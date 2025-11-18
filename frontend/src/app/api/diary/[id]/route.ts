import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
  params: {
    id: string;
  };
};

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const id = params.id;

    if (!id) {
      return NextResponse.json(
        { error: "Inget id angivet." },
        { status: 400 }
      );
    }

    await prisma.diaryEntry.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Fel vid radering av dagboksinlägg:", err);
    return NextResponse.json(
      { error: "Kunde inte radera dagboksinlägget." },
      { status: 500 }
    );
  }
}
