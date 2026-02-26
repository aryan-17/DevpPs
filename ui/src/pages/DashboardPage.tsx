import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { ApiError } from '../lib/api'
import { useAuth } from '../lib/auth'
import type { Credential, Environment, Project } from '../lib/types'
import { DashboardSkeleton } from '../components/DashboardSkeleton'
import { TableSkeleton } from '../components/TableSkeleton'

type EnvWithProjects = {
  env: Environment
  projects: Project[]
}

type SearchHit = {
  envId: string
  envName: string
  projectId: string
  projectName: string
  credential: Credential
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = []
  let i = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++
      results[idx] = await fn(items[idx] as T)
    }
  })
  await Promise.all(workers)
  return results
}

export function DashboardPage() {
  const { authedRequest } = useAuth()
  const [params] = useSearchParams()

  const q = (params.get('q') ?? '').trim()
  const [data, setData] = useState<EnvWithProjects[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [searching, setSearching] = useState(false)
  const [hits, setHits] = useState<SearchHit[]>([])

  const allProjects = useMemo(
    () =>
      data.flatMap((d) =>
        d.projects.map((p) => ({
          envId: d.env.id,
          envName: d.env.name,
          projectId: p.id,
          projectName: p.name,
        }))
      ),
    [data]
  )

  const load = async () => {
    setError(null)
    setLoading(true)
    try {
      const envs = await authedRequest<Environment[]>('/api/envs')
      const projectsByEnv = await Promise.all(
        envs.map(async (env) => {
          const projects = await authedRequest<Project[]>(`/api/envs/${env.id}/projects`)
          return { env, projects } satisfies EnvWithProjects
        })
      )
      setData(projectsByEnv)
    } catch (e) {
      const err = e as ApiError
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const runSearch = async () => {
    setHits([])
    if (q.length < 2) return
    setSearching(true)
    setError(null)
    try {
      const maxHits = 50
      const projectRefs = allProjects

      const perProjectCreds = await mapLimit(
        projectRefs,
        6,
        async ({ envId, envName, projectId, projectName }) => {
          const creds = await authedRequest<Credential[]>(
            `/api/envs/${envId}/projects/${projectId}/credentials`
          )
          const matches = creds.filter((c) => c.key.toLowerCase().includes(q.toLowerCase()))
          return matches.map(
            (credential) =>
              ({
                envId,
                envName,
                projectId,
                projectName,
                credential,
              }) satisfies SearchHit
          )
        }
      )

      const flattened = perProjectCreds.flat().slice(0, maxHits)
      setHits(flattened)
    } catch (e) {
      const err = e as ApiError
      setError(err.message)
    } finally {
      setSearching(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void runSearch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, allProjects.length])

  return (
    <div className="stack">
      {error ? <div className="error">{error}</div> : null}

      <div className="panel">
        <div className="row">
          <div>
            <div style={{ fontWeight: 650 }}>Dashboard</div>
            <div className="muted" style={{ fontSize: 13 }}>
              Projects grouped by environment. Values stay masked unless you reveal a single credential.
            </div>
          </div>
          <button className="btn" onClick={() => void load()} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      {q ? (
        <div className="panel">
          <div className="row">
            <div>
              <div style={{ fontWeight: 650 }}>
                Search: <span className="mono">{q}</span>
              </div>
              <div className="muted" style={{ fontSize: 13 }}>
                {searching ? 'Searching credential keys…' : `${hits.length} result(s) (max 50)`}
              </div>
            </div>
            <Link className="btn" to="/dashboard">
              Clear
            </Link>
          </div>
          {searching ? (
            <div className="panel" style={{ marginTop: 12, padding: 0 }}>
              <TableSkeleton columns={4} rows={5} />
            </div>
          ) : hits.length ? (
            <div className="panel" style={{ marginTop: 12, padding: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Env</th>
                    <th>Project</th>
                    <th>Key</th>
                    <th style={{ width: 160 }}>Open</th>
                  </tr>
                </thead>
                <tbody>
                  {hits.map((h) => (
                    <tr key={`${h.projectId}:${h.credential.id}`}>
                      <td className="muted">{h.envName}</td>
                      <td style={{ fontWeight: 600 }}>{h.projectName}</td>
                      <td className="mono wrap">{h.credential.key}</td>
                      <td>
                        <Link className="btn primary" to={`/projects/${h.envId}/${h.projectId}`}>
                          Credentials
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      ) : null}

      {loading ? (
        <DashboardSkeleton />
      ) : data.length === 0 ? (
        <div className="panel muted">No environments yet.</div>
      ) : (
        data.map(({ env, projects }) => (
          <div key={env.id} className="panel">
            <div className="row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 5,
                    border: '1px solid var(--border)',
                    background: env.colorCode ?? 'transparent',
                  }}
                />
                <div style={{ fontWeight: 650 }}>{env.name}</div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {env.id}
                </div>
              </div>

              <Link className="btn" to={`/projects/${env.id}`}>
                View all projects
              </Link>
            </div>

            {projects.length ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10, marginTop: 12 }}>
                {projects.map((p) => (
                  <div key={p.id} className="panel" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <div className="stack">
                      <div className="row">
                        <div style={{ fontWeight: 650 }}>{p.name}</div>
                        <div className="pill">{p.status ?? '—'}</div>
                      </div>
                      <div className="muted" style={{ fontSize: 13 }}>
                        {p.description ?? '—'}
                      </div>
                      <div className="row">
                        <div className="muted" style={{ fontSize: 12 }}>
                          Team: <span className="mono">{p.team ?? '—'}</span>
                        </div>
                        <Link className="btn primary" to={`/projects/${env.id}/${p.id}`}>
                          Open
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="muted" style={{ fontSize: 13, marginTop: 12 }}>
                No projects in this environment.
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}

