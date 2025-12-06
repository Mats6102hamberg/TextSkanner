import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import type PDFKit from "pdfkit";

import type { MemoryBook } from "@/lib/memory/types";

interface PdfMeta {
  title: string;
  personName?: string;
  timeSpan?: string;
}

interface PdfRequestBody {
  book?: MemoryBook;
  meta?: PdfMeta;
}

export async function POST(req: NextRequest) {
  try {
    const body: PdfRequestBody = await req.json();
    if (!body?.book || !body.meta || !body.meta.title) {
      return NextResponse.json(
        { error: "book och meta.title krävs." },
        { status: 400 }
      );
    }

    const buffer = await renderMemoryBookPdf(body.book, body.meta);
    const safeTitle = sanitizeFileName(body.meta.title || "minnesbok");

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeTitle}.pdf"`
      }
    });
  } catch (error) {
    console.error("memory/pdf route failed", error);
    return NextResponse.json(
      { error: "Kunde inte skapa PDF just nu." },
      { status: 500 }
    );
  }
}

async function renderMemoryBookPdf(book: MemoryBook, meta: PdfMeta): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A5", margin: 40 });
  const chunks: Buffer[] = [];

  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  const title = meta.title || "Minnesbok";
  const subtitleParts: string[] = [];
  if (meta.personName) subtitleParts.push(`En minnesbok om ${meta.personName}`);
  if (meta.timeSpan) subtitleParts.push(meta.timeSpan);

  doc.fontSize(24).text(title, { align: "center" });
  doc.moveDown();
  if (subtitleParts.length) {
    doc.fontSize(14).fillColor("#444444").text(subtitleParts.join("\n"), {
      align: "center"
    });
    doc.moveDown();
  }

  doc.fontSize(10).fillColor("#666666").text("Skapad med Textskanner Minnesbok", {
    align: "center"
  });
  doc.moveDown(2);
  doc.fillColor("#000000");

  book.chapters.forEach((chapter, index) => {
    doc.addPage();
    addChapterPage(doc, chapter, index);
  });

  doc.addPage();
  addNotesPage(doc);

  doc.end();

  return await new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

function addChapterPage(
  doc: PDFKit.PDFDocument,
  chapter: MemoryBook["chapters"][number],
  chapterIndex: number
) {
  const title = chapter.title?.trim() || `Kapitel ${chapterIndex + 1}`;

  doc.fontSize(18).fillColor("#111111").text(title, { align: "left" });
  doc.moveDown();

  if (chapter.summary) {
    doc
      .fontSize(11)
      .fillColor("#555555")
      .text(chapter.summary, { align: "left" });
    doc.moveDown();
  }

  doc.fillColor("#000000");
  chapter.entries.forEach((entry) => {
    if (entry.date || entry.sourceId) {
      doc
        .fontSize(9)
        .fillColor("#666666")
        .text(
          [entry.date || "Odaterad", entry.sourceId && `Källa: ${entry.sourceId}`]
            .filter(Boolean)
            .join(" · ")
        );
    }

    doc.fillColor("#000000").fontSize(12).text(entry.bookText || "", {
      align: "left"
    });
    doc.moveDown();
  });
}

function addNotesPage(doc: PDFKit.PDFDocument) {
  doc.fontSize(18).fillColor("#111111").text("Anteckningssida", { align: "left" });
  doc.moveDown();
  doc
    .fontSize(11)
    .fillColor("#555555")
    .text(
      "Här finns plats för egna anteckningar, kompletterande minnen eller kommentarer efter att boken skapats.",
      {
        align: "left"
      }
    );

  doc.moveDown(2);

  for (let i = 0; i < 10; i++) {
    doc.moveDown();
    doc.strokeColor("#dddddd").lineWidth(0.5);
    doc.moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).stroke();
  }
}

function sanitizeFileName(input: string) {
  return input.replace(/[^\w\d-_]+/g, "_").slice(0, 60) || "minnesbok";
}
