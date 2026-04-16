'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { OptimizedResume } from '@/types';
import { Copy, Check, Star } from 'lucide-react';

interface OptimizedResumeCardProps {
  resume: OptimizedResume;
}

function buildResumeText(resume: OptimizedResume): string {
  if (resume.fullText?.trim()) {
    return resume.fullText.trim();
  }

  return [
    resume.summary ? `RESUMO PROFISSIONAL\n${resume.summary}` : '',
    resume.highlights?.length
      ? `DESTAQUES\n${resume.highlights.map((h) => `• ${h}`).join('\n')}`
      : '',
    resume.experiences?.length
      ? `EXPERIÊNCIAS\n${resume.experiences
          .map(
            (exp) =>
              `${exp.title} | ${exp.company} | ${exp.period}\n${(exp.bullets ?? [])
                .map((b) => `• ${b}`)
                .join('\n')}`
          )
          .join('\n\n')}`
      : '',
    resume.skills?.length ? `HABILIDADES\n${resume.skills.join(', ')}` : '',
    resume.education?.length ? `FORMAÇÃO\n${resume.education.join('\n')}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="gap-1.5 h-8 text-xs"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-green-500" />
          Copiado!
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          Copiar
        </>
      )}
    </Button>
  );
}

export function OptimizedResumeCard({ resume }: OptimizedResumeCardProps) {
  const fullText = buildResumeText(resume);

  const hasSummary = Boolean(resume.summary?.trim());
  const hasHighlights = Boolean(resume.highlights?.length);
  const hasExperiences = Boolean(resume.experiences?.length);
  const hasSkills = Boolean(resume.skills?.length);
  const hasEducation = Boolean(resume.education?.length);

  return (
    <Card className="border-primary/30 shadow-sm ring-1 ring-primary/10">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
                <Star className="w-3.5 h-3.5 text-white fill-white" />
              </div>
              Currículo aderente à vaga
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1.5">
              Reorganizado e reescrito com base no seu conteúdo real, priorizando
              aderência à vaga.
            </p>
          </div>
          <CopyButton text={fullText} />
        </div>

        <div className="flex items-center gap-2 mt-2">
          <Badge className="text-xs bg-primary/10 text-primary border-0 font-medium">
            Destaque principal
          </Badge>
          <Badge variant="secondary" className="text-xs font-normal">
            Sem invenção de dados
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {hasSummary && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Resumo profissional
            </h4>
            <p className="text-sm leading-relaxed text-foreground border-l-2 border-primary pl-3">
              {resume.summary}
            </p>
          </div>
        )}

        {hasHighlights && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Destaques de aderência
            </h4>
            <div className="space-y-1.5">
              {resume.highlights.map((h, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-foreground">{h}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasExperiences && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Experiências adaptadas
            </h4>
            <div className="space-y-4">
              {resume.experiences.map((exp, i) => (
                <div key={i} className="border-l-2 border-border pl-3">
                  <div className="mb-1">
                    <p className="font-semibold text-sm">{exp.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {exp.company} · {exp.period}
                    </p>
                  </div>

                  {(exp.bullets ?? []).length > 0 && (
                    <ul className="space-y-1 mt-2">
                      {exp.bullets.map((bullet, j) => (
                        <li
                          key={j}
                          className="text-sm text-foreground flex items-start gap-1.5"
                        >
                          <span className="text-primary mt-1.5 flex-shrink-0">•</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {hasSkills && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Habilidades relevantes
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {resume.skills.map((skill, i) => (
                <Badge key={i} variant="secondary" className="text-xs font-normal">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {hasEducation && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Formação
            </h4>
            <ul className="space-y-1">
              {resume.education.map((item, i) => (
                <li key={i} className="text-sm text-foreground">
                  • {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!hasSummary && !hasHighlights && !hasExperiences && !hasSkills && !hasEducation && (
          <div className="p-4 bg-muted/40 rounded-lg border border-border text-sm leading-relaxed font-mono text-foreground whitespace-pre-wrap">
            {resume.fullText}
          </div>
        )}
      </CardContent>
    </Card>
  );
}