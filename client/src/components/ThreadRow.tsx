import { Link } from 'react-router'
import { Star } from 'lucide-react'
import { toast } from 'sonner'
import { useUpdateThread, type ThreadListItem } from '../hooks/useThreads'
import { cn } from '../lib/utils'
import { formatRowTime } from '../lib/time'
import { ClassificationBadge } from './ClassificationBadge'


type Props = {
  thread: ThreadListItem
  selected: boolean
  to: string
}

export function ThreadRow({ thread, selected, to }: Props) {
  const update = useUpdateThread()
  const name = thread.contact?.name || thread.contact?.email || 'Unknown sender'

  const toggleImportant = () =>
    update.mutate(
      { id: thread.id, changes: { isImportant: !thread.isImportant } },
      { onError: (e) => toast.error(e.message) },
    )

  return (
    <li className={cn('border-b', selected && 'bg-accent')}>
      <div className="relative flex gap-3 px-4 py-3 hover:bg-accent/60">
        <span
          className={cn(
            'mt-2 h-2 w-2 shrink-0 rounded-full',
            thread.isRead ? 'bg-transparent' : 'bg-primary',
          )}
          title={thread.isRead ? undefined : 'Unread'}
        />

        {/* The link stretches over the whole row; the star sits above it */}
        <Link to={to} className="min-w-0 flex-1 space-y-1 after:absolute after:inset-0">
          <div className="flex items-baseline justify-between gap-2">
            <span className={cn('truncate text-sm', !thread.isRead && 'font-semibold')}>
              {name}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatRowTime(thread.lastMessageAt)}
            </span>
          </div>
          <p className={cn('truncate text-sm', !thread.isRead && 'font-medium')}>
            {thread.subject}
          </p>
          <p className="truncate text-xs text-muted-foreground">{thread.snippet}</p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <ClassificationBadge
              responsibility={thread.responsibility}
              needsReview={thread.needsReview}
              classifiedBy={thread.classifiedBy}
            />
            {thread.messageCount > 1 && (
              <span className="text-xs text-muted-foreground">
                {thread.messageCount} messages
              </span>
            )}
          </div>
        </Link>

        <button
          type="button"
          onClick={toggleImportant}
          className="relative z-10 h-fit rounded p-1 text-muted-foreground hover:text-amber-500"
          aria-label={thread.isImportant ? 'Remove important mark' : 'Mark as important'}
          aria-pressed={thread.isImportant}
        >
          <Star
            className={cn('h-4 w-4', thread.isImportant && 'fill-amber-400 text-amber-500')}
          />
        </button>
      </div>
    </li>
  )
}