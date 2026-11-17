import { Link } from 'react-router'
import { ArrowUpRight, CalendarClock, Info } from 'lucide-react'
import { SEGMENTS, type SegmentKey } from '../lib/segments'
import { Skeleton } from '../components/ui/skeleton'
import { cn } from '../lib/utils'
import { useMe } from '../hooks/useMe'
import { useThreads, useThreadStats } from '../hooks/useThreads'
import { formatDateTime, formatRowTime, greeting } from '../lib/time'
import { Button } from '../components/ui/button'
import { ClassificationBadge } from '../components/ClassificationBadge'


function PriorityCard({
  segment,
  value,
  loading,
  tone,
}: {
  segment: SegmentKey
  value?: number
  loading: boolean
  tone: string
}) {
  const { label, description, icon: Icon } = SEGMENTS[segment]

  return (
    <Link
      to={`/app/inbox/${segment}`}
      className="group rounded-xl border bg-card p-5 transition hover:border-primary/40 hover:shadow-sm"
    >
      <div className="flex items-center justify-between">
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg', tone)}>
          <Icon className="h-4 w-4" />
        </span>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
      </div>
      <div className="mt-4 text-3xl font-semibold tabular-nums">
        {loading ? <Skeleton className="h-9 w-12" /> : (value ?? 0)}
      </div>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </Link>
  )
}

function MiniStat({
  segment,
  value,
  loading,
}: {
  segment: SegmentKey
  value?: number
  loading: boolean
}) {
  const { label, icon: Icon } = SEGMENTS[segment]

  return (
    <Link
      to={`/app/inbox/${segment}`}
      className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 transition hover:border-primary/40"
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="flex-1 text-sm">{label}</span>
      {loading ? (
        <Skeleton className="h-5 w-6" />
      ) : (
        <span className="text-sm font-semibold tabular-nums">{value ?? 0}</span>
      )}
    </Link>
  )
}

export default function Dashboard() {
  const { data: me } = useMe()
  const stats = useThreadStats()
  const recent = useThreads({ segment: 'all' })

  const counts = stats.data?.counts
  const loading = stats.isPending
  const analyzed = counts ? counts.assistant + counts.client + counts.none : 0
  const notAnalyzedYet = !!counts && counts.all > 0 && analyzed === 0
  const firstName = me?.name?.split(' ')[0]

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {greeting()}
          {firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
          {counts ? ` · ${counts.all} conversations in the inbox` : ''}
        </p>
      </div>

      {stats.isError && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <span className="flex-1 text-destructive">{stats.error.message}</span>
          <Button variant="outline" size="sm" onClick={() => stats.refetch()}>
            Retry
          </Button>
        </div>
      )}

      {notAnalyzedYet && (
        <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          The AI hasn&apos;t analyzed these conversations yet, so reply ownership isn&apos;t
          available.
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <PriorityCard
          segment="assistant"
          value={counts?.assistant}
          loading={loading}
          tone="bg-blue-50 text-blue-700"
        />
        <PriorityCard
          segment="client"
          value={counts?.client}
          loading={loading}
          tone="bg-amber-50 text-amber-800"
        />
        <PriorityCard
          segment="review"
          value={counts?.review}
          loading={loading}
          tone="bg-purple-50 text-purple-700"
        />
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat segment="unread" value={counts?.unread} loading={loading} />
        <MiniStat segment="important" value={counts?.important} loading={loading} />
        <MiniStat segment="action" value={counts?.action} loading={loading} />
        <MiniStat segment="waiting" value={counts?.waiting} loading={loading} />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border bg-card lg:col-span-2">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <h2 className="font-medium">Recent conversations</h2>
            <Button
              variant="ghost"
              size="sm"
              render={<Link to="/app/inbox/all" />}
            >
              View all
            </Button>
          </div>

          {recent.isPending && (
            <div className="space-y-3 p-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          )}

          {recent.isError && (
            <p className="p-5 text-sm text-destructive">{recent.error.message}</p>
          )}

          {recent.data && recent.data.length === 0 && (
            <p className="p-5 text-sm text-muted-foreground">No conversations yet.</p>
          )}

          <ul className="divide-y">
            {recent.data?.slice(0, 6).map((t) => (
              <li key={t.id}>
                <Link
                  to={`/app/inbox/all/${t.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-accent/60"
                >
                  <span
                    className={cn(
                      'h-2 w-2 shrink-0 rounded-full',
                      t.isRead ? 'bg-transparent' : 'bg-primary',
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className={cn('truncate text-sm', !t.isRead && 'font-semibold')}>
                      {t.contact?.name || t.contact?.email}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{t.subject}</p>
                  </div>
                  <ClassificationBadge
                    responsibility={t.responsibility}
                    needsReview={t.needsReview}
                    classifiedBy={t.classifiedBy}
                    className="hidden sm:inline-flex"
                  />
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatRowTime(t.lastMessageAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border bg-card">
          <div className="border-b px-5 py-3">
            <h2 className="font-medium">Upcoming meetings</h2>
          </div>

          {stats.isPending && (
            <div className="space-y-3 p-5">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}

          {stats.data && stats.data.upcoming.length === 0 && (
            <div className="flex flex-col items-center gap-2 p-8 text-center text-sm text-muted-foreground">
              <CalendarClock className="h-6 w-6" />
              No meetings spotted yet. The AI picks dates and appointments out of emails
              automatically.
            </div>
          )}

          <ul className="divide-y">
            {stats.data?.upcoming.map((m) => (
              <li key={`${m.threadId}-${m.date}`}>
                <Link
                  to={`/app/inbox/meetings/${m.threadId}`}
                  className="block px-5 py-3 hover:bg-accent/60"
                >
                  <p className="text-sm font-medium">{m.label}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(m.date)}</p>
                  <p className="truncate text-xs text-muted-foreground">{m.subject}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}