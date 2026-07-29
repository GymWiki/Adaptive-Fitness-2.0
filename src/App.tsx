import type { ReactNode } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { NavBar } from './components/NavBar'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { LogWorkout } from './pages/LogWorkout'
import { History } from './pages/History'
import { PlanGenerator } from './pages/PlanGenerator'

function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <NavBar />
      {children}
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
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
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
