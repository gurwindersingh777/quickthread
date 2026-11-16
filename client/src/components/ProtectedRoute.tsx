import { useAuth } from '@clerk/react'
import { Navigate, Outlet } from 'react-router'
import { FullPageLoader } from './FullPageLoader'

export function ProtectedRoute() {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) return <FullPageLoader />
  if (!isSignedIn) return <Navigate to="/sign-in" replace />
  return <Outlet />
}