import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ApiError } from '../lib/api'
import { useAuth } from '../lib/auth'
import type { Environment } from '../lib/types'

type Draft = { name: string; colorCode: string }

export function EnvironmentsPage() {
  const { authedRequest, role } = useAuth()
  const isAdmin = role === 'ADMIN'

  const [envs, setEnvs] = useState<Environment[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [draft, setDraft] = useState<Draft>({ name: '', colorCode: '' })
  const [saving, setSaving] = useState(false)

  const palette = useMemo(
    () => [
      { name: 'qa', color: '#22c55e' },
      { name: 'staging', color: '#f59e0b' },
      { name: 'prod', color: '#ef4444' },
    ],
    []
  )

  const load = async () => {
    setError(null)
    setLoading(true)
    try {
      const data = await authedRequest<Environment[]>('/api/envs')
      setEnvs(data)
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

  return (
    <div className="stack">
      {error ? <div className="error">{error}</div> : null}

      <div className="panel">
        <div className="row">
          <div>
            <div style={{ fontWeight: 650 }}>Environments</div>
            <div className="muted" style={{ fontSize: 13 }}>
              Top-level containers like <span className="mono">qa</span>, <span className="mono">staging</span>,{' '}
              <span className="mono">prod</span>.
            </div>
          </div>
          <button className="btn" onClick={() => void load()} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      {isAdmin ? (
        <div className="panel">
          <div className="row" style={{ alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }} className="grid2">
              <div className="field">
                <label>Name</label>
                <input
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  placeholder="qa"
                />
              </div>
              <div className="field">
                <label>Color (hex)</label>
                <input
                  value={draft.colorCode}
                  onChange={(e) => setDraft((d) => ({ ...d, colorCode: e.target.value }))}
                  placeholder="#22c55e"
                />
              </div>
            </div>
            <button
              className="btn primary"
              disabled={saving}
              onClick={async () => {
                setSaving(true)
                setError(null)
                try {
                  const guess = palette.find((p) => p.name === draft.name.trim().toLowerCase())?.color ?? ''
                  await authedRequest<Environment>('/api/envs', {
                    method: 'POST',
                    body: {
                      name: draft.name.trim(),
                      colorCode: (draft.colorCode || guess || '').trim() || null,
                    },
                  })
                  setDraft({ name: '', colorCode: '' })
                  await load()
                } catch (e) {
                  const err = e as ApiError
                  setError(err.message)
                } finally {
                  setSaving(false)
                }
              }}
            >
              Create
            </button>
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
            Admin-only.
          </div>
        </div>
      ) : null}

      <div className="panel" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 36 }} />
              <th>Name</th>
              <th>ID</th>
              <th style={{ width: 160 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="muted">
                  Loading…
                </td>
              </tr>
            ) : envs.length === 0 ? (
              <tr>
                <td colSpan={4} className="muted">
                  No environments yet.
                </td>
              </tr>
            ) : (
              envs.map((e) => (
                <tr key={e.id}>
                  <td>
                    <div
                      title={e.colorCode ?? ''}
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 5,
                        border: '1px solid var(--border)',
                        background: e.colorCode ?? 'transparent',
                      }}
                    />
                  </td>
                  <td style={{ fontWeight: 600 }}>{e.name}</td>
                  <td className="mono">{e.id}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <Link className="btn primary" to={`/projects/${e.id}`}>
                        Projects
                      </Link>
                      {isAdmin ? (
                        <>
                          <button
                            className="btn"
                            onClick={async () => {
                              const nextName = (prompt('Name (required):', e.name) ?? '').trim()
                              if (!nextName) return
                              const nextColor = (prompt('Color (optional hex):', e.colorCode ?? '') ?? '').trim()
                              setError(null)
                              try {
                                await authedRequest<Environment>(`/api/envs/${e.id}`, {
                                  method: 'PUT',
                                  body: { name: nextName, colorCode: nextColor || null },
                                })
                                await load()
                              } catch (ex) {
                                const err = ex as ApiError
                                setError(err.message)
                              }
                            }}
                          >
                            Edit
                          </button>

                          <button
                            className="btn danger"
                            onClick={async () => {
                              if (!confirm(`Delete environment "${e.name}"?`)) return
                              setError(null)
                              try {
                                await authedRequest<void>(`/api/envs/${e.id}`, { method: 'DELETE' })
                                await load()
                              } catch (ex) {
                                const err = ex as ApiError
                                setError(err.message)
                              }
                            }}
                          >
                            Delete
                          </button>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

