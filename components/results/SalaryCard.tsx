import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SalarySuggestion } from '@/types';
import { TrendingUp, Info } from 'lucide-react';

interface SalaryCardProps {
  salary: SalarySuggestion;
}

export function SalaryCard({ salary }: SalaryCardProps) {
  const ranges = [
    { label: 'Mínimo', value: salary.min, sublabel: 'entrada / júnior', opacity: 'opacity-70' },
    { label: 'Médio', value: salary.mid, sublabel: 'faixa central', opacity: '' },
    { label: 'Máximo', value: salary.max, sublabel: 'sênior / experiente', opacity: 'opacity-80' },
  ];

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-600" />
          Faixa salarial estimada
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-3 gap-3">
          {ranges.map((range, i) => (
            <div
              key={range.label}
              className={`text-center p-4 rounded-xl border ${
                i === 1
                  ? 'border-green-300 bg-green-50'
                  : 'border-border bg-muted/30'
              } ${range.opacity}`}
            >
              <div className={`text-xs font-medium mb-1 ${i === 1 ? 'text-green-700' : 'text-muted-foreground'}`}>
                {range.label}
              </div>
              <div className={`text-lg font-bold ${i === 1 ? 'text-green-700' : 'text-foreground'}`}>
                {range.value}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{range.sublabel}</div>
            </div>
          ))}
        </div>

        {salary.explanation && (
          <p className="text-sm text-foreground leading-relaxed">{salary.explanation}</p>
        )}

        {salary.factors && salary.factors.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Fatores considerados:</p>
            <div className="flex flex-wrap gap-1.5">
              {salary.factors.map((factor, i) => (
                <span key={i} className="text-xs bg-muted px-2.5 py-1 rounded-full text-muted-foreground">
                  {factor}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 leading-relaxed">
            Estimativa baseada em dados de mercado (Glassdoor e benchmarks). Pode variar conforme empresa, localidade e negociação.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
