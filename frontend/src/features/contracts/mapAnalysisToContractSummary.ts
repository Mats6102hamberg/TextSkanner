import { randomUUID } from "crypto";

import type { AvtalsAnalysis, ContractSummary } from "@/types/contracts";

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

export function mapAnalysisToContractSummary(params: {
  userId: string;
  documentId: string;
  analysis: AvtalsAnalysis;
}): ContractSummary {
  const { userId, documentId, analysis } = params;
  const now = new Date().toISOString();

  const salary = analysis.salary ?? null;
  const pension = analysis.pension ?? null;

  const monthlyIncome = asNumber(salary?.monthly);
  const variableIncome = asNumber(salary?.variable);
  const pensionPercent = asNumber(pension?.percent);
  const workloadPercent = asNumber(analysis.workloadPercent);
  const noticePeriodMonths = asNumber(analysis.noticePeriodMonths);

  const startDate = asString(analysis.startDate);
  const endDate = asString(analysis.endDate);

  const riskTags = Array.isArray(analysis.riskTags)
    ? analysis.riskTags.filter((tag) => typeof tag === "string" && tag.trim().length)
    : [];

  // Extrahera löneinformation
  const salaryAmount = asNumber(analysis.salary?.monthly) ?? monthlyIncome ?? undefined;
  const salaryCurrency = 'SEK'; // Standardvärde, kan hämtas från analysen om det finns
  const salaryPeriod = 'month'; // Standardvärde, kan anpassas baserat på analysen
  
  // Skapa en förhandsgranskning av originaltexten (första 500 tecknen)
  const originalTextPreview = typeof analysis.originalText === 'string' 
    ? analysis.originalText.substring(0, 500) 
    : undefined;

  return {
    // Identifikation
    id: randomUUID(),
    userId,
    sourceApp: "textscanner",
    sourceDocumentId: documentId,
    type: "employment",
    
    // Grundläggande information
    title: asString(analysis.title) ?? "Anställningsavtal",
    employerName: asString(analysis.employer) ?? undefined,
    employerOrCounterparty: 
      asString(analysis.employerOrCounterparty) ?? asString(analysis.employer),
    roleTitle: asString(analysis.roleTitle) ?? undefined,
    
    // Lön och ersättning
    salaryAmount,
    salaryCurrency,
    salaryPeriod,
    monthlyIncome,
    variableIncome,
    pensionPercent,
    benefits: Array.isArray(analysis.benefits) 
      ? analysis.benefits.filter((b): b is string => typeof b === 'string' && b.trim().length > 0)
      : undefined,
    
    // Tidsperioder
    startDate,
    endDate,
    probationMonths: asNumber(analysis.probationMonths) || undefined,
    noticePeriodMonths,
    
    // Risk och analys
    riskTags: riskTags.length ? riskTags : analysis.risks ?? [],
    riskLevel: analysis.riskLevel ?? null,
    riskSummary: asString(analysis.riskSummary) || analysis.summary,
    
    // Ytterligare information
    employmentForm: analysis.employmentForm ?? null,
    workloadPercent,
    originalTextPreview,
    
    // Metadata
    notes: asString(analysis.notes) ?? analysis.summary ?? null,
    createdAt: now,
    updatedAt: now
  };
}
