export const Skeleton = ({ className = '' }) => (
  <div
    className={`animate-pulse rounded ${className}`}
    style={{ background: 'var(--bg-muted)' }}
  />
);

export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
    <div className="h-10" style={{ background: 'var(--bg-muted)' }} />
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 px-4 py-3 border-t" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
        {Array.from({ length: cols }).map((_, j) => (
          <Skeleton key={j} className="h-4 flex-1" />
        ))}
      </div>
    ))}
  </div>
);
