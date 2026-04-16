'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FileText,
  History,
  User,
  Shield,
  ArrowRight,
  Plus,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <>
        <AppHeader />
        <main className="pt-[60px] max-w-6xl mx-auto px-4 py-10">
          Carregando...
        </main>
      </>
    );
  }

  if (!user) return null;

  const isAdmin = profile?.role === 'admin';

  return (
    <>
      <AppHeader />
      <main className="pt-[60px] max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Olá, {profile?.full_name || user.email}
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seu currículo, histórico e análises.
            </p>
          </div>

          <Button variant="outline" onClick={() => signOut()}>
            Sair
          </Button>
        </div>

        <Card>
          <CardContent className="p-4 space-y-1 text-sm">
            <p><strong>Email:</strong> {profile?.email || user.email}</p>
            <p><strong>Role:</strong> {profile?.role || 'user'}</p>
            <p><strong>Status:</strong> {profile?.status || 'active'}</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Link href="/analyze">
            <Card className="h-full hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Plus className="w-4 h-4 text-primary" />
                  Nova análise
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Gere um novo currículo aderente para uma vaga.
              </CardContent>
            </Card>
          </Link>

          <Link href="/history">
            <Card className="h-full hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <History className="w-4 h-4 text-primary" />
                  Histórico
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Veja suas análises anteriores salvas na conta.
              </CardContent>
            </Card>
          </Link>

          <Link href="/resumes">
            <Card className="h-full hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="w-4 h-4 text-primary" />
                  Meu currículo
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Gerencie seus currículos salvos e escolha o principal.
              </CardContent>
            </Card>
          </Link>

          <Link href="/profile">
            <Card className="h-full hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="w-4 h-4 text-primary" />
                  Meu perfil
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Atualize seu nome, objetivo profissional e resumo-base.
              </CardContent>
            </Card>
          </Link>
        </div>

        {isAdmin && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Administração</h2>
            <Link href="/admin">
              <Card className="hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Shield className="w-4 h-4 text-primary" />
                    Painel administrativo
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground flex items-center justify-between">
                  <span>
                    Acesse métricas do sistema, usuários e permissões.
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </CardContent>
              </Card>
            </Link>
          </div>
        )}
      </main>
    </>
  );
}