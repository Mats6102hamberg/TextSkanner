export type ContractRiskLevel = "low" | "medium" | "high";

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

export type AnalyzeMode = "quick" | "save";

export interface ContractAnalysisSummaryResult {
  // Grundläggande information
  summary: string;
  title?: string | null;
  employer?: string | null;
  employerOrCounterparty?: string | null;
  roleTitle?: string | null;
  
  // Lön och ersättning
  salary?: {
    monthly?: number | null;
    variable?: number | null;
  } | null;
  pension?: {
    percent?: number | null;
  } | null;
  benefits?: string[];
  
  // Tidsperioder
  startDate?: string | null;
  endDate?: string | null;
  probationMonths?: number | null;
  noticePeriodMonths?: number | null;
  
  // Risk och analys
  risks: string[];
  riskLevel?: ContractRiskLevel | null;
  riskTags?: string[];
  riskSummary?: string;
  
  // Ytterligare information
  employmentForm?: "permanent" | "temporary" | "probationary" | null;
  workloadPercent?: number | null;
  keyPoints: string[];
  notes?: string | null;
  
  // Originaldokument
  originalText?: string;
  
  // Övrigt
  finance?: ContractFinanceSnapshot | null;
}

export type AvtalsAnalysis = ContractAnalysisSummaryResult;

export interface SavedContractSummary {
  id: string;
  name: string;
  analyzedAt: string;
}

export type ContractType = "employment" | "rental" | "loan" | "other";

export interface ContractSummary {
  // Identifikation
  id: string;
  userId: string;
  sourceApp: "textscanner";
  sourceDocumentId: string;
  type: ContractType;
  
  // Grundläggande information
  title: string;
  employerName?: string;
  employerOrCounterparty: string | null;
  roleTitle?: string;
  
  // Lön och ersättning
  salaryAmount?: number;
  salaryCurrency?: "SEK" | "EUR" | string;
  salaryPeriod?: "month" | "year" | "hour";
  monthlyIncome: number | null;
  variableIncome: number | null;
  pensionPercent: number | null;
  benefits?: string[];
  
  // Tidsperioder
  startDate: string | null;
  endDate: string | null;
  probationMonths?: number;
  noticePeriodMonths: number | null;
  
  // Risk och analys
  riskTags: string[];
  riskLevel: "low" | "medium" | "high" | null;
  riskSummary?: string;
  
  // Ytterligare information
  employmentForm: "permanent" | "temporary" | "probationary" | null;
  workloadPercent: number | null;
  originalTextPreview?: string;
  
  // Metadata
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
