import { NextRequest, NextResponse } from "next/server";

import { runTextscannerTask } from "@/lib/textscanner/core";
import type { TextscannerTaskResult } from "@/lib/textscanner/types";

type ContractMode =
  | "summary"
  | "risk"
  | "clarity"
  | "party_balance"
  | "mask";

type ModePayload = {
  text?: unknown;
  language?: unknown;
  modes?: unknown;
};

const DEFAULT_MODES: ContractMode[] = [
  "summary",
  "risk",
  "clarity",
  "party_balance",
  "mask"
];

const MODE_TO_TASK = {
  summary: "contract_summary",
  risk: "contract_risk",
  clarity: "contract_clarity",
  party_balance: "contract_party_balance",
  mask: "contract_mask_suggestions"
} as const;

type AggregatedData = {
  summary?: string;
  simpleExplanation?: string;
  risks?: string[];
  unclearClauses?: string[];
  partyBalance?: string;
  maskSuggestions?: string[];
  warnings?: string[];
};

export async function POST(request: NextRequest) {
  try {
    const rawBody: ModePayload = await request.json();
    const text = typeof rawBody.text === "string" ? rawBody.text.trim() : "";

    if (!text) {
      return NextResponse.json(
        { ok: false, error: "Text is required." },
        { status: 400 }
      );
    }

    const language =
      typeof rawBody.language === "string" && rawBody.language.trim().length
        ? rawBody.language.trim()
        : undefined;

    const requestedModes = normalizeModes(rawBody.modes);
    const aggregated: AggregatedData = {};
    const allWarnings: string[] = [];

    for (const mode of requestedModes) {
      const taskType = MODE_TO_TASK[mode];
      const result = await runTextscannerTask({
        type: taskType,
        text,
        language
      });
      mergeResult(aggregated, result, mode);
      if (Array.isArray(result.warnings)) {
        allWarnings.push(...result.warnings);
      }
    }

    if (allWarnings.length) {
      aggregated.warnings = Array.from(new Set(allWarnings));
    }

    return NextResponse.json({ ok: true, data: aggregated });
  } catch (error) {
    console.error("contract/analyze failed", error);
    return NextResponse.json(
      { ok: false, error: "Failed to analyze contract." },
      { status: 500 }
    );
  }
}

function normalizeModes(input: unknown): ContractMode[] {
  if (!Array.isArray(input) || !input.length) {
    return DEFAULT_MODES;
  }

  const modes: ContractMode[] = [];
  for (const value of input) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim().toLowerCase();
    if (isContractMode(trimmed)) {
      modes.push(trimmed);
    }
  }

  return modes.length ? Array.from(new Set(modes)) : DEFAULT_MODES;
}

function isContractMode(value: string): value is ContractMode {
  return ["summary", "risk", "clarity", "party_balance", "mask"].includes(
    value
  );
}

function mergeResult(
  aggregated: AggregatedData,
  result: TextscannerTaskResult,
  mode: ContractMode
) {
  const { sections } = result;
  switch (mode) {
    case "summary":
      if (!aggregated.summary && sections?.summary) {
        aggregated.summary = sections.summary;
      } else if (!aggregated.summary && result.text) {
        aggregated.summary = result.text;
      }
      if (!aggregated.simpleExplanation && sections?.simpleExplanation) {
        aggregated.simpleExplanation = sections.simpleExplanation;
      }
      break;
    case "risk":
      aggregated.risks = mergeStringArrays(
        aggregated.risks,
        sections?.risks || splitLines(result.text)
      );
      break;
    case "clarity":
      aggregated.unclearClauses = mergeStringArrays(
        aggregated.unclearClauses,
        sections?.unclearClauses || splitLines(result.text)
      );
      if (!aggregated.simpleExplanation && sections?.simpleExplanation) {
        aggregated.simpleExplanation = sections.simpleExplanation;
      }
      break;
    case "party_balance":
      if (!aggregated.partyBalance && sections?.partyBalance) {
        aggregated.partyBalance = sections.partyBalance;
      } else if (!aggregated.partyBalance && result.text) {
        aggregated.partyBalance = result.text;
      }
      if (!aggregated.summary && sections?.summary) {
        aggregated.summary = sections.summary;
      }
      break;
    case "mask":
      aggregated.maskSuggestions = mergeStringArrays(
        aggregated.maskSuggestions,
        sections?.maskSuggestions || splitLines(result.text)
      );
      break;
  }
}

function mergeStringArrays(
  existing: string[] | undefined,
  incoming: string[] | undefined
): string[] | undefined {
  if (!incoming?.length) {
    return existing;
  }
  const base = existing ? [...existing] : [];
  for (const entry of incoming) {
    const value = entry?.trim();
    if (!value) continue;
    if (!base.includes(value)) {
      base.push(value);
    }
  }
  return base.length ? base : existing;
}

function splitLines(text?: string) {
  if (!text) return undefined;
  const items = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  return items.length ? items : undefined;
}
