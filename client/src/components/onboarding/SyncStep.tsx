import { useEffect, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'


const STAGES = ['Authorizing access', 'Fetching conversations', 'Organizing your inbox']

type Props = {
  isSuccess: boolean
  isError: boolean
  errorMessage?: string
  onDone: () => void
  onRetry: () => void
}

export function SyncStep({ isSuccess, isError, errorMessage, onDone, onRetry }: Props) {
  const [stage, setStage] = useState(0)
  const [slow, setSlow] = useState(false)
  const lastStage = STAGES.length - 1
  const ready = isSuccess && stage >= lastStage

  useEffect(() => {
    const timer = setInterval(() => setStage((s) => Math.min(s + 1, lastStage)), 1200)
    return () => clearInterval(timer)
  }, [lastStage])

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 8000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!ready) return
    const timer = setTimeout(onDone, 900)
    return () => clearTimeout(timer)
  }, [ready, onDone])

  if (isError) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-xl font-semibold">We couldn&apos;t finish syncing</h2>
        <p className="text-sm text-destructive">{errorMessage ?? 'Something went wrong.'}</p>
        <Button onClick={onRetry}>Try again</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h2 className="text-xl font-semibold">Syncing your inbox</h2>
        <p className="text-sm text-muted-foreground">This only takes a moment.</p>
      </div>

      <ul className="space-y-3">
        {STAGES.map((label, i) => {
          const done = i < stage || ready
          const active = i === stage && !ready
          return (
            <li key={label} className="flex items-center gap-3 text-sm">
              {done ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : active ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <span className="h-4 w-4 rounded-full border" />
              )}
              <span className={done || active ? '' : 'text-muted-foreground'}>{label}</span>
            </li>
          )
        })}
      </ul>

      {slow && !ready && (
        <p className="text-center text-sm text-muted-foreground">
          Waking up the server. This can take up to a minute on the first visit.
        </p>
      )}
    </div>
  )
}