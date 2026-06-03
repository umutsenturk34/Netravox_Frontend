import { useState, useEffect, lazy, Suspense } from 'react';
import { X } from 'lucide-react';

const MediaPickerModal = lazy(() => import('./MediaPickerModal'));

export function ImageUrlInput({ label, value, onChange, hint, className = '' }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [naturalSize, setNaturalSize] = useState(null);
  const [imgError, setImgError] = useState(false);

  const isUrl = value && (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/'));

  useEffect(() => {
    setImgError(false);
    setNaturalSize(null);
  }, [value]);

  function handleLoad(e) {
    const { naturalWidth: w, naturalHeight: h } = e.target;
    if (w && h) setNaturalSize(`${w}×${h}px`);
    setImgError(false);
  }

  function handleSelect(url) {
    onChange({ target: { value: url } });
    setPickerOpen(false);
  }

  function handleClear() {
    onChange({ target: { value: '' } });
  }

  // Filename only for display
  const displayName = value
    ? value.split('/').pop().split('?')[0].slice(0, 50)
    : '';

  return (
    <div className={className}>
      {/* Label row */}
      <div className="flex items-center justify-between mb-1.5 gap-2 flex-wrap">
        {label && (
          <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {label}
          </label>
        )}
        <div className="flex items-center gap-2 ml-auto flex-shrink-0">
          {hint && (
            <span className="text-[11px] px-1.5 py-0.5 rounded font-medium"
              style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
              Önerilen: {hint}
            </span>
          )}
        </div>
      </div>

      {/* Preview — shown when image loaded */}
      {isUrl && !imgError && (
        <div className="mb-2 relative overflow-hidden rounded-lg border group"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
          <img
            src={value}
            alt="önizleme"
            className="w-full h-32 object-cover"
            onLoad={handleLoad}
            onError={() => setImgError(true)}
          />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-2 py-1"
            style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.6))' }}>
            <span className="text-white text-[10px] font-medium truncate max-w-[70%]">{displayName}</span>
            {naturalSize && <span className="text-white/70 text-[10px] shrink-0">{naturalSize}</span>}
          </div>
        </div>
      )}

      {/* Action buttons row */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-colors hover:opacity-80"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-muted)' }}
        >
          <span>📁</span>
          {value ? 'Görseli Değiştir' : 'Medyadan Seç'}
        </button>

        {value && (
          <button
            type="button"
            onClick={handleClear}
            title="Görseli kaldır"
            className="flex items-center justify-center rounded-lg border px-3 transition-colors hover:bg-red-50 hover:border-red-300"
            style={{ borderColor: 'var(--border)' }}
          >
            <X size={15} className="text-red-400" />
          </button>
        )}
      </div>

      {/* Error state */}
      {isUrl && imgError && (
        <p className="mt-1 text-xs text-amber-500">⚠ Görsel yüklenemedi — lütfen medyadan yeniden seçin</p>
      )}

      {pickerOpen && (
        <Suspense fallback={null}>
          <MediaPickerModal
            open={pickerOpen}
            onClose={() => setPickerOpen(false)}
            onSelect={handleSelect}
          />
        </Suspense>
      )}
    </div>
  );
}

export function Input({ label, hint, error, className = '', ...props }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      {hint && <p className="text-xs mb-1.5" style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>{hint}</p>}
      <input
        {...props}
        className={`w-full rounded-lg px-3.5 py-2.5 border outline-none transition-all
          focus:ring-2 focus:border-blue-500
          ${error ? 'border-red-500 focus:ring-red-500/20' : 'focus:ring-blue-500/20'}`}
        style={{
          background: 'var(--bg-base)',
          borderColor: error ? '#DC2626' : 'var(--border)',
          color: 'var(--text-primary)',
          fontSize: '16px',
        }}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      <textarea
        {...props}
        rows={props.rows || 4}
        className={`w-full rounded-lg px-3.5 py-2.5 border outline-none transition-all resize-y
          focus:ring-2 focus:border-blue-500
          ${error ? 'border-red-500 focus:ring-red-500/20' : 'focus:ring-blue-500/20'}`}
        style={{
          background: 'var(--bg-base)',
          borderColor: error ? '#DC2626' : 'var(--border)',
          color: 'var(--text-primary)',
          fontSize: '16px',
        }}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      <select
        {...props}
        className="w-full rounded-lg px-3.5 py-2.5 border outline-none transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        style={{
          background: 'var(--bg-base)',
          borderColor: 'var(--border)',
          color: 'var(--text-primary)',
          fontSize: '16px',
        }}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
