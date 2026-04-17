import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { JobStructured, OptimizedResume } from '@/types';
import { buildExportFileName, buildResumePlainText } from '@/lib/export-resume';

export const runtime = 'nodejs';

function sanitizeForPdf(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2022/g, '-')
    .replace(/\u2013/g, '-')
    .replace(/\u2014/g, '--')
    .replace(/\u2026/g, '...')
    .replace(/[^\x00-\xFF]/g, '');
}

function wrapText(text: string, maxChars = 95): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    const clean = paragraph.trim();
    if (!clean) { lines.push(''); continue; }
    const words = clean.split(/\s+/);
    let current = '';
    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (next.length <= maxChars) { current = next; }
      else { if (current) lines.push(current); current = word; }
    }
    if (current) lines.push(current);
  }
  return lines;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const optimizedResume = body.optimizedResume as OptimizedResume | undefined;
    const jobStructured = (body.jobStructured ?? null) as JobStructured | null;

    if (!optimizedResume) {
      return NextResponse.json({ error: 'Currículo otimizado não informado.' }, { status: 400 });
    }

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    const margin = 50;
    let y = height - margin;

    const contact = optimizedResume.contact;
    const candidateName = contact?.name?.trim();

    // ── Contact header ────────────────────────────────────────────────────────
    if (candidateName) {
      page.drawText(sanitizeForPdf(candidateName), {
        x: margin, y, size: 16, font: boldFont, color: rgb(0.08, 0.08, 0.08),
      });
      y -= 22;

      const contactParts = [
        contact?.location, contact?.phone, contact?.email,
        contact?.linkedin, contact?.portfolio,
      ].filter(Boolean) as string[];

      if (contactParts.length > 0) {
        for (const l of wrapText(sanitizeForPdf(contactParts.join('  |  ')), 90)) {
          page.drawText(l || ' ', { x: margin, y, size: 9, font, color: rgb(0.3, 0.3, 0.3) });
          y -= 13;
        }
      }

      y -= 4;
      page.drawLine({
        start: { x: margin, y }, end: { x: width - margin, y },
        thickness: 0.5, color: rgb(0.75, 0.75, 0.75),
      });
      y -= 14;
    } else {
      // Fallback when no candidate name: show job title
      const subtitle = [jobStructured?.title, jobStructured?.company].filter(Boolean).join(' — ');
      if (subtitle) {
        page.drawText(sanitizeForPdf(subtitle), {
          x: margin, y, size: 13, font: boldFont, color: rgb(0.15, 0.15, 0.15),
        });
        y -= 22;
      }
    }

    // ── Body: skip contact block already rendered above ───────────────────────
    const fullText = buildResumePlainText(optimizedResume, jobStructured);
    const bodyStart = candidateName ? fullText.indexOf('\n\n') + 2 : 0;
    const bodyText = fullText.slice(bodyStart);

    const fontSize = 10;
    const lineHeight = 15;

    for (const line of wrapText(sanitizeForPdf(bodyText))) {
      if (y < margin + 20) {
        page = pdfDoc.addPage([595.28, 841.89]);
        y = page.getSize().height - margin;
      }
      const isHeader = line.trim().length > 3 && /^[A-ZÀÁÂÃÉÊÍÓÔÕÚÇ\s]{4,}$/.test(line.trim());
      page.drawText(line || ' ', {
        x: margin, y,
        size: isHeader ? fontSize + 1 : fontSize,
        font: isHeader ? boldFont : font,
        color: rgb(0, 0, 0),
      });
      y -= isHeader ? lineHeight + 3 : lineHeight;
    }

    const pdfBytes = await pdfDoc.save();
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${buildExportFileName(optimizedResume, jobStructured, 'pdf')}"`,
      },
    });
  } catch (error) {
    console.error('PDF export error:', error);
    return NextResponse.json({ error: 'Erro ao exportar currículo em PDF.' }, { status: 500 });
  }
}
