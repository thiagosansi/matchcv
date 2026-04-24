import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/server-auth';
import { extractProfileFromText } from '@/lib/services/profile-import';

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { rawText } = body;

    if (!rawText || typeof rawText !== 'string' || rawText.trim().length < 50) {
      return NextResponse.json(
        { error: 'O texto do currículo precisa ter pelo menos 50 caracteres.' },
        { status: 400 }
      );
    }

    if (rawText.length > 15000) {
      return NextResponse.json(
        { error: 'O texto enviado excede o limite de 15.000 caracteres.' },
        { status: 400 }
      );
    }

    const preview = await extractProfileFromText(rawText.trim());

    return NextResponse.json(preview);
  } catch (error) {
    console.error('Profile import error:', error);
    const message = error instanceof Error ? error.message : 'Falha ao importar currículo';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
