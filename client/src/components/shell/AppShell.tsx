import { useState } from 'react'
import { Link, Outlet } from 'react-router'
import { UserButton } from '@clerk/react'
import { Menu } from 'lucide-react'
import { useAccounts } from '../../hooks/useAccounts'
import { timeAgo } from '../../lib/time'
import { SidebarNav } from './SidebarNav'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../ui/sheet'
import { Button } from '../ui/button'
import { HeaderSearch } from './HeaderSearch'


function AccountStatus() {
  const { data: accounts } = useAccounts()
  const first = accounts?.[0]
  if (!first) return null

  const extra = accounts.length - 1
  const dot =
    first.status === 'error'
      ? 'bg-red-500'
      : first.status === 'syncing'
        ? 'bg-amber-500'
        : 'bg-green-500'

  return (
    <Link
      to="/app/accounts"
      className="hidden items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground hover:bg-accent md:flex"
    >
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      <span className="max-w-44 truncate">{first.address}</span>
      <span>· Synced {timeAgo(first.lastSyncedAt)}</span>
      {extra > 0 && <span>+{extra}</span>}
    </Link>
  )
}

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="flex h-dvh bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-card lg:flex">
        <div className="flex h-14 shrink-0 items-center px-6 text-lg font-semibold">
          Quickthread
        </div>
        <div className="min-h-0 flex-1">
          <SidebarNav />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              }
            />
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
                <SheetDescription>Browse your inbox segments</SheetDescription>
              </SheetHeader>
              <div className="flex h-14 items-center px-6 text-lg font-semibold">Quickthread</div>
              <SidebarNav onNavigate={() => setMenuOpen(false)} />
            </SheetContent>
          </Sheet>

          <HeaderSearch />

          <div className="ml-auto flex items-center gap-3">
            <AccountStatus />
            <UserButton />
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}