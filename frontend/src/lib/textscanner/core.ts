import { openai } from "../openai";
import type {
  TextscannerTaskInput,
  TextscannerTaskResult
} from "./types";

const DEFAULT_MODEL = process.env.OPENAI_CONTRACT_MODEL ?? "gpt-4o-mini";

export async function runTextscannerTask(
  input: TextscannerTaskInput
): Promise<TextscannerTaskResult> {
  switch (input.type) {
    case "diary_original":
      return handleDiaryOriginal(input);
    case "diary_readable":
      return handleDiaryReadable(input);
    case "diary_story":
      return handleDiaryStory(input);
    case "contract_summary":
      return handleContractSummary(input);
    case "contract_risk":
      return handleContractRisk(input);
    case "contract_clarity":
      return handleContractClarity(input);
    case "contract_party_balance":
      return handleContractPartyBalance(input);
    case "contract_mask_suggestions":
      return handleContractMaskSuggestions(input);
    case "generic_mask_suggestions":
      return handleGenericMaskSuggestions(input);
    default:
      throw new Error(`Unsupported task type: ${input.type}`);
  }
}

async function handleDiaryOriginal(
  input: TextscannerTaskInput
): Promise<TextscannerTaskResult> {
  const systemPrompt = `
You are a diary text assistant. Keep the original meaning and tone.
Tasks:
1) Preserve all content.
2) Only fix obvious OCR issues, spacing, and nonsense characters.
3) Provide a very short summary if possible.
Respond in JSON with keys: text (string), summary (string), warnings (string array).
`;

  const raw = await callTextModel(systemPrompt, input.text);
  const analysis = parseJson(raw);
  const cleanedText =
    typeof analysis.text === "string" && analysis.text.trim().length
      ? analysis.text
      : raw;
  const summary =
    typeof analysis.summary === "string" ? analysis.summary : undefined;
  const warnings = Array.isArray(analysis.warnings) ? analysis.warnings : [];

  return {
    text: cleanedText,
    sections: {
      summary
    },
    warnings
  };
}

async function handleGenericMaskSuggestions(
  input: TextscannerTaskInput
): Promise<TextscannerTaskResult> {
  const systemPrompt = `
You are a privacy assistant helping Textscanner users find sensitive data.
Find elements such as personal identification numbers, names of private individuals, home or office addresses, email addresses, phone numbers, bank/account numbers, and organization IDs.
Respond ONLY in JSON with keys: maskSuggestions (string array), warnings (string array).
When you reference detected items, describe them generically (e.g., "personnummer", "namn på privatpersoner") instead of repeating the raw data.
`;

  try {
    const raw = await callTextModel(systemPrompt, input.text);
    const analysis = parseJson(raw);
    const maskSuggestions = normalizeStringArray(analysis.maskSuggestions);
    const warnings = Array.isArray(analysis.warnings) ? analysis.warnings : [];

    return {
      text: input.text,
      sections: {
        maskSuggestions
      },
      warnings
    };
  } catch (error) {
    console.warn("generic mask suggestions failed", error);
    return {
      text: input.text,
      sections: {
        maskSuggestions: []
      },
      warnings: ["Maskeringsförslagen kunde inte hämtas just nu."]
    };
  }
}

async function handleDiaryReadable(
  input: TextscannerTaskInput
): Promise<TextscannerTaskResult> {
  const systemPrompt = `
You are an editor improving diary text readability.
Tasks:
1) Split sentences, fix spelling, add punctuation.
2) Keep facts and tone intact; do not invent events.
3) Match the diary's language when possible.
4) Provide a simple explanation (author voice) if relevant.
Respond in JSON with keys: text (string), simpleExplanation (string), warnings (string array).
`;

  const raw = await callTextModel(systemPrompt, input.text);
  const analysis = parseJson(raw);
  const readableText =
    typeof analysis.text === "string" && analysis.text.trim().length
      ? analysis.text
      : raw;
  const simpleExplanation =
    typeof analysis.simpleExplanation === "string"
      ? analysis.simpleExplanation
      : undefined;
  const warnings = Array.isArray(analysis.warnings) ? analysis.warnings : [];

  return {
    text: readableText,
    sections: {
      simpleExplanation
    },
    warnings
  };
}

async function handleDiaryStory(
  input: TextscannerTaskInput
): Promise<TextscannerTaskResult> {
  const systemPrompt = `
You are a storyteller turning diary text into a narrative.
Tasks:
1) Write a story inspired by the diary, preferably in first person ("I...").
2) Keep the emotional truth but enrich descriptions.
3) Produce clear paragraphs with a literary tone.
4) Provide a short summary of the story.
Respond in JSON with keys: text (string), summary (string), warnings (string array).
`;

  const raw = await callTextModel(systemPrompt, input.text);
  const analysis = parseJson(raw);
  const storyText =
    typeof analysis.text === "string" && analysis.text.trim().length
      ? analysis.text
      : raw;
  const summary =
    typeof analysis.summary === "string" ? analysis.summary : undefined;
  const warnings = Array.isArray(analysis.warnings) ? analysis.warnings : [];

  return {
    text: storyText,
    sections: {
      summary
    },
    warnings
  };
}

async function handleContractSummary(
  input: TextscannerTaskInput
): Promise<TextscannerTaskResult> {
  const systemPrompt = `
You are a legally savvy assistant for Textscanner. You receive a contract passage.
Tasks:
1) Produce a concise neutral summary (max 10 sentences).
2) Offer a simple, plain-language explanation.
3) Flag warnings if the contract seems extremely one-sided or very complex.
Never give legal advice—only explain.
Match the language of the input text when possible.
Respond in JSON with keys: summary (string), simpleExplanation (string), warnings (string array).
`;

  const raw = await callTextModel(systemPrompt, input.text);
  const analysis = parseJson(raw);
  const summary = typeof analysis.summary === "string" ? analysis.summary : raw;
  const simpleExplanation =
    typeof analysis.simpleExplanation === "string"
      ? analysis.simpleExplanation
      : undefined;
  const warnings = Array.isArray(analysis.warnings) ? analysis.warnings : [];

  return {
    text: summary,
    sections: {
      summary,
      simpleExplanation
    },
    warnings
  };
}

async function handleContractRisk(
  input: TextscannerTaskInput
): Promise<TextscannerTaskResult> {
  const systemPrompt = `
You are a neutral contract risk analyst for Textscanner.
Describe pitfalls, disadvantages, and potential risks found in the contract text.
Focus on factual observations. No legal advice, only explanation.
Highlight if the agreement appears very one-sided or unusually complex.
Respond in JSON with keys: risks (string array), warnings (string array).
Match the input language where possible.
`;

  const raw = await callTextModel(systemPrompt, input.text);
  const analysis = parseJson(raw);
  const risks = Array.isArray(analysis.risks)
    ? analysis.risks
    : typeof analysis.risks === "string"
      ? analysis.risks.split(/\n+/)
      : [];
  const warnings = Array.isArray(analysis.warnings) ? analysis.warnings : [];

  return {
    text: risks.join("\n"),
    sections: {
      risks
    },
    warnings
  };
}

async function handleContractClarity(
  input: TextscannerTaskInput
): Promise<TextscannerTaskResult> {
  const systemPrompt = `
You are a clarity reviewer for Textscanner.
Identify clauses that feel ambiguous, vague, or hard to interpret.
Explain briefly why each clause is unclear.
Remain neutral and avoid giving legal advice.
Respond in JSON with keys: unclearClauses (string array), simpleExplanation (string), warnings (string array).
Output should match the contract language where possible.
`;

  const raw = await callTextModel(systemPrompt, input.text);
  const analysis = parseJson(raw);
  const unclearClauses = Array.isArray(analysis.unclearClauses)
    ? analysis.unclearClauses
    : typeof analysis.unclearClauses === "string"
      ? analysis.unclearClauses.split(/\n+/)
      : [];
  const simpleExplanation =
    typeof analysis.simpleExplanation === "string"
      ? analysis.simpleExplanation
      : undefined;
  const warnings = Array.isArray(analysis.warnings) ? analysis.warnings : [];

  return {
    text: simpleExplanation ?? unclearClauses.join("\n"),
    sections: {
      simpleExplanation,
      unclearClauses
    },
    warnings
  };
}

async function handleContractPartyBalance(
  input: TextscannerTaskInput
): Promise<TextscannerTaskResult> {
  const systemPrompt = `
You are an impartial contract balance analyst for Textscanner.
Determine which party appears to benefit the most and explain why.
Include any high-level summary that supports your assessment.
If the contract looks extremely one-sided, add a warning.
Never give legal advice—only describe observations.
Respond in JSON with keys: partyBalance (string), summary (string), warnings (string array).
Match the input language when possible.
`;

  const raw = await callTextModel(systemPrompt, input.text);
  const analysis = parseJson(raw);
  const partyBalance =
    typeof analysis.partyBalance === "string" ? analysis.partyBalance : raw;
  const summary =
    typeof analysis.summary === "string" ? analysis.summary : undefined;
  const warnings = Array.isArray(analysis.warnings) ? analysis.warnings : [];

  return {
    text: partyBalance,
    sections: {
      partyBalance,
      summary
    },
    warnings
  };
}

async function handleContractMaskSuggestions(
  input: TextscannerTaskInput
): Promise<TextscannerTaskResult> {
  const systemPrompt = `
You are a privacy-focused assistant for Textscanner.
Identify which parts of the contract should be masked or anonymized (e.g., names, addresses, personal IDs, organization numbers, bank/account numbers).
Describe each sensitive element briefly.
Avoid legal advice.
Respond in JSON with keys: maskSuggestions (string array), warnings (string array).
Match the input language where possible.
`;

  const raw = await callTextModel(systemPrompt, input.text);
  const analysis = parseJson(raw);
  const maskSuggestions = Array.isArray(analysis.maskSuggestions)
    ? analysis.maskSuggestions
    : typeof analysis.maskSuggestions === "string"
      ? analysis.maskSuggestions.split(/\n+/)
      : [];
  const warnings = Array.isArray(analysis.warnings) ? analysis.warnings : [];

  return {
    text: maskSuggestions.join("\n"),
    sections: {
      maskSuggestions
    },
    warnings
  };
}

async function callTextModel(
  systemPrompt: string,
  sourceText: string
): Promise<string> {
  const trimmedPrompt = systemPrompt.trim();
  const userContent = sourceText?.trim() || "(empty text)";

  const completion = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    temperature: 0.2,
    messages: [
      { role: "system", content: trimmedPrompt },
      { role: "user", content: userContent }
    ]
  });

  return completion.choices[0]?.message?.content?.trim() ?? "";
}

function parseJson(raw: string): Record<string, any> {
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    const jsonString = match ? match[0] : raw;
    const parsed = JSON.parse(jsonString);
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch (error) {
    console.warn("Kunde inte tolka JSON från AI", error);
  }
  return {};
}

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split(/\n+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}
