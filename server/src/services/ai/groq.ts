import { env } from "../../config/env.js";

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const WINDOW_MS = 60_000;
const REQUEST_TIMEOUT_MS = 45_000;

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

type GroqResponse = {
  choices: { message: { content: string | null } }[];
  usage?: { total_tokens?: number };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ---- Token budget: stay under the provider's tokens-per-minute limit ----
type Usage = { at: number; tokens: number };
const recent: Usage[] = [];
let gate: Promise<void> = Promise.resolve();

/** Waits until `estimate` tokens fit into the last-60-seconds budget, then reserves them. */
async function reserve(estimate: number): Promise<Usage> {
  // Callers queue up one at a time so they cannot overspend together
  const previous = gate;
  let release!: () => void;
  gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await previous;

  try {
    for (;;) {
      const now = Date.now();
      while (recent.length > 0 && now - recent[0].at > WINDOW_MS) recent.shift();

      const used = recent.reduce((sum, u) => sum + u.tokens, 0);
      if (recent.length === 0 || used + estimate <= env.GROQ_TPM_BUDGET) break;

      await sleep(Math.max(recent[0].at + WINDOW_MS - now + 50, 200));
    }

    const entry: Usage = { at: Date.now(), tokens: estimate };
    recent.push(entry);
    return entry;
  } finally {
    release();
  }
}

function describeError(err: unknown) {
  const cause = (err as { cause?: { code?: string; message?: string } } | null)?.cause;
  return cause?.code ?? cause?.message ?? (err instanceof Error ? err.message : String(err));
}

/** Calls Groq in JSON mode. Respects the token budget and retries transient failures. */
export async function groqJson(messages: ChatMessage[], maxAttempts = 4) {
  if (!env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set');
  }

  // Rough estimate: characters / 3.5 for the prompt plus room for the reply
  const estimate = Math.ceil(JSON.stringify(messages).length / 3.5) + 400;

  for (let attempt = 1; ; attempt++) {
    const usage = await reserve(estimate);

    let res: Response;
    try {
      res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: env.GROQ_MODEL,
          messages,
          temperature: 0,
          max_completion_tokens: 600,
          response_format: { type: 'json_object' },
          // Only the gpt-oss reasoning models accept this setting
          ...(env.GROQ_MODEL.startsWith('openai/gpt-oss')
            ? { reasoning_effort: env.GROQ_REASONING_EFFORT }
            : {}),
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (err) {
      // Network failure or timeout
      if (attempt >= maxAttempts) {
        throw new Error(`Could not reach Groq (${describeError(err)})`);
      }
      await sleep(Math.min(1000 * 2 ** attempt, 10_000));
      continue;
    }

    if (res.ok) {
      const data = (await res.json()) as GroqResponse;
      usage.tokens = data.usage?.total_tokens ?? estimate;
      return { content: data.choices[0]?.message.content ?? '', tokens: usage.tokens };
    }

    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt >= maxAttempts) {
      const detail = await res.text().catch(() => '');
      throw new Error(`Groq request failed (${res.status}): ${detail.slice(0, 300)}`);
    }

    const retryAfter = Number(res.headers.get('retry-after'));
    const waitMs = retryAfter > 0 ? retryAfter * 1000 : 1000 * 2 ** attempt;
    await sleep(Math.min(waitMs, 20_000));
  }
}