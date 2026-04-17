import { PlatformError } from '../errors';
import { fetchHtml, extractMainContentText, stripHtml } from '../html-utils';

interface LeverPosting {
  text?: string;
  descriptionPlain?: string;
  description?: string;
  categories?: {
    commitment?: string;
    location?: string;
    team?: string;
    department?: string;
  };
  lists?: Array<{ text?: string; content?: string }>;
}

function formatLeverJob(data: LeverPosting, company: string): string {
  const parts: string[] = [];

  if (data.text) parts.push(`Vaga: ${data.text}`);
  if (company) parts.push(`Empresa: ${company}`);

  const location = data.categories?.location;
  if (location) parts.push(`Localização: ${location}`);

  const team = data.categories?.team ?? data.categories?.department;
  if (team) parts.push(`Área: ${team}`);

  const commitment = data.categories?.commitment;
  if (commitment) parts.push(`Tipo: ${commitment}`);

  const description =
    data.descriptionPlain ??
    (data.description ? stripHtml(data.description) : null);
  if (description) parts.push(`Descrição:\n${description}`);

  if (data.lists?.length) {
    for (const list of data.lists) {
      if (list.text && list.content) {
        parts.push(`${list.text}:\n${stripHtml(list.content)}`);
      }
    }
  }

  return parts.join('\n\n');
}

function parseLeverUrl(
  url: string
): { company: string; postingId: string } | null {
  const match = url.match(
    /jobs\.lever\.co\/([^/]+)\/([a-f0-9-]{36})/
  );
  if (!match) return null;
  return { company: match[1], postingId: match[2] };
}

async function tryLeverApi(
  company: string,
  postingId: string
): Promise<string | null> {
  try {
    const apiUrl = `https://api.lever.co/v0/postings/${company}/${postingId}`;
    const res = await fetch(apiUrl, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });

    if (!res.ok) return null;

    const data = (await res.json()) as LeverPosting;
    const text = formatLeverJob(data, company);
    return text.length >= 200 ? text : null;
  } catch {
    return null;
  }
}

export async function extractLever(url: string): Promise<string> {
  const parsed = parseLeverUrl(url);

  // Attempt 1: public API
  if (parsed) {
    const apiText = await tryLeverApi(parsed.company, parsed.postingId);
    if (apiText) return apiText;
  }

  // Attempt 2: HTML fallback
  let html: string;
  try {
    html = await fetchHtml(url);
  } catch {
    throw new PlatformError(
      'lever',
      'Não foi possível acessar a vaga Lever. Cole o texto manualmente.'
    );
  }

  const mainText = extractMainContentText(html);
  if (mainText && mainText.length >= 200) return mainText;

  throw new PlatformError(
    'lever',
    'Não foi possível ler a vaga do Lever. Abra a vaga e cole o texto aqui.'
  );
}
