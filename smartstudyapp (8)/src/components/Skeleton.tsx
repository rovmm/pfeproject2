export function SkeletonLine({ width = '100%', height = 14, alt = false }: { width?: number | string; height?: number; alt?: boolean }) {
  return <div className={`skeleton ${alt ? 'skeleton-alt' : ''}`} style={{ width, height }} />;
}

export function SkeletonCard() {
  return (
    <div className="card card-pad">
      <SkeletonLine width={60} height={16} />
      <div style={{ marginTop: 14 }}>
        <SkeletonLine width="80%" height={15} />
      </div>
      <div style={{ marginTop: 9 }}>
        <SkeletonLine width="55%" height={12} alt />
      </div>
      <div style={{ marginTop: 16 }}>
        <SkeletonLine width="100%" height={34} alt />
      </div>
    </div>
  );
}

export function SkeletonTableRow() {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '14px 20px' }}>
      <div className="skeleton" style={{ width: 32, height: 32, borderRadius: '50%' }} />
      <SkeletonLine width="30%" height={13} />
      <SkeletonLine width="25%" height={13} alt />
      <SkeletonLine width="15%" height={13} alt />
    </div>
  );
}
