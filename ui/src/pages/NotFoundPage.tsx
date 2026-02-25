import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="panel">
      <div className="stack">
        <div style={{ fontWeight: 650 }}>Not found</div>
        <div className="muted">That page doesn’t exist.</div>
        <div>
          <Link className="btn primary" to="/dashboard">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

