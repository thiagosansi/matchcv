const GROQ_BASE_URL =
  process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1/chat/completions';

const MODELS = {
  fast: process.env.GROQ_FAST_MODEL || 'llama-3.1-8b-instant',
  quality: process.env.GROQ_QUALITY_MODEL || 'llama-3.3-70b-versatile',
} as const;

export type AIModelPreset = keyof typeof MODELS;

// ---------------------------------------------------------------------------
// Key pool — supports multiple keys to distribute rate-limit quota
//
// Configure in .env.local using any combination:
//   GROQ_API_KEY=gsk_...          (single key, always loaded)
//   GROQ_API_KEY_2=gsk_...        (additional keys, numbered 2–20)
//   GROQ_API_KEYS=gsk_1,gsk_2     (comma-separated list, merged with above)
// ---------------------------------------------------------------------------
function buildKeyPool(): string[] {
  const seen = new Set<string>();
  const pool: string[] = [];

  const add = (key: string | undefined) => {
    const k = key?.trim();
    if (k && !seen.has(k)) {
      seen.add(k);
      pool.push(k);
    }
  };

  // GROQ_API_KEYS=k1,k2,k3
  const multi = process.env.GROQ_API_KEYS;
  if (multi) {
    for (const k of multi.split(',')) add(k);
  }

  // GROQ_API_KEY (original single-key var)
  add(process.env.GROQ_API_KEY);

  // GROQ_API_KEY_2 … GROQ_API_KEY_20
  for (let i = 2; i <= 20; i++) {
    add(process.env[`GROQ_API_KEY_${i}`]);
  }

  return pool;
}

const KEY_POOL = buildKeyPool();

// In-memory cooldown tracker: key → timestamp when it becomes usable again
const keyCooldowns = new Map<string, number>();

function pickAvailableKey(skipKey?: string): string | null {
  const now = Date.now();

  // Try to find a key that is not cooling down (and optionally skip one)
  for (const key of KEY_POOL) {
    if (key === skipKey) continue;
    if ((keyCooldowns.get(key) ?? 0) <= now) return key;
  }

  // All keys cooling down — return the one whose cooldown expires soonest
  let soonest: string | null = null;
  let soonestExpiry = Infinity;
  for (const key of KEY_POOL) {
    if (key === skipKey) continue;
    const expiry = keyCooldowns.get(key) ?? 0;
    if (expiry < soonestExpiry) {
      soonestExpiry = expiry;
      soonest = key;
    }
  }
  return soonest;
}

function markKeyCoolingDown(key: string, ms = 65_000) {
  keyCooldowns.set(key, Date.now() + ms);
}

// ---------------------------------------------------------------------------

type CallAIOptions = {
  model?: string;
  preset?: AIModelPreset;
  fallbackPreset?: AIModelPreset;
  temperature?: number;
  requireJson?: boolean;
  timeoutMs?: number;
  maxTokens?: number;
};

type GroqMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type GroqChoice = {
  message?: {
    content?: string;
  };
};

type GroqErrorPayload = {
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
};

type GroqResponse = {
  choices?: GroqChoice[];
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
};

function resolveModel(options: CallAIOptions): string {
  if (options.model) return options.model;
  if (options.preset) return MODELS[options.preset];
  return MODELS.fast;
}

function buildRequestBody(
  messages: GroqMessage[],
  options: Required<
    Pick<CallAIOptions, 'temperature' | 'requireJson' | 'maxTokens'>
  > & { model: string }
) {
  const body: Record<string, unknown> = {
    model: options.model,
    messages,
    temperature: options.temperature,
  };

  if (options.requireJson) {
    body.response_format = { type: 'json_object' };
  }

  if (options.maxTokens && options.maxTokens > 0) {
    body.max_tokens = options.maxTokens;
  }

  return body;
}

function isRequestTooLargeError(status: number): boolean {
  return status === 413;
}

function isRateLimitError(status: number, message: string): boolean {
  // 413 means the payload itself is too large — NOT a transient rate limit.
  // Retrying (even with another key) won't help; the caller must reduce input.
  if (isRequestTooLargeError(status)) return false;
  const normalized = message.toLowerCase();
  return (
    status === 429 ||
    normalized.includes('rate limit') ||
    normalized.includes('tokens per minute') ||
    normalized.includes('requests per minute')
  );
}

function isRetryableGroqError(status: number, message: string): boolean {
  if (isRateLimitError(status, message)) return true;
  const normalized = message.toLowerCase();
  return (
    status === 503 ||
    normalized.includes('capacity') ||
    normalized.includes('overloaded')
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function makeGroqRequest(
  messages: GroqMessage[],
  options: Required<CallAIOptions> & { model: string },
  apiKey: string
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    const response = await fetch(GROQ_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(
        buildRequestBody(messages, {
          model: options.model,
          temperature: options.temperature,
          requireJson: options.requireJson,
          maxTokens: options.maxTokens,
        })
      ),
      signal: controller.signal,
    });

    const rawText = await response.text();

    if (!response.ok) {
      let parsedError: GroqErrorPayload | null = null;

      try {
        parsedError = JSON.parse(rawText) as GroqErrorPayload;
      } catch {
        parsedError = null;
      }

      const message =
        parsedError?.error?.message ||
        rawText ||
        `Groq API error: ${response.status}`;

      const error = new Error(`Groq API error (${response.status}): ${message}`) as Error & {
        status?: number;
        retryable?: boolean;
        isRateLimit?: boolean;
      };

      error.status = response.status;
      error.isRateLimit = isRateLimitError(response.status, message);
      error.retryable = isRetryableGroqError(response.status, message);

      throw error;
    }

    let data: GroqResponse;
    try {
      data = JSON.parse(rawText) as GroqResponse;
    } catch {
      throw new Error('Groq retornou uma resposta JSON inválida');
    }

    const content = data?.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error('Groq retornou uma resposta vazia');
    }

    if (options.requireJson) {
      try {
        JSON.parse(content);
      } catch {
        throw new Error('Groq não retornou um JSON válido no conteúdo');
      }
    }

    return content;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Tempo limite excedido ao consultar a IA');
    }

    throw error instanceof Error
      ? error
      : new Error('Erro inesperado ao consultar a IA');
  } finally {
    clearTimeout(timeout);
  }
}

// Attempts the request cycling through all available keys on rate-limit errors.
// Falls back to exponential backoff only when every key is exhausted.
async function makeGroqRequestWithRetry(
  messages: GroqMessage[],
  options: Required<CallAIOptions> & { model: string },
  maxAttempts = 4
): Promise<string> {
  let lastError: Error = new Error('Unknown error');
  let lastUsedKey: string | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // On rate-limit, skip the key that just failed and pick a fresh one
    const key = pickAvailableKey(
      lastError && (lastError as Error & { isRateLimit?: boolean }).isRateLimit
        ? lastUsedKey
        : undefined
    );

    if (!key) {
      throw new Error('Todas as API keys da Groq estão sem quota no momento. Tente novamente em instantes.');
    }

    // If the chosen key is still cooling down, wait it out
    const cooldownRemaining = (keyCooldowns.get(key) ?? 0) - Date.now();
    if (cooldownRemaining > 0) {
      await sleep(cooldownRemaining + 200);
    }

    lastUsedKey = key;

    try {
      return await makeGroqRequest(messages, options, key);
    } catch (error) {
      const err = error as Error & { retryable?: boolean; isRateLimit?: boolean };
      lastError = err;

      if (err.isRateLimit) {
        // Mark key as cooling down and immediately try the next one — no sleep
        markKeyCoolingDown(key);
        continue;
      }

      if (!err.retryable || attempt === maxAttempts - 1) {
        throw err;
      }

      // Non-rate-limit retryable error (503, overloaded): exponential backoff
      const baseDelay = Math.pow(2, attempt) * 1000;
      const jitter = Math.random() * 500;
      await sleep(baseDelay + jitter);
    }
  }

  throw lastError;
}

export async function callOpenAI(
  systemPrompt: string,
  userPrompt: string,
  options: CallAIOptions = {}
): Promise<string> {
  if (KEY_POOL.length === 0) {
    throw new Error('GROQ_API_KEY not configured');
  }

  const primaryModel = resolveModel(options);
  const fallbackModel = options.fallbackPreset
    ? MODELS[options.fallbackPreset]
    : primaryModel === MODELS.quality
      ? MODELS.fast
      : primaryModel;

  const resolvedOptions: Required<CallAIOptions> = {
    model: options.model || '',
    preset: options.preset || 'fast',
    fallbackPreset: options.fallbackPreset || 'fast',
    temperature: options.temperature ?? 0.2,
    requireJson: options.requireJson ?? true,
    timeoutMs: options.timeoutMs ?? 30000,
    maxTokens: options.maxTokens ?? 1800,
  };

  const messages: GroqMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: resolvedOptions.requireJson
        ? `${userPrompt}\n\nResponda apenas com json válido.`
        : userPrompt,
    },
  ];

  try {
    return await makeGroqRequestWithRetry(messages, {
      ...resolvedOptions,
      model: primaryModel,
    });
  } catch (error) {
    const maybeRetryable = error as Error & { retryable?: boolean };

    if (fallbackModel !== primaryModel && maybeRetryable?.retryable) {
      return await makeGroqRequestWithRetry(messages, {
        ...resolvedOptions,
        model: fallbackModel,
      });
    }

    throw error;
  }
}

export const AI_MODELS = MODELS;
