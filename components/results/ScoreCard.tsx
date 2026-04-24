'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import type { ATSScoreResult } from '@/types';

interface ScoreCardProps {
  score: number;
  jobTitle: string;
  jobCompany: string;
  executiveSummary: string;
  atsScore?: ATSScoreResult;
}

function ScoreRing({ score }: { score: number }) {
  const [animated, setAnimated] = useState(false);
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 80 ? '#16a34a' :
    score >= 60 ? '#d97706' :
    '#dc2626';

  const label =
    score >= 80 ? 'Alta compatibilidade' :
    score >= 60 ? 'Compatibilidade média' :
    'Compatibilidade baixa';

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
          <circle
            cx="50" cy="50" r="42" fill="none"
            stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={animated ? offset : circumference}
            style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color }}>{score}</span>
          <span className="text-xs text-muted-foreground font-medium">/ 100</span>
        </div>
      </div>
      <span className="text-sm font-medium" style={{ color }}>{label}</span>
    </div>
  );
}

interface DimBarItem {
  label: string;
  score: number;
  weight: number;
  note: string;
}

function DimensionBar({ dim, animated }: { dim: DimBarItem; animated: boolean }) {
  const color =
    dim.score >= 75 ? 'bg-green-500' :
    dim.score >= 50 ? 'bg-amber-500' :
    'bg-red-500';

  const weightPct = Math.round(dim.weight * 100);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground font-medium">
          {dim.label}
          <span className="ml-1 text-muted-foreground/60">({weightPct}%)</span>
        </span>
        <span className="font-semibold tabular-nums">{dim.score}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: animated ? `${dim.score}%` : '0%' }}
        />
      </div>
      {dim.note && (
        <p className="text-xs text-muted-foreground leading-snug">{dim.note}</p>
      )}
    </div>
  );
}

export function ScoreCard({
  score,
  jobTitle,
  jobCompany,
  executiveSummary,
  atsScore,
}: ScoreCardProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(t);
  }, []);

  const displayScore = atsScore ? atsScore.total : score;
  const dimensions: DimBarItem[] = atsScore ? atsScore.dimensions : [];

  return (
    <Card className="border-border overflow-hidden">
      <CardContent className="p-6 space-y-5">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <ScoreRing score={displayScore} />
          <div className="flex-1 text-center sm:text-left">
            <div className="mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Score ATS
              </span>
            </div>
            <h2 className="text-xl font-bold mb-0.5">{jobTitle || 'Vaga analisada'}</h2>
            {jobCompany && (
              <p className="text-sm text-muted-foreground mb-3">{jobCompany}</p>
            )}
            {atsScore && (
              <div className="mb-3">
                {atsScore.passesThreshold ? (
                  <Badge className="gap-1 bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
                    <CheckCircle2 className="w-3 h-3" />
                    Aprovado para revisão humana
                  </Badge>
                ) : displayScore < 60 ? (
                  <Badge variant="outline" className="gap-1 border-red-200 text-red-700 bg-red-50">
                    <AlertTriangle className="w-3 h-3" />
                    Abaixo do limiar ATS
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 border-amber-200 text-amber-700 bg-amber-50">
                    <AlertTriangle className="w-3 h-3" />
                    Próximo do limiar ATS
                  </Badge>
                )}
              </div>
            )}
            <p className="text-sm text-foreground leading-relaxed">{executiveSummary}</p>
          </div>
        </div>

        {dimensions.length > 0 && (
          <div className="border-t pt-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Detalhamento por dimensão
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {dimensions.map((dim, i) => (
                <DimensionBar key={i} dim={dim} animated={animated} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
