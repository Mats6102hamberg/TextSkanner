import { NextRequest, NextResponse } from "next/server";

import { openai } from "../ocr/route-helpers";

export const runtime = "nodejs";

const FAMILY_FILM_MODEL =
  process.env.OPENAI_FAMILY_FILM_MODEL ?? "gpt-4.1-mini";

const LENGTH_MINUTES: Record<string, number> = {
  short: 3,
  medium: 5,
  long: 8
};

export type MemoryBookChapter = {
  title: string;
  summary: string;
  keyMoments: string[];
};

export type MemoryBookTimelineItem = {
  label: string;
  description: string;
};

export type MemoryBookPerson = {
  name: string;
  description: string;
};

export type MemoryBookAnalysis = {
  bookTitle: string;
  subtitle?: string;
  chapters: MemoryBookChapter[];
  timeline: MemoryBookTimelineItem[];
  people: MemoryBookPerson[];
  themes: string[];
  toneSummary: string;
  warning?: string | null;
};

export type FamilyFilmScene = {
  index: number;
  title: string;
  description: string;
  voiceOver: string;
  mood: string;
};

export type FamilyFilmPlan = {
  filmTitle: string;
  estimatedLengthMinutes: number;
  narration: string;
  scenes: FamilyFilmScene[];
  warning?: string | null;
};

export type FamilyFilmResponse = {
  ok: boolean;
  error?: string;
  plan?: FamilyFilmPlan;
};

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Kunde inte tolka förfrågan. Skicka JSON i request-body." },
        { status: 400 }
      );
    }

    const { analysis, options } = (body ?? {}) as {
      analysis?: MemoryBookAnalysis;
      options?: { tone?: string; length?: "short" | "medium" | "long" };
    };

    if (!analysis?.bookTitle) {
      return NextResponse.json(
        { error: "Ingen minnesboksanalys mottagen." },
        { status: 400 }
      );
    }

    const preferredLength = options?.length && LENGTH_MINUTES[options.length]
      ? options.length
      : "medium";
    const targetMinutes = LENGTH_MINUTES[preferredLength];

    const userPrompt = [
      "Du får en MemoryBookAnalysis i JSON-format.",
      "Skapa en filmplan med max 12 scener (storyboard) och en sammanhängande voice-over.",
      "Anpassa stämningen efter analysens toneSummary och det önskade tonläget om det finns.",
      `Önskad känsla/ton: ${options?.tone ?? "följ analysens ton"}`,
      `Önskad längd: ${preferredLength} (~${targetMinutes} minuter)`,
      "Returnera ENDAST JSON enligt FamilyFilmPlan-schemat.",
      `MemoryBookAnalysis: ${JSON.stringify(analysis)}`,
      options ? `Alternativ: ${JSON.stringify(options)}` : undefined
    ]
      .filter(Boolean)
      .join("\n\n");

    const completion = await openai.chat.completions.create({
      model: FAMILY_FILM_MODEL,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Du är SläktMagi Filmplanerare. Du tar en minnesboksstruktur och skapar en familjefilm-plan. Svara alltid strikt med JSON som matchar FamilyFilmPlan."
        },
        {
          role: "user",
          content: userPrompt
        }
      ]
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    const warnings: string[] = [];

    let plan: FamilyFilmPlan;
    if (!raw) {
      warnings.push("AI-svaret saknade innehåll. En enklare plan skapades.");
      plan = fallbackPlan(analysis.bookTitle);
    } else {
      try {
        const parsed = JSON.parse(raw);
        plan = normalizePlan(parsed, analysis.bookTitle, targetMinutes);
      } catch (err) {
        console.error("Family film JSON parse error:", err, raw);
        warnings.push("AI-svaret kunde inte tolkas som giltig JSON.");
        plan = fallbackPlan(analysis.bookTitle);
      }
    }

    if (warnings.length) {
      plan.warning = [plan.warning, ...warnings].filter(Boolean).join(" ");
    }

    return NextResponse.json({ ok: true, plan } satisfies FamilyFilmResponse);
  } catch (error) {
    console.error("Family film route error:", error);
    return NextResponse.json(
      { error: "Något gick fel i SläktMagi-filmplanen. Försök igen om en stund." },
      { status: 500 }
    );
  }
}

function normalizePlan(
  input: unknown,
  bookTitle: string,
  targetMinutes: number
): FamilyFilmPlan {
  const data = (typeof input === "object" && input ? input : {}) as Record<string, unknown>;
  const scenes = normalizeScenes(data.scenes);
  return {
    filmTitle: normalizeString(data.filmTitle, `${bookTitle} – filmen`),
    estimatedLengthMinutes: normalizeNumber(
      data.estimatedLengthMinutes,
      targetMinutes
    ),
    narration: normalizeString(
      data.narration,
      "En varm berättelse som följer bokens viktigaste ögonblick."
    ),
    scenes,
    warning: normalizeOptionalString(data.warning)
  };
}

function normalizeScenes(input: unknown): FamilyFilmScene[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .slice(0, 12)
    .map((scene, index) => {
      if (!scene || typeof scene !== "object") return null;
      const record = scene as Record<string, unknown>;
      return {
        index: normalizeNumber(record.index, index + 1),
        title: normalizeString(record.title, `Scen ${index + 1}`),
        description: normalizeString(
          record.description,
          "Beskriv kort vad tittaren ser."
        ),
        voiceOver: normalizeString(
          record.voiceOver,
          "Berättaren beskriver minnet med värme."
        ),
        mood: normalizeString(record.mood, "nostalgisk")
      };
    })
    .filter(Boolean) as FamilyFilmScene[];
}

function normalizeString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length ? value.trim() : fallback;
}

function normalizeOptionalString(value: unknown) {
  return typeof value === "string" && value.trim().length ? value.trim() : undefined;
}

function normalizeNumber(value: unknown, fallback: number) {
  const num = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.max(1, Math.round(num));
}

function fallbackPlan(bookTitle: string): FamilyFilmPlan {
  return {
    filmTitle: `${bookTitle} – familjefilm`,
    estimatedLengthMinutes: 4,
    narration:
      "En varm berättelse som vandrar genom bokens viktigaste ögonblick. Varje scen fångar ett minne, ett ansikte eller en plats där familjens historia tog form.",
    scenes: [
      {
        index: 1,
        title: "Uppstart",
        description: "Gamla dagboksblad och fotografier läggs ut på ett bord.",
        voiceOver: "Vi börjar vår resa bland de dagboksblad som formade allt.",
        mood: "nostalgisk"
      },
      {
        index: 2,
        title: "Nyckelminne",
        description: "En plats eller händelse som nämns i boken visas i lugn panorering.",
        voiceOver: "Här utspelade sig ett minne som fortfarande bär vår familj.",
        mood: "lugn"
      },
      {
        index: 3,
        title: "Avslutning",
        description: "Familjemedlemmar skrattar eller delar en kram.",
        voiceOver: "Och berättelsen fortsätter – i oss alla.",
        mood: "hoppfull"
      }
    ],
    warning: "En förenklad plan användes då AI-svaret saknades."
  };
}
