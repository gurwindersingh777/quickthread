import { useEffect, useState } from 'react'
import { Skeleton } from './ui/skeleton'

export function FullPageLoader({ label = 'Loading…' }: { label?: string }) {
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 5000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-4 text-center">
      <Skeleton className="h-8 w-48" />
      <p className="text-sm text-muted-foreground">{label}</p>
      {slow && (
        <p className="max-w-sm text-sm text-muted-foreground">
          Waking up the server. This can take up to a minute on the first visit.
        </p>
      )}
    </div>
  )
}