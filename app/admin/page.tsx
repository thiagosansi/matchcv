'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { AppHeader } from '@/components/layout/AppHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users, BarChart2, Activity, Search } from 'lucide-react';

type UserRow = {
  id: string;
  full_name: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  analysis_count: number;
};

type Metrics = {
  totalUsers: number;
  totalAnalyses: number;
  activeUsers: number;
};

export default function AdminPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const supabase = getSupabaseBrowserClient();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!authLoading && profile?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [authLoading, user, profile, router]);

  useEffect(() => {
    if (!user || profile?.role !== 'admin') return;

    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;

      const json = await res.json() as { users: UserRow[]; metrics: Metrics };
      setUsers(json.users ?? []);
      setMetrics(json.metrics ?? null);
      setLoading(false);
    };

    fetchData();
  }, [user, profile, supabase]);

  const updateUser = async (targetId: string, patch: { role?: string; status?: string }) => {
    setSaving(targetId);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ targetId, ...patch }),
    });

    setUsers((prev) =>
      prev.map((u) => (u.id === targetId ? { ...u, ...patch } as UserRow : u))
    );
    setSaving(null);
  };

  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || u.status === filterStatus;
    return matchSearch && matchStatus;
  });

  if (authLoading || loading) {
    return (
      <>
        <AppHeader />
        <main className="pt-[60px] max-w-6xl mx-auto px-4 py-10 text-muted-foreground">
          Carregando...
        </main>
      </>
    );
  }

  if (profile?.role !== 'admin') return null;

  return (
    <>
      <AppHeader />
      <main className="pt-[60px] max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Painel administrativo</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Métricas de uso e gestão de usuários.
          </p>
        </div>

        {metrics && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" /> Total de usuários
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{metrics.totalUsers}</p>
                <p className="text-xs text-muted-foreground mt-1">{metrics.activeUsers} ativos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <BarChart2 className="w-4 h-4" /> Total de análises
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{metrics.totalAnalyses}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Média por usuário
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {metrics.totalUsers > 0
                    ? (metrics.totalAnalyses / metrics.totalUsers).toFixed(1)
                    : '0'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
                <SelectItem value="suspended">Suspensos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Análises</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <p className="font-medium">{u.full_name || '—'}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </TableCell>
                    <TableCell>{u.analysis_count}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          u.status === 'active'
                            ? 'default'
                            : u.status === 'suspended'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {u.status === 'active' ? 'Ativo' : u.status === 'suspended' ? 'Suspenso' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {u.role !== 'admin' && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={saving === u.id}
                            onClick={() => updateUser(u.id, { role: 'admin' })}
                          >
                            Tornar admin
                          </Button>
                        )}
                        {u.status === 'active' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={saving === u.id || u.id === user?.id}
                            onClick={() => updateUser(u.id, { status: 'suspended' })}
                          >
                            Suspender
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={saving === u.id}
                            onClick={() => updateUser(u.id, { status: 'active' })}
                          >
                            Reativar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </>
  );
}
