/**
 * Maskerar känsliga personuppgifter i text med regex-baserad metod
 * För mer avancerad maskering, använd AI-baserad identifiering
 */
export async function maskSensitiveData(input: string): Promise<string> {
  if (!input || !input.trim()) {
    return input ?? "";
  }

  let masked = input;

  // Personnummer (svenskt format: YYMMDD-XXXX eller YYYYMMDD-XXXX)
  masked = masked.replace(/\b(\d{6}|\d{8})[-+]\d{4}\b/g, "[MASKERAT PERSONNUMMER]");

  // Telefonnummer (svenskt format)
  masked = masked.replace(/\b(?:\+46|0)([\s-]?\d){7,}\b/g, "[MASKERAT TELEFONNUMMER]");

  // E-postadresser
  masked = masked.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}/g, "[MASKERAD E-POST]");

  // Gatuadresser (svensk/engelsk format)
  masked = masked.replace(
    /\b([A-ZÅÄÖ][a-zåäö]+(?:gatan|vägen|gränden|road|street|avenue))\s+\d+[A-Z]?\b/g,
    "[MASKERAD ADRESS]"
  );

  // Organisationsnummer
  masked = masked.replace(/\b\d{6}-\d{4}\b/g, "[MASKERAT ORGNR]");

  // Kontonummer (förenklat)
  masked = masked.replace(/\b\d{3,5}[- ]?\d{4}\b/g, "[MASKERAT KONTONR]");

  // Bankkort (16 siffror med mellanslag eller bindestreck)
  masked = masked.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, "[MASKERAT KORTNUMMER]");

  // Postnummer (svenskt format: XXX XX)
  masked = masked.replace(/\b\d{3}\s?\d{2}\b/g, "[MASKERAT POSTNUMMER]");

  return masked;
}

/**
 * Identifierar känslig information med AI (för förhandsgranskning)
 * Returnerar lista med identifierade känsliga element
 */
export async function identifySensitiveData(
  text: string
): Promise<{ type: string; value: string; position: number }[]> {
  // Denna funktion kan utökas med AI-baserad identifiering
  // För nu returnerar vi regex-baserade träffar
  const sensitive: { type: string; value: string; position: number }[] = [];

  // Personnummer
  const personnummerRegex = /\b(\d{6}|\d{8})[-+]\d{4}\b/g;
  let match;
  while ((match = personnummerRegex.exec(text)) !== null) {
    sensitive.push({
      type: "Personnummer",
      value: match[0],
      position: match.index
    });
  }

  // Telefonnummer
  const phoneRegex = /\b(?:\+46|0)([\s-]?\d){7,}\b/g;
  while ((match = phoneRegex.exec(text)) !== null) {
    sensitive.push({
      type: "Telefonnummer",
      value: match[0],
      position: match.index
    });
  }

  // E-post
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}/g;
  while ((match = emailRegex.exec(text)) !== null) {
    sensitive.push({
      type: "E-postadress",
      value: match[0],
      position: match.index
    });
  }

  return sensitive;
}
