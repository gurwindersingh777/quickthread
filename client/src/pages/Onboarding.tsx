import { useCallback, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { UserButton } from '@clerk/react'
import { CheckCircle2, Inbox, Mail, ShieldCheck, Sparkles } from 'lucide-react'
import { useAccounts, useConnectAccount, type Provider } from '../hooks/useAccounts'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { PROVIDER_INFO } from '../lib/providers'
import { ConsentStep } from '../components/onboarding/ConsentStep'
import { SyncStep } from '../components/onboarding/SyncStep'


type Step = 'welcome' | 'provider' | 'consent' | 'sync' | 'done'
const STEP_ORDER: Step[] = ['welcome', 'provider', 'consent', 'sync']

const VALUE_POINTS = [
  {
    icon: Sparkles,
    title: 'AI sorts every conversation',
    text: 'See instantly whether you, your client, or nobody needs to reply.',
  },
  {
    icon: Inbox,
    title: 'A calm view for your client',
    text: 'Your client only sees the emails that genuinely need them.',
  },
  {
    icon: ShieldCheck,
    title: 'You stay in control',
    text: 'AI drafts replies, but nothing is sent until you approve it.',
  },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { data: accounts } = useAccounts()
  const connect = useConnectAccount()

  const adding = params.get('add') === '1'
  const [step, setStep] = useState<Step>(adding ? 'provider' : 'welcome')
  const [provider, setProvider] = useState<Provider | null>(null)

  const finish = useCallback(() => setStep('done'), [])
  const connected = new Set(accounts?.map((a) => a.provider))

  const allow = () => {
    if (!provider) return
    setStep('sync')
    connect.mutate(provider)
  }

  const retry = () => {
    connect.reset()
    setStep('consent')
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="mx-auto flex max-w-5xl items-center justify-between p-4">
        <span className="text-lg font-semibold">Quickthread</span>
        <UserButton />
      </header>

      <main className="mx-auto max-w-lg px-4 py-8">
        {step !== 'done' && (
          <div className="mb-6 flex justify-center gap-2" aria-hidden>
            {STEP_ORDER.map((s, i) => (
              <span
                key={s}
                className={`h-1.5 w-10 rounded-full ${
                  i <= STEP_ORDER.indexOf(step) ? 'bg-primary' : 'bg-muted-foreground/20'
                }`}
              />
            ))}
          </div>
        )}

        <Card>
          <CardContent className="p-6">
            {step === 'welcome' && (
              <div className="space-y-6">
                <div className="space-y-1 text-center">
                  <h1 className="text-2xl font-semibold">Welcome to Quickthread</h1>
                  <p className="text-sm text-muted-foreground">
                    Let&apos;s connect the inbox you manage. It takes about a minute.
                  </p>
                </div>
                <ul className="space-y-4">
                  {VALUE_POINTS.map(({ icon: Icon, title, text }) => (
                    <li key={title} className="flex gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-medium">{title}</span>
                        <span className="block text-sm text-muted-foreground">{text}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full" onClick={() => setStep('provider')}>
                  Connect an email account
                </Button>
              </div>
            )}

            {step === 'provider' && (
              <div className="space-y-5">
                <div className="space-y-1 text-center">
                  <h2 className="text-xl font-semibold">Choose your email provider</h2>
                  <p className="text-sm text-muted-foreground">
                    You can connect more accounts later.
                  </p>
                </div>
                <div className="space-y-3">
                  {(['gmail', 'outlook'] as const).map((p) => {
                    const info = PROVIDER_INFO[p]
                    const isConnected = connected.has(p)
                    return (
                      <button
                        key={p}
                        type="button"
                        disabled={isConnected}
                        onClick={() => {
                          setProvider(p)
                          setStep('consent')
                        }}
                        className="flex w-full items-center gap-4 rounded-lg border p-4 text-left transition hover:border-primary hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-border disabled:hover:bg-transparent"
                      >
                        <span
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${info.badgeClass}`}
                        >
                          <Mail className="h-5 w-5" />
                        </span>
                        <span className="flex-1">
                          <span className="block font-medium">{info.label}</span>
                          <span className="block text-sm text-muted-foreground">
                            {isConnected ? 'Already connected' : info.description}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => (adding ? navigate('/app/accounts') : setStep('welcome'))}
                >
                  Back
                </Button>
              </div>
            )}

            {step === 'consent' && provider && (
              <ConsentStep
                provider={provider}
                onAllow={allow}
                onCancel={() => setStep('provider')}
              />
            )}

            {step === 'sync' && (
              <SyncStep
                isSuccess={connect.isSuccess}
                isError={connect.isError}
                errorMessage={connect.error?.message}
                onDone={finish}
                onRetry={retry}
              />
            )}

            {step === 'done' && (
              <div className="space-y-5 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold">Your inbox is connected</h2>
                  <p className="text-sm text-muted-foreground">
                    {connect.data?.account.address}
                    {connect.data?.alreadyConnected
                      ? ' was already connected.'
                      : ` is synced. ${connect.data?.imported ?? 0} conversations were imported.`}
                  </p>
                </div>
                <Button className="w-full" onClick={() => navigate('/app')}>
                  Open inbox
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}