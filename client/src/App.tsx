import { Route, Routes } from 'react-router'
import Landing from './pages/Landing'
import SignInPage from './pages/SignInPage'
import HealthCheck from './pages/HealthCheck'
import { ProtectedRoute } from './components/ProtectedRoute'
import AppHome from './pages/AppHome'
import SignUpPage from './pages/SignUpPage'
import { RoleRoute } from './components/RoleRoute'
import ClientHome from './components/ClientHome'
import { Toaster } from 'sonner'
import AccountsPage from './pages/AccountsPage'
import Onboarding from './pages/Onboarding'
import { OnboardingGate } from './components/OnboardingGate'

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
              <Route path="/app" element={<AppHome />} />
              <Route path="/app/accounts" element={<AccountsPage />} />
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