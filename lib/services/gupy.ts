import { callOpenAI } from './openai';
import type { GupySuggestion, ResumeStructured, JobStructured } from '@/types';

const SYSTEM_PROMPT = `
Você cria textos curtos para candidatura no mercado brasileiro, especialmente para a etapa "Personalizar" da Gupy.

Regras:
- Responda em português-BR
- Não invente experiências, resultados, ferramentas ou qualificações
- Use apenas informações sustentadas pelo currículo
- Não escreva carta longa
- Não seja robótico
- Evite clichês e exageros
- Os textos devem parecer escritos por uma pessoa real
- Retorne apenas JSON válido

Estrutura:
{
  "formal": "string",
  "human": "string",
  "objective": "string"
}
`;

function safeJsonParse<T>(value: string, label: string): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    throw new Error(`${label} retornou JSON inválido`);
  }
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeGupySuggestion(result: GupySuggestion): GupySuggestion {
  return {
    formal: normalizeText(result.formal),
    human: normalizeText(result.human),
    objective: normalizeText(result.objective),
  };
}

function compactResumeForGupy(resume: ResumeStructured) {
  return {
    summary: resume.summary || '',
    experiences: (resume.experiences || []).slice(0, 3).map((exp) => ({
      title: exp.title || '',
      company: exp.company || '',
      description: exp.description || '',
      achievements: (exp.achievements || []).slice(0, 3),
    })),
    skills: (resume.skills || []).slice(0, 12),
    tools: (resume.tools || []).slice(0, 8),
    education: (resume.education || []).slice(0, 2),
  };
}

function compactJobForGupy(job: JobStructured) {
  return {
    title: job.title || '',
    company: job.company || '',
    responsibilities: (job.responsibilities || []).slice(0, 5),
    required: (job.required || []).slice(0, 6),
    differentials: (job.differentials || []).slice(0, 4),
  };
}

export async function generateGupyTexts(
  resume: ResumeStructured,
  job: JobStructured
): Promise<GupySuggestion> {
  const userPrompt = [
    'Gere 3 versões curtas de texto para candidatura.',
    'Os textos devem ser naturais, úteis e sem exagero.',
    'Use apenas dados reais do currículo.',
    '',
    `curriculo=${JSON.stringify(compactResumeForGupy(resume))}`,
    `vaga=${JSON.stringify(compactJobForGupy(job))}`,
  ].join('\n');

  const result = await callOpenAI(SYSTEM_PROMPT, userPrompt, {
    preset: 'fast',
    fallbackPreset: 'quality',
    requireJson: true,
    temperature: 0.35,
    maxTokens: 1000,
    timeoutMs: 25000,
  });

  return normalizeGupySuggestion(
    safeJsonParse<GupySuggestion>(result, 'Textos de candidatura')
  );
}