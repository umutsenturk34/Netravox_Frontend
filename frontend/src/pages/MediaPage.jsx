import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';

export default function MediaPage() {
  const qc = useQueryClient();
  const inputRef = useRef();
  const { toast } = useToast();
  const { activeTenantId } = useAuth();
  const [view, setView] = useState('grid'); // 'grid' | 'list'
  const [copied, setCopied] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['media', activeTenantId],
    queryFn: () => api.get('/media?limit=60').then((r) => r.data),
    enabled: !!activeTenantId,
  });

  const uploadMutation = useMutation({
    mutationFn: (file) => {
      const form = new FormData();
      form.append('file', file);
      return api.post('/media/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['media'] }); toast.success('Yüklendi'); },
    onError: () => toast.error('Yükleme başarısız'),
  });

  const archiveMutation = useMutation({
    mutationFn: (id) => api.delete(`/media/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['media'] }); toast.success('Arşivlendi'); },
    onError: () => toast.error('İşlem başarısız'),
  });

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'video/mp4'];
  const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

  const handleFiles = (e) => {
    Array.from(e.target.files).forEach((f) => {
      if (!ALLOWED_TYPES.includes(f.type)) {
        toast.error(`Desteklenmeyen dosya tipi: ${f.type}`);
        return;
      }
      if (f.size > MAX_SIZE) {
        toast.error(`Dosya çok büyük: ${Math.round(f.size / 1024 / 1024)} MB (maks 50 MB)`);
        return;
      }
      uploadMutation.mutate(f);
    });
    e.target.value = '';
  };

  const copyUrl = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const items = data?.data || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Medya Kütüphanesi</h1>
        <div className="flex items-center gap-3">
          {/* Grid / List toggle */}
          <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            {['grid', 'list'].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs transition-colors ${view === v ? 'bg-blue-600 text-white' : 'hover:bg-[var(--bg-muted)]'}`}
                style={view !== v ? { color: 'var(--text-muted)', background: 'var(--bg-surface)' } : {}}
              >
                {v === 'grid' ? '⊞ Grid' : '☰ Liste'}
              </button>
            ))}
          </div>
          <Button onClick={() => inputRef.current.click()} disabled={uploadMutation.isPending}>
            {uploadMutation.isPending ? 'Yükleniyor...' : '+ Yükle'}
          </Button>
        </div>
        <input ref={inputRef} type="file" multiple accept="image/*,video/mp4" className="hidden" onChange={handleFiles} />
      </div>

      {isLoading && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Yükleniyor...</p>}

      {!isLoading && !items.length && (
        <EmptyState
          title="Henüz medya dosyası yok"
          description="Görsel veya video yükleyerek başlayın"
          action={<Button onClick={() => inputRef.current.click()}>+ Dosya Yükle</Button>}
        />
      )}

      {/* Grid görünümü */}
      {view === 'grid' && items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {items.map((item) => (
            <div
              key={item._id}
              className="group relative rounded-lg overflow-hidden border aspect-square"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}
            >
              {item.thumbnailUrl ? (
                <img src={item.thumbnailUrl} alt={item.alt?.tr || ''} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl" style={{ color: 'var(--text-muted)' }}>🎬</div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                <button
                  onClick={() => copyUrl(item.url, item._id)}
                  className="w-full text-white text-xs bg-blue-600 rounded px-2 py-1"
                >
                  {copied === item._id ? 'Kopyalandı!' : 'URL Kopyala'}
                </button>
                <button
                  onClick={() => archiveMutation.mutate(item._id)}
                  className="w-full text-white text-xs bg-red-600 rounded px-2 py-1"
                >
                  Arşivle
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Liste görünümü */}
      {view === 'list' && items.length > 0 && (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <table className="w-full text-sm">
            <thead style={{ background: 'var(--bg-muted)' }}>
              <tr>
                {['Dosya', 'Tip', 'Boyut', 'Tarih', ''].map((h, i) => (
                  <th key={i} className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody style={{ background: 'var(--bg-surface)' }}>
              {items.map((item) => (
                <tr key={item._id} className="border-t hover:bg-[var(--bg-muted)] transition-colors" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded border overflow-hidden shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
                        {item.thumbnailUrl
                          ? <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                          : <div className="w-full h-full flex items-center justify-center text-lg">🎬</div>
                        }
                      </div>
                      <span className="text-sm font-mono truncate max-w-xs" style={{ color: 'var(--text-primary)' }}>
                        {item.storageKey?.split('/').pop() || '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {item.mimeType || '—'}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {item.size ? `${Math.round(item.size / 1024)} KB` : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {new Date(item.createdAt).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyUrl(item.url, item._id)}
                        className="text-xs px-2 py-1 rounded hover:bg-[var(--bg-muted)]"
                        style={{ color: copied === item._id ? '#16a34a' : 'var(--text-muted)' }}
                      >
                        {copied === item._id ? 'Kopyalandı!' : 'URL Kopyala'}
                      </button>
                      <button
                        onClick={() => archiveMutation.mutate(item._id)}
                        className="text-xs px-2 py-1 rounded hover:bg-red-50 text-red-500"
                      >
                        Arşivle
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
