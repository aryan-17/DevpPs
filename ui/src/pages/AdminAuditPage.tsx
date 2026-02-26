import { useEffect, useState } from 'react'
import type { ApiError } from '../lib/api'
import { useAuth } from '../lib/auth'
import type { AuditLog } from '../lib/types'
import { TableSkeleton } from '../components/TableSkeleton'

export function AdminAuditPage() {
  const { authedRequest, role } = useAuth()
  const isAdmin = role === 'ADMIN'

  const [logs, setLogs] = useState<AuditLog[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setError(null)
    setLoading(true)
    try {
      const data = await authedRequest<AuditLog[]>('/api/admin/audit-logs')
      setLogs(data)
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
            <div style={{ fontWeight: 650 }}>Audit logs</div>
            <div className="muted" style={{ fontSize: 13 }}>
              Credential access and mutations. (Backend currently returns nested entities; UI shows best-effort fields.)
            </div>
          </div>
          <button className="btn" onClick={() => void load()} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      <div className="panel" style={{ padding: 0 }}>
        {loading ? (
          <TableSkeleton columns={8} rows={8} />
        ) : (
        <table className="table">
          <thead>
            <tr>
              <th>When</th>
              <th>Action</th>
              <th>User</th>
              <th>Env</th>
              <th>Project</th>
              <th>Key</th>
              <th>IP</th>
              <th>ID</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={8} className="muted">
                  No logs.
                </td>
              </tr>
            ) : (
              logs.map((l) => (
                <tr key={l.id}>
                  <td className="muted">{l.createdAt}</td>
                  <td style={{ fontWeight: 600 }}>{l.action}</td>
                  <td className="mono wrap">{l.user?.email ?? l.user?.id ?? '—'}</td>
                  <td className="muted">{l.environment?.name ?? '—'}</td>
                  <td className="muted">{l.project?.name ?? '—'}</td>
                  <td className="mono wrap">{l.credentialKey ?? '—'}</td>
                  <td className="mono">{l.ipAddress ?? '—'}</td>
                  <td className="mono">{l.id}</td>
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

