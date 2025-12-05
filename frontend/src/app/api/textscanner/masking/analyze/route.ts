import { NextRequest, NextResponse } from "next/server";

import { runTextscannerTask } from "@/lib/textscanner/core";

type MaskingOptions = {
  maskNames?: boolean;
  maskAddresses?: boolean;
  maskPersonIds?: boolean;
  maskContact?: boolean;
  maskAccounts?: boolean;
  maskOrgIds?: boolean;
  maskAll?: boolean;
};

interface MaskingPayload {
  text?: unknown;
  language?: unknown;
  options?: unknown;
}

const MASK_PLACEHOLDERS = {
  names: "[MASK:NAMN]",
  addresses: "[MASK:ADRESS]",
  personIds: "[MASK:PERSONNR]",
  contact: "[MASK:KONTAKT]",
  accounts: "[MASK:KONTO]",
  orgIds: "[MASK:ORGNR]"
};

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as MaskingPayload;
    const text = typeof payload.text === "string" ? payload.text : "";

    if (!text.trim()) {
      return NextResponse.json(
        { ok: false, error: "Text is required." },
        { status: 400 }
      );
    }

    const options = resolveOptions(payload.options);
    const taskResult = await runTextscannerTask({
      type: "generic_mask_suggestions",
      text,
      language:
        typeof payload.language === "string" && payload.language.trim().length
          ? payload.language.trim()
          : undefined
    });

    const maskedText = applyMasking(text, options);
    const maskSuggestions = taskResult.sections?.maskSuggestions ?? [];

    return NextResponse.json({
      ok: true,
      data: {
        originalText: text,
        maskedText,
        maskSuggestions,
        warnings: taskResult.warnings
      }
    });
  } catch (error) {
    console.error("masking/analyze failed", error);
    return NextResponse.json(
      { ok: false, error: "Failed to mask text." },
      { status: 500 }
    );
  }
}

function resolveOptions(input: unknown): Required<MaskingOptions> {
  const defaults: Required<MaskingOptions> = {
    maskNames: true,
    maskAddresses: true,
    maskPersonIds: true,
    maskContact: true,
    maskAccounts: true,
    maskOrgIds: true,
    maskAll: false
  };

  if (!input || typeof input !== "object") {
    return defaults;
  }

  const parsed = { ...defaults, ...(input as MaskingOptions) };
  if (parsed.maskAll) {
    parsed.maskNames = true;
    parsed.maskAddresses = true;
    parsed.maskPersonIds = true;
    parsed.maskContact = true;
    parsed.maskAccounts = true;
    parsed.maskOrgIds = true;
  }

  return parsed;
}

function applyMasking(text: string, options: Required<MaskingOptions>): string {
  let output = text;

  if (options.maskPersonIds) {
    // Swedish personnr: 6 digits + separator + 4 digits
    output = output.replace(/\b\d{6}[-+]\d{4}\b/g, MASK_PLACEHOLDERS.personIds);
  }

  if (options.maskOrgIds) {
    // Simple orgnr pattern: 6 digits + '-' + 4 digits (reuse but keep separate placeholder)
    output = output.replace(/\b\d{6}-\d{4}\b/g, MASK_PLACEHOLDERS.orgIds);
  }

  if (options.maskAccounts) {
    // Mask IBAN-like strings or long digit groups (10+)
    output = output.replace(/\b[\dA-Z]{10,}\b/g, MASK_PLACEHOLDERS.accounts);
  }

  if (options.maskContact) {
    // Emails
    output = output.replace(
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
      MASK_PLACEHOLDERS.contact
    );
    // Phone numbers (simple patterns)
    output = output.replace(
      /(\+?\d{2}\s?)?(\d{2,3}[-\s]?){2,4}\d{2,4}/g,
      MASK_PLACEHOLDERS.contact
    );
  }

  if (options.maskAddresses) {
    // Simple street detection (Swedish/English endings)
    output = output.replace(
      /\b([A-ZÅÄÖ][a-zåäö]+(?:gatan|vägen|gränden|road|street|avenue))\s+\d+[A-Z]?/g,
      MASK_PLACEHOLDERS.addresses
    );
  }

  if (options.maskNames) {
    // Mask double-capitalized words (heuristic for names)
    output = output.replace(
      /\b([A-ZÅÄÖ][a-zåäö]+\s+[A-ZÅÄÖ][a-zåäö]+)\b/g,
      MASK_PLACEHOLDERS.names
    );
  }

  return output;
}
