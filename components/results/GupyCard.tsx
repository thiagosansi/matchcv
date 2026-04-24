'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { GupySuggestion, JobStructured } from '@/types';
import { Copy, Check, MessageSquare, Tag } from 'lucide-react';

interface GupyCardProps {
  suggestions: GupySuggestion;
  jobStructured?: JobStructured | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractTopSkills(job: JobStructured): string[] {
  const seen = new Set<string>();
  const skills: string[] = [];

  const add = (items: string[]) => {
    for (const item of items) {
      const normalized = item.trim();
      // Skip long phrases — Gupy skills are short labels (≤ 40 chars)
      if (!normalized || normalized.length > 40) continue;
      const key = normalized.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        skills.push(normalized);
      }
    }
  };

  // Priority order: stack > softSkills > required (filter short items only)
  add(job.stack ?? []);
  add(job.softSkills ?? []);
  add((job.required ?? []).filter((r) => r.length <= 40));
  add(job.differentials ?? []);

  return skills.slice(0, 5);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function CopyableText({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <div className="p-4 bg-muted/40 rounded-lg border border-border text-sm leading-relaxed text-foreground whitespace-pre-wrap min-h-[120px]">
        {text}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className="absolute top-2 right-2 gap-1.5 h-7 text-xs"
      >
        {copied ? (
          <><Check className="w-3 h-3 text-green-500" />Copiado!</>
        ) : (
          <><Copy className="w-3 h-3" />Copiar</>
        )}
      </Button>
    </div>
  );
}

function SkillChip({ skill }: { skill: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(skill);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors
        border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 active:scale-95"
    >
      {copied ? (
        <><Check className="w-3 h-3 text-green-500" />Copiado!</>
      ) : (
        <><Tag className="w-3 h-3" />{skill}</>
      )}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function GupyCard({ suggestions, jobStructured }: GupyCardProps) {
  if (!suggestions?.formal && !suggestions?.human && !suggestions?.objective) return null;

  const topSkills = jobStructured ? extractTopSkills(jobStructured) : [];

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            Candidatura Gupy
          </CardTitle>
          <Badge className="text-xs bg-primary/10 text-primary border-0 font-medium">
            Gupy
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Texto para o campo "Apresente-se" e habilidades para selecionar na vaga.
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* ── Apresente-se text ── */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Apresente-se
          </p>
          <Tabs defaultValue="human">
            <TabsList className="w-full grid grid-cols-3 h-8 mb-3">
              <TabsTrigger value="human" className="text-xs">Pessoal</TabsTrigger>
              <TabsTrigger value="formal" className="text-xs">Formal</TabsTrigger>
              <TabsTrigger value="objective" className="text-xs">Objetiva</TabsTrigger>
            </TabsList>
            {suggestions.human && (
              <TabsContent value="human">
                <CopyableText text={suggestions.human} />
              </TabsContent>
            )}
            {suggestions.formal && (
              <TabsContent value="formal">
                <CopyableText text={suggestions.formal} />
              </TabsContent>
            )}
            {suggestions.objective && (
              <TabsContent value="objective">
                <CopyableText text={suggestions.objective} />
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* ── Top skills ── */}
        {topSkills.length > 0 && (
          <div>
            <div className="flex items-baseline gap-2 mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Habilidades para selecionar
              </p>
              <span className="text-[10px] text-muted-foreground">
                (clique para copiar e pesquisar na Gupy)
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {topSkills.map((skill, i) => (
                <SkillChip key={i} skill={skill} />
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              Estas são as habilidades que mais aparecem na descrição da vaga.
              Busque cada uma no campo de habilidades da Gupy e selecione as que estiverem disponíveis.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
