import { Lock, ShieldCheck } from 'lucide-react'
import type { Provider } from '../../hooks/useAccounts'
import { PERMISSIONS, PROVIDER_INFO } from '../../lib/providers'
import { Button } from '../ui/button'


type Props = {
  provider: Provider
  onAllow: () => void
  onCancel: () => void
}

export function ConsentStep({ provider, onAllow, onCancel }: Props) {
  const info = PROVIDER_INFO[provider]

  return (
    <div className="space-y-5">
      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        Simulated connection: this prototype never contacts {info.label}, and no real email is
        accessed.
      </div>

      <div className="space-y-2 text-center">
        <div
          className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${info.badgeClass}`}
        >
          <Lock className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-semibold">
          Quickthread wants access to your {info.label} account
        </h2>
        <p className="text-sm text-muted-foreground">
          Connect the mailbox of the person you assist.
        </p>
      </div>

      <ul className="space-y-3 rounded-lg border p-4 text-sm">
        {PERMISSIONS.map((permission) => (
          <li key={permission} className="flex gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
            <span>{permission}</span>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button className="flex-1" onClick={onAllow}>
          Allow access
        </Button>
      </div>
    </div>
  )
}