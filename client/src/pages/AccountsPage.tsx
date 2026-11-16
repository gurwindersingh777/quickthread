import { Link } from 'react-router'
import { UserButton } from '@clerk/react'
import { ArrowLeft, Loader2, Mail, Plus, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog'
import { Badge } from '../components/ui/badge'
import { Button, buttonVariants } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Skeleton } from '../components/ui/skeleton'
import {
  useAccounts,
  useDisconnectAccount,
  useSyncAccount,
  type EmailAccount,
} from '../hooks/useAccounts'
import { PROVIDER_INFO } from '../lib/providers'
import { timeAgo } from '../lib/time'

function AccountCard({ account }: { account: EmailAccount }) {
  const sync = useSyncAccount()
  const disconnect = useDisconnectAccount()
  const info = PROVIDER_INFO[account.provider]
  const status = sync.isPending
    ? { label: 'Syncing…', className: 'border-amber-200 bg-amber-50 text-amber-700' }
    : account.status === 'error'
      ? { label: 'Error', className: 'border-red-200 bg-red-50 text-red-700' }
      : { label: 'Connected', className: 'border-green-200 bg-green-50 text-green-700' }

  const handleSync = () =>
    sync.mutate(account.id, {
      onSuccess: () => toast.success('Inbox synced'),
      onError: (e) => toast.error(e.message),
    })

  const handleDisconnect = () =>
    disconnect.mutate(account.id, {
      onSuccess: () => toast.success(`${info.label} account disconnected`),
      onError: (e) => toast.error(e.message),
    })

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start gap-4">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${info.badgeClass}`}
          >
            <Mail className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium">{info.label}</p>
            <p className="truncate text-sm text-muted-foreground">{account.address}</p>
          </div>
          <Badge variant="outline" className={status.className}>
            {status.label}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground">
          Last synced {timeAgo(account.lastSyncedAt)} · {account.threadCount} conversations
        </p>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleSync} disabled={sync.isPending}>
            {sync.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Sync now
          </Button>

          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button variant="ghost" size="sm" disabled={disconnect.isPending}>
                  Disconnect
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disconnect {account.address}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes the account and its {account.threadCount} imported conversations
                  from Quickthread. Your real mailbox is not affected.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel variant="outline" size="default">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  size="default"
                  onClick={handleDisconnect}
                >
                  Disconnect
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AccountsPage() {
  const { data: accounts, isPending, isError, error, refetch } = useAccounts()

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="flex items-center justify-between border-b bg-background p-4">
        <Link to="/app" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to inbox
        </Link>
        <UserButton />
      </header>

      <main className="mx-auto max-w-2xl space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold">Connected accounts</h1>
          <p className="text-sm text-muted-foreground">
            Manage the mailboxes Quickthread keeps in sync.
          </p>
        </div>

        {isPending && (
          <div className="space-y-3">
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
          </div>
        )}

        {isError && (
          <div className="space-y-2">
            <p className="text-sm text-destructive">{error.message}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        )}

        {accounts && (
          <>
            <div className="space-y-3">
              {accounts.map((account) => (
                <AccountCard key={account.id} account={account} />
              ))}
            </div>

            {accounts.length < 2 ? (
              <Link to="/onboarding?add=1" className={buttonVariants({ variant: 'outline' })}>
                <Plus className="mr-2 h-4 w-4" />
                Connect another account
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">
                Both supported providers are connected.
              </p>
            )}
          </>
        )}
      </main>
    </div>
  )
}
