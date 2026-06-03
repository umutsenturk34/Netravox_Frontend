import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Input, Textarea, ImageUrlInput } from '../components/ui/Input';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Code2 } from 'lucide-react';

const TABS = [
  { id: 'general', label: 'Genel' },
  { id: 'robots', label: 'robots.txt' },
  { id: 'scripts', label: 'Özel Kodlar' },
];

const SCOPE_OPTIONS = [
  { value: 'global', label: 'Global (tüm sayfalar)' },
  { value: 'home', label: 'Ana Sayfa' },
  { value: 'about', label: 'Hakkımızda' },
  { value: 'blog', label: 'Blog' },
  { value: 'contact', label: 'İletişim' },
  { value: 'services', label: 'Hizmetler' },
  { value: 'menu', label: 'Menü' },
  { value: 'reservation', label: 'Rezervasyon' },
  { value: 'gallery', label: 'Galeri' },
];

const emptySchema = { type: '', label: '', scope: 'global', dataStr: '{}', isActive: true };

function SchemaTab({ activeTenantId }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptySchema);
  const [jsonError, setJsonError] = useState('');

  const { data: schemaTypes = [] } = useQuery({
    queryKey: ['seo-schema-types'],
    queryFn: () => api.get('/seo/schema-types').then((r) => r.data),
    staleTime: Infinity,
  });

  const { data: schemas = [], isLoading } = useQuery({
    queryKey: ['seo-schemas', activeTenantId],
    queryFn: () => api.get('/seo/schemas').then((r) => r.data),
    enabled: !!activeTenantId,
  });

  const save = useMutation({
    mutationFn: (body) =>
      editing
        ? api.put(`/seo/schemas/${editing._id}`, body).then((r) => r.data)
        : api.post('/seo/schemas', body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seo-schemas'] });
      toast.success(editing ? 'Şema güncellendi' : 'Şema oluşturuldu');
      closeModal();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Hata oluştu'),
  });

  const del = useMutation({
    mutationFn: (id) => api.delete(`/seo/schemas/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seo-schemas'] });
      toast.success('Şema silindi');
    },
  });

  const toggle = useMutation({
    mutationFn: ({ id, isActive }) => api.put(`/seo/schemas/${id}`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['seo-schemas'] }),
  });

  function openNew() {
    setEditing(null);
    setForm(emptySchema);
    setJsonError('');
    setModal(true);
  }

  function openEdit(s) {
    setEditing(s);
    setForm({
      type: s.type,
      label: s.label,
      scope: s.scope || 'global',
      dataStr: JSON.stringify(s.data, null, 2),
      isActive: s.isActive,
    });
    setJsonError('');
    setModal(true);
  }

  function closeModal() {
    setModal(false);
    setEditing(null);
    setForm(emptySchema);
    setJsonError('');
  }

  function handleTypeChange(type) {
    const tpl = schemaTypes.find((t) => t.type === type);
    setForm((f) => ({
      ...f,
      type,
      label: tpl ? tpl.label : '',
      scope: tpl ? tpl.defaultScope : 'global',
      dataStr: tpl ? JSON.stringify(tpl.example, null, 2) : '{}',
    }));
    setJsonError('');
  }

  function handleSubmit(e) {
    e.preventDefault();
    let data;
    try {
      data = JSON.parse(form.dataStr);
    } catch {
      setJsonError('Geçersiz JSON — düzeltin ve tekrar deneyin');
      return;
    }
    save.mutate({ type: form.type, label: form.label, scope: form.scope, data, isActive: form.isActive });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          JSON-LD şema işaretlemeleri web sitenizin arama sonuçlarında zengin snippet göstermesini sağlar.
        </p>
        <Button onClick={openNew} icon={<Plus size={14} />}>Şema Ekle</Button>
      </div>

      {isLoading ? (
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Yükleniyor...</div>
      ) : schemas.length === 0 ? (
        <div className="rounded-xl border p-8 text-center" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
          <Code2 size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Henüz şema yok</p>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>İlk JSON-LD şemasını ekleyerek başlayın.</p>
          <Button size="sm" onClick={openNew} icon={<Plus size={13} />}>Şema Ekle</Button>
        </div>
      ) : (
        <div className="space-y-2">
          {schemas.map((s) => (
            <div
              key={s._id}
              className="flex items-center gap-3 p-4 rounded-xl border"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', opacity: s.isActive ? 1 : 0.5 }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
                    {s.type}
                  </span>
                  <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{s.label}</span>
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Kapsam: {SCOPE_OPTIONS.find((o) => o.value === s.scope)?.label || s.scope}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => toggle.mutate({ id: s._id, isActive: !s.isActive })}
                  title={s.isActive ? 'Pasif yap' : 'Aktif yap'}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-muted)] transition-colors"
                >
                  {s.isActive
                    ? <ToggleRight size={16} style={{ color: '#6366f1' }} />
                    : <ToggleLeft size={16} style={{ color: 'var(--text-muted)' }} />}
                </button>
                <button
                  onClick={() => openEdit(s)}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-muted)] transition-colors"
                >
                  <Pencil size={14} style={{ color: 'var(--text-muted)' }} />
                </button>
                <button
                  onClick={() => { if (confirm('Bu şema silinsin mi?')) del.mutate(s._id); }}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <Trash2 size={14} className="text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modal}
        onClose={closeModal}
        title={editing ? 'Şema Düzenle' : 'Yeni Şema Ekle'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tür seçici */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Şema Türü
            </label>
            <select
              value={form.type}
              onChange={(e) => handleTypeChange(e.target.value)}
              disabled={!!editing}
              required
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              style={{ background: 'var(--bg-input, var(--bg-surface))', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            >
              <option value="">— Seçin —</option>
              {schemaTypes.map((t) => (
                <option key={t.type} value={t.type}>{t.label} ({t.type})</option>
              ))}
            </select>
            {!editing && form.type && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Şablon otomatik yüklendi, düzenleyerek kaydedin.
              </p>
            )}
          </div>

          <Input
            label="Etiket (panel'de görünür)"
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            placeholder="örn. Ana Sayfa SSS"
            required
          />

          {/* Kapsam seçici */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Kapsam
            </label>
            <select
              value={form.scope}
              onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              style={{ background: 'var(--bg-input, var(--bg-surface))', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            >
              {SCOPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              "Global" seçilirse şema sitenin tüm sayfalarına eklenir.
            </p>
          </div>

          {/* JSON editör */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              JSON-LD İçerik
            </label>
            <textarea
              value={form.dataStr}
              onChange={(e) => { setForm((f) => ({ ...f, dataStr: e.target.value })); setJsonError(''); }}
              rows={14}
              spellCheck={false}
              className="w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              style={{
                background: 'var(--bg-muted)',
                borderColor: jsonError ? '#ef4444' : 'var(--border)',
                color: 'var(--text-primary)',
                fontFamily: 'monospace',
              }}
            />
            {jsonError && <p className="text-xs mt-1 text-red-500">{jsonError}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={closeModal}>İptal</Button>
            <Button type="submit" loading={save.isPending}>
              {editing ? 'Güncelle' : 'Oluştur'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function SeoPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { activeTenantId, activeCompany } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [form, setForm] = useState({
    siteName: { tr: '', en: '' },
    defaultMetaTitle: { tr: '', en: '' },
    defaultMetaDescription: { tr: '', en: '' },
    defaultOgImage: '',
    googleAnalyticsId: '',
    ga4PropertyId: '',
    googleTagManagerId: '',
    metaPixelId: '',
    searchConsoleVerification: '',
    robotsTxt: 'User-agent: *\nAllow: /',
  });

  const { data } = useQuery({
    queryKey: ['seo', activeTenantId, 'settings'],
    queryFn: () => api.get('/seo/settings').then((r) => r.data),
    enabled: !!activeTenantId,
  });

  useEffect(() => {
    if (data) {
      setForm((prev) => ({
        ...prev,
        siteName: data.siteName || { tr: '', en: '' },
        defaultMetaTitle: data.defaultMetaTitle || { tr: '', en: '' },
        defaultMetaDescription: data.defaultMetaDescription || { tr: '', en: '' },
        defaultOgImage: data.defaultOgImage || '',
        googleAnalyticsId: data.googleAnalyticsId || '',
        ga4PropertyId: data.ga4PropertyId || '',
        googleTagManagerId: data.googleTagManagerId || '',
        metaPixelId: data.metaPixelId || '',
        searchConsoleVerification: data.searchConsoleVerification || '',
        robotsTxt: data.robotsTxt || 'User-agent: *\nAllow: /',
      }));
    }
  }, [data]);

  const save = useMutation({
    mutationFn: (body) => api.put('/seo/settings', body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seo'] });
      toast.success('SEO ayarları kaydedildi');
    },
    onError: () => toast.error('Kaydedilemedi'),
  });

  const set = (field, value) => setForm((p) => ({ ...p, [field]: value }));
  const setLang = (field, lang, value) =>
    setForm((p) => ({ ...p, [field]: { ...p[field], [lang]: value } }));

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>SEO Ayarları</h1>
        <Button onClick={() => save.mutate(form)} disabled={save.isPending}>
          {save.isPending ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </div>

      {/* Tab bar */}
      <div className="flex border-b mb-6" style={{ borderColor: 'var(--border)' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === t.id ? 'border-b-2 border-blue-600' : ''
            }`}
            style={{ color: activeTab === t.id ? '#2563EB' : 'var(--text-muted)' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'general' && (
        <div className="space-y-5 rounded-xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Site Adı (TR)" value={form.siteName.tr} onChange={(e) => setLang('siteName', 'tr', e.target.value)} placeholder={activeCompany?.name || 'Site adı'} />
            <Input label="Site Adı (EN)" value={form.siteName.en} onChange={(e) => setLang('siteName', 'en', e.target.value)} placeholder={activeCompany?.name || 'Site adı'} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Meta Başlık (TR)" value={form.defaultMetaTitle.tr} onChange={(e) => setLang('defaultMetaTitle', 'tr', e.target.value)} />
            <Input label="Meta Başlık (EN)" value={form.defaultMetaTitle.en} onChange={(e) => setLang('defaultMetaTitle', 'en', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Textarea label="Meta Açıklama (TR)" rows={3} value={form.defaultMetaDescription.tr} onChange={(e) => setLang('defaultMetaDescription', 'tr', e.target.value)} />
            <Textarea label="Meta Açıklama (EN)" rows={3} value={form.defaultMetaDescription.en} onChange={(e) => setLang('defaultMetaDescription', 'en', e.target.value)} />
          </div>
          <ImageUrlInput label="Varsayılan OG Görseli URL" value={form.defaultOgImage} onChange={(e) => set('defaultOgImage', e.target.value)} hint="1200×630px" />
          <div className="border-t pt-4 space-y-4" style={{ borderColor: 'var(--border)' }}>
            <Input label="Google Analytics ID (Measurement ID)" value={form.googleAnalyticsId} onChange={(e) => set('googleAnalyticsId', e.target.value)} placeholder="G-XXXXXXXXXX" />
            <Input label="GA4 Property ID (Dashboard verisi için)" value={form.ga4PropertyId} onChange={(e) => set('ga4PropertyId', e.target.value)} placeholder="320484123" hint="GA4 Admin → Property Settings → Property ID (sadece sayı)" />
            <Input label="Google Tag Manager ID" value={form.googleTagManagerId} onChange={(e) => set('googleTagManagerId', e.target.value)} placeholder="GTM-XXXXXXX" />
            <Input label="Meta Pixel ID" value={form.metaPixelId} onChange={(e) => set('metaPixelId', e.target.value)} placeholder="000000000000000" />
            <Input label="Search Console Doğrulama Kodu" value={form.searchConsoleVerification} onChange={(e) => set('searchConsoleVerification', e.target.value)} placeholder="google-site-verification=..." />
          </div>
        </div>
      )}

      {activeTab === 'robots' && (
        <div className="rounded-xl border p-5 space-y-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
          <div>
            <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
              robots.txt dosyası arama motorlarına hangi sayfaları tarayacaklarını bildirir.
            </p>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              Dikkat: Yanlış yapılandırma sitenizin indekslenmesini engelleyebilir.
            </p>
          </div>
          <Textarea
            label="robots.txt içeriği"
            rows={12}
            value={form.robotsTxt}
            onChange={(e) => set('robotsTxt', e.target.value)}
            style={{ fontFamily: 'monospace' }}
          />
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => set('robotsTxt', 'User-agent: *\nAllow: /')}>
              Varsayılana döndür
            </Button>
            <Button size="sm" variant="secondary" onClick={() => set('robotsTxt', 'User-agent: *\nDisallow: /')}>
              Tümünü engelle
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'scripts' && (
        <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Özel script entegrasyonu için Google Analytics ID ve GTM ID alanlarını kullanın. Ham script ekleme özelliği yakında.
          </p>
          <div className="rounded-lg p-4 text-sm" style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
            Bu özellik bir sonraki sürümde eklenecek.
          </div>
        </div>
      )}

    </div>
  );
}
