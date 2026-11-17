import mongoose from 'mongoose';
import { SAMPLE_THREADS } from '../data/sampleThreads.js';
import { DEMO_ACCOUNTS } from '../demo.js';
import { EmailAccount } from '../models/EmailAccount.js';
import { Thread } from '../models/Thread.js';
import { User } from '../models/User.js';
import { classifyConversation } from '../services/ai/classify.js';
import { CONFIDENCE_THRESHOLD } from '../services/segments.js';
import { connectDB } from '../config/db.js';

const pad = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s.padEnd(n));

async function main() {
  await connectDB();

  const alice = await User.findOne({ email: DEMO_ACCOUNTS.assistant.email });
  if (!alice) throw new Error('Run "npm run seed:users" first');

  const accounts = await EmailAccount.find({ ownerId: alice._id });
  if (accounts.length === 0) throw new Error('Alice has no connected account');

  const threads = await Thread.find({
    ownerId: alice._id,
    accountId: { $in: accounts.map((a) => a._id) },
  }).sort({ lastMessageAt: -1 });

  const expected = new Map(SAMPLE_THREADS.map((t) => [t.subject, t.expected]));
  const account = accounts[0];

  console.log(`Model: ${process.env.GROQ_MODEL ?? 'default'} | threads: ${threads.length}\n`);
  console.log(`${pad('Subject', 46)} ${pad('Expected', 9)} ${pad('Got', 9)} Conf  Result`);
  console.log('-'.repeat(84));

  let correct = 0;
  let scored = 0;
  let totalTokens = 0;
  const failures: string[] = [];
  const started = Date.now();

  for (const t of threads) {
    const want = expected.get(t.subject);

    try {
      const { classification: c, tokens } = await classifyConversation({
        subject: t.subject,
        clientName: account.displayName || 'the client',
        assistantName: alice.name || 'the assistant',
        mailbox: account.address,
        now: new Date(),
        messages: t.messages.map((m) => ({
          direction: m.direction as 'incoming' | 'outgoing',
          fromName: m.fromName,
          sentAt: m.sentAt,
          body: m.body,
        })),
      });
      totalTokens += tokens;

      const flagged = c.confidence < CONFIDENCE_THRESHOLD;
      let ok: boolean | null = null;
      if (want === 'review') ok = flagged;
      else if (want) ok = c.responsibility === want;

      if (ok !== null) {
        scored++;
        if (ok) correct++;
      }

      const mark = ok === null ? '-' : ok ? 'ok' : 'MISS';
      const note = flagged && want !== 'review' ? ' (flagged for review)' : '';
      console.log(
        `${pad(t.subject, 46)} ${pad(want ?? '?', 9)} ${pad(c.responsibility, 9)} ${c.confidence.toFixed(2)}  ${mark}${note}`,
      );
      if (ok === false) failures.push(`${t.subject}\n    -> ${c.reason}`);
    } catch (err) {
      console.log(`${pad(t.subject, 46)} ERROR: ${err instanceof Error ? err.message : err}`);
    }
  }

  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  console.log('-'.repeat(84));
  console.log(`Correct: ${correct}/${scored} (${Math.round((correct / Math.max(scored, 1)) * 100)}%)`);
  console.log(`Tokens used: ${totalTokens} | Time: ${seconds}s`);

  if (failures.length > 0) {
    console.log('\nMisses (the model\'s reason):');
    for (const f of failures) console.log(` - ${f}`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});