import { NextRequest, NextResponse } from 'next/server';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
} from 'docx';
import type { JobStructured, OptimizedResume } from '@/types';
import { buildExportFileName } from '@/lib/export-resume';

export const runtime = 'nodejs';

function toParagraphs(
  optimizedResume: OptimizedResume,
  jobStructured: JobStructured | null
): Paragraph[] {
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      text: 'Currículo aderente à vaga',
      heading: HeadingLevel.TITLE,
      spacing: { after: 200 },
    })
  );

  if (jobStructured?.title || jobStructured?.company) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: [jobStructured?.title, jobStructured?.company]
              .filter(Boolean)
              .join(' — '),
            bold: true,
          }),
        ],
        spacing: { after: 200 },
      })
    );
  }

  if (optimizedResume.summary?.trim()) {
    children.push(
      new Paragraph({
        text: 'Resumo profissional',
        heading: HeadingLevel.HEADING_1,
      }),
      new Paragraph({
        text: optimizedResume.summary.trim(),
        spacing: { after: 200 },
      })
    );
  }

  if (optimizedResume.highlights?.length) {
    children.push(
      new Paragraph({
        text: 'Destaques',
        heading: HeadingLevel.HEADING_1,
      })
    );

    optimizedResume.highlights.forEach((item) => {
      children.push(
        new Paragraph({
          text: item,
          bullet: { level: 0 },
        })
      );
    });
  }

  if (optimizedResume.experiences?.length) {
    children.push(
      new Paragraph({
        text: 'Experiências',
        heading: HeadingLevel.HEADING_1,
      })
    );

    optimizedResume.experiences.forEach((exp) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: exp.title, bold: true }),
            new TextRun({ text: ` — ${exp.company}` }),
            new TextRun({ text: ` (${exp.period})`, italics: true }),
          ],
          spacing: { before: 120, after: 80 },
        })
      );

      exp.bullets?.forEach((bullet) => {
        children.push(
          new Paragraph({
            text: bullet,
            bullet: { level: 0 },
          })
        );
      });
    });
  }

  if (optimizedResume.skills?.length) {
    children.push(
      new Paragraph({
        text: 'Competências',
        heading: HeadingLevel.HEADING_1,
      }),
      new Paragraph({
        text: optimizedResume.skills.join(', '),
        spacing: { after: 200 },
      })
    );
  }

  if (optimizedResume.education?.length) {
    children.push(
      new Paragraph({
        text: 'Formação',
        heading: HeadingLevel.HEADING_1,
      })
    );

    optimizedResume.education.forEach((item) => {
      children.push(
        new Paragraph({
          text: item,
          bullet: { level: 0 },
        })
      );
    });
  }

  if (optimizedResume.fullText?.trim()) {
    children.push(
      new Paragraph({
        text: 'Versão completa',
        heading: HeadingLevel.HEADING_1,
      })
    );

    optimizedResume.fullText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((line) => {
        children.push(
          new Paragraph({
            text: line,
          })
        );
      });
  }

  return children;
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

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: toParagraphs(optimizedResume, jobStructured),
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const fileName = buildExportFileName(
      optimizedResume,
      jobStructured,
      'docx'
    );

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('DOCX export error:', error);
    return NextResponse.json(
      { error: 'Erro ao exportar currículo em Word.' },
      { status: 500 }
    );
  }
}