export default function Button({ children, variant = 'primary', size = 'md', disabled, loading, onClick, type = 'button', className = '' }) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-3 text-sm',
  };

  const variants = {
    primary: 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white',
    secondary: 'border hover:bg-[var(--bg-muted)] text-[var(--text-primary)]',
    danger: 'bg-[#DC2626] hover:bg-[#B91C1C] text-white',
    ghost: 'hover:bg-[var(--bg-muted)] text-[var(--text-secondary)]',
  };

  const variantStyle = variants[variant];
  const isSecondary = variant === 'secondary';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${sizes[size]} ${variantStyle} ${className}`}
      style={isSecondary ? { borderColor: 'var(--border)' } : {}}
    >
      {loading && (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
      )}
      {children}
    </button>
  );
}
