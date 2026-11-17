import { useEffect, useRef } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Mail,
  RotateCcw,
  Star,
} from 'lucide-react'
import { toast } from 'sonner'
import { isSegmentKey, type SegmentKey } from '../lib/segments'
import { useThread, useThreads, useUpdateThread, type ThreadChanges } from '../hooks/useThreads'
import { Skeleton } from '../components/ui/skeleton'
import { Button } from '../components/ui/button'
import { ClassificationBadge } from '../components/ClassificationBadge'
import { AiPanel } from '../components/thread/AiPanel'
import { MessageCard } from '../components/thread/MessageCard'
import { cn } from '../lib/utils'


// Segments a conversation disappears from when it is marked done
const REMOVED_BY_DONE: SegmentKey[] = ['assistant', 'client', 'action', 'waiting', 'review']

function leavesSegment(segment: SegmentKey, changes: ThreadChanges) {
  if (changes.isArchived === true) return segment !== 'archived'
  if (changes.isArchived === false) return segment === 'archived'
  if (changes.status === 'done') return REMOVED_BY_DONE.includes(segment)
  if (changes.status === 'open') return segment === 'done'
  return false
}

export default function ThreadView() {
  const { segment: segmentParam, threadId } = useParams()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const segment: SegmentKey = isSegmentKey(segmentParam) ? segmentParam : 'all'
  const search = params.toString() ? `?${params.toString()}` : ''
  const listPath = `/app/inbox/${segment}${search}`
  const toThread = (id: string) => `/app/inbox/${segment}/${id}${search}`

  const { data: thread, isPending, isError, error, refetch } = useThread(threadId)

  // Same query as the list pane, so this reuses its cache
  const list = useThreads({
    segment,
    q: params.get('q') || undefined,
    unread: params.get('unread') === '1',
    important: params.get('important') === '1',
  })

  const update = useUpdateThread()
  const updateThread = update.mutate

  // Mark as read the first time a conversation is opened
  const autoRead = useRef<string | null>(null)
  useEffect(() => {
    if (thread && !thread.isRead && autoRead.current !== thread.id) {
      autoRead.current = thread.id
      updateThread({ id: thread.id, changes: { isRead: true } })
    }
  }, [thread, updateThread])

  const ids = list.data ?? []
  const index = ids.findIndex((t) => t.id === threadId)
  const prev = index > 0 ? ids[index - 1] : undefined
  const next = index >= 0 && index < ids.length - 1 ? ids[index + 1] : undefined

  const apply = (changes: ThreadChanges, message: string, backToList = false) => {
    if (!thread) return
    const advance = leavesSegment(segment, changes)
    const fallback = next ?? prev

    update.mutate(
      { id: thread.id, changes },
      {
        onSuccess: () => {
          toast.success(message)
          if (backToList) navigate(listPath)
          else if (advance) navigate(fallback ? toThread(fallback.id) : listPath, { replace: true })
        },
        onError: (e) => toast.error(e.message),
      },
    )
  }

  if (isPending) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (isError) {
    const notFound = error.message.toLowerCase().includes('not found')
    return (
      <div className="flex h-full flex-col items-start gap-3 p-6">
        <Button variant="ghost" size="sm" render={<Link to={listPath} />}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to list
        </Button>
        <p className={cn('text-sm', notFound ? 'text-muted-foreground' : 'text-destructive')}>
          {notFound ? 'This conversation no longer exists.' : error.message}
        </p>
        {!notFound && (
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        )}
      </div>
    )
  }

  const done = thread.status === 'done'
  const messages = thread.messages
  const contact = thread.contact

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 space-y-3 border-b p-4">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            render={<Link to={listPath} aria-label="Back to list" />}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="ml-auto flex items-center gap-1">
            {index >= 0 && (
              <span className="mr-1 text-xs text-muted-foreground">
                {index + 1} of {ids.length}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              disabled={!prev}
              onClick={() => prev && navigate(toThread(prev.id))}
              aria-label="Previous conversation"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={!next}
              onClick={() => next && navigate(toThread(next.id))}
              aria-label="Next conversation"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold leading-snug">{thread.subject}</h1>
          <p className="text-sm text-muted-foreground">
            {contact ? `${contact.name || contact.email} · ${contact.email}` : 'Unknown sender'}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <ClassificationBadge
              responsibility={thread.responsibility}
              needsReview={thread.needsReview}
              classifiedBy={thread.classifiedBy}
            />
            {done && (
              <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                <CheckCheck className="h-3 w-3" />
                Done
              </span>
            )}
            {thread.isArchived && (
              <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                Archived
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          <Button
            variant="outline"
            size="sm"
            aria-pressed={thread.isImportant}
            onClick={() =>
              apply(
                { isImportant: !thread.isImportant },
                thread.isImportant ? 'Removed from important' : 'Marked as important',
              )
            }
          >
            <Star
              className={cn(
                'h-4 w-4 sm:mr-2',
                thread.isImportant && 'fill-amber-400 text-amber-500',
              )}
            />
            <span className="hidden sm:inline">Important</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => apply({ isRead: false }, 'Marked as unread', true)}
          >
            <Mail className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Mark unread</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              apply(
                { status: done ? 'open' : 'done' },
                done ? 'Conversation reopened' : 'Marked as done',
              )
            }
          >
            {done ? (
              <RotateCcw className="h-4 w-4 sm:mr-2" />
            ) : (
              <CheckCheck className="h-4 w-4 sm:mr-2" />
            )}
            <span className="hidden sm:inline">{done ? 'Reopen' : 'Mark done'}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              apply(
                { isArchived: !thread.isArchived },
                thread.isArchived ? 'Moved back to the inbox' : 'Conversation archived',
              )
            }
          >
            {thread.isArchived ? (
              <ArchiveRestore className="h-4 w-4 sm:mr-2" />
            ) : (
              <Archive className="h-4 w-4 sm:mr-2" />
            )}
            <span className="hidden sm:inline">{thread.isArchived ? 'Unarchive' : 'Archive'}</span>
          </Button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-3xl space-y-4">
          <AiPanel thread={thread} />

          <p className="pt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Conversation · {messages.length} {messages.length === 1 ? 'message' : 'messages'}
          </p>

          <div className="space-y-3">
            {messages.map((m, i) => (
              <MessageCard
                key={m.id}
                message={m}
                defaultOpen={messages.length <= 2 || i === messages.length - 1}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}