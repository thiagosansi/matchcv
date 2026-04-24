import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase';
import { getAuthUser } from '@/lib/server-auth';

const createSchema = z.object({
  company: z.string().min(1, 'Empresa obrigatória'),
  title: z.string().min(1, 'Cargo obrigatório'),
  location: z.string().optional().default(''),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  is_current: z.boolean().optional().default(false),
  description: z.string().optional().default(''),
  display_order: z.number().int().optional(),
});

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const db = createServerClient();
  const { data, error } = await db
    .from('work_experiences')
    .select('*')
    .eq('user_id', authUser.id)
    .is('deleted_at', null)
    .order('display_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Erro ao buscar experiências.' }, { status: 500 });
  }

  return NextResponse.json({ experiences: data });
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

  const db = createServerClient();

  // Determine next display_order (max existing + 10)
  let nextOrder = parsed.data.display_order;
  if (nextOrder === undefined) {
    const { data: existing } = await db
      .from('work_experiences')
      .select('display_order')
      .eq('user_id', authUser.id)
      .is('deleted_at', null)
      .order('display_order', { ascending: false })
      .limit(1);
    nextOrder = existing && existing.length > 0 ? (existing[0].display_order ?? 0) + 10 : 0;
  }

  const { data, error } = await db
    .from('work_experiences')
    .insert({
      user_id: authUser.id,
      company: parsed.data.company,
      title: parsed.data.title,
      location: parsed.data.location,
      start_date: parsed.data.start_date ?? null,
      end_date: parsed.data.is_current ? null : (parsed.data.end_date ?? null),
      is_current: parsed.data.is_current,
      description: parsed.data.description,
      display_order: nextOrder,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Erro ao criar experiência.' }, { status: 500 });
  }

  return NextResponse.json({ experience: data }, { status: 201 });
}
