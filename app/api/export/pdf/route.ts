import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { JobStructured, OptimizedResume } from '@/types';
import {
  buildExportFileName,
  buildResumePlainText,
} from '@/lib/export-resume';

export const runtime = 'nodejs';

function wrapText(text: string, maxChars = 95): string[] {
  const lines: string[] = [];
  const paragraphs = text.split('\n');

  for (const paragraph of paragraphs) {
    const clean = paragraph.trim();

    if (!clean) {
      lines.push('');
      continue;
    }

    const words = clean.split(/\s+/);
    let current = '';

    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (next.length <= maxChars) {
        current = next;
      } else {
        if (current) lines.push(current);
        current = word;
      }
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
      return NextResponse.json(
        { error: 'Currículo otimizado não informado.' },
        { status: 400 }
      );
    }

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();

    const margin = 50;
    const fontSize = 11;
    const lineHeight = 16;
    let y = height - margin;

    const title = 'Currículo aderente à vaga';
    page.drawText(title, {
      x: margin,
      y,
      size: 18,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    y -= 28;

    const subtitle = [jobStructured?.title, jobStructured?.company]
      .filter(Boolean)
      .join(' — ');

    if (subtitle) {
      page.drawText(subtitle, {
        x: margin,
        y,
        size: 11,
        font: boldFont,
        color: rgb(0.25, 0.25, 0.25),
      });
      y -= 24;
    }

    const lines = wrapText(buildResumePlainText(optimizedResume, jobStructured));

    for (const line of lines) {
      if (y < margin + 20) {
        page = pdfDoc.addPage([595.28, 841.89]);
        y = page.getHeight() - margin;
      }

      page.drawText(line || ' ', {
        x: margin,
        y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });

      y -= lineHeight;
    }

    const pdfBytes = await pdfDoc.save();
    const fileName = buildExportFileName(
      optimizedResume,
      jobStructured,
      'pdf'
    );

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('PDF export error:', error);
    return NextResponse.json(
      { error: 'Erro ao exportar currículo em PDF.' },
      { status: 500 }
    );
  }
}