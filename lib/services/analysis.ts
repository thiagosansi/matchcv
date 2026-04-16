import { callOpenAI } from './openai';
import type {
  AnalysisResult,
  ResumeStructured,
  JobStructured,
  OptimizedResume,
} from '@/types';

const ANALYSIS_SYSTEM_PROMPT = `
Você analisa aderência entre currículo e vaga.

Regras:
- Responda em português-BR
- Não invente fatos
- Use apenas evidências do currículo
- Se faltar evidência, trate como lacuna provável
- Seja objetivo
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
  "atsKeywords": ["string"]
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
- Se houver 2 ou mais experiências no currículo: inclua todas (mínimo 2) com 3-4 bullets cada
- Se houver habilidades: inclua todas as relevantes para a vaga
- Se houver formação: inclua formação completa
- O fullText deve ser completo (resumo + experiências + habilidades + formação)

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
  "fullText": "string com currículo completo formatado"
}
`;

function safeJsonParse<T>(value: string, label: string): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    throw new Error(`${label} retornou JSON inválido`);
  }
}

function cleanStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean);
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
  };
}

function normalizeOptimizedResume(result: OptimizedResume): OptimizedResume {
  return {
    summary:
      typeof result.summary === 'string' ? result.summary.trim() : '',
    experiences: Array.isArray(result.experiences) ? result.experiences.filter(Boolean) : [],
    skills: cleanStringArray(result.skills),
    education: cleanStringArray(result.education),
    highlights: cleanStringArray(result.highlights),
    fullText:
      typeof result.fullText === 'string' ? result.fullText.trim() : '',
  };
}

function compactResumeForAnalysis(resume: ResumeStructured) {
  return {
    summary: resume.summary || '',
    experiences: (resume.experiences || []).slice(0, 4).map((exp) => ({
      title: exp.title || '',
      company: exp.company || '',
      period: exp.period || '',
      description: exp.description || '',
      achievements: (exp.achievements || []).slice(0, 4),
    })),
    skills: (resume.skills || []).slice(0, 20),
    tools: (resume.tools || []).slice(0, 15),
    education: (resume.education || []).slice(0, 3),
    languages: (resume.languages || []).slice(0, 5),
    projects: (resume.projects || []).slice(0, 3),
  };
}

function compactJobForAnalysis(job: JobStructured) {
  return {
    title: job.title || '',
    company: job.company || '',
    responsibilities: (job.responsibilities || []).slice(0, 8),
    required: (job.required || []).slice(0, 10),
    differentials: (job.differentials || []).slice(0, 8),
    stack: (job.stack || []).slice(0, 10),
    softSkills: (job.softSkills || []).slice(0, 8),
    seniority: job.seniority || '',
    location: job.location || '',
    workModel: job.workModel || '',
    isGupy: Boolean(job.isGupy),
  };
}

function compactResumeForOptimization(resume: ResumeStructured) {
  return {
    summary: resume.summary || '',
    experiences: (resume.experiences || []).slice(0, 6).map((exp) => ({
      title: exp.title || '',
      company: exp.company || '',
      period: exp.period || '',
      description: exp.description || '',
      achievements: (exp.achievements || []).slice(0, 8),
    })),
    skills: (resume.skills || []).slice(0, 25),
    tools: (resume.tools || []).slice(0, 20),
    education: (resume.education || []).slice(0, 4),
    languages: (resume.languages || []).slice(0, 5),
    projects: (resume.projects || []).slice(0, 4),
  };
}

function compactAnalysisForOptimization(analysis: AnalysisResult) {
  return {
    score: analysis.score,
    strengths: (analysis.strengths || []).slice(0, 6),
    gaps: (analysis.gaps || []).slice(0, 6),
    atsKeywords: (analysis.atsKeywords || []).slice(0, 10),
  };
}

function buildFallbackFullText(result: OptimizedResume): string {
  return [
    result.summary ? `RESUMO PROFISSIONAL\n${result.summary}` : '',
    result.highlights?.length
      ? `DESTAQUES\n${result.highlights.map((item) => `• ${item}`).join('\n')}`
      : '',
    result.experiences?.length
      ? `EXPERIÊNCIAS\n${result.experiences
          .map(
            (exp) =>
              `${exp.title} | ${exp.company} | ${exp.period}\n${(exp.bullets || [])
                .map((bullet) => `• ${bullet}`)
                .join('\n')}`
          )
          .join('\n\n')}`
      : '',
    result.skills?.length ? `HABILIDADES\n${result.skills.join(', ')}` : '',
    result.education?.length ? `FORMAÇÃO\n${result.education.join('\n')}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

export async function analyzeCompatibility(
  resume: ResumeStructured,
  job: JobStructured
): Promise<AnalysisResult> {
  const userPrompt = [
    'Compare currículo e vaga.',
    'Considere apenas evidências explícitas no currículo.',
    'Se faltar evidência, aponte lacuna provável.',
    '',
    `curriculo=${JSON.stringify(compactResumeForAnalysis(resume))}`,
    `vaga=${JSON.stringify(compactJobForAnalysis(job))}`,
  ].join('\n');

  const result = await callOpenAI(ANALYSIS_SYSTEM_PROMPT, userPrompt, {
    preset: 'quality',
    fallbackPreset: 'fast',
    requireJson: true,
    temperature: 0.15,
    maxTokens: 1600,
    timeoutMs: 30000,
  });

  return normalizeAnalysis(
    safeJsonParse<AnalysisResult>(result, 'Análise de compatibilidade')
  );
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

  const userPrompt = [
    'Gere um currículo aderente à vaga usando apenas dados reais do currículo.',
    'Use o curriculo_original como fonte de verdade para nomes de empresa, cargo, período e realizações.',
    'Inclua todas as experiências, habilidades e formação presentes no currículo.',
    'O fullText deve ser completo — não corte experiências.',
    '',
    rawClip ? `curriculo_original=${JSON.stringify(rawClip)}` : '',
    `curriculo_estruturado=${JSON.stringify(compactResumeForOptimization(resume))}`,
    `vaga=${JSON.stringify(compactJobForAnalysis(job))}`,
    `analise=${JSON.stringify(compactAnalysisForOptimization(analysis))}`,
  ].filter(Boolean).join('\n');

  const result = await callOpenAI(OPTIMIZE_SYSTEM_PROMPT, userPrompt, {
    preset: 'quality',
    fallbackPreset: 'fast',
    requireJson: true,
    temperature: 0.2,
    maxTokens: 3500,
    timeoutMs: 55000,
  });

  const normalized = normalizeOptimizedResume(
    safeJsonParse<OptimizedResume>(result, 'Currículo aderente')
  );

  if (!normalized.fullText) {
    normalized.fullText = buildFallbackFullText(normalized);
  }

  return normalized;
}