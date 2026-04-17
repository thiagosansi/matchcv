import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Gap } from '@/types';
import { TriangleAlert as AlertTriangle, TrendingDown, Key } from 'lucide-react';

interface GapsCardProps {
  gaps: Gap[];
  strengths: string[];
}

const importanceConfig = {
  high: { label: 'Alta', class: 'bg-red-100 text-red-700 border-red-200' },
  medium: { label: 'Média', class: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  low: { label: 'Baixa', class: 'bg-blue-100 text-blue-700 border-blue-200' },
};

const typeIcon = {
  skill: <AlertTriangle className="w-3.5 h-3.5" />,
  keyword: <Key className="w-3.5 h-3.5" />,
  experience: <TrendingDown className="w-3.5 h-3.5" />,
  tool: <Key className="w-3.5 h-3.5" />,
  seniority: <TrendingDown className="w-3.5 h-3.5" />,
};

const typeLabel = {
  skill: 'Competência',
  keyword: 'Palavra-chave',
  experience: 'Experiência',
  tool: 'Ferramenta',
  seniority: 'Senioridade',
};

export function GapsCard({ gaps, strengths }: GapsCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {gaps.length > 0 && (
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-red-100 text-red-600 flex items-center justify-center text-xs">
                <AlertTriangle className="w-3.5 h-3.5" />
              </span>
              Lacunas identificadas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {gaps.map((gap, i) => (
              <div
                key={i}
                className="p-3 rounded-lg border border-border bg-muted/30 space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{typeIcon[gap.type]}</span>
                  <span className="text-xs font-medium text-muted-foreground">{typeLabel[gap.type]}</span>
                  <span className={`ml-auto text-xs font-medium px-1.5 py-0.5 rounded border ${importanceConfig[gap.importance].class}`}>
                    {importanceConfig[gap.importance].label}
                  </span>
                </div>
                <p className="text-sm text-foreground">{gap.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {strengths.length > 0 && (
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-green-100 text-green-600 flex items-center justify-center">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              Pontos fortes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {strengths.map((strength, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-green-50/50 border border-green-100">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm text-foreground">{strength}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
