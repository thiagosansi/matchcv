import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase';
import { getAuthUser } from '@/lib/server-auth';

const contactSchema = z.object({
  linkedin: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  location: z.string().optional().default(''),
  website: z.string().optional().default(''),
  github: z.string().optional().default(''),
});

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const db = createServerClient();
  const { data, error } = await db
    .from('profiles')
    .select('contact_info, full_name, professional_goal, base_summary')
    .eq('id', authUser.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Erro ao buscar contato.' }, { status: 500 });
  }

  return NextResponse.json({ contact: data?.contact_info ?? {} });
}

export async function PATCH(request: NextRequest) {
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

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const db = createServerClient();
  const { error } = await db
    .from('profiles')
    .update({ contact_info: parsed.data })
    .eq('id', authUser.id);

  if (error) {
    return NextResponse.json({ error: 'Erro ao atualizar contato.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
