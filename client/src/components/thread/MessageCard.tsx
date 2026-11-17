import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { ThreadMessage } from '../../hooks/useThreads'
import { cn } from '../../lib/utils'
import { formatDateTime } from '../../lib/time'

function initials(name: string) {
  const parts = name.replace(/\(.*?\)/g, '').trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?'
}

export function MessageCard({
  message,
  defaultOpen,
}: {
  message: ThreadMessage
  defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const outgoing = message.direction === 'outgoing'
  const preview = message.body.replace(/\s+/g, ' ')

  return (
    <article className={cn('rounded-xl border bg-card', outgoing && 'border-primary/20 bg-primary/5')}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
            outgoing ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
          )}
        >
          {initials(message.fromName)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-sm font-medium">{message.fromName}</span>
            <time className="shrink-0 text-xs text-muted-foreground">
              {formatDateTime(message.sentAt)}
            </time>
          </div>
          {open ? (
            <p className="truncate text-xs text-muted-foreground">
              {message.fromEmail} to {message.to.join(', ')}
            </p>
          ) : (
            <p className="truncate text-sm text-muted-foreground">{preview}</p>
          )}
        </div>

        <ChevronDown
          className={cn(
            'mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className="whitespace-pre-wrap px-4 pb-4 pl-16 text-sm leading-relaxed">
          {message.body}
        </div>
      )}
    </article>
  )
}