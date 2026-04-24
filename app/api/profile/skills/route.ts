import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAuthServerClient } from '@/lib/server-auth';
import { getAuthUser } from '@/lib/server-auth';

const createSchema = z.object({
  name: z.string().min(1, 'Nome da skill obrigatório'),
  category: z.enum(['technical', 'tool', 'language', 'certification']).default('technical'),
  proficiency: z.string().optional().default(''),
  display_order: z.number().int().optional(),
});

const deleteSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const db = createAuthServerClient();
  const { data, error } = await db
    .from('profile_skills')
    .select('*')
    .eq('user_id', authUser.id)
    .is('deleted_at', null)
    .order('category', { ascending: true })
    .order('display_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Erro ao buscar skills.' }, { status: 500 });
  }

  return NextResponse.json({ skills: data });
}

export async function POST(request: NextRequest) {
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

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const db = createAuthServerClient();

  let nextOrder = parsed.data.display_order;
  if (nextOrder === undefined) {
    const { data: existing } = await db
      .from('profile_skills')
      .select('display_order')
      .eq('user_id', authUser.id)
      .eq('category', parsed.data.category)
      .is('deleted_at', null)
      .order('display_order', { ascending: false })
      .limit(1);
    nextOrder = existing && existing.length > 0 ? (existing[0].display_order ?? 0) + 10 : 0;
  }

  const { data, error } = await db
    .from('profile_skills')
    .insert({
      user_id: authUser.id,
      name: parsed.data.name,
      category: parsed.data.category,
      proficiency: parsed.data.proficiency,
      display_order: nextOrder,
    })
    .select()
    .single();

  if (error) {
    console.error('profile_skills insert error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ skill: data }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
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

  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const db = createAuthServerClient();
  const { error } = await db
    .from('profile_skills')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', parsed.data.id)
    .eq('user_id', authUser.id)
    .is('deleted_at', null);

  if (error) {
    return NextResponse.json({ error: 'Erro ao excluir skill.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
