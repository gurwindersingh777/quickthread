export const CONFIDENCE_THRESHOLD = 0.7;

export const SEGMENT_KEYS = [
  'all',
  'unread',
  'assistant',
  'client',
  'none',
  'action',
  'waiting',
  'meetings',
  'important',
  'general',
  'review',
  'done',
  'archived',
] as const;

export type SegmentKey = (typeof SEGMENT_KEYS)[number];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Filter = Record<string, any>;

// Manual override wins; otherwise the AI's decision
const effectiveIs = (responsibility: string): Filter => ({
  $expr: {
    $eq: [{ $ifNull: ['$override.responsibility', '$ai.responsibility'] }, responsibility],
  },
});

const active: Filter = { isArchived: false };
const notDone: Filter = { status: { $ne: 'done' } };

export function segmentFilter(segment: SegmentKey): Filter {
  switch (segment) {
    case 'all':
      return { ...active };
    case 'unread':
      return { ...active, isRead: false };
    case 'assistant':
      return { ...active, ...notDone, ...effectiveIs('assistant') };
    case 'client':
      return { ...active, ...notDone, ...effectiveIs('client') };
    case 'none':
      return { ...active, ...effectiveIs('none') };
    case 'action':
      return { ...active, ...notDone, 'ai.actionRequired': true };
    case 'waiting':
      return {
        ...active,
        ...notDone,
        $or: [{ 'ai.waitingForReply': true }, { status: 'waiting' }],
      };
    case 'meetings':
      return {
        ...active,
        $or: [
          { 'ai.category': { $in: ['meeting', 'scheduling'] } },
          { 'ai.extractedDates.kind': 'meeting' },
        ],
      };
    case 'important':
      return { ...active, isImportant: true };
    case 'general':
      return { ...active, 'ai.category': 'general' };
    case 'review':
      return {
        ...active,
        ...notDone,
        override: { $exists: false },
        'ai.confidence': { $lt: CONFIDENCE_THRESHOLD },
      };
    case 'done':
      return { isArchived: false, status: 'done' };
    case 'archived':
      return { isArchived: true };
  }
}