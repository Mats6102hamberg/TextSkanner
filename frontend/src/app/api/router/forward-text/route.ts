import { NextRequest, NextResponse } from "next/server";

type ForwardTarget = "language-tool" | "memory-book" | "pdf";

type ForwardRequestBody = {
  source?: string;
  target?: ForwardTarget;
  variant?: "original" | "clarified" | "story";
  text?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ForwardRequestBody;
    const { source = "unknown", target, variant = "original", text = "" } = body;

    if (!target) {
      return NextResponse.json({ error: "Saknar målmodul" }, { status: 400 });
    }

    if (!text.trim()) {
      return NextResponse.json({ error: "Ingen text att skicka" }, { status: 400 });
    }

    console.log("Forward text", { source, target, variant, preview: text.slice(0, 160) });

    return NextResponse.json({ ok: true, message: `Text mottagen för ${target}` });
  } catch (error) {
    console.error("Forward text route error", error);
    return NextResponse.json({ error: "Kunde inte vidarebefordra texten" }, { status: 500 });
  }
}
