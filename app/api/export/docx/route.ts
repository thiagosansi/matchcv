import { NextRequest, NextResponse } from 'next/server';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  BorderStyle,
} from 'docx';
import type { JobStructured, OptimizedResume } from '@/types';
import { buildExportFileName } from '@/lib/export-resume';

export const runtime = 'nodejs';

function toParagraphs(optimizedResume: OptimizedResume): Paragraph[] {
  const children: Paragraph[] = [];
  const contact = optimizedResume.contact;

  // ── Contact header ─────────────────────────────────────────────────────────
  if (contact?.name) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: contact.name, bold: true, size: 32 })],
        spacing: { after: 80 },
      })
    );
    const parts = [
      contact.location, contact.phone, contact.email,
      contact.linkedin, contact.portfolio,
    ].filter(Boolean) as string[];
    if (parts.length) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: parts.join('  |  '), size: 18, color: '555555' })],
          spacing: { after: 160 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC', space: 4 } },
        })
      );
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  if (optimizedResume.summary?.trim()) {
    children.push(
      new Paragraph({ text: 'Resumo Profissional', heading: HeadingLevel.HEADING_1 }),
      new Paragraph({ text: optimizedResume.summary.trim(), spacing: { after: 160 } })
    );
  }

  // ── Highlights ─────────────────────────────────────────────────────────────
  if (optimizedResume.highlights?.length) {
    children.push(new Paragraph({ text: 'Destaques', heading: HeadingLevel.HEADING_1 }));
    for (const item of optimizedResume.highlights) {
      children.push(new Paragraph({ text: item, bullet: { level: 0 } }));
    }
  }

  // ── Experiences ────────────────────────────────────────────────────────────
  if (optimizedResume.experiences?.length) {
    children.push(new Paragraph({ text: 'Experiência Profissional', heading: HeadingLevel.HEADING_1 }));
    for (const exp of optimizedResume.experiences) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: exp.title, bold: true }),
            new TextRun({ text: ` — ${exp.company}` }),
            new TextRun({ text: ` (${exp.period})`, italics: true }),
          ],
          spacing: { before: 120, after: 60 },
        })
      );
      for (const bullet of exp.bullets ?? []) {
        children.push(new Paragraph({ text: bullet, bullet: { level: 0 } }));
      }
    }
  }

  // ── Skills ─────────────────────────────────────────────────────────────────
  if (optimizedResume.skills?.length) {
    children.push(
      new Paragraph({ text: 'Competências', heading: HeadingLevel.HEADING_1 }),
      new Paragraph({ text: optimizedResume.skills.join(' • '), spacing: { after: 160 } })
    );
  }

  // ── Education ──────────────────────────────────────────────────────────────
  if (optimizedResume.education?.length) {
    children.push(new Paragraph({ text: 'Formação', heading: HeadingLevel.HEADING_1 }));
    for (const item of optimizedResume.education) {
      children.push(new Paragraph({ text: item, bullet: { level: 0 } }));
    }
  }

  // ── Languages ──────────────────────────────────────────────────────────────
  if (optimizedResume.languages?.length) {
    children.push(new Paragraph({ text: 'Idiomas', heading: HeadingLevel.HEADING_1 }));
    for (const item of optimizedResume.languages) {
      children.push(new Paragraph({ text: item, bullet: { level: 0 } }));
    }
  }

  // ── Certifications ─────────────────────────────────────────────────────────
  if (optimizedResume.certifications?.length) {
    children.push(new Paragraph({ text: 'Certificações', heading: HeadingLevel.HEADING_1 }));
    for (const item of optimizedResume.certifications) {
      children.push(new Paragraph({ text: item, bullet: { level: 0 } }));
    }
  }

  return children;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const optimizedResume = body.optimizedResume as OptimizedResume | undefined;
    const jobStructured = (body.jobStructured ?? null) as JobStructured | null;

    if (!optimizedResume) {
      return NextResponse.json({ error: 'Currículo otimizado não informado.' }, { status: 400 });
    }

    const doc = new Document({
      sections: [{ properties: {}, children: toParagraphs(optimizedResume) }],
    });

    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${buildExportFileName(optimizedResume, jobStructured, 'docx')}"`,
      },
    });
  } catch (error) {
    console.error('DOCX export error:', error);
    return NextResponse.json({ error: 'Erro ao exportar currículo em Word.' }, { status: 500 });
  }
}
