import { Router } from 'express';
import { isValidObjectId, type Types } from 'mongoose';
import { z } from 'zod';
import { currentUser, requireRole, requireUser } from '../middleware/requireUser.js';
import { EmailAccount, PROVIDERS, type EmailAccountDocument } from '../models/EmailAccount.js';
import { Thread } from '../models/Thread.js';
import { importSampleInbox } from '../services/inbox.js';

export const accountsRouter = Router();
accountsRouter.use(requireUser, requireRole('assistant'));

async function toDto(account: EmailAccountDocument) {
  const threadCount = await Thread.countDocuments({ accountId: account._id });
  return {
    id: account.id as string,
    provider: account.provider,
    address: account.address,
    displayName: account.displayName,
    status: account.status,
    lastSyncedAt: account.lastSyncedAt,
    threadCount,
  };
}

async function findOwned(id: string, ownerId: Types.ObjectId) {
  if (!isValidObjectId(id)) return null;
  return EmailAccount.findOne({ _id: id, ownerId });
}

accountsRouter.get('/', async (_req, res) => {
  const user = currentUser(res);
  const accounts = await EmailAccount.find({ ownerId: user._id }).sort({ createdAt: 1 });
  res.json(await Promise.all(accounts.map(toDto)));
});

const connectSchema = z.object({ provider: z.enum(PROVIDERS) });

// Simulated OAuth connection: creates the account and imports the sample inbox
accountsRouter.post('/connect', async (req, res) => {
  const parsed = connectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid provider' });
    return;
  }

  const user = currentUser(res);
  const result = await importSampleInbox(user._id, parsed.data.provider);

  res.status(result.created ? 201 : 200).json({
    account: await toDto(result.account),
    imported: result.imported,
    alreadyConnected: !result.created,
  });
});

// Simulated re-sync
accountsRouter.post('/:id/sync', async (req, res) => {
  const account = await findOwned(req.params.id, currentUser(res)._id);
  if (!account) {
    res.status(404).json({ error: 'Account not found' });
    return;
  }

  account.status = 'connected';
  account.lastSyncedAt = new Date();
  await account.save();
  res.json(await toDto(account));
});

// Disconnect: removes the account and its imported threads
accountsRouter.delete('/:id', async (req, res) => {
  const account = await findOwned(req.params.id, currentUser(res)._id);
  if (!account) {
    res.status(404).json({ error: 'Account not found' });
    return;
  }

  await Thread.deleteMany({ accountId: account._id });
  await account.deleteOne();
  res.json({ ok: true });
});