import { SignUp } from '@clerk/react'

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
    </main>
  )
}