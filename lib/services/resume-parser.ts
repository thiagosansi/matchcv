import { callOpenAI } from './openai';
import type { ResumeStructured, ContactInfo } from '@/types';

const SYSTEM_PROMPT = `
Você extrai dados estruturados de currículos.

Regras:
- Responda em português-BR
- Não invente nada
- Use apenas o que estiver explícito
- Se não houver informação, use string vazia ou array vazio
- Não misture skills com tools
- Não duplique itens
- Retorne apenas JSON válido

Estrutura:
{
  "contact": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "linkedin": "string",
    "location": "string",
    "portfolio": "string"
  },
  "summary": "string",
  "experiences": [
    {
      "title": "string",
      "company": "string",
      "period": "string",
      "description": "string",
      "achievements": ["string"]
    }
  ],
  "skills": ["string"],
  "tools": ["string"],
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "period": "string",
      "field": "string"
    }
  ],
  "languages": [
    {
      "name": "string",
      "level": "string"
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["string"]
    }
  ],
  "certifications": ["string"]
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
    .filter((v): v is string => typeof v === 'string')
    .map((v) => v.trim())
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

function normalizeContact(value: unknown): ContactInfo {
  const empty: ContactInfo = {
    name: '',
    email: '',
    phone: '',
    linkedin: '',
    location: '',
    portfolio: '',
  };

  if (!value || typeof value !== 'object') return empty;

  const c = value as Record<string, unknown>;
  return {
    name: normalizeString(c.name),
    email: normalizeString(c.email),
    phone: normalizeString(c.phone),
    linkedin: normalizeString(c.linkedin),
    location: normalizeString(c.location),
    portfolio: normalizeString(c.portfolio),
  };
}

function normalizeResume(result: ResumeStructured): ResumeStructured {
  return {
    contact: normalizeContact(result.contact),

    summary: normalizeString(result.summary),

    experiences: Array.isArray(result.experiences)
      ? result.experiences
          .filter(Boolean)
          .map((exp) => ({
            title: normalizeString(exp.title),
            company: normalizeString(exp.company),
            period: normalizeString(exp.period),
            description: normalizeString(exp.description),
            achievements: dedupe(normalizeArray(exp.achievements)),
          }))
      : [],

    skills: dedupe(normalizeArray(result.skills)),
    tools: dedupe(normalizeArray(result.tools)),

    education: Array.isArray(result.education)
      ? result.education
          .filter(Boolean)
          .map((edu) => ({
            degree: normalizeString(edu.degree),
            institution: normalizeString(edu.institution),
            period: normalizeString(edu.period),
            field: normalizeString(edu.field),
          }))
      : [],

    languages: Array.isArray(result.languages)
      ? result.languages
          .filter(Boolean)
          .map((lang) => ({
            name: normalizeString(lang.name),
            level: normalizeString(lang.level),
          }))
      : [],

    projects: Array.isArray(result.projects)
      ? result.projects
          .filter(Boolean)
          .map((proj) => ({
            name: normalizeString(proj.name),
            description: normalizeString(proj.description),
            technologies: dedupe(normalizeArray(proj.technologies)),
          }))
      : [],

    certifications: dedupe(normalizeArray(result.certifications)),
  };
}

interface ParseResumeOptions {
  /** Use quality model and higher token budget — for full-profile imports with many entries. */
  fullExtraction?: boolean;
}

export async function parseResume(
  resumeText: string,
  opts: ParseResumeOptions = {}
): Promise<ResumeStructured> {
  const cleanedText = clipText(
    resumeText
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim(),
    12000
  );

  const userPrompt = [
    'Extraia o currículo abaixo para JSON estruturado.',
    'Use apenas o que estiver explícito.',
    'Não invente informações.',
    'Extraia TODAS as experiências profissionais presentes, sem omitir nenhuma.',
    'Para contact.linkedin: extraia a URL ou username do LinkedIn se presente.',
    'Para contact.location: extraia cidade e estado (ex: "São Paulo, SP").',
    '',
    `curriculo=${JSON.stringify(cleanedText)}`,
  ].join('\n');

  const result = await callOpenAI(SYSTEM_PROMPT, userPrompt, {
    // Full extraction (import): use quality model with large token budget
    // Fast parse (analyze fallback): use fast model with smaller budget
    preset: opts.fullExtraction ? 'quality' : 'fast',
    fallbackPreset: 'quality',
    requireJson: true,
    temperature: 0.1,
    maxTokens: opts.fullExtraction ? 8000 : 2200,
    timeoutMs: opts.fullExtraction ? 60000 : 30000,
  });

  return normalizeResume(
    safeJsonParse<ResumeStructured>(result, 'Parse de currículo')
  );
}
