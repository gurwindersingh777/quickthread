import { useAuth } from '@clerk/react'
import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../lib/api'
import type { Role } from '../lib/roles'

export type Me = {
  id: string
  email: string
  name: string
  imageUrl: string
  role: Role
}

export function useMe() {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth()

  return useQuery({
    queryKey: ['me', userId],
    queryFn: async () => apiGet<Me>('/api/me', await getToken()),
    enabled: isLoaded && !!isSignedIn,
  })
}