import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'UserId não informado' }, { status: 400 });
    }

    const db = createServerClient();

    const { data, error } = await db
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      resumes: data ?? [],
      primaryResume: (data ?? []).find((item) => item.is_primary) ?? null,
    });
  } catch (error) {
    console.error('GET resumes error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar currículos' },
      { status: 500 }
    );
  }
}