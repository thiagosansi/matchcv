import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId || userId.length < 10) {
      return NextResponse.json(
        { error: 'Usuário inválido.' },
        { status: 400 }
      );
    }

    const db = createServerClient();

    const { data, error } = await db
      .from('job_analyses')
      .select(
        'id, user_id, job_structured_json, match_score, is_gupy, status, created_at, executive_summary'
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      analyses: data ?? [],
    });
  } catch (error) {
    console.error('History route error:', error);

    return NextResponse.json(
      { error: 'Falha ao carregar histórico.' },
      { status: 500 }
    );
  }
}