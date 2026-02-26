import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { ApiError } from '../lib/api'
import { useAuth } from '../lib/auth'
import type { Project } from '../lib/types'
import { TableSkeleton } from '../components/TableSkeleton'

type Draft = {
  name: string
  description: string
  team: string
  status: string
}

export function ProjectsPage() {
  const { envId } = useParams()
  const { authedRequest, role } = useAuth()
  const isAdmin = role === 'ADMIN'

  const [projects, setProjects] = useState<Project[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [draft, setDraft] = useState<Draft>({ name: '', description: '', team: '', status: '' })
  const [saving, setSaving] = useState(false)

  const statuses = useMemo(() => ['active', 'deprecated', 'maintenance'], [])

  const load = async () => {
    if (!envId) return
    setError(null)
    setLoading(true)
    try {
      const data = await authedRequest<Project[]>(`/api/envs/${envId}/projects`)
      setProjects(data)
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
  }, [envId])

  if (!envId) return <div className="error">Missing envId</div>

  return (
    <div className="stack">
      {error ? <div className="error">{error}</div> : null}

      <div className="panel">
        <div className="row">
          <div>
            <div style={{ fontWeight: 650 }}>Projects</div>
            <div className="muted" style={{ fontSize: 13 }}>
              Environment: <span className="mono">{envId}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link className="btn" to="/dashboard">
              Back
            </Link>
            <button className="btn" onClick={() => void load()} disabled={loading}>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {isAdmin ? (
        <div className="panel">
          <div className="row" style={{ alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }} className="stack">
              <div className="grid2">
                <div className="field">
                  <label>Name</label>
                  <input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Team</label>
                  <input value={draft.team} onChange={(e) => setDraft((d) => ({ ...d, team: e.target.value }))} />
                </div>
              </div>
              <div className="grid2">
                <div className="field">
                  <label>Status</label>
                  <select value={draft.status} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}>
                    <option value="">(optional)</option>
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Description</label>
                  <input
                    value={draft.description}
                    onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <button
              className="btn primary"
              disabled={saving}
              onClick={async () => {
                setSaving(true)
                setError(null)
                try {
                  await authedRequest<Project>(`/api/envs/${envId}/projects`, {
                    method: 'POST',
                    body: {
                      name: draft.name.trim(),
                      description: draft.description.trim() || null,
                      team: draft.team.trim() || null,
                      status: draft.status || null,
                    },
                  })
                  setDraft({ name: '', description: '', team: '', status: '' })
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
        {loading ? (
          <TableSkeleton columns={6} rows={5} />
        ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Team</th>
              <th>Status</th>
              <th>ID</th>
              <th style={{ width: 220 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr>
                <td colSpan={6} className="muted">
                  No projects yet.
                </td>
              </tr>
            ) : (
              projects.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td className="muted">{p.description ?? '—'}</td>
                  <td className="muted">{p.team ?? '—'}</td>
                  <td className="muted">{p.status ?? '—'}</td>
                  <td className="mono">{p.id}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <Link className="btn primary" to={`/projects/${envId}/${p.id}`}>
                        Credentials
                      </Link>
                      {isAdmin ? (
                        <>
                          <button
                            className="btn"
                            onClick={async () => {
                              const nextName = (prompt('Name (required):', p.name) ?? '').trim()
                              if (!nextName) return
                              const nextTeam = (prompt('Team (optional):', p.team ?? '') ?? '').trim()
                              const nextStatus = (prompt('Status (optional):', p.status ?? '') ?? '').trim()
                              const nextDescription = (prompt('Description (optional):', p.description ?? '') ?? '').trim()

                              setError(null)
                              try {
                                await authedRequest<Project>(`/api/envs/${envId}/projects/${p.id}`, {
                                  method: 'PUT',
                                  body: {
                                    name: nextName,
                                    team: nextTeam || null,
                                    status: nextStatus || null,
                                    description: nextDescription || null,
                                  },
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
                              if (!confirm(`Delete project "${p.name}"?`)) return
                              setError(null)
                              try {
                                await authedRequest<void>(`/api/envs/${envId}/projects/${p.id}`, { method: 'DELETE' })
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
        )}
      </div>
    </div>
  )
}

