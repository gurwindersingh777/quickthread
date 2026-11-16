import { useAuth } from '@clerk/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useApi } from './useApi'

export type Provider = 'gmail' | 'outlook'

export type EmailAccount = {
  id: string
  provider: Provider
  address: string
  displayName: string
  status: 'connected' | 'syncing' | 'error'
  lastSyncedAt: string | null
  threadCount: number
}

type ConnectResult = {
  account: EmailAccount
  imported: number
  alreadyConnected: boolean
}

export function useAccounts() {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const api = useApi()

  return useQuery({
    queryKey: ['accounts', userId],
    queryFn: () => api<EmailAccount[]>('/api/accounts'),
    enabled: isLoaded && !!isSignedIn,
  })
}

export function useConnectAccount() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (provider: Provider) =>
      api<ConnectResult>('/api/accounts/connect', { method: 'POST', body: { provider } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
  })
}

export function useSyncAccount() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const [account] = await Promise.all([
        api<EmailAccount>(`/api/accounts/${id}/sync`, { method: 'POST' }),
        new Promise((resolve) => setTimeout(resolve, 1000)),
      ])
      return account
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
  })
}

export function useDisconnectAccount() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api<{ ok: true }>(`/api/accounts/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
  })
}