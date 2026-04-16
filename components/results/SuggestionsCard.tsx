import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { SectionSuggestion } from '@/types';

interface SuggestionsCardProps {
  suggestions: SectionSuggestion[];
}

const categoryConfig = {
  keep: { label: 'Manter', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', dot: 'bg-green-500' },
  adjust: { label: 'Ajustar', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200', dot: 'bg-yellow-500' },
  include: { label: 'Incluir', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-500' },
  reduce: { label: 'Reduzir', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-400' },
};

export function SuggestionsCard({ suggestions }: SuggestionsCardProps) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Sugestões por seção</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={[suggestions[0]?.section]}>
          {suggestions.map((section, i) => (
            <AccordionItem key={i} value={section.section} className="border-border">
              <AccordionTrigger className="text-sm font-medium hover:no-underline py-3">
                {section.section}
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(Object.keys(categoryConfig) as Array<keyof typeof categoryConfig>).map((key) => {
                    const items = section[key];
                    if (!items || items.length === 0) return null;
                    const config = categoryConfig[key];
                    return (
                      <div key={key} className={`p-3 rounded-lg border ${config.bg} ${config.border}`}>
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                          <span className={`text-xs font-semibold uppercase tracking-wide ${config.color}`}>
                            {config.label}
                          </span>
                        </div>
                        <ul className="space-y-1">
                          {items.map((item: string, j: number) => (
                            <li key={j} className={`text-xs ${config.color} leading-relaxed`}>
                              • {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
