import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const userId = request.nextUrl.searchParams.get('userId');

    if (!id) {
      return NextResponse.json(
        { error: 'ID da análise não informado.' },
        { status: 400 }
      );
    }

    if (!userId || userId.length < 10) {
      return NextResponse.json(
        { error: 'Usuário inválido.' },
        { status: 400 }
      );
    }

    const db = createServerClient();

    const { data: analysis, error: analysisError } = await db
      .from('job_analyses')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (analysisError) {
      throw new Error(analysisError.message);
    }

    if (!analysis) {
      return NextResponse.json(
        { error: 'Análise não encontrada.' },
        { status: 404 }
      );
    }

    const { data: gupy, error: gupyError } = await db
      .from('gupy_suggestions')
      .select('*')
      .eq('analysis_id', id)
      .maybeSingle();

    if (gupyError) {
      throw new Error(gupyError.message);
    }

    const { data: salary, error: salaryError } = await db
      .from('salary_suggestions')
      .select('*')
      .eq('analysis_id', id)
      .maybeSingle();

    if (salaryError) {
      throw new Error(salaryError.message);
    }

    return NextResponse.json({
      analysis,
      gupy: gupy ?? null,
      salary: salary ?? null,
    });
  } catch (error) {
    console.error('Get analysis error:', error);
    const message =
      error instanceof Error ? error.message : 'Falha ao carregar análise';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}