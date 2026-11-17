import { BellOff, CircleDashed, Eye, Pencil, UserCheck, UserRound } from 'lucide-react'
import type { Responsibility } from '../hooks/useThreads'
import { cn } from '../lib/utils'

const STYLES = {
  assistant: {
    label: 'Assistant to reply',
    icon: UserCheck,
    tone: 'border-blue-200 bg-blue-50 text-blue-700',
  },
  client: {
    label: 'Client to reply',
    icon: UserRound,
    tone: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  none: {
    label: 'No reply needed',
    icon: BellOff,
    tone: 'border-slate-200 bg-slate-100 text-slate-600',
  },
  review: {
    label: 'Needs review',
    icon: Eye,
    tone: 'border-dashed border-purple-300 bg-purple-50 text-purple-700',
  },
  pending: {
    label: 'Not analyzed',
    icon: CircleDashed,
    tone: 'border-dashed border-slate-300 bg-transparent text-slate-500',
  },
} as const

type Props = {
  responsibility: Responsibility | null
  needsReview?: boolean
  classifiedBy?: 'ai' | 'manual' | null
  className?: string
}

export function ClassificationBadge({
  responsibility,
  needsReview,
  classifiedBy,
  className,
}: Props) {
  const key = needsReview ? 'review' : (responsibility ?? 'pending')
  const { label, icon: Icon, tone } = STYLES[key]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium',
        tone,
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
      {classifiedBy === 'manual' && <Pencil className="h-3 w-3 opacity-70" />}
    </span>
  )
}