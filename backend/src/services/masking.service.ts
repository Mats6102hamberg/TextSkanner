/**
 * Enkel v1-maskeringsmotor.
 * Fokus: personnummer, telefonnummer, e-post, långa tal.
 * Går att bygga ut senare.
 */

export type MaskingOptions = {
  maskPersonnummer?: boolean;
  maskEmail?: boolean;
  maskPhone?: boolean;
  maskLongNumbers?: boolean;
};

const DEFAULT_OPTIONS: MaskingOptions = {
  maskPersonnummer: true,
  maskEmail: true,
  maskPhone: true,
  maskLongNumbers: true,
};

export type MaskingResult = {
  originalText: string;
  maskedText: string;
  changes: {
    type: "personnummer" | "email" | "phone" | "number";
    original: string;
    masked: string;
    index: number;
  }[];
};

export function maskText(
  text: string,
  options: MaskingOptions = DEFAULT_OPTIONS
): MaskingResult {
  let masked = text;
  const changes: MaskingResult["changes"] = [];

  const applyPattern = (
    pattern: RegExp,
    type: MaskingResult["changes"][number]["type"],
    maskFn: (match: string) => string
  ) => {
    let match: RegExpExecArray | null;
    pattern.lastIndex = 0;

    while ((match = pattern.exec(text)) !== null) {
      const original = match[0];
      const maskedValue = maskFn(original);

      masked = masked.replace(original, maskedValue);

      changes.push({
        type,
        original,
        masked: maskedValue,
        index: match.index,
      });
    }
  };

  // Personnummer: ÅÅÅÅMMDD-XXXX eller ÅÅMMDD-XXXX
  if (options.maskPersonnummer) {
    const pnrPattern =
      /\b(\d{6}|\d{8})[-+]\d{4}\b/g; // ex: 750312-1234, 19850312-5678
    applyPattern(pnrPattern, "personnummer", (match) => {
      // Behåll födelsedelen, maska sista 4
      const parts = match.split(/[-+]/);
      if (parts.length !== 2) return "XXXXXXXX-XXXX";
      return `${parts[0]}-XXXX`;
    });
  }

  // E-postadresser
  if (options.maskEmail) {
    const emailPattern =
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
    applyPattern(emailPattern, "email", () => "[MASKERAD E-POST]");
  }

  // Svenska telefonnummer (enkel v1): +46..., 07..., 08...
  if (options.maskPhone) {
    // International format: +46 followed by 9-10 digits
    const intlPhonePattern = /\+46[\s-]?\d{1,3}[\s-]?\d{3,4}[\s-]?\d{2,4}/g;
    applyPattern(intlPhonePattern, "phone", () => '+46-XXX-XXX-XX');

    // Swedish mobile: 07X-XXX XX XX
    const mobilePattern = /\b07[\d\s-]{8,12}\b/g;
    applyPattern(mobilePattern, "phone", () => '07X-XXX-XX-XX');

    // Stockholm landline: 08-XXX XX XX
    const stockholmPattern = /\b08[\s-]?[\d\s-]{6,10}\b/g;
    applyPattern(stockholmPattern, "phone", () => '08-XXX-XX-XX');
  }

  // Långa nummer (t.ex. bankkonton, organisationsnummer)
  if (options.maskLongNumbers) {
    // Organisationsnummer: XXXXXX-XXXX (6 siffror, bindestreck, 4 siffror)
    const orgPattern = /\b\d{6}-\d{4}\b/g;
    applyPattern(orgPattern, "number", (match) => {
      const parts = match.split('-');
      return `${parts[0]}-XXXX`;
    });

    // Bankkonton: sekvenser av 10+ siffror (med optional bindestreck/mellanslag)
    const bankPattern = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4,}\b/g;
    applyPattern(bankPattern, "number", () => "XXXX-XXXX-XXXX");
  }

  return {
    originalText: text,
    maskedText: masked,
    changes,
  };
}

/**
 * Utility: Check if text contains sensitive information
 */
export function containsSensitiveInfo(text: string): boolean {
  const result = maskText(text);
  return result.changes.length > 0;
}

/**
 * Utility: Get statistics about masked content
 */
export function getMaskingStats(result: MaskingResult) {
  const stats = {
    totalMasked: result.changes.length,
    personnummer: 0,
    email: 0,
    phone: 0,
    number: 0,
  };

  result.changes.forEach((change) => {
    stats[change.type]++;
  });

  return stats;
}
