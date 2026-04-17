import { NextRequest, NextResponse } from 'next/server';
import {
  fetchJobFromPlatform,
  PlatformError,
  PLATFORM_PASTE_INSTRUCTIONS,
  detectPlatform,
} from '@/lib/platforms';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL obrigatória.' }, { status: 400 });
    }

    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(url)) {
      return NextResponse.json({ error: 'Formato de URL inválido.' }, { status: 400 });
    }

    const { text, platform } = await fetchJobFromPlatform(url);

    return NextResponse.json({ text, platform });
  } catch (error) {
    if (error instanceof PlatformError) {
      return NextResponse.json(
        {
          error: error.message,
          platform: error.platform,
          instruction: PLATFORM_PASTE_INSTRUCTIONS[error.platform],
        },
        { status: 422 }
      );
    }

    const platform = (() => {
      try {
        const body = request.url;
        return detectPlatform(body);
      } catch {
        return 'generic' as const;
      }
    })();

    const message =
      error instanceof Error ? error.message : 'Falha ao buscar a vaga.';

    return NextResponse.json(
      {
        error: message,
        platform,
        instruction: PLATFORM_PASTE_INSTRUCTIONS[platform],
      },
      { status: 500 }
    );
  }
}
