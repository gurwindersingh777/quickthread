import { createHash } from 'node:crypto';
import { AiCache } from '../models/AiCache.js';
import { EmailAccount } from '../models/EmailAccount.js';
import { Thread } from '../models/Thread.js';
import { User } from '../models/User.js';
import { classifyConversation, PROMPT_VERSION, type ClassifyInput } from './ai/classify.js';
import type { Classification } from './ai/schema.js';
import { env } from '../config/env.js';

const CONCURRENCY = 2;

// ---------------- Cache ----------------

type CachedClassification = Omit<Classification, 'extractedDates'> & {
  extractedDates: { label: string; date: string; kind: 'meeting' | 'deadline' | 'other' }[];
};

// Timestamps are left out on purpose: the same emails imported again hit the cache.
// The day is included because extracted dates depend on "today".
function cacheKey(input: ClassifyInput) {
  const payload = JSON.stringify({
    v: PROMPT_VERSION,
    model: env.GROQ_MODEL,
    day: input.now.toISOString().slice(0, 10),
    subject: input.subject,
    contact: input.contactEmail,
    client: input.clientName,
    assistant: input.assistantName,
    messages: input.messages.map((m) => [m.direction, m.fromName, m.body]),
  });
  return createHash('sha256').update(payload).digest('hex');
}

async function classifyWithCache(input: ClassifyInput, force: boolean) {
  const key = cacheKey(input);

  if (!force) {
    const hit = await AiCache.findOne({ key });
    if (hit) {
      const c = JSON.parse(hit.result) as CachedClassification;
      const classification: Classification = {
        ...c,
        extractedDates: c.extractedDates.map((d) => ({ ...d, date: new Date(d.date) })),
      };
      return { classification, cached: true };
    }
  }

  const { classification } = await classifyConversation(input);
  await AiCache.updateOne(
    { key },
    { $set: { result: JSON.stringify(classification), createdAt: new Date() } },
    { upsert: true },
  )
    .exec()
    .catch(() => undefined);

  return { classification, cached: false };
}

// ---------------- Analyzing one conversation ----------------

async function processThread(id: string, force: boolean) {
  const thread = await Thread.findById(id);
  if (!thread) return;

  try {
    const [account, owner] = await Promise.all([
      EmailAccount.findById(thread.accountId),
      User.findById(thread.ownerId),
    ]);
    if (!account || !owner) throw new Error('The connected account no longer exists');

    const { classification: c, cached } = await classifyWithCache(
      {
        subject: thread.subject,
        clientName: account.displayName || 'the client',
        assistantName: owner.name || 'the assistant',
        mailbox: account.address,
        contactEmail: thread.participants[0]?.email ?? '',
        now: new Date(),
        messages: thread.messages.map((m) => ({
          direction: m.direction as 'incoming' | 'outgoing',
          fromName: m.fromName,
          sentAt: m.sentAt,
          body: m.body,
        })),
      },
      force,
    );

    thread.set('ai', {
      responsibility: c.responsibility,
      confidence: c.confidence,
      uncertainty: c.uncertainty,
      reason: c.reason,
      summary: c.summary,
      category: c.category,
      actionRequired: c.actionRequired,
      waitingForReply: c.waitingForReply,
      extractedDates: c.extractedDates,
      classifiedAt: new Date(),
      classifiedMessageCount: thread.messages.length,
      model: env.GROQ_MODEL,
    });
    thread.analysis = { status: 'done', updatedAt: new Date() };

    console.log(
      `[analysis] ${thread.subject} -> ${c.responsibility} ${c.confidence.toFixed(2)}${cached ? ' (cached)' : ''}`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[analysis] failed for "${thread.subject}": ${message}`);
    thread.analysis = { status: 'failed', error: message.slice(0, 300), updatedAt: new Date() };
  }

  await thread.save();
}

// ---------------- Background queue ----------------

type Job = { id: string; force: boolean };

const waiting: Job[] = [];
const inQueue = new Set<string>();
const active = new Set<string>();
const rerun = new Map<string, boolean>();
let idleWaiters: (() => void)[] = [];

function notifyIfIdle() {
  if (active.size === 0 && waiting.length === 0) {
    for (const resolve of idleWaiters.splice(0)) resolve();
  }
}

function pump() {
  while (active.size < CONCURRENCY && waiting.length > 0) {
    const job = waiting.shift() as Job;
    inQueue.delete(job.id);
    active.add(job.id);

    processThread(job.id, job.force)
      .catch((err) => console.error('[analysis] crashed', err))
      .finally(() => {
        active.delete(job.id);
        const again = rerun.get(job.id);
        if (again !== undefined) {
          // A new message arrived while we were analyzing: go again
          rerun.delete(job.id);
          enqueueAnalysis([job.id], { force: again });
        } else {
          pump();
        }
        notifyIfIdle();
      });
  }
}

export function enqueueAnalysis(ids: string[], options: { force?: boolean } = {}) {
  const force = options.force ?? false;

  for (const id of ids) {
    if (active.has(id)) {
      rerun.set(id, force);
    } else if (!inQueue.has(id)) {
      inQueue.add(id);
      waiting.push({ id, force });
    }
  }
  pump();
}

/** Resolves when nothing is queued or running. Used by scripts that must not exit early. */
export function waitForIdle() {
  if (active.size === 0 && waiting.length === 0) return Promise.resolve();
  return new Promise<void>((resolve) => idleWaiters.push(resolve));
}

/** Picks up work that was pending when the server last stopped. */
export async function resumePendingAnalyses() {
  const pending = await Thread.find({ 'analysis.status': 'pending' }).select('_id');
  if (pending.length > 0) {
    console.log(`[analysis] resuming ${pending.length} pending conversations`);
    enqueueAnalysis(pending.map((t) => t.id as string));
  }
}