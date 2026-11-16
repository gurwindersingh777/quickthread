import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { Show, UserButton } from "@clerk/react";
import { DemoLogin } from "../components/DemoLogin";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between p-4">
        <span className="text-lg font-semibold">Quickthread</span>
        <nav className="flex items-center gap-2">
          <Show when="signed-out">
            <Button variant="ghost" render={<Link to="/sign-in" />}>
              Sign in
            </Button>
          </Show>
          <Show when="signed-in">
            <Button variant="ghost" render={<Link to="/app" />}>
              Open app
            </Button>
            <UserButton />
          </Show>
        </nav>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Know who needs to reply, instantly.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Quickthread uses AI to sort your client&apos;s emails into what you
          should handle, what they should answer, and what needs no reply.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button size="lg" render={<Link to="/sign-up" />}>
            Get Started
          </Button>
        </div>
        <div className="mt-10 flex justify-center">
          <DemoLogin />
        </div>
      </main>
    </div>
  );
}
