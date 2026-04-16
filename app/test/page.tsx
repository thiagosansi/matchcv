'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

const SAMPLE_RESUME = `João Silva
Desenvolvedor Backend Python Sênior — 6 anos de experiência

RESUMO
Desenvolvedor backend com foco em APIs REST, microsserviços e dados. Experiência em ambientes de alta disponibilidade e squads ágeis.

EXPERIÊNCIA

Engenheiro de Software Sênior — Empresa XYZ (Jan 2020 – Dez 2024)
- Desenvolvimento e manutenção de APIs REST com Python/FastAPI
- Modelagem e otimização de consultas PostgreSQL
- Deploy e monitoramento em AWS (EC2, RDS, S3, CloudWatch)
- Revisão de código e mentoria de desenvolvedores júnior
- Implementação de cache com Redis reduzindo latência em 40%

Desenvolvedor Backend Pleno — Startup ABC (Mar 2018 – Dez 2019)
- APIs com Django REST Framework
- Integração com serviços externos via webhooks
- Testes automatizados com pytest (cobertura > 85%)

HABILIDADES
Python, FastAPI, Django, PostgreSQL, Redis, Docker, AWS, Git, pytest, REST APIs, CI/CD

FORMAÇÃO
Bacharelado em Ciência da Computação — USP (2014–2018)

IDIOMAS
Inglês — Avançado`;

const SAMPLE_JOB = `Desenvolvedor Backend Python Sênior — TechCorp

A TechCorp é uma plataforma de logística que processa mais de 1 milhão de pedidos por dia.

RESPONSABILIDADES
- Desenvolver e manter APIs REST escaláveis
- Otimizar performance de banco de dados
- Participar de code reviews e definições técnicas
- Colaborar com times de produto e dados

REQUISITOS OBRIGATÓRIOS
- Python 3.10+ com FastAPI ou Django
- PostgreSQL e modelagem relacional
- Docker e noções de Kubernetes
- Experiência com AWS
- Git e metodologias ágeis (Scrum/Kanban)

DIFERENCIAIS
- Redis e sistemas de cache distribuído
- Observabilidade (Datadog, Grafana)
- Experiência com microsserviços

MODELO: Remoto
SENIORIDADE: Sênior`;

type AnalysisResult = {
  score?: number;
  executiveSummary?: string;
  strengths?: string[];
  gaps?: Array<{ type: string; description: string; importance: string }>;
  atsKeywords?: string[];
};

type ApiResponse = {
  analysis?: AnalysisResult;
  optimizedResume?: { fullText?: string; summary?: string; skills?: string[] };
  salary?: { min?: string; mid?: string; max?: string; explanation?: string };
  jobStructured?: { title?: string; company?: string; seniority?: string; workModel?: string; isGupy?: boolean };
  gupySuggestions?: { formal?: string; human?: string; objective?: string } | null;
  error?: string;
};

type Section = 'analysis' | 'resume' | 'salary' | 'gupy';

export default function TestPage() {
  const [resumeText, setResumeText] = useState(SAMPLE_RESUME);
  const [jobText, setJobText] = useState(SAMPLE_JOB);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('');
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState('');
  const [openSection, setOpenSection] = useState<Section | null>('analysis');
  const [elapsed, setElapsed] = useState(0);

  const steps = [
    'Lendo currículo...',
    'Estruturando vaga...',
    'Calculando compatibilidade...',
    'Gerando currículo aderente...',
    'Estimando salário...',
  ];

  const handleAnalyze = async () => {
    setError('');
    setResult(null);
    setLoading(true);
    setElapsed(0);

    let stepIdx = 0;
    setStep(steps[0]);
    const stepInterval = setInterval(() => {
      stepIdx = (stepIdx + 1) % steps.length;
      setStep(steps[stepIdx]);
    }, 4000);

    const start = Date.now();
    const elapsedInterval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);

    try {
      const res = await fetch('/api/test-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobText }),
      });

      const data: ApiResponse = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error ?? 'Erro desconhecido');
      }

      setResult(data);
      setOpenSection('analysis');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      clearInterval(stepInterval);
      clearInterval(elapsedInterval);
      setLoading(false);
      setStep('');
    }
  };

  const toggle = (s: Section) => setOpenSection((prev) => (prev === s ? null : s));

  const scoreColor = (score?: number) => {
    if (!score) return 'bg-gray-100 text-gray-700';
    if (score >= 75) return 'bg-green-100 text-green-800';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const importanceColor = (imp: string) => {
    if (imp === 'high') return 'destructive';
    if (imp === 'medium') return 'secondary';
    return 'outline';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-yellow-50 border-yellow-200 px-4 py-2 text-center">
        <p className="text-xs text-yellow-800 font-medium">
          Modo de Teste — sem autenticação, sem banco de dados
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">MatchCV — Tela de Teste</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Edite currículo e vaga abaixo e clique em Analisar para testar o pipeline completo.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Currículo</label>
            <Textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              className="min-h-[320px] font-mono text-xs resize-none"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">{resumeText.length} caracteres</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Vaga</label>
            <Textarea
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
              className="min-h-[320px] text-sm resize-none"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">{jobText.length} caracteres</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 mb-8">
          <Button
            onClick={handleAnalyze}
            disabled={loading || resumeText.trim().length < 100 || jobText.trim().length < 50}
            size="lg"
            className="min-w-[240px] h-11"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                {step}
              </span>
            ) : (
              'Analisar'
            )}
          </Button>
          {loading && (
            <p className="text-xs text-muted-foreground">{elapsed}s decorridos — pode levar até 40s</p>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 p-4 rounded-lg border border-destructive/30 bg-destructive/5 mb-6">
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {result && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">Pipeline completo</span>
              {result.jobStructured?.title && (
                <span className="text-sm text-muted-foreground">
                  {result.jobStructured.title}
                  {result.jobStructured.company ? ` — ${result.jobStructured.company}` : ''}
                </span>
              )}
              {result.jobStructured?.isGupy && (
                <Badge variant="secondary" className="text-xs">Gupy</Badge>
              )}
              {result.jobStructured?.workModel && (
                <Badge variant="outline" className="text-xs">{result.jobStructured.workModel}</Badge>
              )}
            </div>

            {/* Análise */}
            <div className="border rounded-lg overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                onClick={() => toggle('analysis')}
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-sm">Análise de Compatibilidade</span>
                  {result.analysis?.score !== undefined && (
                    <span className={`text-sm font-bold px-2 py-0.5 rounded ${scoreColor(result.analysis.score)}`}>
                      {result.analysis.score}/100
                    </span>
                  )}
                </div>
                {openSection === 'analysis' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {openSection === 'analysis' && (
                <div className="px-4 py-4 space-y-4">
                  {result.analysis?.executiveSummary && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Resumo Executivo</p>
                      <p className="text-sm leading-relaxed">{result.analysis.executiveSummary}</p>
                    </div>
                  )}
                  {result.analysis?.strengths && result.analysis.strengths.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Pontos Fortes ({result.analysis.strengths.length})</p>
                      <ul className="space-y-1">
                        {result.analysis.strengths.map((s, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">✓</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.analysis?.gaps && result.analysis.gaps.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Lacunas ({result.analysis.gaps.length})</p>
                      <ul className="space-y-1.5">
                        {result.analysis.gaps.map((g, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <Badge variant={importanceColor(g.importance)} className="text-[10px] mt-0.5 flex-shrink-0">
                              {g.importance}
                            </Badge>
                            {g.description}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.analysis?.atsKeywords && result.analysis.atsKeywords.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Keywords ATS</p>
                      <div className="flex flex-wrap gap-1.5">
                        {result.analysis.atsKeywords.map((kw, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{kw}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Currículo aderente */}
            <div className="border rounded-lg overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                onClick={() => toggle('resume')}
              >
                <span className="font-medium text-sm">Currículo Aderente</span>
                {openSection === 'resume' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {openSection === 'resume' && (
                <div className="px-4 py-4">
                  {result.optimizedResume?.fullText ? (
                    <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed text-foreground bg-muted/20 p-3 rounded-md overflow-auto max-h-[400px]">
                      {result.optimizedResume.fullText}
                    </pre>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum texto gerado.</p>
                  )}
                </div>
              )}
            </div>

            {/* Estimativa salarial */}
            <div className="border rounded-lg overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                onClick={() => toggle('salary')}
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-sm">Estimativa Salarial</span>
                  {result.salary?.min && result.salary?.max && (
                    <span className="text-sm text-muted-foreground">
                      {result.salary.min} – {result.salary.max}
                    </span>
                  )}
                </div>
                {openSection === 'salary' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {openSection === 'salary' && (
                <div className="px-4 py-4 space-y-3">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {(['min', 'mid', 'max'] as const).map((k) => (
                      <div key={k} className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground uppercase mb-1">{k === 'min' ? 'Mínimo' : k === 'mid' ? 'Médio' : 'Máximo'}</p>
                        <p className="text-base font-bold">{result.salary?.[k] ?? '—'}</p>
                      </div>
                    ))}
                  </div>
                  {result.salary?.explanation && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{result.salary.explanation}</p>
                  )}
                </div>
              )}
            </div>

            {/* Gupy */}
            {result.gupySuggestions && (
              <div className="border rounded-lg overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                  onClick={() => toggle('gupy')}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">Textos para Gupy</span>
                    <Badge variant="secondary" className="text-xs">3 versões</Badge>
                  </div>
                  {openSection === 'gupy' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {openSection === 'gupy' && (
                  <div className="px-4 py-4 space-y-4">
                    {([['formal', 'Formal'], ['human', 'Humano'], ['objective', 'Objetivo']] as const).map(([key, label]) =>
                      result.gupySuggestions?.[key] ? (
                        <div key={key}>
                          <p className="text-xs font-medium text-muted-foreground uppercase mb-1.5">{label}</p>
                          <p className="text-sm leading-relaxed p-3 bg-muted/20 rounded-md">
                            {result.gupySuggestions[key]}
                          </p>
                        </div>
                      ) : null
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
