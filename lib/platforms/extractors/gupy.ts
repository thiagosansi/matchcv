import { PlatformError } from '../errors';
import {
  fetchHtml,
  extractMetaTags,
  extractMainContentText,
  stripHtml,
} from '../html-utils';

interface GupyJobData {
  name?: string;
  description?: string;
  responsibilities?: string;
  requirements?: string;
  desirable?: string;
  benefits?: string;
  jobType?: string;
  workplace?: string;
  city?: string;
  state?: string;
  careerPage?: { name?: string };
}

function formatGupyJob(data: GupyJobData): string {
  const parts: string[] = [];

  if (data.name) parts.push(`Vaga: ${data.name}`);
  if (data.careerPage?.name) parts.push(`Empresa: ${data.careerPage.name}`);

  const location = [data.city, data.state].filter(Boolean).join(', ');
  if (location) parts.push(`Localização: ${location}`);
  if (data.workplace) parts.push(`Modelo: ${data.workplace}`);
  if (data.jobType) parts.push(`Tipo: ${data.jobType}`);

  if (data.description)
    parts.push(`Descrição:\n${stripHtml(data.description)}`);
  if (data.responsibilities)
    parts.push(`Responsabilidades:\n${stripHtml(data.responsibilities)}`);
  if (data.requirements)
    parts.push(`Requisitos:\n${stripHtml(data.requirements)}`);
  if (data.desirable)
    parts.push(`Diferenciais:\n${stripHtml(data.desirable)}`);
  if (data.benefits)
    parts.push(`Benefícios:\n${stripHtml(data.benefits)}`);

  return parts.join('\n\n');
}

function parseGupyUrl(
  url: string
): { subdomain: string; jobId: string } | null {
  // https://company.gupy.io/jobs/12345 (with or without query string)
  const companyMatch = url.match(
    /https?:\/\/([^.]+)\.gupy\.io\/jobs\/(\d+)/
  );
  if (companyMatch) {
    return { subdomain: companyMatch[1], jobId: companyMatch[2] };
  }

  // https://portal.gupy.io/job-offer/12345
  const portalMatch = url.match(
    /portal\.gupy\.io\/job-offer\/(\d+)/
  );
  if (portalMatch) {
    return { subdomain: 'portal', jobId: portalMatch[1] };
  }

  return null;
}

async function tryGupyApi(
  subdomain: string,
  jobId: string
): Promise<string | null> {
  if (subdomain === 'portal') return null;

  try {
    const apiUrl = `https://${subdomain}.gupy.io/api/job/${jobId}`;
    const res = await fetch(apiUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });

    if (!res.ok) return null;

    const data = (await res.json()) as GupyJobData;
    const text = formatGupyJob(data);
    return text.length >= 200 ? text : null;
  } catch {
    return null;
  }
}

export async function extractGupy(url: string): Promise<string> {
  const parsed = parseGupyUrl(url);

  // Attempt 1: Gupy public API (company subdomains)
  if (parsed) {
    const apiText = await tryGupyApi(parsed.subdomain, parsed.jobId);
    if (apiText) return apiText;
  }

  // Attempt 2: fetch HTML and try meta tags (Gupy injects og: tags even as SPA)
  let html: string;
  try {
    html = await fetchHtml(url);
  } catch {
    throw new PlatformError(
      'gupy',
      'Não foi possível acessar a vaga Gupy. Cole o texto manualmente.'
    );
  }

  const metaText = extractMetaTags(html);
  if (metaText && metaText.length >= 150) return metaText;

  // Attempt 3: main/article content (unlikely for SPA but worth trying)
  const mainText = extractMainContentText(html);
  if (mainText && mainText.length >= 200) return mainText;

  // Gupy is a React SPA — dynamic content not available via fetch
  throw new PlatformError(
    'gupy',
    'A vaga Gupy não pôde ser lida automaticamente. Abra a vaga, role até a descrição completa aparecer e cole o texto aqui.'
  );
}
