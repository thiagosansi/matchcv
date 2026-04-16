'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  History,
  Plus,
  FileText,
  CircleAlert as AlertCircle,
  Briefcase,
  MapPin,
  Monitor,
  Calendar,
} from 'lucide-react';
import type { JobStructured } from '@/types';

interface HistoryItem {
  id: string;
  match_score: number;
  is_gupy: boolean;
  status: string;
  created_at: string;
  executive_summary: string;
  job_structured_json: JobStructured;
}

function ScorePill({ score }: { score: number }) {
  const cls =
    score >= 75
      ? 'text-green-700 bg-green-50 border-green-200'
      : score >= 50
        ? 'text-yellow-700 bg-yellow-50 border-yellow-200'
        : 'text-red-700 bg-red-50 border-red-200';

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border flex-shrink-0 ${cls}`}>
      {score}
    </span>
  );
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function HistoryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [analyses, setAnalyses] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;

    fetch(`/api/history?userId=${encodeURIComponent(user.id)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setAnalyses(data.analyses ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Falha ao carregar histórico'))
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading) {
    return (
      <>
        <AppHeader />
        <main className="pt-[60px] max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64 mb-8" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl mb-3" />
          ))}
        </main>
      </>
    );
  }

  if (!user) return null;

  return (
    <>
      <AppHeader />
      <main className="pt-[60px] max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <History className="w-5 h-5 text-primary" />
              <h1 className="text-2xl font-bold">Histórico</h1>
            </div>
            <p className="text-sm text-muted-foreground">Suas análises salvas na conta</p>
          </div>
          <Link href="/analyze">
            <Button className="gap-1.5 h-9">
              <Plus className="w-4 h-4" />
              Nova análise
            </Button>
          </Link>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : analyses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-5">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Nenhuma análise ainda</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Faça sua primeira análise para ver o histórico aqui.
            </p>
            <Link href="/analyze">
              <Button className="gap-1.5">
                <Plus className="w-4 h-4" />
                Fazer primeira análise
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {analyses.map((item) => {
              const job = item.job_structured_json;
              return (
                <Link key={item.id} href={`/results/${item.id}`} className="block">
                  <div className="rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all duration-150 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h3 className="font-semibold text-sm sm:text-base truncate">
                            {job?.title || 'Vaga sem título'}
                          </h3>
                          {item.is_gupy && (
                            <Badge variant="secondary" className="text-xs flex-shrink-0">
                              Gupy
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {job?.company && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-3 h-3" />
                              {job.company}
                            </span>
                          )}
                          {job?.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {job.location}
                            </span>
                          )}
                          {job?.workModel && (
                            <span className="flex items-center gap-1">
                              <Monitor className="w-3 h-3" />
                              {job.workModel}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(item.created_at)}
                          </span>
                        </div>
                      </div>
                      <ScorePill score={item.match_score} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
