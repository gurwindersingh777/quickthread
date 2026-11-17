import {
  Archive,
  BellOff,
  Calendar,
  CheckCheck,
  Eye,
  Hourglass,
  Inbox,
  Layers,
  ListChecks,
  Mail,
  Star,
  UserCheck,
  UserRound,
  type LucideIcon,
} from 'lucide-react'

export type SegmentKey =
  | 'all'
  | 'unread'
  | 'assistant'
  | 'client'
  | 'none'
  | 'action'
  | 'waiting'
  | 'meetings'
  | 'important'
  | 'general'
  | 'review'
  | 'done'
  | 'archived'

export type SegmentMeta = {
  label: string
  description: string
  empty: string
  icon: LucideIcon
}

export const SEGMENTS: Record<SegmentKey, SegmentMeta> = {
  review: {
    label: 'Needs review',
    description: 'The AI is unsure who should reply. Confirm the right owner.',
    empty: 'Nothing needs review. The AI is confident about every conversation.',
    icon: Eye,
  },
  client: {
    label: 'Client to reply',
    description: 'Conversations that need the client personally.',
    empty: 'No conversations are waiting on the client.',
    icon: UserRound,
  },
  assistant: {
    label: 'Assistant to reply',
    description: 'Conversations you should handle.',
    empty: 'You are all caught up.',
    icon: UserCheck,
  },
  action: {
    label: 'Action required',
    description: 'Emails that need a follow-up or another action.',
    empty: 'No open actions right now.',
    icon: ListChecks,
  },
  waiting: {
    label: 'Waiting for response',
    description: 'Conversations where we are waiting on someone else.',
    empty: 'Nothing is waiting on a reply.',
    icon: Hourglass,
  },
  meetings: {
    label: 'Meetings',
    description: 'Scheduling and appointments found in emails.',
    empty: 'No meetings or appointments found yet.',
    icon: Calendar,
  },
  important: {
    label: 'Important',
    description: 'Conversations marked as important.',
    empty: 'Star a conversation to find it here.',
    icon: Star,
  },
  general: {
    label: 'General',
    description: 'Other informational emails.',
    empty: 'No general emails.',
    icon: Layers,
  },
  none: {
    label: 'No reply needed',
    description: 'Updates, newsletters, and resolved threads.',
    empty: 'No conversations in this segment.',
    icon: BellOff,
  },
  all: {
    label: 'All mail',
    description: 'Every active conversation.',
    empty: 'Your inbox is empty.',
    icon: Inbox,
  },
  unread: {
    label: 'Unread',
    description: 'Conversations you have not opened yet.',
    empty: 'No unread conversations.',
    icon: Mail,
  },
  done: {
    label: 'Done',
    description: 'Conversations marked as completed.',
    empty: 'Completed conversations appear here.',
    icon: CheckCheck,
  },
  archived: {
    label: 'Archived',
    description: 'Conversations you archived.',
    empty: 'No archived conversations.',
    icon: Archive,
  },
}

export const NAV_GROUPS: { title: string; keys: SegmentKey[] }[] = [
  { title: 'Needs attention', keys: ['review', 'client', 'assistant', 'action', 'waiting'] },
  { title: 'Organize', keys: ['meetings', 'important', 'general', 'none'] },
  { title: 'Mailbox', keys: ['all', 'unread', 'done', 'archived'] },
]

export const isSegmentKey = (value: string | undefined): value is SegmentKey =>
  !!value && value in SEGMENTS