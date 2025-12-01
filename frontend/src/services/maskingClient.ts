const BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000/api";

export type MaskChange = {
  type: "personnummer" | "email" | "phone" | "number";
  original: string;
  masked: string;
  index: number;
};

export type MaskingResponse = {
  originalText: string;
  maskedText: string;
  changes: MaskChange[];
};

export async function processMasking(text: string): Promise<MaskingResponse> {
  const res = await fetch(`${BASE_URL}/masking/process`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    throw new Error("Kunde inte maskera texten");
  }

  return res.json();
}
