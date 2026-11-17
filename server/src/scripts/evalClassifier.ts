import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { env } from '../config/env.js';
import { SAMPLE_THREADS } from '../data/sampleThreads.js';
import { DEMO_ACCOUNTS } from '../demo.js';
import { mapLimit } from '../lib/pool.js';
import { EmailAccount } from '../models/EmailAccount.js';
import { Thread } from '../models/Thread.js';
import { User } from '../models/User.js';
import { classifyConversation } from '../services/ai/classify.js';
import { CONFIDENCE_THRESHOLD } from '../services/segments.js';

const CONCURRENCY = 2;
const pad = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s.padEnd(n));

async function main() {
  await connectDB();

  const alice = await User.findOne({ email: DEMO_ACCOUNTS.assistant.email });
  if (!alice) throw new Error('Run "npm run seed:users" first');

  const accounts = await EmailAccount.find({ ownerId: alice._id });
  if (accounts.length === 0) throw new Error('Alice has no connected account');
  const account = accounts[0];

  const allThreads = await Thread.find({
    ownerId: alice._id,
    accountId: { $in: accounts.map((a) => a._id) },
  }).sort({ lastMessageAt: -1 });

  const filter = process.argv[2]?.toLowerCase();
  const threads = filter
    ? allThreads.filter((t) => t.subject.toLowerCase().includes(filter))
    : allThreads;

  const expected = new Map(SAMPLE_THREADS.map((t) => [t.subject, t.expected]));

  console.log(
    `Model: ${env.GROQ_MODEL} (reasoning: ${env.GROQ_REASONING_EFFORT}) | threads: ${threads.length} | concurrency: ${CONCURRENCY}\n`,
  );

  const started = Date.now();
  const results = await mapLimit(threads, CONCURRENCY, async (t) => {
    try {
      const out = await classifyConversation({
        subject: t.subject,
        clientName: account.displayName || 'the client',
        assistantName: alice.name || 'the assistant',
        mailbox: account.address,
        contactEmail: t.participants[0]?.email ?? '',
        now: new Date(),
        messages: t.messages.map((m) => ({
          direction: m.direction as 'incoming' | 'outgoing',
          fromName: m.fromName,
          sentAt: m.sentAt,
          body: m.body,
        })),
      });
      process.stdout.write('.');
      return { subject: t.subject, ok: true as const, ...out };
    } catch (err) {
      return {
        subject: t.subject,
        ok: false as const,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  });
  const seconds = ((Date.now() - started) / 1000).toFixed(1);

  console.log(`${pad('Subject', 44)} ${pad('Expected', 9)} ${pad('Got', 9)} Conf  Flags / Result`);
  console.log('-'.repeat(100));

  let correct = 0;
  let scored = 0;
  let totalTokens = 0;
  const failures: string[] = [];

  for (const r of results) {
    if (!r.ok) {
      console.log(`${pad(r.subject, 44)} ERROR: ${r.error}`);
      continue;
    }

    const c = r.classification;
    const want = expected.get(r.subject);
    totalTokens += r.tokens;

    const flagged = c.confidence < CONFIDENCE_THRESHOLD;
    let ok: boolean | null = null;
    if (want === 'review') ok = flagged;
    else if (want) ok = c.responsibility === want;

    if (ok !== null) {
      scored++;
      if (ok) correct++;
    }

    const mark = ok === null ? '-' : ok ? 'ok' : 'MISS';
    const flags = c.uncertainty.length ? ` [${c.uncertainty.join(', ')}]` : '';
    const review = flagged ? ' -> NEEDS REVIEW' : '';
    console.log(
      `${pad(r.subject, 44)} ${pad(want ?? '?', 9)} ${pad(c.responsibility, 9)} ${c.confidence.toFixed(2)}  ${mark}${review}${flags}`,
    );
    if (ok === false) failures.push(`${r.subject}\n    -> ${c.reason}`);
  }

  console.log('-'.repeat(100));
  console.log(`Correct: ${correct}/${scored} (${Math.round((correct / Math.max(scored, 1)) * 100)}%)`);
  console.log(`Tokens: ${totalTokens} | Total time: ${seconds}s`);

  if (failures.length > 0) {
    console.log("\nMisses (the model's reason):");
    for (const f of failures) console.log(` - ${f}`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});