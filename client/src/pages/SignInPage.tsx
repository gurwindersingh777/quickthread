import { SignIn } from '@clerk/react'
import { DemoLogin } from '../components/DemoLogin'

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/30 p-4">
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
      <DemoLogin />
    </main>
  )
}