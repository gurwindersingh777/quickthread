import { env } from "../../config/env.js";

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

type GroqResponse = {
  choices: { message: { content: string | null } }[];
  usage?: { total_tokens?: number };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Calls Groq in JSON mode. Retries on rate limits and server errors. */
export async function groqJson(messages: ChatMessage[], maxAttempts = 4) {
  if (!env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set');
  }

  for (let attempt = 1; ; attempt++) {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: env.GROQ_MODEL,
        messages,
        temperature: 0.1,
        max_completion_tokens: 800,
        response_format: { type: 'json_object' },
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as GroqResponse;
      return {
        content: data.choices[0]?.message.content ?? '',
        tokens: data.usage?.total_tokens ?? 0,
      };
    }

    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt >= maxAttempts) {
      const detail = await res.text().catch(() => '');
      throw new Error(`Groq request failed (${res.status}): ${detail.slice(0, 300)}`);
    }

    // Respect the server's retry-after hint, otherwise back off exponentially
    const retryAfter = Number(res.headers.get('retry-after'));
    const waitMs = retryAfter > 0 ? retryAfter * 1000 : 1000 * 2 ** attempt;
    await sleep(Math.min(waitMs, 20_000));
  }
}