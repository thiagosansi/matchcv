import { callOpenAI } from './openai';
import type { JobStructured, Platform } from '@/types';

export { fetchJobFromPlatform } from '@/lib/platforms';

const SYSTEM_PROMPT = `
Você extrai dados estruturados de vagas de emprego.

Regras:
- Responda em português-BR
- Não invente dados
- Se algo não estiver claro, use string vazia ou array vazio
- Diferencie responsabilidades, requisitos obrigatórios, diferenciais, stack e soft skills
- Não misture benefício com requisito
- Detecte Gupy quando houver indício claro no texto
- Retorne apenas JSON válido

Normalização:
- seniority: "Júnior" | "Pleno" | "Sênior" | "Lead" | "Especialista" | "Coordenação" | "Gerência" | "Diretoria" | ""
- workModel: "Remoto" | "Híbrido" | "Presencial" | ""

Estrutura:
{
  "title": "string",
  "company": "string",
  "responsibilities": ["string"],
  "required": ["string"],
  "differentials": ["string"],
  "stack": ["string"],
  "softSkills": ["string"],
  "seniority": "string",
  "location": "string",
  "workModel": "string",
  "isGupy": false
}
`;

function safeJsonParse<T>(value: string, label: string): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    throw new Error(`${label} retornou JSON inválido`);
  }
}

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const key = value.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(value);
    }
  }
  return result;
}

function clipText(text: string, maxChars = 12000): string {
  return text.length > maxChars ? text.slice(0, maxChars) : text;
}

function normalizeSeniority(value: string): string {
  const n = value.trim().toLowerCase();
  if (!n) return '';
  if (n.includes('junior') || n.includes('júnior')) return 'Júnior';
  if (n.includes('pleno') || n.includes('mid')) return 'Pleno';
  if (n.includes('senior') || n.includes('sênior')) return 'Sênior';
  if (n.includes('lead')) return 'Lead';
  if (n.includes('especialista') || n.includes('specialist')) return 'Especialista';
  if (n.includes('coord')) return 'Coordenação';
  if (n.includes('gerente') || n.includes('manager') || n.includes('gerência')) return 'Gerência';
  if (n.includes('diretor') || n.includes('director') || n.includes('diretoria')) return 'Diretoria';
  return '';
}

function normalizeWorkModel(value: string): string {
  const n = value.trim().toLowerCase();
  if (!n) return '';
  if (n.includes('remoto') || n.includes('remote') || n.includes('home office')) return 'Remoto';
  if (n.includes('híbrido') || n.includes('hibrido') || n.includes('hybrid')) return 'Híbrido';
  if (n.includes('presencial') || n.includes('on-site') || n.includes('onsite')) return 'Presencial';
  return '';
}

function normalizeJobStructured(
  result: JobStructured,
  platform: Platform = 'generic'
): JobStructured {
  const isGupy = Boolean(result.isGupy) || platform === 'gupy';
  return {
    title: normalizeString(result.title),
    company: normalizeString(result.company),
    responsibilities: dedupe(normalizeArray(result.responsibilities)),
    required: dedupe(normalizeArray(result.required)),
    differentials: dedupe(normalizeArray(result.differentials)),
    stack: dedupe(normalizeArray(result.stack)),
    softSkills: dedupe(normalizeArray(result.softSkills)),
    seniority: normalizeSeniority(normalizeString(result.seniority)),
    location: normalizeString(result.location),
    workModel: normalizeWorkModel(normalizeString(result.workModel)),
    isGupy,
    platform,
  };
}

export async function parseJob(
  jobText: string,
  platform: Platform = 'generic'
): Promise<JobStructured> {
  const cleanedJobText = clipText(
    jobText
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim(),
    12000
  );

  const userPrompt = [
    'Extraia a vaga abaixo para JSON estruturado.',
    'Não invente dados.',
    'Classifique corretamente obrigatório e desejável.',
    '',
    `vaga=${JSON.stringify(cleanedJobText)}`,
  ].join('\n');

  const result = await callOpenAI(SYSTEM_PROMPT, userPrompt, {
    preset: 'fast',
    requireJson: true,
    temperature: 0.1,
    maxTokens: 1400,
    timeoutMs: 25000,
  });

  return normalizeJobStructured(
    safeJsonParse<JobStructured>(result, 'Estruturação da vaga'),
    platform
  );
}
