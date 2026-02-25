import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { ApiError } from '../lib/api'
import { useAuth } from '../lib/auth'
import type { Credential } from '../lib/types'

type Draft = {
  key: string
  value: string
  type: string
  description: string
}

export function CredentialsPage() {
  const { envId, projectId } = useParams()
  const { authedRequest, role } = useAuth()
  const isAdmin = role === 'ADMIN'

  const [creds, setCreds] = useState<Credential[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [draft, setDraft] = useState<Draft>({ key: '', value: '', type: '', description: '' })
  const [saving, setSaving] = useState(false)

  const [revealingId, setRevealingId] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)

  const basePath = useMemo(() => {
    if (!envId || !projectId) return null
    return `/api/envs/${envId}/projects/${projectId}/credentials`
  }, [envId, projectId])

  const load = async () => {
    if (!basePath) return
    setError(null)
    setLoading(true)
    try {
      const data = await authedRequest<Credential[]>(basePath)
      setCreds(data)
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
  }, [basePath])

  if (!envId || !projectId) return <div className="error">Missing envId/projectId</div>

  return (
    <div className="stack">
      {error ? <div className="error">{error}</div> : null}

      <div className="panel">
        <div className="row">
          <div>
            <div style={{ fontWeight: 650 }}>Credentials</div>
            <div className="muted" style={{ fontSize: 13 }}>
              Env: <span className="mono">{envId}</span> · Project: <span className="mono">{projectId}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link className="btn" to={`/projects/${envId}`}>
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
                  <label>Key</label>
                  <input value={draft.key} onChange={(e) => setDraft((d) => ({ ...d, key: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Type</label>
                  <input value={draft.type} onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value }))} />
                </div>
              </div>
              <div className="grid2">
                <div className="field">
                  <label>Value</label>
                  <input
                    value={draft.value}
                    onChange={(e) => setDraft((d) => ({ ...d, value: e.target.value }))}
                    placeholder="Will be encrypted at rest"
                  />
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
                if (!basePath) return
                setSaving(true)
                setError(null)
                try {
                  await authedRequest<Credential>(basePath, {
                    method: 'POST',
                    body: {
                      key: draft.key.trim(),
                      value: draft.value,
                      type: draft.type.trim() || null,
                      description: draft.description.trim() || null,
                    },
                  })
                  setDraft({ key: '', value: '', type: '', description: '' })
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

          <div className="row" style={{ marginTop: 12 }}>
            <div className="muted" style={{ fontSize: 12 }}>
              CSV import format: <span className="mono">key,value[,type[,description]]</span>
            </div>
            <label className="btn" style={{ cursor: importing ? 'not-allowed' : 'pointer', opacity: importing ? 0.7 : 1 }}>
              Import CSV
              <input
                type="file"
                accept=".csv,text/csv"
                style={{ display: 'none' }}
                disabled={importing}
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  e.target.value = ''
                  if (!file || !basePath) return
                  setImporting(true)
                  setError(null)
                  try {
                    const form = new FormData()
                    form.append('file', file)
                    const count = await authedRequest<number>(`${basePath}/import`, {
                      method: 'POST',
                      body: form,
                    })
                    await load()
                    alert(`Imported ${count} credentials.`)
                  } catch (ex) {
                    const err = ex as ApiError
                    setError(err.message)
                  } finally {
                    setImporting(false)
                  }
                }}
              />
            </label>
          </div>

          <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
            Admin-only: create/update/delete/import.
          </div>
        </div>
      ) : (
        <div className="panel">
          <div className="muted" style={{ fontSize: 13 }}>
            Values are masked by default. Click <span className="mono">Reveal</span> to fetch the decrypted value (this will be audited).
          </div>
        </div>
      )}

      <div className="panel" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Key</th>
              <th>Value</th>
              <th>Type</th>
              <th>Description</th>
              <th>Updated</th>
              <th style={{ width: 240 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="muted">
                  Loading…
                </td>
              </tr>
            ) : creds.length === 0 ? (
              <tr>
                <td colSpan={6} className="muted">
                  No credentials yet.
                </td>
              </tr>
            ) : (
              creds.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }} className="wrap">
                    {c.key}
                  </td>
                  <td className="mono wrap">{c.value}</td>
                  <td className="muted">{c.type ?? '—'}</td>
                  <td className="muted wrap">{c.description ?? '—'}</td>
                  <td className="muted">{c.updatedAt ?? '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <button
                        className="btn"
                        disabled={revealingId === c.id}
                        onClick={async () => {
                          if (!basePath) return
                          setError(null)
                          setRevealingId(c.id)
                          try {
                            const revealed = await authedRequest<Credential>(`${basePath}/${c.id}/reveal`)
                            setCreds((prev) => prev.map((x) => (x.id === c.id ? { ...x, value: revealed.value } : x)))
                          } catch (e) {
                            const err = e as ApiError
                            setError(err.message)
                          } finally {
                            setRevealingId(null)
                          }
                        }}
                      >
                        {revealingId === c.id ? 'Revealing…' : 'Reveal'}
                      </button>

                      <button
                        className="btn"
                        disabled={c.value === '***'}
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(c.value)
                            alert('Copied to clipboard.')
                          } catch {
                            alert('Copy failed.')
                          }
                        }}
                      >
                        Copy
                      </button>

                      {isAdmin ? (
                        <>
                          <button
                            className="btn"
                            onClick={async () => {
                              if (!basePath) return
                              const nextValue = prompt('New value (required):', '') ?? ''
                              if (!nextValue.trim()) return
                              const nextType = prompt('Type (optional):', c.type ?? '') ?? ''
                              const nextDescription = prompt('Description (optional):', c.description ?? '') ?? ''

                              setError(null)
                              try {
                                await authedRequest<Credential>(`${basePath}/${c.id}`, {
                                  method: 'PUT',
                                  body: {
                                    key: c.key,
                                    value: nextValue,
                                    type: nextType.trim() || null,
                                    description: nextDescription.trim() || null,
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
                              if (!basePath) return
                              if (!confirm(`Delete credential "${c.key}"?`)) return
                              setError(null)
                              try {
                                await authedRequest<void>(`${basePath}/${c.id}`, { method: 'DELETE' })
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

