import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';

const GALLERY_CATEGORIES = [
  { value: '', label: '— Kategori seçin —' },
  { value: 'Doga', label: 'Doğa' },
  { value: 'Restoran', label: 'Restoran' },
  { value: 'Kahvalti', label: 'Kahvaltı' },
  { value: 'Lezzetler', label: 'Lezzetler' },
  { value: 'Etkinlikler', label: 'Etkinlikler' },
  { value: 'Mekan Detaylari', label: 'Mekan Detayları' },
];

function EditModal({ item, onClose, onSave }) {
  const [altTr, setAltTr] = useState(item.alt?.tr || '');
  const [captionTr, setCaptionTr] = useState(item.caption?.tr || '');
  const [category, setCategory] = useState(item.category || '');
  const [showInGallery, setShowInGallery] = useState(item.showInGallery ?? false);
  const [isFeatured, setIsFeatured] = useState(item.isFeatured ?? false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: () =>
      api.patch(`/media/${item._id}`, {
        alt: { tr: altTr },
        caption: { tr: captionTr },
        category: category || null,
        showInGallery,
        isFeatured,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['media'] });
      toast.success('Güncellendi');
      onClose();
    },
    onError: () => toast.error('Güncellenemedi'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl shadow-xl p-6 space-y-4"
        style={{ background: 'var(--bg-surface)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Medya Düzenle</h3>
          <button onClick={onClose} className="text-lg leading-none" style={{ color: 'var(--text-muted)' }}>✕</button>
        </div>

        {item.thumbnailUrl && (
          <img src={item.thumbnailUrl} alt="" className="w-full h-40 object-cover rounded-lg" />
        )}

        <div className="space-y-3">
          {/* Galeride Göster toggle */}
          <div
            className="flex items-center justify-between p-3 rounded-lg border cursor-pointer"
            style={{
              borderColor: showInGallery ? '#6366f1' : 'var(--border)',
              background: showInGallery ? 'rgba(99,102,241,0.05)' : 'var(--bg-base)',
            }}
            onClick={() => setShowInGallery(v => !v)}
          >
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Web Sitesi Galerisinde Göster</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Aktifse Galeri sayfasında görünür</p>
            </div>
            <div className={`w-10 h-6 rounded-full transition-colors relative ${showInGallery ? 'bg-indigo-600' : 'bg-gray-300'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${showInGallery ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
          </div>

          {/* Öne Çıkan Anlar toggle */}
          <div
            className="flex items-center justify-between p-3 rounded-lg border cursor-pointer"
            style={{
              borderColor: isFeatured ? '#d97706' : 'var(--border)',
              background: isFeatured ? 'rgba(217,119,6,0.05)' : 'var(--bg-base)',
            }}
            onClick={() => setIsFeatured(v => !v)}
          >
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Öne Çıkan Anlar</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Aktifse Galeri sayfasındaki hero bölümünde görünür</p>
            </div>
            <div className={`w-10 h-6 rounded-full transition-colors relative ${isFeatured ? 'bg-amber-600' : 'bg-gray-300'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isFeatured ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>
              Galeri Kategorisi
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
            >
              {GALLERY_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>
              Alt Metin (SEO)
            </label>
            <input
              type="text"
              value={altTr}
              onChange={(e) => setAltTr(e.target.value)}
              placeholder="Örn: Gusto Kartepe açık hava masaları"
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>
              Açıklama / Başlık
            </label>
            <input
              type="text"
              value={captionTr}
              onChange={(e) => setCaptionTr(e.target.value)}
              placeholder="Örn: Orman içindeki masalar"
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="flex-1">
            {saveMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border px-4 py-2 text-sm"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            İptal
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MediaPage() {
  const qc = useQueryClient();
  const inputRef = useRef();
  const { toast } = useToast();
  const { activeTenantId } = useAuth();
  const [view, setView] = useState('grid');
  const [copied, setCopied] = useState(null);
  const [editing, setEditing] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['media', activeTenantId],
    queryFn: () => api.get('/media?limit=60').then((r) => r.data),
    enabled: !!activeTenantId,
  });

  const uploadMutation = useMutation({
    mutationFn: (file) => {
      const form = new FormData();
      form.append('file', file);
      return api.post('/media/upload', form);
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
  const MAX_SIZE = 50 * 1024 * 1024;

  const handleFiles = (e) => {
    Array.from(e.target.files).forEach((f) => {
      if (!ALLOWED_TYPES.includes(f.type)) { toast.error(`Desteklenmeyen dosya tipi: ${f.type}`); return; }
      if (f.size > MAX_SIZE) { toast.error(`Dosya çok büyük: ${Math.round(f.size / 1024 / 1024)} MB (maks 50 MB)`); return; }
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

  const categoryLabel = (cat) => GALLERY_CATEGORIES.find((c) => c.value === cat)?.label;

  return (
    <div>
      {editing && <EditModal item={editing} onClose={() => setEditing(null)} />}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Medya Kütüphanesi</h1>
        <div className="flex items-center gap-3">
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
        <input ref={inputRef} type="file" multiple accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml,video/mp4" className="hidden" onChange={handleFiles} />
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
              className="group relative rounded-lg overflow-hidden border aspect-square cursor-pointer"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}
            >
              {item.thumbnailUrl ? (
                <img src={item.thumbnailUrl} alt={item.alt?.tr || ''} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl" style={{ color: 'var(--text-muted)' }}>🎬</div>
              )}
              {item.showInGallery && (
                <div className="absolute top-1 right-1 bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                  Galeri ✓
                </div>
              )}
              {item.category && (
                <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                  {categoryLabel(item.category) || item.category}
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                <button
                  onClick={() => setEditing(item)}
                  className="w-full text-white text-xs bg-blue-600 rounded px-2 py-1"
                >
                  Düzenle
                </button>
                <button
                  onClick={() => copyUrl(item.url, item._id)}
                  className="w-full text-white text-xs bg-gray-600 rounded px-2 py-1"
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
                {['Dosya', 'Kategori', 'Tip', 'Boyut', 'Tarih', ''].map((h, i) => (
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
                  <td className="px-4 py-3">
                    {item.category ? (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700">
                        {categoryLabel(item.category) || item.category}
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{item.mimeType || '—'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {item.size ? `${Math.round(item.size / 1024)} KB` : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {new Date(item.createdAt).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditing(item)}
                        className="text-xs px-2 py-1 rounded hover:bg-blue-50 text-blue-600"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => copyUrl(item.url, item._id)}
                        className="text-xs px-2 py-1 rounded hover:bg-[var(--bg-muted)]"
                        style={{ color: copied === item._id ? '#16a34a' : 'var(--text-muted)' }}
                      >
                        {copied === item._id ? 'Kopyalandı!' : 'URL'}
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
