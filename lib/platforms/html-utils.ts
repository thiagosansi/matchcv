export function stripHtml(html: string): string {
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

export async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    },
    signal: AbortSignal.timeout(12000),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Falha ao buscar URL: ${response.status}`);
  }

  return response.text();
}

export function extractJsonLdJobPosting(html: string): string | null {
  const scriptRegex =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      const candidates = Array.isArray(data) ? data : [data];

      for (const item of candidates) {
        if (item?.['@type'] === 'JobPosting') {
          const parts: string[] = [];
          if (item.title) parts.push(`Vaga: ${item.title}`);
          if (item.hiringOrganization?.name)
            parts.push(`Empresa: ${item.hiringOrganization.name}`);
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
          if (item.jobLocation)
            parts.push(`Localização: ${JSON.stringify(item.jobLocation)}`);

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
    const clean = obj
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (
      clean.length < 30 ||
      clean.startsWith('http') ||
      clean.startsWith('data:') ||
      /^[a-zA-Z0-9_-]{40,}$/.test(clean)
    )
      return '';
    return clean;
  }
  if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
  if (Array.isArray(obj)) {
    return obj
      .map((item) => flattenToText(item, depth + 1))
      .filter(Boolean)
      .join('\n');
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

export function extractNextDataText(
  html: string,
  priorityKeys: string[] = []
): string | null {
  const match = html.match(
    /<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i
  );
  if (!match) return null;

  try {
    const nextData = JSON.parse(match[1]);
    const pageProps = nextData?.props?.pageProps;
    if (!pageProps || typeof pageProps !== 'object') return null;

    const jobKeys = [
      ...priorityKeys,
      'job',
      'vacancy',
      'position',
      'vaga',
      'jobPosting',
      'posting',
      'opportunity',
      'role',
    ];

    for (const key of jobKeys) {
      const val = (pageProps as Record<string, unknown>)[key];
      if (val && typeof val === 'object') {
        const text = flattenToText(val);
        if (text.length >= 200) return text.slice(0, 12000);
      }
    }

    const text = flattenToText(pageProps);
    if (text.length >= 200) return text.slice(0, 12000);
  } catch {
    // invalid JSON, skip
  }

  return null;
}

export function extractMainContentText(html: string): string | null {
  const areaRegex =
    /<(?:main|article)[^>]*>([\s\S]*?)<\/(?:main|article)>/gi;
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

export function extractMetaTags(html: string): string | null {
  const parts: string[] = [];

  const titleMatch = html.match(
    /<meta[^>]*(?:property=["']og:title["']|name=["']title["'])[^>]*content=["']([^"']+)["']/i
  );
  if (titleMatch) parts.push(`Vaga: ${titleMatch[1]}`);

  const descMatch = html.match(
    /<meta[^>]*(?:property=["']og:description["']|name=["']description["'])[^>]*content=["']([^"']+)["']/i
  );
  if (descMatch) parts.push(`Descrição: ${descMatch[1]}`);

  const siteName = html.match(
    /<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i
  );
  if (siteName) parts.push(`Empresa/Plataforma: ${siteName[1]}`);

  if (parts.length === 0) return null;
  const text = parts.join('\n');
  return text.length >= 100 ? text : null;
}

export function extractBySelectorHeuristic(
  html: string,
  classPatterns: RegExp[]
): string | null {
  for (const pattern of classPatterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      const text = stripHtml(match[1]);
      if (text.length > 200) return text.slice(0, 12000);
    }
  }
  return null;
}
