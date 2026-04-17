import { PlatformError } from '../errors';
import {
  fetchHtml,
  extractJsonLdJobPosting,
  extractMainContentText,
  stripHtml,
} from '../html-utils';

interface GreenhouseJob {
  title?: string;
  content?: string;
  location?: { name?: string };
  departments?: Array<{ name?: string }>;
  offices?: Array<{ name?: string }>;
}

function formatGreenhouseJob(data: GreenhouseJob, company: string): string {
  const parts: string[] = [];

  if (data.title) parts.push(`Vaga: ${data.title}`);
  if (company) parts.push(`Empresa: ${company}`);

  const location = data.location?.name ?? data.offices?.[0]?.name;
  if (location) parts.push(`Localização: ${location}`);

  const department = data.departments?.[0]?.name;
  if (department) parts.push(`Área: ${department}`);

  if (data.content) {
    parts.push(`Descrição:\n${stripHtml(data.content)}`);
  }

  return parts.join('\n\n');
}

function parseGreenhouseUrl(
  url: string
): { company: string; jobId: string } | null {
  const match = url.match(
    /boards\.greenhouse\.io\/([^/]+)\/jobs\/(\d+)/
  );
  if (!match) return null;
  return { company: match[1], jobId: match[2] };
}

async function tryGreenhouseApi(
  company: string,
  jobId: string
): Promise<string | null> {
  try {
    const apiUrl = `https://boards-api.greenhouse.io/v1/boards/${company}/jobs/${jobId}`;
    const res = await fetch(apiUrl, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });

    if (!res.ok) return null;

    const data = (await res.json()) as GreenhouseJob;
    const text = formatGreenhouseJob(data, company);
    return text.length >= 200 ? text : null;
  } catch {
    return null;
  }
}

export async function extractGreenhouse(url: string): Promise<string> {
  const parsed = parseGreenhouseUrl(url);

  // Attempt 1: public API
  if (parsed) {
    const apiText = await tryGreenhouseApi(parsed.company, parsed.jobId);
    if (apiText) return apiText;
  }

  // Attempt 2: HTML with JSON-LD (Greenhouse implements JobPosting schema)
  let html: string;
  try {
    html = await fetchHtml(url);
  } catch {
    throw new PlatformError(
      'greenhouse',
      'Não foi possível acessar a vaga Greenhouse. Cole o texto manualmente.'
    );
  }

  const jsonLd = extractJsonLdJobPosting(html);
  if (jsonLd && jsonLd.length >= 200) return jsonLd;

  const mainText = extractMainContentText(html);
  if (mainText && mainText.length >= 200) return mainText;

  throw new PlatformError(
    'greenhouse',
    'Não foi possível ler a vaga do Greenhouse. Abra a vaga e cole o texto aqui.'
  );
}
