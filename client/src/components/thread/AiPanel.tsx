import type { ReactNode } from 'react'
import { Sparkles } from 'lucide-react'
import type { ThreadDetail } from '../../hooks/useThreads';
import { ClassificationBadge } from '../ClassificationBadge';
import { formatDateTime } from '../../lib/time';


function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="leading-relaxed">{children}</div>
    </div>
  )
}

export function AiPanel({ thread }: { thread: ThreadDetail }) {
  const ai = thread.ai
  const dates = ai?.extractedDates.filter((d) => d.date) ?? []

  return (
    <section className="rounded-xl border bg-card">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-medium">AI insights</h2>
      </div>

      {!ai ? (
        <p className="p-4 text-sm text-muted-foreground">
          The AI hasn&apos;t analyzed this conversation yet.
        </p>
      ) : (
        <div className="space-y-4 p-4 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <ClassificationBadge
              responsibility={thread.responsibility}
              needsReview={thread.needsReview}
              classifiedBy={thread.classifiedBy}
            />
            {thread.confidence !== null && (
              <span className="text-xs text-muted-foreground">
                {Math.round(thread.confidence * 100)}% confident
              </span>
            )}
            {thread.classifiedBy === 'manual' && (
              <span className="text-xs text-muted-foreground">Edited by you</span>
            )}
          </div>

          {ai.reason && <Field label="Why this owner">{ai.reason}</Field>}
          {ai.summary && <Field label="Summary">{ai.summary}</Field>}

          {(ai.actionRequired || ai.waitingForReply) && (
            <div className="flex flex-wrap gap-2">
              {ai.actionRequired && (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-800">
                  Action required
                </span>
              )}
              {ai.waitingForReply && (
                <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  Waiting for a reply
                </span>
              )}
            </div>
          )}

          {dates.length > 0 && (
            <Field label="Key dates">
              <ul className="space-y-1">
                {dates.map((d) => (
                  <li key={`${d.label}-${d.date}`} className="flex justify-between gap-3">
                    <span>{d.label}</span>
                    <span className="shrink-0 text-muted-foreground">
                      {formatDateTime(d.date as string)}
                    </span>
                  </li>
                ))}
              </ul>
            </Field>
          )}
        </div>
      )}
    </section>
  )
}