import { NextRequest, NextResponse } from "next/server";

import { runTextscannerTask } from "@/lib/textscanner/core";

const MODE_TO_TASK = {
  original: "diary_original",
  readable: "diary_readable",
  story: "diary_story"
} as const;

type DiaryMode = keyof typeof MODE_TO_TASK;

type DiaryPayload = {
  text?: unknown;
  language?: unknown;
  mode?: unknown;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as DiaryPayload;
    const text = typeof body.text === "string" ? body.text.trim() : "";

    if (!text) {
      return NextResponse.json(
        { ok: false, error: "Text is required." },
        { status: 400 }
      );
    }

    const language =
      typeof body.language === "string" && body.language.trim().length
        ? body.language.trim()
        : undefined;

    const mode = normalizeMode(body.mode);
    const result = await runTextscannerTask({
      type: MODE_TO_TASK[mode],
      text,
      language
    });

    return NextResponse.json({
      ok: true,
      data: {
        text: result.text,
        summary: result.sections?.summary,
        simpleExplanation: result.sections?.simpleExplanation,
        warnings: result.warnings
      }
    });
  } catch (error) {
    console.error("diary/analyze failed", error);
    return NextResponse.json(
      { ok: false, error: "Failed to analyze diary text." },
      { status: 500 }
    );
  }
}

function normalizeMode(mode: unknown): DiaryMode {
  if (typeof mode === "string") {
    const normalized = mode.trim().toLowerCase();
    if (isDiaryMode(normalized)) {
      return normalized;
    }
  }
  return "readable";
}

function isDiaryMode(value: string): value is DiaryMode {
  return value === "original" || value === "readable" || value === "story";
}
