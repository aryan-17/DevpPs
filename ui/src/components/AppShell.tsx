import { NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { DashboardSkeleton } from './DashboardSkeleton'

function SidebarLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => (isActive ? 'active' : undefined)}
      end
    >
      {label}
    </NavLink>
  )
}

type AppShellProps = { authLoading?: boolean }

export function AppShell({ authLoading = false }: AppShellProps) {
  const { role, logout } = useAuth()
  const nav = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const isAdmin = role === 'ADMIN'

  const segments = location.pathname.split('/').filter(Boolean)
  const title = (() => {
    if (segments[0] === 'admin') return 'Admin'
    if (segments[0] === 'envs') return 'Environments'
    if (segments[0] === 'projects') {
      if (segments.length >= 3) return 'Credentials'
      return 'Projects'
    }
    return 'Dashboard'
  })()

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-badge" />
          <div>
            <div className="brand-title">DevPortal</div>
            <div className="muted" style={{ fontSize: 12 }}>
              Credentials manager
            </div>
          </div>
        </div>

        <nav className="nav">
          <SidebarLink to="/dashboard" label="Dashboard" />
          <SidebarLink to="/envs" label="Environments" />
          {isAdmin ? <SidebarLink to="/admin/users" label="Admin · Users" /> : null}
          {isAdmin ? <SidebarLink to="/admin/audit-logs" label="Admin · Audit logs" /> : null}
        </nav>

        <div style={{ padding: 8, marginTop: 10 }} className="stack">
          <div className="pill">Role: {role ?? '—'}</div>
          <button
            className="btn"
            onClick={() => {
              logout()
              nav('/login')
            }}
          >
            Log out
          </button>
        </div>
      </aside>

      <main className="content">
        <div className="topbar">
          <h1>{title}</h1>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                const q = String(fd.get('q') ?? '').trim()
                nav(q ? `/dashboard?q=${encodeURIComponent(q)}` : '/dashboard')
              }}
            >
              <input
                name="q"
                defaultValue={params.get('q') ?? ''}
                placeholder="Search credential keys…"
                style={{
                  width: 280,
                  border: '1px solid var(--border)',
                  background: 'rgba(0,0,0,0.18)',
                  borderRadius: 10,
                  padding: '8px 10px',
                }}
              />
            </form>
            <div className="pill">API: /api → :8080</div>
          </div>
        </div>
        {authLoading ? <DashboardSkeleton /> : <Outlet />}
      </main>
    </div>
  )
}

