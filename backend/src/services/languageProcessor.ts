import OpenAI from "openai";
import { z } from "zod";

const MODE_PROMPTS = {
  simplify: "Förklara följande text på enkel svenska för någon utan fackkunskap.",
  summarize: "Sammanfatta texten kortfattat på svenska med de viktigaste punkterna.",
  translate_en: "Översätt texten till enkel engelska med naturlig ton."
} as const;

type ModeKey = keyof typeof MODE_PROMPTS;

const requestSchema = z.object({
  mode: z.enum(["simplify", "summarize", "translate_en"] as const),
  text: z.string().min(1)
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function processLanguageRequest(payload: unknown): Promise<string> {
  const { mode, text } = requestSchema.parse(payload);

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY saknas");
  }

  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Texten får inte vara tom");
  }

  const prompt = MODE_PROMPTS[mode as ModeKey];

  const completion = await openai.chat.completions.create({
    model: process.env.CONTRACT_ANALYZER_MODEL ?? "gpt-4.1-mini",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: "Du är en hjälpsam språkassistent som skriver tydliga svar."
      },
      {
        role: "user",
        content: `${prompt}\n---\n${trimmed}`
      }
    ]
  });

  const output = completion.choices[0]?.message?.content?.trim();
  if (!output) {
    throw new Error("Språkprocessen gav inget svar");
  }

  return output;
}
