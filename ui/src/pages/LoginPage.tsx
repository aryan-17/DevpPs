import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import type { ApiError } from '../lib/api'
import { useAuth } from '../lib/auth'

export function LoginPage() {
  const { user, loaded, login } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()

  const next = (loc.state as { from?: string } | null)?.from ?? '/dashboard'

  if (loaded && user) {
    return <Navigate to={next} replace />
  }

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  return (
    <div className="login-wrap">
      <div className="card">
        <h2>Sign in</h2>
        <p>
          Use your DevPortal account. If this is the first time, create the initial admin via{' '}
          <Link to="/bootstrap" style={{ color: 'var(--brand)' }}>
            bootstrap admin
          </Link>
          .
        </p>

        {error ? <div className="error">{error}</div> : null}

        <div className="stack" style={{ marginTop: 12 }}>
          <div className="field">
            <label>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@acme.com" />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              type="password"
            />
          </div>

          <div className="actions">
            <button
              className="btn primary"
              disabled={loading}
              onClick={async () => {
                setError(null)
                setLoading(true)
                try {
                  await login(email.trim(), password)
                  nav(next)
                } catch (e) {
                  const err = e as ApiError
                  setError(err.message ?? 'Login failed')
                } finally {
                  setLoading(false)
                }
              }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

