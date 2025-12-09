import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import type { ContractSummary } from "@/types/contracts";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const summary = (await req.json()) as Partial<ContractSummary> | null;
    if (!summary || typeof summary !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const baseUrl = process.env.PROSPERO_BASE_URL;
    if (!baseUrl) {
      console.warn("PROSPERO_BASE_URL is not configured; cannot forward contract");
      return NextResponse.json(
        { error: "Prospero-integration saknar konfiguration." },
        { status: 500 }
      );
    }

    const enrichedSummary: ContractSummary = {
      ...summary,
      userId: summary.userId ?? user.id,
      sourceApp: "textscanner",
      // säkerställ obligatoriska fält med rimliga defaultar
      id: summary.id ?? "temp-" + randomUUID(),
      sourceDocumentId: summary.sourceDocumentId ?? "unknown-document",
      type: summary.type ?? "other",
      title: summary.title ?? "Okänt avtal",
      employerOrCounterparty: summary.employerOrCounterparty ?? null,
      monthlyIncome: summary.monthlyIncome ?? null,
      variableIncome: summary.variableIncome ?? null,
      pensionPercent: summary.pensionPercent ?? null,
      startDate: summary.startDate ?? null,
      endDate: summary.endDate ?? null,
      noticePeriodMonths: summary.noticePeriodMonths ?? null,
      riskTags: summary.riskTags ?? [],
      riskLevel: summary.riskLevel ?? null,
      employmentForm: summary.employmentForm ?? null,
      workloadPercent: summary.workloadPercent ?? null,
      notes: summary.notes ?? null,
      createdAt: summary.createdAt ?? new Date().toISOString(),
      updatedAt: summary.updatedAt ?? new Date().toISOString()
    } as ContractSummary;

    console.log("Forwarding ContractSummary to Prospero", {
      id: enrichedSummary.id,
      title: enrichedSummary.title
    });

    let forwardResponse: Response;
    try {
      forwardResponse = await fetch(`${baseUrl}/api/integrations/contracts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(enrichedSummary)
      });
    } catch (fetchError) {
      console.error("Failed to reach Prospero API", fetchError);
      return NextResponse.json(
        { error: "Kunde inte nå Prospero just nu." },
        { status: 502 }
      );
    }

    const responseBody = await forwardResponse.text();
    const contentType =
      forwardResponse.headers.get("content-type") ?? "application/json";

    return new NextResponse(responseBody, {
      status: forwardResponse.status,
      headers: {
        "content-type": contentType
      }
    });
  } catch (error) {
    console.error("/api/prospero/contracts POST failed", error);
    return NextResponse.json(
      { error: "Failed to forward contract" },
      { status: 500 }
    );
  }
}
