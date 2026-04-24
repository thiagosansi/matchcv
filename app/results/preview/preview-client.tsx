'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { ResultsView } from '@/components/results/ResultsView';
import type {
  AnalyzeApiResponse,
  AnalysisResult,
  OptimizedResume,
  GupySuggestion,
  SalarySuggestion,
} from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function ResultsPreviewPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<AnalyzeApiResponse | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (authLoading || !user) return;
    const raw = sessionStorage.getItem('matchcv_result');
    if (!raw) {
      router.push('/analyze');
      return;
    }
    try {
      setData(JSON.parse(raw) as AnalyzeApiResponse);
    } catch {
      router.push('/analyze');
    }
  }, [authLoading, user, router]);

  if (authLoading || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-60 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  const analysisResult: AnalysisResult = data.analysis;

  const optimizedResume: OptimizedResume = data.optimizedResume ?? {
    summary: '',
    experiences: [],
    skills: [],
    education: [],
    highlights: [],
  };

  const gupySuggestion: GupySuggestion | null = data.gupySuggestions ?? null;
  const salarySuggestion: SalarySuggestion | null = data.salary ?? null;

  return (
    <ResultsView
      score={data.atsScore?.total ?? analysisResult.score}
      jobStructured={data.jobStructured}
      analysis={analysisResult}
      optimizedResume={optimizedResume}
      salary={salarySuggestion}
      gupySuggestions={gupySuggestion}
      atsScore={data.atsScore}
      createdAt={new Date().toISOString()}
    />
  );
}
