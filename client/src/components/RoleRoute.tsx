import { Navigate, Outlet } from 'react-router'
import { homeFor, type Role } from '../lib/roles'
import { useMe } from '../hooks/useMe'
import { FullPageLoader } from './FullPageLoader'
import { Button } from './ui/button'


export function RoleRoute({ role }: { role: Role }) {
  const { data: me, isPending, isError, error, refetch } = useMe()

  if (isPending) return <FullPageLoader label="Loading your workspace…" />

  if (isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-4 text-center">
        <p className="text-sm text-destructive">{error.message}</p>
        <Button variant="outline" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    )
  }

  if (me.role !== role) return <Navigate to={homeFor(me.role)} replace />
  return <Outlet />
}