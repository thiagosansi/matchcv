import { callOpenAI } from './openai';
import { buildSalaryContext } from '@/lib/data/salary-benchmarks';
import type { SalarySuggestion, JobStructured } from '@/types';

const SYSTEM_PROMPT = `
Você estima faixa salarial para vagas no mercado brasileiro.

Regras:
- Responda em português-BR
- Use a referência de mercado fornecida como âncora principal
- Ajuste para cima/baixo com base em fatores específicos da vaga (stack diferenciada, fintech/startup, nível de inglês exigido, benefícios, porte da empresa)
- Se a referência de mercado não foi encontrada, estime com base em benchmarks gerais
- Seja conservador e realista; não invente precisão excessiva
- Use valores mensais em BRL, formato "R$ 12.000"
- Não use inglês
- Não diga que consultou dados em tempo real
- Retorne apenas JSON válido

Estrutura:
{
  "min": "R$ 0",
  "mid": "R$ 0",
  "max": "R$ 0",
  "explanation": "string",
  "factors": ["string"]
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

function formatBRL(value: string): string {
  const digits = value.replace(/\D/g, '');

  if (!digits) return 'R$ 0';

  const amount = Number(digits);
  return `R$ ${amount.toLocaleString('pt-BR')}`;
}

function normalizeSalary(result: SalarySuggestion): SalarySuggestion {
  return {
    min: formatBRL(result.min || ''),
    mid: formatBRL(result.mid || ''),
    max: formatBRL(result.max || ''),
    explanation:
      normalizeString(result.explanation) ||
      'Estimativa baseada em benchmarks gerais de mercado, com precisão limitada pelos dados disponíveis na vaga.',
    factors: normalizeArray(result.factors),
  };
}

function compactJobForSalary(job: JobStructured) {
  return {
    title: job.title || '',
    company: job.company || '',
    seniority: job.seniority || '',
    location: job.location || '',
    workModel: job.workModel || '',
    stack: (job.stack || []).slice(0, 8),
    required: (job.required || []).slice(0, 8),
    responsibilities: (job.responsibilities || []).slice(0, 6),
  };
}

export async function estimateSalary(job: JobStructured): Promise<SalarySuggestion> {
  const compactJob = compactJobForSalary(job);

  const benchmarkCtx = buildSalaryContext(
    job.title || '',
    job.seniority || '',
    job.location || '',
    job.workModel || ''
  );

  const userPrompt = [
    'Estime a faixa salarial mensal desta vaga no mercado brasileiro.',
    'Use a referência de mercado abaixo como âncora e ajuste com base nos detalhes da vaga.',
    '',
    benchmarkCtx.contextText,
    '',
    `vaga=${JSON.stringify(compactJob)}`,
  ].join('\n');

  const result = await callOpenAI(SYSTEM_PROMPT, userPrompt, {
    preset: 'fast',
    fallbackPreset: 'quality',
    requireJson: true,
    temperature: 0.2,
    maxTokens: 900,
    timeoutMs: 25000,
  });

  return normalizeSalary(
    safeJsonParse<SalarySuggestion>(result, 'Estimativa salarial')
  );
}