import { useAuth } from '@clerk/react'
import { Navigate, Outlet } from 'react-router'
import { Skeleton } from './ui/skeleton'

export function ProtectedRoute() {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Skeleton className="h-8 w-48" />
      </div>
    )
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />
  }

  return <Outlet />
}