import { PlatformError } from '../errors';
import { fetchHtml, extractJsonLdJobPosting } from '../html-utils';

export async function extractLinkedIn(url: string): Promise<string> {
  // LinkedIn blocks scrapers aggressively, but try once for public pages
  try {
    const html = await fetchHtml(url);
    const jsonLd = extractJsonLdJobPosting(html);
    if (jsonLd && jsonLd.length >= 300) return jsonLd;
  } catch {
    // silencioso — expected to fail
  }

  // LinkedIn consistently blocks automated access
  throw new PlatformError(
    'linkedin',
    'O LinkedIn bloqueia leitura automática de vagas. Abra a vaga, clique em "Ver mais" para expandir a descrição completa e cole o texto aqui.'
  );
}
