import { Skeleton } from './Skeleton'

type TableSkeletonProps = {
  columns: number
  rows?: number
}

export function TableSkeleton({ columns, rows = 5 }: TableSkeletonProps) {
  return (
    <table className="table">
        <thead>
          <tr>
            {Array.from({ length: columns }, (_, i) => (
              <th key={i}>
                <Skeleton width={i === columns - 1 ? 80 : 60} height={14} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, rowIdx) => (
            <tr key={rowIdx}>
              {Array.from({ length: columns }, (_, colIdx) => (
                <td key={colIdx}>
                  <Skeleton
                    width={colIdx === 0 ? 100 : colIdx === columns - 1 ? 140 : 80}
                    height={16}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
  )
}
