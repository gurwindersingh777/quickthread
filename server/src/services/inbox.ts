import type { Types } from 'mongoose';
import { EmailAccount, type Provider } from '../models/EmailAccount.js';
import { Thread } from '../models/Thread.js';
import { SAMPLE_THREADS, type Sender, type SeedPerson } from '../data/sampleThreads.js';
import { enqueueAnalysis } from './analysis.js';

const CLIENT_NAME = 'James Carter';

const ACCOUNT_ADDRESS: Record<Provider, string> = {
  gmail: 'james@northwindlabs.io',
  outlook: 'james.carter@northwindlabs.com',
};

function buildMessage(
  sender: Sender,
  contact: SeedPerson,
  address: string,
  sentAt: Date,
  body: string,
) {
  if (sender === 'contact') {
    return {
      fromName: contact.name,
      fromEmail: contact.email,
      to: [address],
      body,
      sentAt,
      direction: 'incoming' as const,
    };
  }
  return {
    fromName: sender === 'alice' ? 'Alice (for James)' : CLIENT_NAME,
    fromEmail: address,
    to: [contact.email],
    body,
    sentAt,
    direction: 'outgoing' as const,
  };
}

export async function importSampleInbox(
  ownerId: Types.ObjectId,
  provider: Provider,
  options: { reset?: boolean } = {},
) {
  let account = await EmailAccount.findOne({ ownerId, provider });

  if (account && options.reset) {
    await Thread.deleteMany({ accountId: account._id });
    await account.deleteOne();
    account = null;
  }

  if (account) {
    return { account, imported: 0, created: false };
  }

  const address = ACCOUNT_ADDRESS[provider];
  const created = await EmailAccount.create({
    ownerId,
    provider,
    address,
    displayName: CLIENT_NAME,
    status: 'connected',
    lastSyncedAt: new Date(),
  });

  const now = Date.now();
  const docs = SAMPLE_THREADS.map((t) => {
    const messages = t.messages.map((m) =>
      buildMessage(m.from, t.contact, address, new Date(now - m.hoursAgo * 3_600_000), m.body),
    );
    const last = messages[messages.length - 1];

    return {
      ownerId,
      accountId: created._id,
      subject: t.subject,
      participants: [t.contact, { name: CLIENT_NAME, email: address }],
      snippet: last.body.replace(/\s+/g, ' ').slice(0, 140),
      lastMessageAt: last.sentAt,
      messages,
      isRead: !t.unread,
      isImportant: Boolean(t.important),
      analysis: { status: 'pending' as const, updatedAt: new Date() },
    };
  });

  const inserted = await Thread.insertMany(docs);
  enqueueAnalysis(inserted.map((t) => t.id as string));
  return { account: created, imported: docs.length, created: true };
}