'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Key, CheckCircle2, XCircle } from 'lucide-react';
import type { ATSScoreResult } from '@/types';

interface ATSKeywordsCardProps {
  keywords: string[];
  atsScore?: ATSScoreResult;
}

export function ATSKeywordsCard({ keywords, atsScore }: ATSKeywordsCardProps) {
  // Prefer rule-based ATS result when available
  const found = atsScore?.foundKeywords ?? [];
  const missing = atsScore?.missingKeywords ?? [];
  const hasAts = found.length > 0 || missing.length > 0;

  if (!hasAts && (!keywords || keywords.length === 0)) return null;

  if (hasAts) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Key className="w-4 h-4 text-primary" />
            Palavras-chave ATS
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Análise de cobertura das palavras-chave exigidas pela vaga.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {missing.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <XCircle className="w-3.5 h-3.5 text-red-500" />
                <span className="text-xs font-semibold text-red-700">
                  Ausentes no currículo ({missing.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {missing.map((kw, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="text-xs px-2.5 py-1 font-medium border-red-200 text-red-700 bg-red-50"
                  >
                    {kw}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {found.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                <span className="text-xs font-semibold text-green-700">
                  Já no seu currículo ({found.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {found.map((kw, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="text-xs px-2.5 py-1 font-medium border-green-200 text-green-700 bg-green-50"
                  >
                    {kw}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Legacy fallback: old records from DB without ats_score_json
  if (!keywords || keywords.length === 0) return null;
  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Key className="w-4 h-4 text-primary" />
          Palavras-chave ATS
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Inclua estas palavras no seu currículo para passar pelos filtros automáticos.
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {keywords.map((kw, i) => (
            <Badge
              key={i}
              variant="outline"
              className="text-xs px-2.5 py-1 font-medium border-primary/30 text-primary hover:bg-primary/5 cursor-default"
            >
              {kw}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
