import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, resumeId } = body;

    if (!userId || !resumeId) {
      return NextResponse.json(
        { error: 'Dados inválidos' },
        { status: 400 }
      );
    }

    const db = createServerClient();

    // remove principal atual
    await db
      .from('resumes')
      .update({ is_primary: false })
      .eq('user_id', userId);

    // define novo principal
    const { error } = await db
      .from('resumes')
      .update({ is_primary: true })
      .eq('id', resumeId);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('set primary error:', error);
    return NextResponse.json(
      { error: 'Erro ao definir currículo principal' },
      { status: 500 }
    );
  }
}