import OpenAI from "openai";
import { z } from "zod";

import type { ContractAnalysisResult } from "../shared/types/contracts";

const REQUIRED_ENV_VARS = ["OPENAI_API_KEY"] as const;

const contractSectionSchema = z.object({
  id: z.string().min(1),
  heading: z.string().optional().nullable(),
  text: z.string().min(1),
  riskLevel: z.enum(["low", "medium", "high"]),
  riskReason: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  important: z.boolean().optional()
});

const contractAnalysisSchema = z.object({
  language: z.string().min(2),
  overallRisk: z.enum(["low", "medium", "high"]),
  overallRiskReason: z.string().optional().nullable(),
  summaries: z.object({
    short: z.string().min(1),
    medium: z.string().min(1),
    detailed: z.string().min(1),
    explainLike12: z.string().min(1)
  }),
  sections: z.array(contractSectionSchema).default([]),
  detectedParties: z.array(z.string()).optional(),
  detectedDates: z.array(z.string()).optional(),
  detectedAmounts: z.array(z.string()).optional()
});

function ensureEnv() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Saknar miljövariabler: ${missing.join(", ")}`);
  }
}

const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function callLLMForContractAnalysis(
  rawText: string,
  language: string = "sv"
): Promise<ContractAnalysisResult> {
  ensureEnv();

  const trimmedText = rawText.trim();
  if (!trimmedText) {
    throw new Error("rawText saknas för kontraktsanalys");
  }

  const model = process.env.CONTRACT_ANALYZER_MODEL ?? "gpt-4.1-mini";

  const systemPrompt = `Du är en expert på kommersiella avtal, villkor, risker och svensk affärsjuridik på grundläggande nivå.
Du får INTE ge juridisk rådgivning utan ska endast beskriva risker och strukturera information.
Du ska alltid svara med strikt JSON som följer ContractAnalysisResult-schemat och aldrig lägga till extra text.`;

  const languageGuidance = (() => {
    if (language === "sv") {
      return "Skriv hela analysen på svenska.";
    }
    if (language === "auto") {
      return "Identifiera språket i varje textblock, men skriv hela analysen på svenska. Ange vilket huvudspråk du hittade i fältet language.";
    }
    return `Texten är angiven som ${language}. Identifiera block som kan vara på andra språk men skriv hela analysen på svenska.`;
  })();

  const userPrompt = `Instruktioner:
- ${languageGuidance}
- Identifiera språk per textblock om det varierar och inkludera huvudspråket i resultatets "language"-fält. Om ett språk inte stöds, notera det i sektionens riskReason.
- Normalisera texten försiktigt men bevara språkmetadata.
- Riskprioritera i följande ordning: Term & automatförlängning, IP/licenser, ansvar/ansvarsbegränsning, avgifter & sanktioner, non-compete/confidentiality, tvistelösning/arbitration, uppsägning & termination fee.
- Markera sektioner med ovannämnda kategorier och sätt important=true för riskområden som kräver uppmärksamhet.
- Ge en övergripande risknivå (low/medium/high) med kort motivering.
- Dela upp avtalet i sektioner (logiska stycken). Varje sektion behöver id, text, riskLevel, riskReason, category (t.ex. payment, termination, liability) och flaggan important när det är extra kritiskt.
- Skapa fyra sammanfattningar: short (≈2 meningar, "1-kortsöversikt"), medium (för beslutsfattare), detailed (utförlig genomgång), explainLike12 (enkelt språk för ett barn på 12 år).
- Extrahera listor över parter, relevanta datum och belopp om de finns.
- Du får inte ge juridisk rådgivning, endast teknisk analys.
- Svara ENDAST med giltig JSON som matchar ContractAnalysisResult.

Avtalstext:
<<<CONTRACT>>>
${trimmedText}
<<<END>>>`;

  const completion = await openaiClient.chat.completions.create({
    model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]
  });

  const rawResponse = completion.choices[0]?.message?.content;
  if (!rawResponse) {
    throw new Error("LLM-svaret saknade innehåll");
  }

  const parsed = await parseWithRetry(rawResponse, model);
  const validated = contractAnalysisSchema.parse(parsed);
  return validated;
}

async function parseWithRetry(rawResponse: string, model: string) {
  try {
    return JSON.parse(rawResponse);
  } catch (err) {
    console.warn("Första JSON-parse misslyckades, försöker igen...");
  }

  const retryMessages = [
    {
      role: "system" as const,
      content:
        "Du returnerade JSON som inte kunde tolkas. Returnera nu ENDAST giltig JSON som följer ContractAnalysisResult-schemat och inget mer."
    },
    {
      role: "user" as const,
      content: `Här är ditt tidigare svar. Extrahera endast giltig JSON:\n${rawResponse}`
    }
  ];

  const retryCompletion = await openaiClient.chat.completions.create({
    model,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: retryMessages
  });

  const retryContent = retryCompletion.choices[0]?.message?.content;
  if (!retryContent) {
    throw new Error("LLM kunde inte producera giltig JSON");
  }

  try {
    return JSON.parse(retryContent);
  } catch (err) {
    console.error("Misslyckades att tolka JSON även efter retry:", retryContent);
    throw new Error("Kontraktsanalysen kunde inte tolkas som JSON");
  }
}
