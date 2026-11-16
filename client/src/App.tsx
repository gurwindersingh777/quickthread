import { Route, Routes } from 'react-router'
import Landing from './pages/Landing'
import SignInPage from './pages/SignInPage'
import HealthCheck from './pages/HealthCheck'
import { ProtectedRoute } from './components/ProtectedRoute'
import AppHome from './pages/AppHome'
import SignUpPage from './pages/SignUpPage'


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/sign-in/*" element={<SignInPage />} />
      <Route path="/sign-up/*" element={<SignUpPage />} />
      <Route path="/status" element={<HealthCheck />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/app/*" element={<AppHome />} />
      </Route>
    </Routes>
  )
}