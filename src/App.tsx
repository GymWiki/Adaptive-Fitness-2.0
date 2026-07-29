import type { ReactNode } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { OnboardingGate } from './components/OnboardingGate'
import { NavBar } from './components/NavBar'
import { AuthErrorBanner } from './components/AuthErrorBanner'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { Onboarding } from './pages/Onboarding'
import { Dashboard } from './pages/Dashboard'
import { LogWorkout } from './pages/LogWorkout'
import { History } from './pages/History'
import { PlanGenerator } from './pages/PlanGenerator'
import { Progress } from './pages/Progress'

function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen pb-16 sm:pb-0">
      <NavBar />
      {children}
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AuthErrorBanner />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/onboarding" element={<Onboarding />} />
            <Route element={<OnboardingGate />}>
              <Route
                path="/app"
                element={
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                }
              />
              <Route
                path="/app/log"
                element={
                  <AppLayout>
                    <LogWorkout />
                  </AppLayout>
                }
              />
              <Route
                path="/app/history"
                element={
                  <AppLayout>
                    <History />
                  </AppLayout>
                }
              />
              <Route
                path="/app/plan"
                element={
                  <AppLayout>
                    <PlanGenerator />
                  </AppLayout>
                }
              />
              <Route
                path="/app/progress"
                element={
                  <AppLayout>
                    <Progress />
                  </AppLayout>
                }
              />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
