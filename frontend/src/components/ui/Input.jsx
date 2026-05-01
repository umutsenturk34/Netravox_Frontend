import { useState, useEffect, lazy, Suspense } from 'react';

const MediaPickerModal = lazy(() => import('./MediaPickerModal'));

export function ImageUrlInput({ label, value, onChange, placeholder, hint, className = '' }) {
  const [imgError, setImgError] = useState(false);
  const [naturalSize, setNaturalSize] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);

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
  }

  return (
    <div className={className}>
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
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="text-[11px] px-2 py-0.5 rounded font-medium border transition-colors hover:opacity-80"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-muted)' }}
          >
            📁 Medyadan Seç
          </button>
        </div>
      </div>

      {isUrl && !imgError && (
        <div className="mb-2 relative overflow-hidden rounded-lg border group"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
          <img
            src={value}
            alt="önizleme"
            className="w-full h-28 object-cover"
            onLoad={handleLoad}
            onError={() => setImgError(true)}
          />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-2 py-1"
            style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.55))' }}>
            <span className="text-white text-[10px] font-medium">Önizleme</span>
            {naturalSize && <span className="text-white/80 text-[10px]">{naturalSize}</span>}
          </div>
        </div>
      )}

      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder || 'https://... veya medyadan seç'}
        className="w-full rounded-lg px-3.5 py-2.5 border outline-none transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        style={{
          background: 'var(--bg-base)',
          borderColor: 'var(--border)',
          color: 'var(--text-primary)',
          fontSize: '16px',
        }}
      />

      {isUrl && imgError && (
        <p className="mt-1 text-xs text-amber-500">⚠ Görsel yüklenemedi — URL'yi kontrol edin</p>
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

export function Input({ label, error, className = '', ...props }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
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
