import { UserButton } from "@clerk/react"
import { useMe } from "../hooks/useMe"

export default function ClientHome() {
  const { data: me } = useMe()

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b p-4">
        <span className="font-semibold">Quickthread</span>
        <UserButton />
      </header>
      <main className="mx-auto max-w-md p-6">
        <h1 className="text-2xl font-semibold">Hi {me?.name ?? 'there'}</h1>
        <p className="mt-2 text-muted-foreground">
          Emails that need your reply will appear here (Phase 6).
        </p>
      </main>
    </div>
  )
}