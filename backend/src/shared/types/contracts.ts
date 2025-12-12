export type ContractRiskLevel = "low" | "medium" | "high";

export type SummaryLevel = "short" | "medium" | "detailed";

export interface ContractSectionAnalysis {
  id: string;
  heading?: string | null;
  text: string;
  riskLevel: ContractRiskLevel;
  riskReason?: string | null;
  category?: string | null;
  important?: boolean;
}

export interface ContractSummaries {
  short: string;
  medium: string;
  detailed: string;
  explainLike12: string;
}

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

export interface ContractAnalysisResult {
  language: string;
  overallRisk: ContractRiskLevel;
  overallRiskReason?: string | null;
  sections: ContractSectionAnalysis[];
  summaries: ContractSummaries;
  detectedParties?: string[];
  detectedDates?: string[];
  detectedAmounts?: string[];
  finance?: ContractFinanceSnapshot | null;
}

export type ContractType = "employment" | "rental" | "loan" | "other";

export interface ContractSummary {
  id: string;
  userId: string;
  sourceApp: "textscanner";
  sourceDocumentId: string;
  type: ContractType;
  title: string;
  employerOrCounterparty: string | null;
  monthlyIncome: number | null;
  variableIncome: number | null;
  pensionPercent: number | null;
  employmentForm: "permanent" | "temporary" | "probationary" | null;
  workloadPercent: number | null;
  startDate: string | null;
  endDate: string | null;
  noticePeriodMonths: number | null;
  riskLevel: "low" | "medium" | "high" | null;
  riskTags: string[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
