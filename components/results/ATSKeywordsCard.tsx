import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Key } from 'lucide-react';

interface ATSKeywordsCardProps {
  keywords: string[];
}

export function ATSKeywordsCard({ keywords }: ATSKeywordsCardProps) {
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
