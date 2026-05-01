export default function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--bg-muted)' }}>
        <span className="text-xl" style={{ color: 'var(--text-muted)' }}>○</span>
      </div>
      <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{title}</p>
      {description && <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{description}</p>}
      {action}
    </div>
  );
}
