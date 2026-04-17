import type { Platform } from '@/types';
import { PlatformError } from '../errors';
import {
  fetchHtml,
  extractJsonLdJobPosting,
  extractMainContentText,
  extractBySelectorHeuristic,
  stripHtml,
} from '../html-utils';

// CSS class/id patterns to target the job description section per platform.
// Using regex against raw HTML because we don't have a DOM parser server-side.
const PLATFORM_PATTERNS: Record<string, RegExp[]> = {
  catho: [
    /class="[^"]*job-description[^"]*"[^>]*>([\s\S]*?)<\/(?:div|section)/i,
    /data-testid="job-description"[^>]*>([\s\S]*?)<\/(?:div|section)/i,
  ],
  vagas_com: [
    /class="[^"]*job-description-content[^"]*"[^>]*>([\s\S]*?)<\/(?:div|section)/i,
    /id="job-description"[^>]*>([\s\S]*?)<\/(?:div|section)/i,
  ],
  infojobs: [
    /class="[^"]*offer-description[^"]*"[^>]*>([\s\S]*?)<\/(?:div|section)/i,
    /class="[^"]*job-description[^"]*"[^>]*>([\s\S]*?)<\/(?:div|section)/i,
  ],
  kenoby: [
    /class="[^"]*job-content[^"]*"[^>]*>([\s\S]*?)<\/(?:div|section)/i,
    /class="[^"]*job-body[^"]*"[^>]*>([\s\S]*?)<\/(?:div|section)/i,
  ],
};

export async function extractBrazilianPlatform(
  url: string,
  platform: Platform
): Promise<string> {
  let html: string;
  try {
    html = await fetchHtml(url);
  } catch {
    throw new PlatformError(
      platform,
      `Não foi possível acessar a vaga. Cole o texto manualmente.`
    );
  }

  // Attempt 1: JSON-LD (some platforms implement schema.org)
  const jsonLd = extractJsonLdJobPosting(html);
  if (jsonLd && jsonLd.length >= 200) return jsonLd;

  // Attempt 2: platform-specific CSS selectors
  const patterns = PLATFORM_PATTERNS[platform] ?? [];
  const selectorText = extractBySelectorHeuristic(html, patterns);
  if (selectorText && selectorText.length >= 200) return selectorText;

  // Attempt 3: main/article content
  const mainText = extractMainContentText(html);
  if (mainText && mainText.length >= 200) return mainText;

  // Attempt 4: full HTML strip as last resort
  const fullText = stripHtml(html);
  if (fullText.length >= 200) return fullText.slice(0, 12000);

  throw new PlatformError(
    platform,
    'Não foi possível extrair o conteúdo da vaga. Cole o texto manualmente.'
  );
}
