import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Skeleton } from './components/ui/skeleton'

import { apiGet } from './lib/api'
import { Badge } from './components/ui/badge'
import { Button } from './components/ui/button'


type Health = {
  status: string
  db: 'connected' | 'disconnected'
  time: string
}

export default function App() {
  const [health, setHealth] = useState<Health | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)

  const retry = () => {
    setLoading(true)
    setError(null)
    setAttempt((n) => n + 1)
  }

  useEffect(() => {
    let cancelled = false
    apiGet<Health>('/api/health')
      .then((data) => {
        if (!cancelled) setHealth(data)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Request failed')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Quickthread</CardTitle>
          <CardDescription>Connection check</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <Skeleton className="h-6 w-full" />}

          {error && (
            <div className="space-y-2">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={retry}>
                Retry
              </Button>
            </div>
          )}

          {health && !loading && (
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>API</span>
                <Badge>{health.status}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Database</span>
                <Badge variant={health.db === 'connected' ? 'default' : 'destructive'}>
                  {health.db}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}