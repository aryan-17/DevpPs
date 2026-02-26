import { Skeleton } from './Skeleton'

export function DashboardSkeleton() {
  return (
    <div className="stack">
      <div className="panel">
        <div className="row">
          <div className="stack" style={{ gap: 8 }}>
            <Skeleton width={140} height={18} />
            <Skeleton width={320} height={16} />
          </div>
          <Skeleton width={72} height={36} borderRadius={10} />
        </div>
      </div>

      {[1, 2].map((env) => (
        <div key={env} className="panel">
          <div className="row" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Skeleton width={14} height={14} borderRadius={5} />
              <Skeleton width={80} height={18} />
              <Skeleton width={180} height={14} />
            </div>
            <Skeleton width={120} height={36} borderRadius={10} />
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 10,
            }}
          >
            {[1, 2, 3].map((card) => (
              <div key={card} className="panel" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="stack">
                  <div className="row">
                    <Skeleton width={120} height={18} />
                    <Skeleton width={70} height={28} borderRadius={999} />
                  </div>
                  <Skeleton width="100%" height={14} />
                  <Skeleton width={100} height={14} />
                  <div className="row" style={{ marginTop: 8 }}>
                    <Skeleton width={120} height={14} />
                    <Skeleton width={60} height={36} borderRadius={10} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
