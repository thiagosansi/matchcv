'use client';

import Link from 'next/link';
import { ScoreCard } from './ScoreCard';
import { GapsCard } from './GapsCard';
import { SuggestionsCard } from './SuggestionsCard';
import { OptimizedResumeCard } from './OptimizedResumeCard';
import { ATSKeywordsCard } from './ATSKeywordsCard';
import { GupyCard } from './GupyCard';
import { SalaryCard } from './SalaryCard';
import { ExportButtons } from './ExportButtons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type {
  AnalysisResult,
  OptimizedResume,
  SalarySuggestion,
  GupySuggestion,
  JobStructured,
  ATSScoreResult,
} from '@/types';
import {
  Plus,
  CircleAlert as AlertCircle,
  ArrowLeft,
  Briefcase,
  MapPin,
  Monitor,
} from 'lucide-react';

interface ResultsViewProps {
  score: number;
  jobStructured: JobStructured | null;
  analysis: AnalysisResult;
  optimizedResume: OptimizedResume;
  salary: SalarySuggestion | null;
  gupySuggestions: GupySuggestion | null;
  atsScore?: ATSScoreResult;
  createdAt?: string;
  showBackButton?: boolean;
}

export function ResultsView({
  score,
  jobStructured,
  analysis,
  optimizedResume,
  salary,
  gupySuggestions,
  atsScore,
  showBackButton = true,
}: ResultsViewProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <Link href="/history">
              <Button variant="ghost" size="sm" className="gap-1.5 h-8 -ml-2">
                <ArrowLeft className="w-4 h-4" />
                Histórico
              </Button>
            </Link>
          )}
        </div>
        <Link href="/analyze">
          <Button size="sm" variant="outline" className="gap-1.5 h-8">
            <Plus className="w-3.5 h-3.5" />
            Nova análise
          </Button>
        </Link>
      </div>

      {jobStructured && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {jobStructured.seniority && (
            <Badge variant="secondary" className="gap-1 font-normal">
              <Briefcase className="w-3 h-3" />
              {jobStructured.seniority}
            </Badge>
          )}
          {jobStructured.location && (
            <Badge variant="secondary" className="gap-1 font-normal">
              <MapPin className="w-3 h-3" />
              {jobStructured.location}
            </Badge>
          )}
          {jobStructured.workModel && (
            <Badge variant="secondary" className="gap-1 font-normal">
              <Monitor className="w-3 h-3" />
              {jobStructured.workModel}
            </Badge>
          )}
          {jobStructured.isGupy && (
            <Badge className="gap-1 font-normal bg-primary/10 text-primary border-0">
              Gupy
            </Badge>
          )}
        </div>
      )}

      <ScoreCard
        score={score}
        jobTitle={jobStructured?.title ?? ''}
        jobCompany={jobStructured?.company ?? ''}
        executiveSummary={analysis.executiveSummary}
        atsScore={atsScore}
      />

      <div className="rounded-xl border bg-card p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-sm">Exportar currículo aderente</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Baixe a versão gerada em Word ou PDF.
          </p>
        </div>
        <ExportButtons
          optimizedResume={optimizedResume}
          jobStructured={jobStructured}
        />
      </div>

      <OptimizedResumeCard resume={optimizedResume} />

      <GapsCard gaps={analysis.gaps ?? []} strengths={analysis.strengths ?? []} />

      {analysis.sectionSuggestions && analysis.sectionSuggestions.length > 0 && (
        <SuggestionsCard suggestions={analysis.sectionSuggestions} />
      )}

      {(atsScore || (analysis.atsKeywords && analysis.atsKeywords.length > 0)) && (
        <ATSKeywordsCard
          keywords={analysis.atsKeywords ?? []}
          atsScore={atsScore}
        />
      )}

      {salary && <SalaryCard salary={salary} />}

      {jobStructured?.isGupy && gupySuggestions && (
        <GupyCard suggestions={gupySuggestions} jobStructured={jobStructured} />
      )}

      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertCircle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800 text-sm">
          <strong>Revise antes de usar.</strong> A IA pode cometer erros. Confira
          todos os dados, especialmente experiências, datas e resultados. Nunca
          envie um currículo sem verificar.
        </AlertDescription>
      </Alert>
    </div>
  );
}