import { Router } from 'express';
import { isValidObjectId, type Types } from 'mongoose';
import { z } from 'zod';
import { currentUser, requireRole, requireUser } from '../middleware/requireUser.js';
import { Thread } from '../models/Thread.js';
import { SEGMENT_KEYS, segmentFilter, type SegmentKey } from '../services/segments.js';
import { toDetailDto, toListDto } from '../services/threads.js';

export const threadsRouter = Router();
threadsRouter.use(requireUser, requireRole('assistant'));

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const listQuery = z.object({
  segment: z.enum(SEGMENT_KEYS).default('all'),
  q: z.string().trim().max(100).optional(),
  unread: z.literal('1').optional(),
  important: z.literal('1').optional(),
});

// GET /api/threads?segment=client&q=term&unread=1&important=1
threadsRouter.get('/', async (req, res) => {
  const parsed = listQuery.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid query' });
    return;
  }

  const { segment, q, unread, important } = parsed.data;
  const user = currentUser(res);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conditions: Record<string, any>[] = [{ ownerId: user._id }, segmentFilter(segment)];
  if (unread) conditions.push({ isRead: false });
  if (important) conditions.push({ isImportant: true });
  if (q) {
    const re = new RegExp(escapeRegex(q), 'i');
    conditions.push({
      $or: [
        { subject: re },
        { snippet: re },
        { 'participants.name': re },
        { 'participants.email': re },
        { 'messages.body': re },
        { 'ai.summary': re },
      ],
    });
  }

  const threads = await Thread.find({ $and: conditions }).sort({ lastMessageAt: -1 }).limit(200);
  res.json(threads.map(toListDto));
});

// GET /api/threads/stats: counts for every segment plus upcoming meetings
threadsRouter.get('/stats', async (_req, res) => {
  const user = currentUser(res);

  const entries = await Promise.all(
    SEGMENT_KEYS.map(
      async (key) =>
        [
          key,
          await Thread.countDocuments({ $and: [{ ownerId: user._id }, segmentFilter(key)] }),
        ] as const,
    ),
  );
  const counts = Object.fromEntries(entries) as Record<SegmentKey, number>;

  const withMeetings = await Thread.find({
    ownerId: user._id,
    isArchived: false,
    'ai.extractedDates.kind': 'meeting',
  }).select('subject ai.extractedDates');

  const now = Date.now();
  const upcoming: { threadId: string; subject: string; label: string; date: Date }[] = [];
  for (const t of withMeetings) {
    for (const d of t.ai?.extractedDates ?? []) {
      if (d.kind === 'meeting' && d.date && d.date.getTime() >= now) {
        upcoming.push({
          threadId: t.id as string,
          subject: t.subject,
          label: d.label ?? t.subject,
          date: d.date,
        });
      }
    }
  }
  upcoming.sort((a, b) => a.date.getTime() - b.date.getTime());

  res.json({ counts, upcoming: upcoming.slice(0, 5) });
});

async function findOwned(id: string, ownerId: Types.ObjectId) {
  if (!isValidObjectId(id)) return null;
  return Thread.findOne({ _id: id, ownerId });
}

// GET /api/threads/:id
threadsRouter.get('/:id', async (req, res) => {
  const thread = await findOwned(req.params.id, currentUser(res)._id);
  if (!thread) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }
  res.json(toDetailDto(thread));
});

const patchSchema = z
  .object({
    isRead: z.boolean().optional(),
    isImportant: z.boolean().optional(),
    isArchived: z.boolean().optional(),
    status: z.enum(['open', 'waiting', 'done']).optional(),
  })
  .strict();

// PATCH /api/threads/:id: mark read/unread, important, archive, done
threadsRouter.patch('/:id', async (req, res) => {
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid update' });
    return;
  }

  const thread = await findOwned(req.params.id, currentUser(res)._id);
  if (!thread) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }

  thread.set(parsed.data);
  await thread.save();
  res.json(toDetailDto(thread));
});