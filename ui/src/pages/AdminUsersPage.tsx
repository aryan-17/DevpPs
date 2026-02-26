import { useEffect, useMemo, useState } from 'react'
import type { ApiError } from '../lib/api'
import { useAuth } from '../lib/auth'
import type { Role, User } from '../lib/types'
import { TableSkeleton } from '../components/TableSkeleton'

type InviteResponse = { userId: string; temporaryPassword: string }

export function AdminUsersPage() {
  const { authedRequest, role } = useAuth()
  const isAdmin = role === 'ADMIN'

  const [users, setUsers] = useState<User[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<Role>('DEVELOPER')
  const [inviting, setInviting] = useState(false)
  const [inviteResult, setInviteResult] = useState<InviteResponse | null>(null)

  const roles = useMemo<Role[]>(() => ['DEVELOPER', 'ADMIN'], [])

  const load = async () => {
    setError(null)
    setLoading(true)
    try {
      const data = await authedRequest<User[]>('/api/admin/users')
      setUsers(data)
    } catch (e) {
      const err = e as ApiError
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!isAdmin) {
    return <div className="error">Admin only.</div>
  }

  return (
    <div className="stack">
      {error ? <div className="error">{error}</div> : null}

      <div className="panel">
        <div className="row">
          <div>
            <div style={{ fontWeight: 650 }}>Users</div>
            <div className="muted" style={{ fontSize: 13 }}>
              Invite a user to generate a temporary password.
            </div>
          </div>
          <button className="btn" onClick={() => void load()} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="row" style={{ alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }} className="grid2">
            <div className="field">
              <label>Name</label>
              <input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Jane Doe" />
            </div>
            <div className="field">
              <label>Email</label>
              <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="jane@acme.com" />
            </div>
          </div>
          <div style={{ width: 190 }} className="field">
            <label>Role</label>
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as Role)}>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <button
            className="btn primary"
            disabled={inviting}
            onClick={async () => {
              setInviting(true)
              setError(null)
              setInviteResult(null)
              try {
                const r = await authedRequest<InviteResponse>('/api/admin/users/invite', {
                  method: 'POST',
                  body: {
                    name: inviteName.trim(),
                    email: inviteEmail.trim(),
                    role: inviteRole,
                  },
                })
                setInviteResult(r)
                setInviteName('')
                setInviteEmail('')
                await load()
              } catch (e) {
                const err = e as ApiError
                setError(err.message)
              } finally {
                setInviting(false)
              }
            }}
          >
            Invite
          </button>
        </div>

        {inviteResult ? (
          <div className="panel" style={{ marginTop: 12 }}>
            <div className="stack">
              <div className="muted" style={{ fontSize: 12 }}>
                Temporary password (share securely):
              </div>
              <div className="mono wrap" style={{ fontSize: 14 }}>
                {inviteResult.temporaryPassword}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="panel" style={{ padding: 0 }}>
        {loading ? (
          <TableSkeleton columns={6} rows={5} />
        ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Active</th>
              <th>ID</th>
              <th style={{ width: 250 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="muted">
                  No users.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td className="mono wrap">{u.email}</td>
                  <td className="muted">{u.role}</td>
                  <td className="muted">{u.active ? 'Yes' : 'No'}</td>
                  <td className="mono">{u.id}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <button
                        className="btn"
                        onClick={async () => {
                          const nextRole: Role = u.role === 'ADMIN' ? 'DEVELOPER' : 'ADMIN'
                          setError(null)
                          try {
                            await authedRequest<User>(`/api/admin/users/${u.id}`, {
                              method: 'PUT',
                              body: { role: nextRole, active: u.active },
                            })
                            await load()
                          } catch (e) {
                            const err = e as ApiError
                            setError(err.message)
                          }
                        }}
                      >
                        Make {u.role === 'ADMIN' ? 'Developer' : 'Admin'}
                      </button>
                      <button
                        className={u.active ? 'btn danger' : 'btn primary'}
                        onClick={async () => {
                          setError(null)
                          try {
                            await authedRequest<User>(`/api/admin/users/${u.id}`, {
                              method: 'PUT',
                              body: { role: u.role, active: !u.active },
                            })
                            await load()
                          } catch (e) {
                            const err = e as ApiError
                            setError(err.message)
                          }
                        }}
                      >
                        {u.active ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        )}
      </div>
    </div>
  )
}

