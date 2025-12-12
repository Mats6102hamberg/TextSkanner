import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const runtime = "nodejs";

type ExtractedEntities = {
  persons: Array<{ name: string; description: string; confidence: number }>;
  places: Array<{ name: string; description: string; confidence: number }>;
  dates: Array<{ date: string | null; dateText?: string; description: string; confidence: number }>;
  events: Array<{ title: string; description: string; confidence: number }>;
  relationships: Array<{ person1: string; person2: string; type: string; confidence: number }>;
};

type CreateDraftRequest = {
  entryIds: string[];
  entities: ExtractedEntities;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateDraftRequest;

    if (!body.entryIds || body.entryIds.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Minst ett dagboksinlägg krävs." },
        { status: 400 }
      );
    }

    if (!body.entities) {
      return NextResponse.json(
        { ok: false, error: "Entiteter saknas." },
        { status: 400 }
      );
    }

    // Spara draft i DB
    const draft = await prisma.familyEntityDraft.create({
      data: {
        sourceEntryIds: body.entryIds,
        entities: body.entities as any
      }
    });

    return NextResponse.json({
      ok: true,
      id: draft.id,
      draft: {
        id: draft.id,
        sourceEntryIds: draft.sourceEntryIds,
        entities: draft.entities,
        createdAt: draft.createdAt,
        updatedAt: draft.updatedAt
      }
    });
  } catch (error) {
    console.error("Fel vid skapande av utkast:", error);
    return NextResponse.json(
      { ok: false, error: "Kunde inte skapa utkast." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const drafts = await prisma.familyEntityDraft.findMany({
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json({
      ok: true,
      drafts
    });
  } catch (error) {
    console.error("Fel vid hämtning av utkast:", error);
    return NextResponse.json(
      { ok: false, error: "Kunde inte hämta utkast." },
      { status: 500 }
    );
  }
}
