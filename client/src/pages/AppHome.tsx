import { UserButton, useUser } from '@clerk/react'

export default function AppHome() {
  const { user } = useUser()

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b p-4">
        <span className="font-semibold">Quickthread</span>
        <UserButton />
      </header>
      <main className="p-6">
        <h1 className="text-2xl font-semibold">
          Welcome, {user?.firstName ?? user?.primaryEmailAddress?.emailAddress}
        </h1>
        <p className="mt-2 text-muted-foreground">
          The assistant dashboard arrives in Phase 4.
        </p>
      </main>
    </div>
  )
}