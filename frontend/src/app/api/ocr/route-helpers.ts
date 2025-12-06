import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function runOcrOnBuffer(
  buffer: Buffer,
  mime: string,
  language: string
) {
  const base64 = buffer.toString("base64");
  const sourceLanguageInstruction =
    language === "auto"
      ? "Försök först avgöra vilket språk texten är på. Läs sedan av all text så noggrant som möjligt."
      : `Texten är på språket "${language}". Läs av den exakt som den står.`;

  const prompt = `
${sourceLanguageInstruction}

Regler:
- Returnera bara råtexten från dokumentet/bilden.
- Ta inte med egna kommentarer eller rubriker.
- Översätt inte texten.
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: {
              url: `data:${mime};base64,${base64}`
            }
          }
        ]
      }
    ]
  });

  return completion.choices[0]?.message?.content?.trim() ?? "";
}
