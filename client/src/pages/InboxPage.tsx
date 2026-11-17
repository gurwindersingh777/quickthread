import { Navigate, Outlet, useMatch, useParams, useSearchParams } from 'react-router'
import { Inbox, SearchX, X } from 'lucide-react'
import { cn } from '../lib/utils'
import { isSegmentKey, SEGMENTS, type SegmentKey } from '../lib/segments'
import { useThreads } from '../hooks/useThreads'
import { Skeleton } from '../components/ui/skeleton'
import { Button } from '../components/ui/button'
import { ThreadRow } from '../components/ThreadRow'


function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-accent',
      )}
    >
      {children}
    </button>
  )
}

function InboxContent({ segment, threadId }: { segment: SegmentKey; threadId?: string }) {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const unread = params.get('unread') === '1'
  const important = params.get('important') === '1'
  const meta = SEGMENTS[segment]
  const Icon = meta.icon

  const { data: threads, isPending, isError, error, refetch, isPlaceholderData } = useThreads({
    segment,
    q: q || undefined,
    unread,
    important,
  })

  const update = (mutate: (next: URLSearchParams) => void) => {
    const next = new URLSearchParams(params)
    mutate(next)
    setParams(next, { replace: true })
  }

  const toggle = (key: 'unread' | 'important') =>
    update((next) => {
      if (next.get(key) === '1') next.delete(key)
      else next.set(key, '1')
    })

  const clearAll = () =>
    update((next) => {
      next.delete('q')
      next.delete('unread')
      next.delete('important')
    })

  const filtering = !!q || unread || important
  // Keep filters and search when opening a conversation
  const search = params.toString() ? `?${params.toString()}` : ''

  return (
    <div className="flex h-full">
      <section
        className={cn(
          'flex h-full w-full flex-col border-r lg:w-96 lg:shrink-0 xl:w-104',
          threadId && 'hidden lg:flex',
        )}
      >
        <div className="space-y-3 border-b p-4">
          <div>
            <h1 className="flex items-center gap-2 text-lg font-semibold">
              <Icon className="h-5 w-5 text-muted-foreground" />
              {meta.label}
              {threads && (
                <span className="text-sm font-normal text-muted-foreground">
                  {threads.length}
                </span>
              )}
            </h1>
            <p className="text-xs text-muted-foreground">{meta.description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <FilterChip active={unread} onClick={() => toggle('unread')}>
              Unread
            </FilterChip>
            <FilterChip active={important} onClick={() => toggle('important')}>
              Important
            </FilterChip>
            {q && (
              <button
                type="button"
                onClick={() => update((next) => next.delete('q'))}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs"
              >
                Search: &ldquo;{q}&rdquo;
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        <div
          className={cn(
            'min-h-0 flex-1 overflow-y-auto transition-opacity',
            isPlaceholderData && 'opacity-60',
          )}
        >
          {isPending && (
            <div className="space-y-4 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          )}

          {isError && (
            <div className="space-y-2 p-4">
              <p className="text-sm text-destructive">{error.message}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          )}

          {threads && threads.length === 0 && (
            <div className="flex flex-col items-center gap-3 p-10 text-center">
              {filtering ? (
                <SearchX className="h-8 w-8 text-muted-foreground" />
              ) : (
                <Icon className="h-8 w-8 text-muted-foreground" />
              )}
              <p className="text-sm text-muted-foreground">
                {filtering ? 'No conversations match your search or filters.' : meta.empty}
              </p>
              {filtering && (
                <Button variant="outline" size="sm" onClick={clearAll}>
                  Clear filters
                </Button>
              )}
            </div>
          )}

          {threads && threads.length > 0 && (
            <ul>
              {threads.map((t) => (
                <ThreadRow
                  key={t.id}
                  thread={t}
                  selected={t.id === threadId}
                  to={`/app/inbox/${segment}/${t.id}${search}`}
                />
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className={cn('min-w-0 flex-1', !threadId && 'hidden lg:block')}>
        {threadId ? (
          <Outlet />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <Inbox className="h-8 w-8" />
            <p className="text-sm">Select a conversation to read it</p>
          </div>
        )}
      </section>
    </div>
  )
}

export default function InboxPage() {
  const { segment } = useParams()
  const threadMatch = useMatch('/app/inbox/:segment/:threadId')

  if (!isSegmentKey(segment)) return <Navigate to="/app/inbox/all" replace />

  return <InboxContent segment={segment} threadId={threadMatch?.params.threadId} />
}