import { PlatformError } from '../errors';
import {
  fetchHtml,
  extractNextDataText,
  extractMainContentText,
  stripHtml,
} from '../html-utils';

interface InhireJobData {
  title?: string;
  name?: string;
  description?: string;
  requirements?: string;
  benefits?: string;
  workplace?: string;
  city?: string;
  contract?: string;
  company?: { name?: string; fantasy_name?: string } | string;
  department?: { name?: string } | string;
}

function formatInhireJob(data: InhireJobData): string {
  const parts: string[] = [];

  const title = data.title ?? data.name;
  if (title) parts.push(`Vaga: ${title}`);

  const company =
    typeof data.company === 'object'
      ? (data.company?.fantasy_name ?? data.company?.name)
      : data.company;
  if (company) parts.push(`Empresa: ${company}`);

  if (data.city) parts.push(`Localização: ${data.city}`);
  if (data.workplace) parts.push(`Modelo: ${data.workplace}`);
  if (data.contract) parts.push(`Contrato: ${data.contract}`);

  if (data.description)
    parts.push(`Descrição:\n${stripHtml(data.description)}`);
  if (data.requirements)
    parts.push(`Requisitos:\n${stripHtml(data.requirements)}`);
  if (data.benefits)
    parts.push(`Benefícios:\n${stripHtml(data.benefits)}`);

  return parts.join('\n\n');
}

function extractInhireFromNextData(html: string): string | null {
  // Inhire uses Next.js SSR — priority keys for their data structure
  const text = extractNextDataText(html, [
    'job',
    'vacancy',
    'vaga',
    'opportunity',
    'position',
  ]);

  if (!text) return null;

  // Try to parse as structured InhireJobData if possible
  try {
    const nextDataMatch = html.match(
      /<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i
    );
    if (!nextDataMatch) return text;

    const nextData = JSON.parse(nextDataMatch[1]);
    const pageProps = nextData?.props?.pageProps;
    if (!pageProps) return text;

    const jobKeys = ['job', 'vacancy', 'vaga', 'opportunity', 'position'];
    for (const key of jobKeys) {
      const val = pageProps[key] as InhireJobData | undefined;
      if (val && typeof val === 'object') {
        const formatted = formatInhireJob(val);
        if (formatted.length >= 200) return formatted;
      }
    }
  } catch {
    // fall through to raw extracted text
  }

  return text;
}

export async function extractInhire(url: string): Promise<string> {
  let html: string;
  try {
    html = await fetchHtml(url);
  } catch {
    throw new PlatformError(
      'inhire',
      'Não foi possível acessar a vaga Inhire. Cole o texto manualmente.'
    );
  }

  // Attempt 1: __NEXT_DATA__ with Inhire-specific key mapping
  const nextText = extractInhireFromNextData(html);
  if (nextText && nextText.length >= 200) return nextText;

  // Attempt 2: main/article content
  const mainText = extractMainContentText(html);
  if (mainText && mainText.length >= 200) return mainText;

  throw new PlatformError(
    'inhire',
    'Não foi possível ler a vaga do Inhire automaticamente. Abra a vaga, clique em "Ver descrição completa" e cole o texto aqui.'
  );
}
