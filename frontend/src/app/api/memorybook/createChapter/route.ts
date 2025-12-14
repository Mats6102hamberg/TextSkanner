import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const entryIds: string[] = Array.isArray(body?.entryIds) ? body.entryIds : [];
    if (!entryIds.length) {
      return NextResponse.json(
        { ok: false, error: "Inga entryIds skickades." },
        { status: 400 }
      );
    }

    // Hämta dagboksinlägg
    const entries = await prisma.diaryEntry.findMany({
      where: { id: { in: entryIds } },
      select: { id: true, originalText: true, text: true, storyText: true, clarifiedText: true }
    });

    const combined = entries
      .map((e) => {
        const parts = [
          e.originalText?.trim(),
          e.clarifiedText?.trim(),
          e.storyText?.trim(),
          e.text?.trim()
        ].filter(Boolean);
        return `# ${e.id}\n${parts.join("\n\n")}`;
      })
      .filter(Boolean)
      .join("\n\n---\n\n");

    if (!combined.trim()) {
      return NextResponse.json(
        { ok: false, error: "Inga texter hittades för dessa entryIds." },
        { status: 400 }
      );
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Du är en svensk redaktör. Skapa ett minnesbokskapitel baserat på dagboksanteckningar. Svara ENBART som JSON med fälten: title (string), content (string), summary (string), tags (string[])."
        },
        { role: "user", content: combined }
      ]
    });

    const raw = completion.choices?.[0]?.message?.content || "{}";
    const result = JSON.parse(raw);

    const title = typeof result.title === "string" ? result.title.trim() : "";
    const content = typeof result.content === "string" ? result.content.trim() : "";
    const summary = typeof result.summary === "string" ? result.summary.trim() : "";

    const tags: string[] = Array.isArray(result.tags)
      ? result.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
      : [];
    const uniqueTags: string[] = Array.from(new Set(tags)).slice(0, 12);

    if (!title || !content) {
      return NextResponse.json(
        { ok: false, error: "AI kunde inte generera titel och innehåll." },
        { status: 500 }
      );
    }

    // Spara kapitel i DB - exakt enligt Prisma schema
    const chapter = await prisma.memoryBookChapter.create({
      data: {
        title,
        content,
        summary: summary || null,
        tags: uniqueTags,
        sourceEntryIds: entryIds
      }
    });

    return NextResponse.json({
      ok: true,
      chapterId: chapter.id,
      preview: {
        title,
        content,
        summary,
        tags: uniqueTags,
        sourceEntryIds: entryIds
      }
    });
  } catch (error) {
    console.error("POST /api/memorybook/createChapter error:", error);
    return NextResponse.json(
      { ok: false, error: "Kunde inte skapa kapitel." },
      { status: 500 }
    );
  }
}
