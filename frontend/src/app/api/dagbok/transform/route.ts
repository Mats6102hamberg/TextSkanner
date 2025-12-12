import { NextRequest, NextResponse } from "next/server";
import { runTextscannerTask } from "@/lib/textscanner/core";

export const runtime = "nodejs";

type TransformMode = "clarify" | "story";

type TransformRequestBody = {
  mode?: TransformMode;
  text?: string;
  language?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as TransformRequestBody;
    const mode = body.mode;
    const text = body.text ?? "";
    const language = body.language || "sv";

    if (mode !== "clarify" && mode !== "story") {
      return NextResponse.json(
        { error: "Ogiltig transformeringstyp. Använd 'clarify' eller 'story'." },
        { status: 400 }
      );
    }

    if (!text.trim()) {
      return NextResponse.json(
        { error: "Ingen text att bearbeta. Skicka text i request body." },
        { status: 400 }
      );
    }

    // Använd Textscanner Core för AI-transformation
    const taskType = mode === "clarify" ? "diary_readable" : "diary_story";
    
    console.log(`[dagbok/transform] Kör ${taskType} på ${text.length} tecken, språk: ${language}`);

    const result = await runTextscannerTask({
      type: taskType,
      text: text.trim(),
      language
    });

    if (!result.text || !result.text.trim()) {
      return NextResponse.json(
        { error: "AI-transformeringen gav inget resultat. Försök igen." },
        { status: 500 }
      );
    }

    // Returnera transformerad text med eventuella varningar
    return NextResponse.json({ 
      ok: true, 
      text: result.text,
      warnings: result.warnings,
      sections: result.sections
    });

  } catch (error) {
    console.error("Dagbok transform route error:", error);
    const errorMessage = error instanceof Error ? error.message : "Transformeringen misslyckades";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
