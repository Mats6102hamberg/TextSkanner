import { runTextscannerTask } from "@/lib/textscanner/core";
import type { TextscannerTaskResult } from "@/lib/textscanner/types";
import type {
  ContractAnalysisSummaryResult,
  ContractFinanceSnapshot
} from "@/types/contracts";

export type ContractMode =
  | "summary"
  | "risk"
  | "clarity"
  | "party_balance"
  | "mask"
  | "finance";

const DEFAULT_MODES: ContractMode[] = [
  "summary",
  "risk",
  "clarity",
  "party_balance",
  "mask",
  "finance"
];

const MODE_TO_TASK = {
  summary: "contract_summary",
  risk: "contract_risk",
  clarity: "contract_clarity",
  party_balance: "contract_party_balance",
  mask: "contract_mask_suggestions",
  finance: "contract_finance"
} as const;

export type AggregatedData = {
  summary?: string;
  simpleExplanation?: string;
  risks?: string[];
  unclearClauses?: string[];
  partyBalance?: string;
  maskSuggestions?: string[];
  warnings?: string[];
  finance?: ContractFinanceSnapshot | null;
};

export async function analyzeContractFromText(params: {
  text: string;
  language?: string;
  modes?: unknown;
}): Promise<{ aggregated: AggregatedData; warnings: string[] }> {
  const { text, language, modes } = params;
  const trimmed = text.trim();

  if (!trimmed) {
    throw new Error("Ingen text hittades i dokumentet.");
  }

  const requestedModes = normalizeModes(modes);
  const aggregated: AggregatedData = {};
  const allWarnings: string[] = [];

  for (const mode of requestedModes) {
    const taskType = MODE_TO_TASK[mode];
    let result: TextscannerTaskResult | null = null;
    try {
      result = await runTextscannerTask({
        type: taskType,
        text: trimmed,
        language
      });
    } catch (taskError) {
      console.error(`contract analysis ${mode} task failed`, taskError);
      if (mode === "finance") {
        if (aggregated.finance === undefined) {
          aggregated.finance = null;
        }
        continue;
      }
      throw taskError;
    }

    mergeResult(aggregated, result, mode);
    if (Array.isArray(result.warnings)) {
      allWarnings.push(...result.warnings);
    }
  }

  if (allWarnings.length) {
    aggregated.warnings = Array.from(new Set(allWarnings));
  }

  return { aggregated, warnings: aggregated.warnings ?? [] };
}

export function aggregatedToSummary(
  aggregated: AggregatedData
): ContractAnalysisSummaryResult {
  const summaryText =
    aggregated.summary ??
    aggregated.simpleExplanation ??
    "Ingen sammanfattning kunde genereras.";

  return {
    summary: summaryText,
    risks: aggregated.risks ?? [],
    keyPoints: aggregated.unclearClauses ?? [],
    finance: aggregated.finance ?? null,
    title: null,
    employer: null,
    employerOrCounterparty: null,
    salary: null,
    pension: null,
    employmentForm: null,
    workloadPercent: null,
    startDate: null,
    endDate: null,
    noticePeriodMonths: null,
    riskLevel: null,
    riskTags: aggregated.risks ?? [],
    notes: aggregated.partyBalance ?? null
  };
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
  return ["summary", "risk", "clarity", "party_balance", "mask", "finance"].includes(
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
    case "finance": {
      const normalizedFinance = normalizeFinance(sections?.finance);
      if (normalizedFinance || sections?.finance === null) {
        aggregated.finance = normalizedFinance;
      } else if (aggregated.finance === undefined) {
        aggregated.finance = null;
      }
      break;
    }
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

function normalizeFinance(input: unknown): ContractFinanceSnapshot | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const finance = input as Record<string, unknown>;

  const name =
    typeof finance.name === "string" && finance.name.trim().length
      ? finance.name.trim()
      : "Avtal";

  const categoryValues: ContractFinanceSnapshot["category"][] = [
    "boende",
    "abonnemang",
    "lån",
    "bil",
    "övrigt"
  ];
  const categoryInput =
    typeof finance.category === "string" ? finance.category.trim() : "";
  const category = categoryValues.includes(
    categoryInput as ContractFinanceSnapshot["category"]
  )
    ? (categoryInput as ContractFinanceSnapshot["category"])
    : "övrigt";

  const currency: "SEK" = "SEK";

  const toNumber = (val: unknown): number | undefined =>
    typeof val === "number" && !Number.isNaN(val) ? val : undefined;

  const toStringOrUndefined = (val: unknown): string | undefined =>
    typeof val === "string" && val.trim().length ? val.trim() : undefined;

  const toStringArray = (val: unknown): string[] =>
    Array.isArray(val)
      ? val
          .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
          .filter(Boolean)
      : [];

  const indexationValues: ContractFinanceSnapshot["indexation"][] = [
    "none",
    "cpi",
    "other"
  ];
  const indexationInput =
    typeof finance.indexation === "string" ? finance.indexation.trim() : "";
  const indexation = indexationValues.includes(
    indexationInput as ContractFinanceSnapshot["indexation"]
  )
    ? (indexationInput as ContractFinanceSnapshot["indexation"])
    : "none";

  return {
    name,
    category,
    currency,
    fixedMonthlyCost: toNumber(finance.fixedMonthlyCost),
    upfrontFee: toNumber(finance.upfrontFee),
    variableCostDescription: toStringOrUndefined(
      finance.variableCostDescription
    ),
    startDate: toStringOrUndefined(finance.startDate),
    endDate: toStringOrUndefined(finance.endDate),
    bindingMonths: toNumber(finance.bindingMonths),
    noticePeriodMonths: toNumber(finance.noticePeriodMonths),
    indexation,
    importantClauses: toStringArray(finance.importantClauses)
  };
}
