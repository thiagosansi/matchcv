import { callOpenAI } from './openai';
import type { JobStructured } from '@/types';

const SYSTEM_PROMPT = `
Você extrai dados estruturados de vagas de emprego.

Regras:
- Responda em português-BR
- Não invente dados
- Se algo não estiver claro, use string vazia ou array vazio
- Diferencie responsabilidades, requisitos obrigatórios, diferenciais, stack e soft skills
- Não misture benefício com requisito
- Detecte Gupy quando houver indício claro
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
  "isGupy": true
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
  const normalized = value.trim().toLowerCase();

  if (!normalized) return '';

  if (normalized.includes('junior') || normalized.includes('júnior')) return 'Júnior';
  if (normalized.includes('pleno') || normalized.includes('mid')) return 'Pleno';
  if (normalized.includes('senior') || normalized.includes('sênior')) return 'Sênior';
  if (normalized.includes('lead')) return 'Lead';
  if (normalized.includes('especialista') || normalized.includes('specialist')) return 'Especialista';
  if (normalized.includes('coord')) return 'Coordenação';
  if (
    normalized.includes('gerente') ||
    normalized.includes('manager') ||
    normalized.includes('gerência')
  ) {
    return 'Gerência';
  }
  if (
    normalized.includes('diretor') ||
    normalized.includes('director') ||
    normalized.includes('diretoria')
  ) {
    return 'Diretoria';
  }

  return '';
}

function normalizeWorkModel(value: string): string {
  const normalized = value.trim().toLowerCase();

  if (!normalized) return '';

  if (
    normalized.includes('remoto') ||
    normalized.includes('remote') ||
    normalized.includes('home office')
  ) {
    return 'Remoto';
  }

  if (
    normalized.includes('híbrido') ||
    normalized.includes('hibrido') ||
    normalized.includes('hybrid')
  ) {
    return 'Híbrido';
  }

  if (
    normalized.includes('presencial') ||
    normalized.includes('on-site') ||
    normalized.includes('onsite')
  ) {
    return 'Presencial';
  }

  return '';
}

function normalizeJobStructured(result: JobStructured): JobStructured {
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
    isGupy: Boolean(result.isGupy),
  };
}

export async function parseJob(jobText: string): Promise<JobStructured> {
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
    safeJsonParse<JobStructured>(result, 'Estruturação da vaga')
  );
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function extractJsonLdJobPosting(html: string): string | null {
  const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      const candidates = Array.isArray(data) ? data : [data];

      for (const item of candidates) {
        if (item?.['@type'] === 'JobPosting') {
          const parts: string[] = [];
          if (item.title) parts.push(`Vaga: ${item.title}`);
          if (item.hiringOrganization?.name) parts.push(`Empresa: ${item.hiringOrganization.name}`);
          if (item.description) {
            parts.push('Descrição:');
            parts.push(
              String(item.description)
                .replace(/<[^>]+>/g, ' ')
                .replace(/&nbsp;/gi, ' ')
                .replace(/\s+/g, ' ')
                .trim()
            );
          }
          if (item.employmentType) parts.push(`Tipo: ${item.employmentType}`);
          if (item.jobLocation) parts.push(`Localização: ${JSON.stringify(item.jobLocation)}`);

          const text = parts.join('\n');
          if (text.length >= 200) return text.slice(0, 12000);
        }
      }
    } catch {
      // invalid JSON-LD, skip
    }
  }

  return null;
}

function flattenToText(obj: unknown, depth = 0): string {
  if (depth > 8) return '';
  if (typeof obj === 'string') {
    const clean = obj.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    // Skip short strings, URLs, tokens, and base64
    if (clean.length < 30 || clean.startsWith('http') || clean.startsWith('data:') || /^[a-zA-Z0-9_-]{40,}$/.test(clean)) return '';
    return clean;
  }
  if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
  if (Array.isArray(obj)) {
    return obj.map(item => flattenToText(item, depth + 1)).filter(Boolean).join('\n');
  }
  if (obj && typeof obj === 'object') {
    return Object.entries(obj as Record<string, unknown>)
      .map(([k, v]) => {
        const val = flattenToText(v, depth + 1);
        if (!val) return '';
        return `${k}: ${val}`;
      })
      .filter(Boolean)
      .join('\n');
  }
  return '';
}

function extractNextDataText(html: string): string | null {
  const match = html.match(/<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!match) return null;

  try {
    const nextData = JSON.parse(match[1]);
    const pageProps = nextData?.props?.pageProps;
    if (!pageProps || typeof pageProps !== 'object') return null;

    // Prioritize common job-specific keys
    const jobKeys = ['job', 'vacancy', 'position', 'vaga', 'jobPosting', 'posting', 'opportunity', 'role'];
    for (const key of jobKeys) {
      const val = (pageProps as Record<string, unknown>)[key];
      if (val && typeof val === 'object') {
        const text = flattenToText(val);
        if (text.length >= 200) return text.slice(0, 12000);
      }
    }

    // Fall back to full pageProps
    const text = flattenToText(pageProps);
    if (text.length >= 200) return text.slice(0, 12000);
  } catch {
    // invalid JSON, skip
  }

  return null;
}

function extractMainContentText(html: string): string | null {
  const areaRegex = /<(?:main|article)[^>]*>([\s\S]*?)<\/(?:main|article)>/gi;
  const contents: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = areaRegex.exec(html)) !== null) {
    const text = stripHtml(match[1]);
    if (text.length > 150) contents.push(text);
  }

  if (contents.length === 0) return null;
  const combined = contents.join('\n').slice(0, 12000);
  return combined.length >= 200 ? combined : null;
}

export async function fetchJobFromUrl(url: string): Promise<string> {
  let html: string;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(10000),
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Falha ao buscar URL: ${response.status}`);
    }

    html = await response.text();
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    throw new Error(
      msg.startsWith('Falha ao buscar')
        ? msg
        : 'Não foi possível buscar o conteúdo da vaga pela URL. Cole o texto manualmente.'
    );
  }

  // Strategy 1: JSON-LD JobPosting schema
  const jsonLd = extractJsonLdJobPosting(html);
  if (jsonLd) return jsonLd;

  // Strategy 2: __NEXT_DATA__ (Next.js apps — inhire.app, Greenhouse, Lever, etc.)
  const nextData = extractNextDataText(html);
  if (nextData) return nextData;

  // Strategy 3: <main> / <article> content areas
  const mainContent = extractMainContentText(html);
  if (mainContent) return mainContent;

  // Strategy 4: full HTML strip (original fallback)
  const fullText = stripHtml(html);
  if (fullText.length < 200) {
    throw new Error(
      'Conteúdo insuficiente. O site pode bloquear acesso automático. Cole o texto da vaga manualmente.'
    );
  }
  return fullText.slice(0, 12000);
}