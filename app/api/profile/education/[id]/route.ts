import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase';
import { getAuthUser } from '@/lib/server-auth';

const updateSchema = z.object({
  institution: z.string().min(1).optional(),
  degree: z.string().optional(),
  field: z.string().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  is_current: z.boolean().optional(),
  description: z.string().optional(),
  display_order: z.number().int().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const updates: Record<string, unknown> = {
    ...parsed.data,
    updated_at: new Date().toISOString(),
  };

  if (parsed.data.is_current === true) {
    updates.end_date = null;
  }

  const db = createServerClient();
  const { data, error } = await db
    .from('education_entries')
    .update(updates)
    .eq('id', params.id)
    .eq('user_id', authUser.id)
    .is('deleted_at', null)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Formação não encontrada ou erro ao atualizar.' }, { status: 404 });
  }

  return NextResponse.json({ education: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const db = createServerClient();
  const { error } = await db
    .from('education_entries')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('user_id', authUser.id)
    .is('deleted_at', null);

  if (error) {
    return NextResponse.json({ error: 'Erro ao excluir formação.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
