'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface ScoreCardProps {
  score: number;
  jobTitle: string;
  jobCompany: string;
  executiveSummary: string;
}

function ScoreRing({ score }: { score: number }) {
  const [animated, setAnimated] = useState(false);
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 75 ? '#16a34a' :
    score >= 50 ? '#d97706' :
    '#dc2626';

  const label =
    score >= 75 ? 'Alta compatibilidade' :
    score >= 50 ? 'Compatibilidade média' :
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
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
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

export function ScoreCard({ score, jobTitle, jobCompany, executiveSummary }: ScoreCardProps) {
  return (
    <Card className="border-border overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <ScoreRing score={score} />
          <div className="flex-1 text-center sm:text-left">
            <div className="mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Análise de compatibilidade</span>
            </div>
            <h2 className="text-xl font-bold mb-0.5">{jobTitle || 'Vaga analisada'}</h2>
            {jobCompany && (
              <p className="text-sm text-muted-foreground mb-3">{jobCompany}</p>
            )}
            <p className="text-sm text-foreground leading-relaxed">{executiveSummary}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
