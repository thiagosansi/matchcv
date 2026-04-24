import { callOpenAI } from './openai';
import { buildResumeFullText } from '@/lib/build-resume-text';
import type {
  AnalysisResult,
  ResumeStructured,
  JobStructured,
  OptimizedResume,
  OptimizedExperience,
  KeywordMatch,
  ScoreDimension,
} from '@/types';

// ─── Prompts ─────────────────────────────────────────────────────────────────

const ANALYSIS_SYSTEM_PROMPT = `
Você analisa aderência entre currículo e vaga.

Regras:
- Responda em português-BR
- Não invente fatos
- Use apenas evidências do currículo
- Se faltar evidência, trate como lacuna provável
- Seja objetivo e específico
- Retorne apenas JSON válido

Estrutura:
{
  "score": 0,
  "executiveSummary": "string",
  "strengths": ["string"],
  "gaps": [
    {
      "type": "skill|keyword|experience|tool|seniority",
      "description": "string",
      "importance": "high|medium|low"
    }
  ],
  "sectionSuggestions": [
    {
      "section": "Resumo|Experiências|Habilidades|Formação|Projetos|Certificações",
      "keep": ["string"],
      "adjust": ["string"],
      "include": ["string"],
      "reduce": ["string"]
    }
  ],
  "atsKeywords": ["string"],
  "scoreBreakdown": [
    {
      "label": "Competências técnicas",
      "score": 0,
      "weight": 35,
      "note": "string"
    },
    {
      "label": "Experiência e senioridade",
      "score": 0,
      "weight": 30,
      "note": "string"
    },
    {
      "label": "Formação",
      "score": 0,
      "weight": 15,
      "note": "string"
    },
    {
      "label": "Soft skills",
      "score": 0,
      "weight": 10,
      "note": "string"
    },
    {
      "label": "Completude do currículo",
      "score": 0,
      "weight": 10,
      "note": "string"
    }
  ]
}
`;

const OPTIMIZE_SYSTEM_PROMPT = `
Você é um especialista em currículos ATS para o mercado brasileiro.
Gere um currículo completamente aderente à vaga usando APENAS dados reais do candidato.

REGRAS NÃO NEGOCIÁVEIS:
- Use SOMENTE dados do currículo — nunca invente cargo, empresa, período, ferramenta, resultado numérico ou certificação
- Mantenha cargo, empresa e período EXATAMENTE como no curriculo_original
- Não substitua o cargo real do candidato pelo cargo da vaga

ESTRATÉGIA ATS — siga esta ordem:
1. ESPELHE a linguagem da vaga: use os mesmos termos e verbos que o recrutador usou no JD
2. Selecione as 6-8 experiências com MAIOR aderência à vaga (não force todas — qualidade > volume)
3. Priorize experiências com: mesmo setor, mesmo tipo de produto, mesmas metodologias da vaga
4. Para cada experiência selecionada: 3-5 bullets ricos
5. Bullet format: [verbo de ação no passado] + [contexto específico] + [impacto/escala quando disponível]
6. Injete 1-2 keywords da vaga por bullet onde a experiência real confirmar o conhecimento

RESUMO PROFISSIONAL:
- 3-5 linhas direcionadas ESPECIFICAMENTE a esta vaga e empresa
- Use o título exato da vaga ao se posicionar (ex: "Product Manager com X anos...")
- Cite anos de experiência, setor/segmento e 2-3 diferenciais mais relevantes para a vaga
- Inclua keywords críticas da vaga de forma orgânica

DESTAQUES DE ADERÊNCIA (highlights):
- 4-6 pontos que conectam diretamente o candidato aos requisitos da vaga
- Seja específico: "X anos em produtos [segmento da vaga], conforme requerido para [cargo]"
- Cite requisitos explícitos da vaga que o candidato claramente atende com evidência real

SKILLS:
- Liste PRIMEIRO as skills que aparecem na descrição da vaga (por ordem de relevância)
- Depois as demais skills relevantes do perfil do candidato

FORMAÇÃO:
- Inclua: grau + curso + instituição + período para cada item

IDIOMAS E CERTIFICAÇÕES:
- Inclua todos os idiomas do currículo (sem inventar níveis)
- Inclua todas as certificações relevantes para a vaga

Retorne APENAS JSON válido com esta estrutura:
{
  "summary": "string",
  "experiences": [
    {
      "title": "cargo exato do currículo",
      "company": "empresa exata do currículo",
      "period": "período exato do currículo",
      "bullets": ["string (3-5 bullets ricos por experiência)"]
    }
  ],
  "skills": ["string"],
  "education": ["string"],
  "highlights": ["string (4-6 destaques de aderência)"],
  "languages": ["string"],
  "certifications": ["string"]
}
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function safeJsonParse<T>(value: string, label: string): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    throw new Error(`${label} retornou JSON inválido`);
  }
}

function cleanStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

// ─── Normalization ────────────────────────────────────────────────────────────

function normalizeScoreBreakdown(raw: unknown): ScoreDimension[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(Boolean)
    .map((item) => ({
      label: typeof item.label === 'string' ? item.label.trim() : '',
      score: typeof item.score === 'number' ? Math.max(0, Math.min(100, Math.round(item.score))) : 0,
      weight: typeof item.weight === 'number' ? item.weight : 0,
      note: typeof item.note === 'string' ? item.note.trim() : '',
    }))
    .filter((d) => d.label);
}

function normalizeAnalysis(result: AnalysisResult): AnalysisResult {
  const score =
    typeof result.score === 'number'
      ? Math.max(0, Math.min(100, Math.round(result.score)))
      : 0;

  return {
    score,
    executiveSummary:
      typeof result.executiveSummary === 'string' && result.executiveSummary.trim()
        ? result.executiveSummary.trim()
        : 'Não foi possível gerar um resumo executivo.',
    strengths: cleanStringArray(result.strengths),
    gaps: Array.isArray(result.gaps) ? result.gaps.filter(Boolean) : [],
    sectionSuggestions: Array.isArray(result.sectionSuggestions)
      ? result.sectionSuggestions.filter(Boolean)
      : [],
    atsKeywords: cleanStringArray(result.atsKeywords),
    keywordMatch: [],          // populated after via matchKeywordsToResume
    scoreBreakdown: normalizeScoreBreakdown(result.scoreBreakdown),
  };
}

function normalizeOptimizedExperience(raw: unknown): OptimizedExperience | null {
  if (!raw || typeof raw !== 'object') return null;
  const e = raw as Record<string, unknown>;
  const title = typeof e.title === 'string' ? e.title.trim() : '';
  const company = typeof e.company === 'string' ? e.company.trim() : '';
  if (!title && !company) return null;
  return {
    title,
    company,
    period: typeof e.period === 'string' ? e.period.trim() : '',
    bullets: cleanStringArray(e.bullets),
  };
}

function normalizeOptimizedResume(result: OptimizedResume): OptimizedResume {
  return {
    summary: typeof result.summary === 'string' ? result.summary.trim() : '',
    experiences: Array.isArray(result.experiences)
      ? (result.experiences.map(normalizeOptimizedExperience).filter(Boolean) as OptimizedExperience[])
      : [],
    skills: cleanStringArray(result.skills),
    education: cleanStringArray(result.education),
    highlights: cleanStringArray(result.highlights),
    languages: cleanStringArray(result.languages),
    certifications: cleanStringArray(result.certifications),
    // fullText is built deterministically after normalization
  };
}

// ─── Compact helpers (control token usage) ───────────────────────────────────

function compactResumeForAnalysis(resume: ResumeStructured) {
  return {
    summary: resume.summary || '',
    // No slice — send all experiences so analysis is accurate
    experiences: (resume.experiences || []).map((exp) => ({
      title: exp.title || '',
      company: exp.company || '',
      period: exp.period || '',
      description: (exp.description || '').slice(0, 200),
      achievements: (exp.achievements || []).slice(0, 5),
    })),
    skills: (resume.skills || []).slice(0, 25),
    tools: (resume.tools || []).slice(0, 20),
    education: (resume.education || []).slice(0, 4),
    languages: (resume.languages || []).slice(0, 5),
    certifications: (resume.certifications || []).slice(0, 10),
  };
}

function compactJobForAnalysis(job: JobStructured) {
  return {
    title: job.title || '',
    company: job.company || '',
    responsibilities: (job.responsibilities || []).slice(0, 8),
    required: (job.required || []).slice(0, 12),
    differentials: (job.differentials || []).slice(0, 8),
    stack: (job.stack || []).slice(0, 12),
    softSkills: (job.softSkills || []).slice(0, 8),
    seniority: job.seniority || '',
    location: job.location || '',
    workModel: job.workModel || '',
  };
}

function compactResumeForOptimization(resume: ResumeStructured) {
  return {
    summary: resume.summary || '',
    // No slice — include all experiences for a complete optimized resume
    experiences: (resume.experiences || []).map((exp) => ({
      title: exp.title || '',
      company: exp.company || '',
      period: exp.period || '',
      description: (exp.description || '').slice(0, 600),
      achievements: (exp.achievements || []).slice(0, 12),
    })),
    skills: (resume.skills || []).slice(0, 30),
    tools: (resume.tools || []).slice(0, 25),
    education: (resume.education || []).slice(0, 4),
    languages: (resume.languages || []).slice(0, 5),
    certifications: (resume.certifications || []).slice(0, 10),
    projects: (resume.projects || []).slice(0, 4),
  };
}

function compactAnalysisForOptimization(analysis: AnalysisResult) {
  return {
    score: analysis.score,
    strengths: (analysis.strengths || []).slice(0, 6),
    gaps: (analysis.gaps || []).slice(0, 8),
    atsKeywords: (analysis.atsKeywords || []).slice(0, 15),
    missingKeywords: (analysis.keywordMatch || [])
      .filter((k) => !k.found)
      .map((k) => k.keyword)
      .slice(0, 10),
  };
}

// ─── Keyword matching (deterministic, no AI call) ────────────────────────────

// Common aliases for keywords found in Brazilian job postings
const KEYWORD_ALIASES: Record<string, string[]> = {
  react: ['reactjs', 'react.js'],
  node: ['nodejs', 'node.js'],
  javascript: ['js'],
  typescript: ['ts'],
  python: ['py'],
  postgresql: ['postgres', 'pg'],
  mongodb: ['mongo'],
  kubernetes: ['k8s'],
  elasticsearch: ['elastic', 'es'],
  'next.js': ['nextjs', 'next'],
  'vue.js': ['vuejs', 'vue'],
  'angular': ['angularjs'],
  'aws': ['amazon web services'],
  'gcp': ['google cloud'],
  'ci/cd': ['cicd', 'continuous integration', 'continuous delivery'],
};

function buildAliasMap(): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const [canonical, aliases] of Object.entries(KEYWORD_ALIASES)) {
    map.set(canonical, [canonical, ...aliases]);
    for (const alias of aliases) {
      if (!map.has(alias)) map.set(alias, [canonical, ...aliases]);
    }
  }
  return map;
}

const ALIAS_MAP = buildAliasMap();

function keywordFoundInText(keyword: string, textLower: string): boolean {
  const kw = keyword.toLowerCase().trim();

  // Direct match
  if (textLower.includes(kw)) return true;

  // Alias match
  const variants = ALIAS_MAP.get(kw);
  if (variants) {
    return variants.some((v) => textLower.includes(v));
  }

  // Partial match for compound words (e.g. "Node.js" → "node")
  const base = kw.replace(/[^a-z0-9]/g, '');
  if (base.length >= 4 && textLower.replace(/[^a-z0-9]/g, '').includes(base)) {
    return true;
  }

  return false;
}

export function matchKeywordsToResume(
  keywords: string[],
  resumeText: string
): KeywordMatch[] {
  const textLower = resumeText.toLowerCase();

  return keywords.map((keyword) => ({
    keyword,
    found: keywordFoundInText(keyword, textLower),
  }));
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function analyzeCompatibility(
  resume: ResumeStructured,
  job: JobStructured,
  resumeText: string
): Promise<AnalysisResult> {
  const userPrompt = [
    'Compare currículo e vaga.',
    'Considere apenas evidências explícitas no currículo.',
    'Se faltar evidência, aponte lacuna provável.',
    'Para scoreBreakdown: avalie cada dimensão de forma independente e específica.',
    '',
    `curriculo=${JSON.stringify(compactResumeForAnalysis(resume))}`,
    `vaga=${JSON.stringify(compactJobForAnalysis(job))}`,
  ].join('\n');

  const result = await callOpenAI(ANALYSIS_SYSTEM_PROMPT, userPrompt, {
    preset: 'quality',
    fallbackPreset: 'fast',
    requireJson: true,
    temperature: 0.15,
    maxTokens: 2000,
    timeoutMs: 35000,
  });

  const normalized = normalizeAnalysis(
    safeJsonParse<AnalysisResult>(result, 'Análise de compatibilidade')
  );

  // Keyword match is done deterministically — no extra AI call
  normalized.keywordMatch = matchKeywordsToResume(
    normalized.atsKeywords,
    resumeText
  );

  return normalized;
}

export async function optimizeResume(
  resume: ResumeStructured,
  job: JobStructured,
  analysis: AnalysisResult,
  resumeText?: string
): Promise<OptimizedResume> {
  // Keep rawClip small — Groq free tier is limited to ~6000 total tokens per request.
  // The structured data (compactResumeForOptimization) is the primary source;
  // rawClip just helps preserve verbatim phrasing for bullet rewriting.
  const rawClip = resumeText
    ? resumeText.replace(/\s+/g, ' ').trim().slice(0, 1500)
    : '';

  const compactAnalysis = compactAnalysisForOptimization(analysis);

  const missingKeywordsNote =
    compactAnalysis.missingKeywords.length > 0
      ? [
          '',
          'Palavras-chave da vaga AUSENTES no currículo (inclua se houver evidência real):',
          compactAnalysis.missingKeywords.join(', '),
        ].join('\n')
      : '';

  const userPrompt = [
    'Gere um currículo aderente à vaga usando apenas dados reais do currículo.',
    'Use o curriculo_original como fonte de verdade para nomes de empresa, cargo, período e realizações.',
    'Selecione as 6-8 experiências com MAIOR aderência à vaga — qualidade > volume.',
    missingKeywordsNote,
    '',
    rawClip ? `curriculo_original=${JSON.stringify(rawClip)}` : '',
    `curriculo_estruturado=${JSON.stringify(compactResumeForOptimization(resume))}`,
    `vaga=${JSON.stringify(compactJobForAnalysis(job))}`,
    `analise=${JSON.stringify(compactAnalysis)}`,
  ]
    .filter(Boolean)
    .join('\n');

  const result = await callOpenAI(OPTIMIZE_SYSTEM_PROMPT, userPrompt, {
    preset: 'quality',
    fallbackPreset: 'fast',
    requireJson: true,
    temperature: 0.2,
    // ~2500 input tokens + 3200 output = ~5700 total — fits in Groq free tier (6000 TPM)
    maxTokens: 3200,
    timeoutMs: 90000,
  });

  const normalized = normalizeOptimizedResume(
    safeJsonParse<OptimizedResume>(result, 'Currículo aderente')
  );

  // Copy contact from original resume — never rewritten by AI
  normalized.contact = resume.contact;

  // Build fullText deterministically from structured data
  normalized.fullText = buildResumeFullText(normalized);

  return normalized;
}
