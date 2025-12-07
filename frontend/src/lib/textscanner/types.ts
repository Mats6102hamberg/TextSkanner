export type ContractFinanceCategory =
  | "boende"
  | "abonnemang"
  | "lån"
  | "bil"
  | "övrigt";

export type ContractFinanceIndexation = "none" | "cpi" | "other";

export interface ContractFinanceSnapshot {
  name: string;
  category: ContractFinanceCategory;
  currency: "SEK";
  fixedMonthlyCost?: number;
  upfrontFee?: number;
  variableCostDescription?: string;
  startDate?: string;
  endDate?: string;
  bindingMonths?: number;
  noticePeriodMonths?: number;
  indexation?: ContractFinanceIndexation;
  importantClauses?: string[];
}

export type TextscannerTaskType =
  | "diary_original"
  | "diary_readable"
  | "diary_story"
  | "contract_summary"
  | "contract_risk"
  | "contract_clarity"
  | "contract_party_balance"
  | "contract_mask_suggestions"
  | "contract_finance"
  | "generic_mask_suggestions";

export interface TextscannerTaskInput {
  type: TextscannerTaskType;
  text: string;
  language?: string; // "sv", "en", "de", etc.
  meta?: Record<string, unknown>;
}

export interface TextscannerTaskResult {
  text: string;
  sections?: {
    summary?: string;
    simpleExplanation?: string;
    risks?: string[];
    unclearClauses?: string[];
    partyBalance?: string;
    maskSuggestions?: string[];
    finance?: ContractFinanceSnapshot | null;
  };
  warnings?: string[];
  debugInfo?: Record<string, unknown>;
}
