import { Navigate, Outlet } from 'react-router'
import { useAccounts } from '../hooks/useAccounts'
import { FullPageLoader } from './FullPageLoader'
import { FullPageError } from './FullPageError'

export function OnboardingGate() {
  const { data: accounts, isPending, isError, error, refetch } = useAccounts()

  if (isPending) return <FullPageLoader label="Checking your connected accounts…" />
  if (isError) return <FullPageError message={error.message} onRetry={() => refetch()} />
  if (accounts.length === 0) return <Navigate to="/onboarding" replace />

  return <Outlet />
}