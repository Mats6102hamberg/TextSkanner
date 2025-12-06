export async function maskSensitiveData(input: string): Promise<string> {
  if (!input || !input.trim()) {
    return input ?? "";
  }

  return input
    .replace(/\b(\d{6}|\d{8})[-+]\d{4}\b/g, "[MASKERAT PERSONNUMMER]")
    .replace(/\b(?:\+46|0)([\s-]?\d){7,}\b/g, "[MASKERAT TELEFONNUMMER]")
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}/g, "[MASKERAD E-POST]")
    .replace(
      /\b([A-ZÅÄÖ][a-zåäö]+(?:gatan|vägen|gränden|road|street|avenue))\s+\d+[A-Z]?\b/g,
      "[MASKERAD ADRESS]"
    )
    .replace(/\b\d{6}-\d{4}\b/g, "[MASKERAT ORGNR]")
    .replace(/\b\d{3,5}[- ]?\d{4}\b/g, "[MASKERAT KONTONR]");
}
