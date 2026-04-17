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
Você gera um "Currículo aderente à vaga" usando SOMENTE dados reais do currículo.

Regras obrigatórias:
- Responda em português-BR
- Não invente cargo, empresa, período, ferramenta, projeto, certificação, idioma ou resultado numérico
- Não troque o cargo real do candidato pelo cargo da vaga
- Use os nomes de empresa, cargo e período EXATAMENTE como aparecem no curriculo_original
- Use palavras-chave da vaga apenas quando houver evidência real no currículo
- O texto final deve parecer currículo real de um humano, não texto genérico de IA

Escrita dos bullets de experiência:
- Formato preferido: verbo de ação no passado + contexto específico + impacto/resultado quando mencionado no original
- Use terminologia da vaga quando a experiência real confirmar a habilidade
- Seja específico: cite ferramentas, metodologias, escala e resultados reais do currículo
- Evite frases vagas como "atuei em", "contribuí para", "responsável por" sem detalhe

Cobertura obrigatória:
- Inclua TODAS as experiências presentes no currículo, com 3-4 bullets cada
- Inclua todos os idiomas presentes no currículo (não invente níveis)
- Inclua todas as certificações presentes no currículo
- Se houver habilidades: inclua todas as relevantes para a vaga
- Se houver formação: inclua formação completa

Estrutura:
{
  "summary": "string",
  "experiences": [
    {
      "title": "cargo exato do currículo",
      "company": "empresa exata do currículo",
      "period": "período exato do currículo",
      "bullets": ["string", "string", "string"]
    }
  ],
  "skills": ["string"],
  "education": ["string"],
  "highlights": ["string", "string", "string"],
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
      description: (exp.description || '').slice(0, 300),
      achievements: (exp.achievements || []).slice(0, 8),
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
  const rawClip = resumeText
    ? resumeText.replace(/\s+/g, ' ').trim().slice(0, 9000)
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
    'Inclua TODAS as experiências do currículo — não omita nenhuma.',
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
    maxTokens: 4500,
    timeoutMs: 60000,
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
