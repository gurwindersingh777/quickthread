import { Link } from 'react-router'
import { UserButton } from '@clerk/react'
import { useMe } from '../hooks/useMe'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Skeleton } from '../components/ui/skeleton'
import { Button, buttonVariants } from '../components/ui/button'
import { Badge } from '../components/ui/badge'

export default function AppHome() {
  const { data: me, isPending, isError, error, refetch } = useMe()

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b p-4">
        <span className="font-semibold">Quickthread</span>
        <div className="flex items-center gap-3">
          <Link
            to="/app/accounts"
            className={buttonVariants({ variant: 'ghost', size: 'sm' })}
          >
            Accounts
          </Link>
          <UserButton />
        </div>
      </header>

      <main className="mx-auto max-w-md p-6">
        <Card>
          <CardHeader>
            <CardTitle>Your account</CardTitle>
            <CardDescription>Loaded from the Quickthread API</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isPending && <Skeleton className="h-16 w-full" />}

            {isError && (
              <div className="space-y-2">
                <p className="text-sm text-destructive">{error.message}</p>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  Retry
                </Button>
              </div>
            )}

            {me && (
              <div className="space-y-1 text-sm">
                <p className="text-base font-medium">{me.name || me.email}</p>
                <p className="text-muted-foreground">{me.email}</p>
                <Badge variant="secondary">{me.role}</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
