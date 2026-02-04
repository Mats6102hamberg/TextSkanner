/**
 * Maskerar känsliga personuppgifter i text med regex-baserad metod
 * För mer avancerad maskering, använd AI-baserad identifiering
 */
export async function maskSensitiveData(input: string): Promise<string> {
  if (!input || !input.trim()) {
    return input ?? "";
  }

  let masked = input;

  // Bankkort (16 siffror) - gör detta först för att undvika konflikter
  masked = masked.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, "[MASKERAT KORTNUMMER]");

  // E-postadresser
  masked = masked.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}/g, "[MASKERAD E-POST]");

  // Internationella telefonnummer
  masked = masked.replace(/\b\+\d{1,3}[\s-]?\d{1,4}[\s-]?\d{1,4}[\s-]?\d{1,9}\b/g, "[MASKERAT TELEFONNUMMER]");

  // Svenska telefonnummer
  masked = masked.replace(/\b(?:\+46|0)([\s-]?\d){2,3}[\s-]?\d{2,3}[\s-]?\d{2}[\s-]?\d{2}\b/g, "[MASKERAT TELEFONNUMMER]");

  // Personnummer (YYMMDD-XXXX eller YYYYMMDD-XXXX)
  masked = masked.replace(/\b(?:\d{6}|\d{8})[-+]\d{4}\b/g, "[MASKERAT PERSONNUMMER]");

  // Organisationsnummer (börjar oftast med 55, 16, 20, etc)
  masked = masked.replace(/\b(?:55|16|20|21|22|23|24|25|26|27|28|29|30|31|32|33|34|35|36|37|38|39|40|41|42|43|44|45|46|47|48|49|50|51|52|53|54|56|57|58|59|60|61|62|63|64|65|66|67|68|69|70|71|72|73|74|75|76|77|78|79|80|81|82|83|84|85|86|87|88|89|90|91|92|93|94|95|96|97|98|99)\d{4}-\d{4}\b/g, "[MASKERAT ORGNR]");

  // Gatuadresser (svensk och engelsk format)
  masked = masked.replace(
    /\b([A-ZÅÄÖ][a-zåäö]+(?:gatan|vägen|gränden|gärdet|liden|stigen|torget|road|street|avenue|drive|lane|boulevard))\s+\d+[A-Z]?\b/g,
    "[MASKERAD ADRESS]"
  );
  
  // Fler adressformat (nummer först)
  masked = masked.replace(
    /\b\d+[A-Z]?\s+([A-ZÅÄÖ][a-zåäö]+(?:gatan|vägen|gränden|gärdet|liden|stigen|torget|road|street|avenue|drive|lane|boulevard))\b/g,
    "[MASKERAD ADRESS]"
  );

  // Kontonummer (3-4 siffror - 4 siffror)
  masked = masked.replace(/\b\d{3,4}[-]\d{4}\b/g, "[MASKERAT KONTONR]");

  // Postnummer (svenskt format: XXX XX eller XXXXX)
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

  // Organisationsnummer (först för att undvika konflikter)
  const orgNrRegex = /\b(6[0-9]|7[0-9]|8[0-9]|9[0-9])\d{4}-\d{4}\b/g;
  let match;
  while ((match = orgNrRegex.exec(text)) !== null) {
    sensitive.push({
      type: "Organisationsnummer",
      value: match[0],
      position: match.index
    });
  }

  // Personnummer
  const personnummerRegex = /\b(\d{6}|\d{8})[-+]\d{4}\b/g;
  while ((match = personnummerRegex.exec(text)) !== null) {
    sensitive.push({
      type: "Personnummer",
      value: match[0],
      position: match.index
    });
  }

  // Telefonnummer (svenska)
  const phoneRegex = /\b(?:\+46|0)([\s-]?\d){2,3}[\s-]?\d{2,3}[\s-]?\d{2}[\s-]?\d{2}\b/g;
  while ((match = phoneRegex.exec(text)) !== null) {
    sensitive.push({
      type: "Telefonnummer",
      value: match[0],
      position: match.index
    });
  }

  // Internationella telefonnummer
  const intlPhoneRegex = /\b\+\d{1,3}[\s-]?\d{1,4}[\s-]?\d{1,4}[\s-]?\d{1,9}\b/g;
  while ((match = intlPhoneRegex.exec(text)) !== null) {
    sensitive.push({
      type: "Internationellt telefonnummer",
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

  // Adresser
  const addressRegex = /\b([A-ZÅÄÖ][a-zåäö]+(?:gatan|vägen|gränden|gärdet|liden|stigen|torget|road|street|avenue|drive|lane|boulevard))\s+\d+[A-Z]?\b/g;
  while ((match = addressRegex.exec(text)) !== null) {
    sensitive.push({
      type: "Adress",
      value: match[0],
      position: match.index
    });
  }

  return sensitive;
}
