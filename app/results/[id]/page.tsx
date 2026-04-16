'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { ResultsView } from '@/components/results/ResultsView';
import type {
  DbJobAnalysis,
  DbGupySuggestion,
  DbSalarySuggestion,
  AnalysisResult,
  OptimizedResume,
  GupySuggestion,
  SalarySuggestion,
} from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { CircleAlert as AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface ResultData {
  analysis: DbJobAnalysis;
  gupy: DbGupySuggestion | null;
  salary: DbSalarySuggestion | null;
}

function formatCurrency(val: number): string {
  return `R$ ${val.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function normalizeOptimizedResume(
  value: DbJobAnalysis['optimized_resume_json'],
  fallbackText: string
): OptimizedResume {
  if (value && typeof value === 'object') {
    return {
      summary: typeof value.summary === 'string' ? value.summary : '',
      experiences: Array.isArray(value.experiences) ? value.experiences : [],
      skills: Array.isArray(value.skills) ? value.skills : [],
      education: Array.isArray(value.education) ? value.education : [],
      highlights: Array.isArray(value.highlights) ? value.highlights : [],
      fullText:
        typeof value.fullText === 'string' && value.fullText.trim()
          ? value.fullText
          : fallbackText,
    };
  }

  return {
    summary: '',
    experiences: [],
    skills: [],
    education: [],
    highlights: [],
    fullText: fallbackText,
  };
}

export default function ResultsPage() {
  const router = useRouter();
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();

  const [data, setData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!id || authLoading || !user) return;

    const url = `/api/analysis/${id}?userId=${encodeURIComponent(user.id)}`;

    fetch(url)
      .then((r) => r.json())
      .then((res) => {
        if (res.error) setError(res.error);
        else setData(res);
      })
      .catch(() => setError('Falha ao carregar análise'))
      .finally(() => setLoading(false));
  }, [id, authLoading, user]);

  if (authLoading || (loading && !data)) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-60 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!user) return null;

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2">Análise não encontrada</h2>
        <p className="text-muted-foreground text-sm mb-6">
          {error || 'Tente novamente'}
        </p>
        <Link href="/history">
          <Button>Ver histórico</Button>
        </Link>
      </div>
    );
  }

  const { analysis, gupy, salary } = data;

  const analysisResult: AnalysisResult = {
    score: analysis.match_score,
    executiveSummary: analysis.executive_summary,
    strengths: analysis.strengths_json ?? [],
    gaps: analysis.gaps_json ?? [],
    sectionSuggestions: analysis.section_recommendations_json ?? [],
    atsKeywords: analysis.ats_keywords ?? [],
  };

  const optimizedResume = normalizeOptimizedResume(
    analysis.optimized_resume_json,
    analysis.optimized_resume_text
  );

  const gupySuggestion: GupySuggestion | null = gupy
    ? {
        formal: gupy.formal_text,
        human: gupy.human_text,
        objective: gupy.objective_text,
      }
    : null;

  const salarySuggestion: SalarySuggestion | null = salary
    ? {
        min: formatCurrency(salary.salary_min),
        mid: formatCurrency(salary.salary_mid),
        max: formatCurrency(salary.salary_max),
        explanation: salary.explanation,
        factors: salary.source_summary
          ? salary.source_summary
              .split(';')
              .map((item) => item.trim())
              .filter(Boolean)
          : [],
      }
    : null;

  return (
    <ResultsView
      score={analysis.match_score}
      jobStructured={analysis.job_structured_json}
      analysis={analysisResult}
      optimizedResume={optimizedResume}
      salary={salarySuggestion}
      gupySuggestions={gupySuggestion}
      createdAt={analysis.created_at}
    />
  );
}