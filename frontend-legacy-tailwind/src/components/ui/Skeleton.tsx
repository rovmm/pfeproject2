interface SkeletonProps {
  className?: string
  width?: string
  height?: string
  rounded?: string
}

export function Skeleton({ className = '', width, height, rounded = 'rounded-md' }: SkeletonProps) {
  return (
    <div
      className={`skeleton-shimmer ${rounded} ${className}`}
      style={{ width, height: height ?? '1rem' }}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="ss-card p-5 space-y-3" style={{ cursor: 'default' }}>
      <div className="flex items-center justify-between">
        <Skeleton width="60%" height="1.1rem" />
        <Skeleton width="3.5rem" height="1.3rem" rounded="rounded-full" />
      </div>
      <Skeleton width="40%" height="0.875rem" />
      <div className="flex gap-4 pt-1">
        <Skeleton width="5rem" height="0.875rem" />
        <Skeleton width="4rem" height="0.875rem" />
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex gap-4 px-4 py-2">
        <Skeleton width="30%" height="0.75rem" />
        <Skeleton width="20%" height="0.75rem" />
        <Skeleton width="15%" height="0.75rem" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border border-[var(--color-border)] rounded-md">
          <Skeleton width="30%" height="0.875rem" />
          <Skeleton width="20%" height="0.875rem" />
          <Skeleton width="15%" height="0.875rem" />
          <Skeleton width="10%" height="0.875rem" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  const widths = ['100%', '90%', '75%', '85%', '60%']
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={widths[i % widths.length]} height="0.875rem" />
      ))}
    </div>
  )
}
