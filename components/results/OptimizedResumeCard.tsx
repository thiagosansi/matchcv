'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { OptimizedResume } from '@/types';
import { Copy, Check, Star, MapPin, Phone, Linkedin, ChevronDown, ChevronUp, Globe } from 'lucide-react';

interface OptimizedResumeCardProps {
  resume: OptimizedResume;
}

function buildResumeText(resume: OptimizedResume): string {
  if (resume.fullText?.trim()) return resume.fullText.trim();

  const lines: string[] = [];

  if (resume.contact?.name) {
    lines.push(resume.contact.name);
    const contactDetails = [
      resume.contact.location,
      resume.contact.phone,
      resume.contact.email,
      resume.contact.linkedin,
    ].filter(Boolean).join(' | ');
    if (contactDetails) lines.push(contactDetails);
    lines.push('');
  }

  if (resume.summary) {
    lines.push('RESUMO PROFISSIONAL');
    lines.push(resume.summary);
    lines.push('');
  }

  if (resume.highlights?.length) {
    lines.push('DESTAQUES DE ADERÊNCIA');
    resume.highlights.forEach((h) => lines.push(`• ${h}`));
    lines.push('');
  }

  if (resume.experiences?.length) {
    lines.push('EXPERIÊNCIA PROFISSIONAL');
    resume.experiences.forEach((exp) => {
      lines.push(`${exp.title} | ${exp.company} | ${exp.period}`);
      (exp.bullets ?? []).forEach((b) => lines.push(`  • ${b}`));
      lines.push('');
    });
  }

  if (resume.skills?.length) {
    lines.push('COMPETÊNCIAS');
    lines.push(resume.skills.join(' • '));
    lines.push('');
  }

  if (resume.education?.length) {
    lines.push('FORMAÇÃO');
    resume.education.forEach((e) => lines.push(e));
    lines.push('');
  }

  if (resume.languages?.length) {
    lines.push('IDIOMAS');
    lines.push(resume.languages.join(' | '));
    lines.push('');
  }

  if (resume.certifications?.length) {
    lines.push('CERTIFICAÇÕES');
    resume.certifications.forEach((c) => lines.push(`• ${c}`));
  }

  return lines.join('\n').trim();
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <h4 className="text-[11px] font-bold uppercase tracking-widest text-primary">
        {children}
      </h4>
      <div className="h-px bg-primary/20 mt-1" />
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 h-8 text-xs">
      {copied ? (
        <><Check className="w-3.5 h-3.5 text-green-500" />Copiado!</>
      ) : (
        <><Copy className="w-3.5 h-3.5" />Copiar</>
      )}
    </Button>
  );
}

export function OptimizedResumeCard({ resume }: OptimizedResumeCardProps) {
  const [expanded, setExpanded] = useState(true);
  const fullText = buildResumeText(resume);

  const hasSummary = Boolean(resume.summary?.trim());
  const hasHighlights = Boolean(resume.highlights?.length);
  const hasExperiences = Boolean(resume.experiences?.length);
  const hasSkills = Boolean(resume.skills?.length);
  const hasEducation = Boolean(resume.education?.length);
  const hasLanguages = Boolean(resume.languages?.length);
  const hasCertifications = Boolean(resume.certifications?.length);
  const hasContact = Boolean(resume.contact?.name);

  return (
    <div className="space-y-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 rounded-t-xl border border-b-0 border-primary/30 bg-primary/5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
            <Star className="w-3.5 h-3.5 text-white fill-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-none">Currículo aderente à vaga</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Reescrito com seus dados reais · ATS-optimizado
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="text-[10px] bg-primary/10 text-primary border-0 font-medium hidden sm:flex">
            Sem invenção de dados
          </Badge>
          <CopyButton text={fullText} />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded((v) => !v)}
            className="h-8 w-8 p-0"
          >
            {expanded
              ? <ChevronUp className="w-4 h-4" />
              : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Document body */}
      {expanded && (
        <div className="border border-primary/30 rounded-b-xl bg-white dark:bg-card shadow-sm">
          <div className="max-w-2xl mx-auto px-8 py-8 space-y-6">

            {/* ── Contact header ── */}
            {hasContact && (
              <div className="text-center border-b border-border pb-5">
                <h2 className="text-xl font-bold text-foreground tracking-tight">
                  {resume.contact!.name}
                </h2>
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-2">
                  {resume.contact!.location && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />{resume.contact!.location}
                    </span>
                  )}
                  {resume.contact!.phone && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="w-3 h-3" />{resume.contact!.phone}
                    </span>
                  )}
                  {resume.contact!.linkedin && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Linkedin className="w-3 h-3" />{resume.contact!.linkedin}
                    </span>
                  )}
                  {resume.contact!.portfolio && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Globe className="w-3 h-3" />{resume.contact!.portfolio}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* ── Resumo profissional ── */}
            {hasSummary && (
              <div>
                <SectionHeading>Resumo Profissional</SectionHeading>
                <p className="text-sm leading-relaxed text-foreground">{resume.summary}</p>
              </div>
            )}

            {/* ── Destaques de aderência ── */}
            {hasHighlights && (
              <div>
                <SectionHeading>Destaques de Aderência</SectionHeading>
                <ul className="space-y-1.5">
                  {resume.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <span className="text-primary font-bold mt-0.5 flex-shrink-0">✓</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ── Experiência profissional ── */}
            {hasExperiences && (
              <div>
                <SectionHeading>Experiência Profissional</SectionHeading>
                <div className="space-y-5">
                  {resume.experiences.map((exp, i) => (
                    <div key={i}>
                      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5 mb-1.5">
                        <p className="font-semibold text-sm text-foreground">{exp.title}</p>
                        <p className="text-xs text-muted-foreground whitespace-nowrap">{exp.period}</p>
                      </div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">{exp.company}</p>
                      {(exp.bullets ?? []).length > 0 && (
                        <ul className="space-y-1">
                          {exp.bullets.map((bullet, j) => (
                            <li key={j} className="flex items-start gap-2 text-sm text-foreground">
                              <span className="text-muted-foreground mt-1.5 flex-shrink-0 text-[10px]">▸</span>
                              <span className="leading-relaxed">{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Competências ── */}
            {hasSkills && (
              <div>
                <SectionHeading>Competências</SectionHeading>
                <p className="text-sm text-foreground leading-relaxed">
                  {resume.skills.join(' · ')}
                </p>
              </div>
            )}

            {/* ── Formação ── */}
            {hasEducation && (
              <div>
                <SectionHeading>Formação Acadêmica</SectionHeading>
                <ul className="space-y-1.5">
                  {resume.education.map((item, i) => (
                    <li key={i} className="text-sm text-foreground">{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* ── Idiomas + Certificações (side by side when both exist) ── */}
            {(hasLanguages || hasCertifications) && (
              <div className={`grid gap-6 ${hasLanguages && hasCertifications ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
                {hasLanguages && (
                  <div>
                    <SectionHeading>Idiomas</SectionHeading>
                    <ul className="space-y-1">
                      {resume.languages!.map((lang, i) => (
                        <li key={i} className="text-sm text-foreground">{lang}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {hasCertifications && (
                  <div>
                    <SectionHeading>Certificações</SectionHeading>
                    <ul className="space-y-1">
                      {resume.certifications!.map((item, i) => (
                        <li key={i} className="text-sm text-foreground">{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Fallback */}
            {!hasSummary && !hasExperiences && !hasSkills && !hasEducation && (
              <pre className="text-sm leading-relaxed text-foreground whitespace-pre-wrap font-sans">
                {resume.fullText}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
