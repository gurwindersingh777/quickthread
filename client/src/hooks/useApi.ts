import { useCallback } from 'react'
import { useAuth } from '@clerk/react'
import { apiRequest, type RequestOptions } from '../lib/api'

export function useApi() {
  const { getToken } = useAuth()

  return useCallback(
    async <T>(path: string, options: Omit<RequestOptions, 'token'> = {}) =>
      apiRequest<T>(path, { ...options, token: await getToken() }),
    [getToken],
  )
}