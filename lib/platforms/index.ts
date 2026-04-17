import type { Platform } from '@/types';
import { detectPlatform } from './detect';
import { PlatformError, PLATFORM_PASTE_INSTRUCTIONS, PLATFORM_DISPLAY_NAMES } from './errors';
import { extractGupy } from './extractors/gupy';
import { extractInhire } from './extractors/inhire';
import { extractGreenhouse } from './extractors/greenhouse';
import { extractLever } from './extractors/lever';
import { extractLinkedIn } from './extractors/linkedin';
import { extractBrazilianPlatform } from './extractors/brazilian';
import {
  fetchHtml,
  extractJsonLdJobPosting,
  extractNextDataText,
  extractMainContentText,
  stripHtml,
} from './html-utils';

export type { Platform };
export { detectPlatform, PlatformError, PLATFORM_PASTE_INSTRUCTIONS, PLATFORM_DISPLAY_NAMES };

export interface JobFetchResult {
  text: string;
  platform: Platform;
}

async function extractGeneric(url: string): Promise<string> {
  const html = await fetchHtml(url);

  const jsonLd = extractJsonLdJobPosting(html);
  if (jsonLd) return jsonLd;

  const nextData = extractNextDataText(html);
  if (nextData) return nextData;

  const mainContent = extractMainContentText(html);
  if (mainContent) return mainContent;

  const fullText = stripHtml(html);
  if (fullText.length < 200) {
    throw new Error(
      'Conteúdo insuficiente. O site pode bloquear acesso automático. Cole o texto da vaga manualmente.'
    );
  }
  return fullText.slice(0, 12000);
}

export async function fetchJobFromPlatform(
  url: string
): Promise<JobFetchResult> {
  const platform = detectPlatform(url);

  let text: string;

  switch (platform) {
    case 'gupy':
      text = await extractGupy(url);
      break;
    case 'inhire':
      text = await extractInhire(url);
      break;
    case 'greenhouse':
      text = await extractGreenhouse(url);
      break;
    case 'lever':
      text = await extractLever(url);
      break;
    case 'linkedin':
      text = await extractLinkedIn(url);
      break;
    case 'catho':
    case 'vagas_com':
    case 'infojobs':
    case 'kenoby':
      text = await extractBrazilianPlatform(url, platform);
      break;
    default:
      text = await extractGeneric(url);
  }

  return { text, platform };
}
