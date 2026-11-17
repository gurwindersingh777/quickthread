import { Navigate, Route, Routes } from 'react-router'
import { Toaster } from 'sonner'
import Landing from './pages/Landing'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
import HealthCheck from './pages/HealthCheck'
import { ProtectedRoute } from './components/ProtectedRoute'
import { RoleRoute } from './components/RoleRoute'
import Onboarding from './pages/Onboarding'
import { OnboardingGate } from './components/OnboardingGate'
import { AppShell } from './components/shell/AppShell'
import Dashboard from './pages/Dashboard'
import InboxPage from './pages/InboxPage'
import ThreadView from './pages/ThreadView'
import AccountsPage from './pages/AccountsPage'
import ClientHome from './components/ClientHome'


export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />
        <Route path="/status" element={<HealthCheck />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute role="assistant" />}>
            <Route path="/onboarding" element={<Onboarding />} />

            <Route element={<OnboardingGate />}>
              <Route element={<AppShell />}>
                <Route path="/app" element={<Dashboard />} />
                <Route path="/app/inbox" element={<Navigate to="/app/inbox/all" replace />} />
                <Route path="/app/inbox/:segment" element={<InboxPage />}>
                  <Route path=":threadId" element={<ThreadView />} />
                </Route>
                <Route path="/app/accounts" element={<AccountsPage />} />
              </Route>
            </Route>
          </Route>

          <Route element={<RoleRoute role="client" />}>
            <Route path="/client/*" element={<ClientHome />} />
          </Route>
        </Route>
      </Routes>
      <Toaster richColors position="top-right" />
    </>
  )
}