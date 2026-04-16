import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const runtime = 'nodejs';

function cleanExtractedText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{4,}/g, '\n\n\n')
    .replace(/^\s+|\s+$/gm, '')
    .trim();
}

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // Dynamic import avoids pdf-parse loading its test fixtures at module init time,
  // which breaks Next.js App Router builds.
  const pdfParse = (await import('pdf-parse')).default;
  const result = await pdfParse(buffer);
  return result.text ?? '';
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const userId = formData.get('user_id')?.toString() ?? null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Arquivo não enviado' },
        { status: 400 }
      );
    }

    if (!userId || userId.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Usuário inválido' },
        { status: 400 }
      );
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: 'O arquivo precisa ser um PDF' },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'O PDF excede o tamanho máximo permitido (10MB)' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let rawText: string;
    try {
      rawText = await extractTextFromPdf(buffer);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            'Não foi possível extrair texto do PDF. Tente outro arquivo ou cole o texto manualmente.',
        },
        { status: 400 }
      );
    }

    const cleanText = cleanExtractedText(rawText);

    if (cleanText.length < 80) {
      return NextResponse.json(
        {
          success: false,
          error:
            'O PDF não contém texto suficiente para análise. Verifique se o arquivo não é uma imagem escaneada e tente colar o texto manualmente.',
        },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('resumes')
      .insert({
        user_id: userId,
        file_name: file.name,
        file_path: '',
        raw_text: cleanText,
        structured_json: {},
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      fileName: file.name,
      rawText: cleanText,
      cleanText,
      charCount: cleanText.length,
      preview: cleanText.slice(0, 600),
      structuredResume: null,
      resumeId: data.id,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[upload-resume] unhandled error:', msg);

    return NextResponse.json(
      { success: false, error: 'Erro interno ao processar o currículo' },
      { status: 500 }
    );
  }
}
