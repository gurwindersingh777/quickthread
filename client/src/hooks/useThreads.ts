import { useAuth } from '@clerk/react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { SegmentKey } from '../lib/segments'
import { useApi } from './useApi'

export type Responsibility = 'assistant' | 'client' | 'none'

export type ThreadListItem = {
  id: string
  subject: string
  snippet: string
  contact: { name: string; email: string } | null
  lastMessageAt: string
  messageCount: number
  isRead: boolean
  isImportant: boolean
  isArchived: boolean
  status: 'open' | 'waiting' | 'done'
  responsibility: Responsibility | null
  classifiedBy: 'ai' | 'manual' | null
  confidence: number | null
  needsReview: boolean
  ai: {
    summary: string | null
    reason: string | null
    category: string | null
    actionRequired: boolean
    waitingForReply: boolean
    extractedDates: { label: string; date: string | null; kind: string }[]
  } | null
}

export type ThreadFilters = {
  segment: SegmentKey
  q?: string
  unread?: boolean
  important?: boolean
}

export type ThreadStats = {
  counts: Record<SegmentKey, number>
  upcoming: { threadId: string; subject: string; label: string; date: string }[]
}

// Poll so changes made elsewhere (for example by the client) show up on their own
const REFRESH_MS = 15_000

export function useThreads(filters: ThreadFilters) {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const api = useApi()

  return useQuery({
    queryKey: ['threads', userId, filters],
    queryFn: () => {
      const params = new URLSearchParams({ segment: filters.segment })
      if (filters.q) params.set('q', filters.q)
      if (filters.unread) params.set('unread', '1')
      if (filters.important) params.set('important', '1')
      return api<ThreadListItem[]>(`/api/threads?${params.toString()}`)
    },
    enabled: isLoaded && !!isSignedIn,
    placeholderData: keepPreviousData,
    refetchInterval: REFRESH_MS,
  })
}

export function useThreadStats() {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const api = useApi()

  return useQuery({
    queryKey: ['thread-stats', userId],
    queryFn: () => api<ThreadStats>('/api/threads/stats'),
    enabled: isLoaded && !!isSignedIn,
    refetchInterval: REFRESH_MS,
  })
}

export type ThreadChanges = Partial<
  Pick<ThreadListItem, 'isRead' | 'isImportant' | 'isArchived' | 'status'>
>

export function useUpdateThread() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: ThreadChanges }) =>
      api<ThreadListItem>(`/api/threads/${id}`, { method: 'PATCH', body: changes }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['threads'] }),
        queryClient.invalidateQueries({ queryKey: ['thread-stats'] }),
        queryClient.invalidateQueries({ queryKey: ['thread'] }),
      ]),
  })
}

export type ThreadMessage = {
  id: string
  fromName: string
  fromEmail: string
  to: string[]
  body: string
  sentAt: string
  direction: 'incoming' | 'outgoing'
}

export type ThreadDetail = ThreadListItem & {
  participants: { name: string; email: string }[]
  clientDecision: { action: 'handled' | 'handoff'; note: string; at: string } | null
  messages: ThreadMessage[]
}

export function useThread(id: string | undefined) {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const api = useApi()

  return useQuery({
    queryKey: ['thread', userId, id],
    queryFn: () => api<ThreadDetail>(`/api/threads/${id}`),
    enabled: isLoaded && !!isSignedIn && !!id,
    refetchInterval: REFRESH_MS,
    // A missing conversation won't appear on a retry
    retry: (failureCount, error) =>
      failureCount < 1 && !error.message.toLowerCase().includes('not found'),
  })
}