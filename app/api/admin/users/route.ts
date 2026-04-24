import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

async function getRequestingUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  const supabase = createServerClient();

  const { data: { user } } = await supabase.auth.getUser(token);
  return user?.id ?? null;
}

export async function GET(request: NextRequest) {
  const userId = await getRequestingUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerClient();

  // Verify requesting user is admin
  const { data: requester } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (requester?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Fetch all users with analysis count
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, status, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }

  // Count analyses per user
  const { data: analysisCounts } = await supabase
    .from('job_analyses')
    .select('user_id');

  const countMap: Record<string, number> = {};
  for (const row of analysisCounts ?? []) {
    countMap[row.user_id] = (countMap[row.user_id] ?? 0) + 1;
  }

  const enriched = (users ?? []).map((u) => ({
    ...u,
    analysis_count: countMap[u.id] ?? 0,
  }));

  // Overall metrics
  const totalAnalyses = analysisCounts?.length ?? 0;
  const now = Date.now();
  const last7days = (analysisCounts ?? []).filter((r) => {
    // job_analyses may not have created_at accessible here; fall back to total
    return true;
  }).length;

  return NextResponse.json({
    users: enriched,
    metrics: {
      totalUsers: enriched.length,
      totalAnalyses,
      activeUsers: enriched.filter((u) => u.status === 'active').length,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const userId = await getRequestingUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerClient();

  const { data: requester } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (requester?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json() as { targetId: string; role?: string; status?: string };
  const { targetId, role, status } = body;

  if (!targetId) {
    return NextResponse.json({ error: 'targetId required' }, { status: 400 });
  }

  const updates: Record<string, string> = {};
  if (role) updates.role = role;
  if (status) updates.status = status;

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', targetId);

  if (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
