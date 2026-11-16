import { useState } from 'react'
import { useAuth, useSignIn } from '@clerk/react'
import { useNavigate } from 'react-router'
import { homeFor, type Role } from '../lib/roles'
import { apiRequest } from '../lib/api'
import { Button } from './ui/button'


export function DemoLogin() {
  const { isSignedIn } = useAuth()
  const { signIn } = useSignIn()
  const navigate = useNavigate()
  const [pending, setPending] = useState<Role | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (isSignedIn) return null

  const start = async (role: Role) => {
    setPending(role)
    setError(null)
    try {
      const { token } = await apiRequest<{ token: string }>('/api/demo/login', {
        method: 'POST',
        body: { role },
      })

      const { error: ticketError } = await signIn.ticket({ ticket: token })
      if (ticketError) throw new Error(ticketError.message)
      if (signIn.status !== 'complete') throw new Error('Demo sign-in did not complete')

      await signIn.finalize({
        navigate: ({ decorateUrl }) => {
          const url = decorateUrl(homeFor(role))
          if (url.startsWith('http')) {
            window.location.href = url
          } else {
            navigate(url)
          }
        },
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Demo sign-in failed')
      setPending(null)
    }
  }

  return (
    <div className="w-full max-w-sm space-y-3 rounded-xl border bg-card p-4 text-left text-card-foreground">
      <div>
        <p className="text-sm font-medium">Just exploring?</p>
        <p className="text-sm text-muted-foreground">
          Try Quickthread instantly with a demo account.
        </p>
      </div>
      <div className="grid gap-2">
        <Button onClick={() => start('assistant')} disabled={pending !== null}>
          {pending === 'assistant' ? 'Signing in…' : 'Continue as Alice (Assistant)'}
        </Button>
        <Button
          variant="outline"
          onClick={() => start('client')}
          disabled={pending !== null}
        >
          {pending === 'client' ? 'Signing in…' : 'Continue as James (Client)'}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        Demo data is shared between visitors and may be reset.
      </p>
    </div>
  )
}