import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { ApiError } from '../lib/api'
import { apiRequest } from '../lib/api'

type BootstrapAdminResponse = {
  id: string
  email: string
  message: string
}

export function BootstrapAdminPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BootstrapAdminResponse | null>(null)
  const [loading, setLoading] = useState(false)

  return (
    <div className="login-wrap">
      <div className="card">
        <h2>Bootstrap admin</h2>
        <p>
          One-time setup to create the first admin user via <span className="mono">/api/auth/bootstrap-admin</span>.
          After this, sign in normally.
        </p>

        {error ? <div className="error">{error}</div> : null}
        {result ? (
          <div className="panel">
            <div className="stack">
              <div>
                <div className="muted">Created user</div>
                <div className="mono wrap">{result.email}</div>
              </div>
              <div className="muted">{result.message}</div>
              <div className="actions">
                <Link className="btn primary" to="/login">
                  Go to login
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        {!result ? (
          <div className="stack" style={{ marginTop: 12 }}>
            <div className="field">
              <label>Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Admin" />
            </div>
            <div className="field">
              <label>Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@acme.com" />
            </div>
            <div className="field">
              <label>Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a strong password"
                type="password"
              />
            </div>
            <div className="actions">
              <Link className="btn" to="/login">
                Cancel
              </Link>
              <button
                className="btn primary"
                disabled={loading}
                onClick={async () => {
                  setError(null)
                  setLoading(true)
                  try {
                    const r = await apiRequest<BootstrapAdminResponse>('/api/auth/bootstrap-admin', {
                      method: 'POST',
                      body: { name: name.trim(), email: email.trim(), password },
                    })
                    setResult(r)
                  } catch (e) {
                    const err = e as ApiError
                    setError(err.message ?? 'Bootstrap failed')
                  } finally {
                    setLoading(false)
                  }
                }}
              >
                {loading ? 'Creating…' : 'Create admin'}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

