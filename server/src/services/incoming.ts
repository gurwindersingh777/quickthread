import type { Types } from 'mongoose';
import { SIMULATED_INCOMING } from '../data/simulatedIncoming.js';
import { EmailAccount } from '../models/EmailAccount.js';
import { Thread } from '../models/Thread.js';
import { enqueueAnalysis } from './analysis.js';

const snippetOf = (body: string) => body.replace(/\s+/g, ' ').slice(0, 140);

/** Delivers the next not-yet-delivered demo email to this assistant's inbox. */
export async function simulateIncoming(ownerId: Types.ObjectId) {
  const account = await EmailAccount.findOne({ ownerId }).sort({ createdAt: 1 });
  if (!account) return { status: 'no-account' as const };

  for (const scenario of SIMULATED_INCOMING) {
    const sentAt = new Date();

    if (scenario.kind === 'reply') {
      const thread = await Thread.findOne({
        ownerId,
        accountId: account._id,
        subject: scenario.threadSubject,
      });
      if (!thread || thread.messages.some((m) => m.body === scenario.body)) continue;

      const contact = thread.participants[0];
      thread.messages.push({
        fromName: contact?.name || contact?.email || 'Unknown sender',
        fromEmail: contact?.email ?? 'unknown@example.com',
        to: [account.address],
        body: scenario.body,
        sentAt,
        direction: 'incoming',
      });
      thread.lastMessageAt = sentAt;
      thread.snippet = snippetOf(scenario.body);
      thread.isRead = false;
      thread.isArchived = false;
      thread.status = 'open';
      // The situation changed: drop any manual correction and an earlier client decision
      thread.override = undefined;
      thread.clientDecision = undefined;
      thread.analysis = { status: 'pending', updatedAt: new Date() };
      await thread.save();

      enqueueAnalysis([thread.id as string]);
      return {
        status: 'delivered' as const,
        kind: 'reply' as const,
        threadId: thread.id as string,
        subject: thread.subject,
      };
    }

    const exists = await Thread.exists({
      ownerId,
      accountId: account._id,
      subject: scenario.subject,
    });
    if (exists) continue;

    const created = await Thread.create({
      ownerId,
      accountId: account._id,
      subject: scenario.subject,
      participants: [scenario.contact, { name: account.displayName, email: account.address }],
      snippet: snippetOf(scenario.body),
      lastMessageAt: sentAt,
      messages: [
        {
          fromName: scenario.contact.name,
          fromEmail: scenario.contact.email,
          to: [account.address],
          body: scenario.body,
          sentAt,
          direction: 'incoming',
        },
      ],
      isRead: false,
      isImportant: Boolean(scenario.important),
      analysis: { status: 'pending', updatedAt: new Date() },
    });

    enqueueAnalysis([created.id as string]);
    return {
      status: 'delivered' as const,
      kind: 'new' as const,
      threadId: created.id as string,
      subject: created.subject,
    };
  }

  return { status: 'exhausted' as const };
}