import { useEffect, type ReactElement } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { useAuth } from './lib/auth'
import { store } from './store'
import { fetchUserThunk } from './store/authThunks'
import { AdminAuditPage } from './pages/AdminAuditPage'
import { AdminUsersPage } from './pages/AdminUsersPage'
import { BootstrapAdminPage } from './pages/BootstrapAdminPage'
import { CredentialsPage } from './pages/CredentialsPage'
import { DashboardPage } from './pages/DashboardPage'
import { EnvironmentsPage } from './pages/EnvironmentsPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProjectsPage } from './pages/ProjectsPage'

function AuthBootstrap({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void store.dispatch(fetchUserThunk())
  }, [])
  return <>{children}</>
}

function RequireAuth({ children }: { children: ReactElement }) {
  const { user, loaded } = useAuth()
  const loc = useLocation()
  if (!loaded) return null
  if (user === null) return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  return children
}

export default function App() {
  return (
    <AuthBootstrap>
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/bootstrap" element={<BootstrapAdminPage />} />

      <Route
        path="/"
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="envs" element={<EnvironmentsPage />} />
        <Route path="projects/:envId" element={<ProjectsPage />} />
        <Route path="projects/:envId/:projectId" element={<CredentialsPage />} />
        <Route path="admin/users" element={<AdminUsersPage />} />
        <Route path="admin/audit-logs" element={<AdminAuditPage />} />
        <Route index element={<Navigate to="/dashboard" replace />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </AuthBootstrap>
  )
}
