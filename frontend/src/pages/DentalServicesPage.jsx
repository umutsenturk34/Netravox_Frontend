import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Input, Textarea, Select, ImageUrlInput } from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';

const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const ICONS = ['🦷', '🔬', '💎', '🩺', '✨', '🎯', '🏥', '💉', '👕', '🧥', '🧢', '👜', '⭐', '🎁', '📦', '🛍️'];

const SECTOR_LABELS = {
  dental:  { page: 'Diş Hekimi Hizmetleri', item: 'Hizmet', placeholder: 'Diş Beyazlatma', sizes: false },
  beauty:  { page: 'Güzellik Hizmetleri',   item: 'Hizmet', placeholder: 'Saç Boyama',     sizes: false },
  hotel:   { page: 'Hizmet & Olanaklar',    item: 'Hizmet', placeholder: 'Spa & Wellness', sizes: false },
  service: { page: 'Hizmetler',             item: 'Hizmet', placeholder: 'Hizmet adı',     sizes: false },
  other:   { page: 'Ürünler',               item: 'Ürün',   placeholder: 'Ürün adı',       sizes: true  },
  default: { page: 'Ürünler & Hizmetler',   item: 'Ürün',   placeholder: 'Ürün/Hizmet adı',sizes: true  },
};

const emptyService = {
  name: { tr: '', en: '' },
  description: { tr: '', en: '' },
  fullDescription: { tr: '', en: '' },
  material: { tr: '', en: '' },
  sizes: [],
  sizeGuide: { tr: '', en: '' },
  sizeGuideImage: '',
  category: '',
  sku: '',
  icon: '',
  image: '',
  price: '',
  currency: 'TRY',
  duration: '',
  isActive: true,
  order: 0,
};

// 3-state cycle: none → instock → outofstock → none
function getSizeState(sizes, name) {
  const found = (sizes || []).find(s => s.name === name);
  if (!found) return 'none';
  return found.inStock ? 'instock' : 'outofstock';
}
function toggleSize(sizes, name) {
  const state = getSizeState(sizes, name);
  if (state === 'none')       return [...sizes, { name, inStock: true }];
  if (state === 'instock')    return sizes.map(s => s.name === name ? { ...s, inStock: false } : s);
  return sizes.filter(s => s.name !== name);
}

function SizeChip({ name, state, onClick }) {
  const styles = {
    none:       'border border-dashed text-[var(--text-muted)] hover:border-green-400 hover:text-green-600',
    instock:    'bg-green-500 text-white border border-green-500',
    outofstock: 'bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 border border-red-300 dark:border-red-700 line-through',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      title={state === 'none' ? 'Eklemek için tıkla' : state === 'instock' ? 'Stok yok yapmak için tıkla' : 'Kaldırmak için tıkla'}
      className={`w-11 h-11 rounded-lg text-xs font-bold transition-all ${styles[state]}`}
    >
      {name}
    </button>
  );
}

function FormSection({ title, children }) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-bold uppercase tracking-wider pb-1 border-b" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
        {title}
      </p>
      {children}
    </div>
  );
}

export default function DentalServicesPage() {
  const { toast } = useToast();
  const { activeTenantId, activeCompany } = useAuth();
  const labels = SECTOR_LABELS[activeCompany?.sector] || SECTOR_LABELS.default;
  const qc = useQueryClient();

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyService);
  const [tab, setTab] = useState('tr');
  const [customSize, setCustomSize] = useState('');
  const [filterSearch,   setFilterSearch]   = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services', activeTenantId],
    queryFn: () => api.get('/services').then((r) => r.data),
    enabled: !!activeTenantId,
  });

  const save = useMutation({
    mutationFn: (data) =>
      editing
        ? api.patch(`/services/${editing._id}`, data).then((r) => r.data)
        : api.post('/services', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
      toast.success(editing ? `${labels.item} güncellendi` : `${labels.item} oluşturuldu`);
      closeModal();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Hata oluştu'),
  });

  const del = useMutation({
    mutationFn: (id) => api.delete(`/services/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
      toast.success(`${labels.item} silindi`);
    },
  });

  const toggle = useMutation({
    mutationFn: ({ id, isActive }) => api.patch(`/services/${id}`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  });

  function openNew() {
    setEditing(null);
    setForm(emptyService);
    setTab('tr');
    setModal(true);
  }

  function openEdit(svc) {
    setEditing(svc);
    setForm({
      name: { tr: svc.name?.tr || '', en: svc.name?.en || '' },
      description: { tr: svc.description?.tr || '', en: svc.description?.en || '' },
      fullDescription: { tr: svc.fullDescription?.tr || '', en: svc.fullDescription?.en || '' },
      material: { tr: svc.material?.tr || '', en: svc.material?.en || '' },
      sizes: svc.sizes || [],
      sizeGuide: { tr: svc.sizeGuide?.tr || '', en: svc.sizeGuide?.en || '' },
      sizeGuideImage: svc.sizeGuideImage || '',
      category: svc.category || '',
      sku: svc.sku || '',
      icon: svc.icon || '',
      image: svc.image || '',
      price: svc.price || '',
      currency: svc.currency || 'TRY',
      duration: svc.duration || '',
      isActive: svc.isActive ?? true,
      order: svc.order || 0,
    });
    setTab('tr');
    setModal(true);
  }

  function closeModal() {
    setModal(false);
    setEditing(null);
    setCustomSize('');
  }

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));
  const setNested = (key, l, val) => setForm((p) => ({ ...p, [key]: { ...p[key], [l]: val } }));

  function addCustomSize() {
    const name = customSize.trim().toUpperCase();
    if (!name || form.sizes.find(s => s.name === name)) return;
    set('sizes', [...form.sizes, { name, inStock: true }]);
    setCustomSize('');
  }

  function handleSubmit(e) {
    e.preventDefault();
    save.mutate(form);
  }

  // Sizes shown on card
  const sizePreview = (svc) => {
    if (!svc.sizes?.length) return null;
    const inStock = svc.sizes.filter(s => s.inStock).map(s => s.name).join(' · ');
    const out     = svc.sizes.filter(s => !s.inStock).map(s => s.name).join(' · ');
    return { inStock, out };
  };

  // Unique categories for filter
  const allCategories = [...new Set(services.map(s => s.category).filter(Boolean))].sort();

  // Apply filters
  const displayed = services.filter(svc => {
    const q = filterSearch.trim().toLowerCase();
    const matchSearch = !q ||
      svc.name?.tr?.toLowerCase().includes(q) ||
      svc.name?.en?.toLowerCase().includes(q) ||
      svc.sku?.toLowerCase().includes(q) ||
      svc._id?.toLowerCase().includes(q);
    const matchCat = !filterCategory || svc.category === filterCategory;
    return matchSearch && matchCat;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{labels.page}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {activeCompany?.name || ''} — {labels.item} yönetimi
          </p>
        </div>
        <Button onClick={openNew}>+ Yeni {labels.item}</Button>
      </div>

      {/* ── Filtre Bar ── */}
      {!isLoading && services.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-5 p-4 rounded-xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          {/* Arama */}
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-muted)' }}>🔍</span>
            <input
              type="text"
              value={filterSearch}
              onChange={e => setFilterSearch(e.target.value)}
              placeholder="Ad, SKU veya ID ile ara..."
              className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              style={{ background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: '14px' }}
            />
            {filterSearch && (
              <button onClick={() => setFilterSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-1.5" style={{ color: 'var(--text-muted)' }}>✕</button>
            )}
          </div>
          {/* Kategori filtresi */}
          {allCategories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <button
                onClick={() => setFilterCategory('')}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${!filterCategory ? 'bg-blue-600 text-white' : 'hover:bg-[var(--bg-muted)]'}`}
                style={filterCategory ? { color: 'var(--text-primary)' } : {}}
              >
                Tümü ({services.length})
              </button>
              {allCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat === filterCategory ? '' : cat)}
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${filterCategory === cat ? 'bg-blue-600 text-white' : 'hover:bg-[var(--bg-muted)]'}`}
                  style={filterCategory !== cat ? { color: 'var(--text-primary)' } : {}}
                >
                  {cat} ({services.filter(s => s.category === cat).length})
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 rounded-xl animate-pulse" style={{ background: 'var(--bg-muted)' }} />
          ))}
        </div>
      ) : services.length === 0 ? (
        <EmptyState
          title={`Henüz ${labels.item.toLowerCase()} yok`}
          description={`İlk ${labels.item.toLowerCase()}ü ekleyin.`}
          action={<Button onClick={openNew}>+ Yeni {labels.item}</Button>}
        />
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 rounded-xl border" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
          <p className="text-2xl mb-3">🔍</p>
          <p className="font-medium">Sonuç bulunamadı</p>
          <p className="text-sm mt-1">Arama veya filtre kriterlerini değiştirin</p>
          <button onClick={() => { setFilterSearch(''); setFilterCategory(''); }} className="mt-3 text-sm text-blue-600 hover:underline">
            Filtreleri temizle
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayed.map((svc) => {
            const sp = sizePreview(svc);
            return (
              <div
                key={svc._id}
                className="rounded-xl border flex flex-col overflow-hidden transition-shadow hover:shadow-lg"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
              >
                {/* ── Görsel alanı ── */}
                <div className="relative h-44 flex-shrink-0 overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
                  {svc.image ? (
                    <img
                      src={svc.image}
                      alt={svc.name?.tr || ''}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                    />
                  ) : null}
                  {/* Placeholder — gösterilir eğer görsel yoksa veya yüklenemezse */}
                  <div
                    className="w-full h-full items-center justify-center flex-col gap-1"
                    style={{ display: svc.image ? 'none' : 'flex' }}
                  >
                    <span className="text-4xl opacity-30">{svc.icon || '📦'}</span>
                    <span className="text-[11px] font-medium opacity-40" style={{ color: 'var(--text-muted)' }}>Görsel yok</span>
                  </div>

                  {/* Aktif/Pasif rozet — görselin üzerinde */}
                  <span className={`absolute top-2.5 right-2.5 text-[11px] px-2.5 py-1 rounded-full font-semibold shadow-sm backdrop-blur-sm ${
                    svc.isActive
                      ? 'bg-green-500/90 text-white'
                      : 'bg-black/40 text-white/80'
                  }`}>
                    {svc.isActive ? 'Aktif' : 'Pasif'}
                  </span>

                  {/* Fiyat rozeti — sol alt */}
                  {svc.price && (
                    <span className="absolute bottom-2.5 left-2.5 text-xs px-2.5 py-1 rounded-full font-bold shadow-sm backdrop-blur-sm bg-black/60 text-white">
                      {svc.price.toLocaleString('tr-TR')} {svc.currency === 'TRY' ? '₺' : svc.currency}
                    </span>
                  )}

                  {/* Hızlı eylem butonları — hover'da görsel üzerinde */}
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors duration-200 flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
                    <button
                      onClick={() => openEdit(svc)}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-white text-gray-900 shadow transition-transform hover:scale-105"
                    >
                      Düzenle
                    </button>
                  </div>
                </div>

                {/* ── Kart içeriği ── */}
                <div className="p-4 flex flex-col gap-2.5 flex-1">
                  {/* Ad + kategori + SKU */}
                  <div>
                    <p className="font-semibold text-sm leading-tight" style={{ color: 'var(--text-primary)' }}>{svc.name?.tr}</p>
                    {svc.name?.en && <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{svc.name.en}</p>}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {svc.category && (
                      <span
                        className="text-[11px] px-2 py-0.5 rounded-md font-medium cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}
                        onClick={() => setFilterCategory(svc.category)}
                        title="Bu kategoriye göre filtrele"
                      >
                        📂 {svc.category}
                      </span>
                    )}
                    {svc.sku && (
                      <span className="text-[11px] px-2 py-0.5 rounded-md font-mono"
                        style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
                        # {svc.sku}
                      </span>
                    )}
                  </div>

                  {svc.description?.tr && (
                    <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-muted)' }}>{svc.description.tr}</p>
                  )}

                  {sp && (
                    <div className="text-[11px] space-y-0.5">
                      {sp.inStock && <p className="text-green-600 dark:text-green-400">✓ {sp.inStock}</p>}
                      {sp.out     && <p className="text-red-400 line-through">{sp.out}</p>}
                    </div>
                  )}

                  {/* Ayırıcı + aksiyon butonları */}
                  <div className="flex gap-1.5 pt-2 mt-auto border-t" style={{ borderColor: 'var(--border)' }}>
                    <button
                      onClick={() => openEdit(svc)}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => toggle.mutate({ id: svc._id, isActive: !svc.isActive })}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors hover:bg-[var(--bg-muted)]"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {svc.isActive ? 'Pasifleştir' : 'Aktifleştir'}
                    </button>
                    <button
                      onClick={() => { if (confirm(`${labels.item}i silmek istediğinize emin misiniz?`)) del.mutate(svc._id); }}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 ml-auto"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modal} onClose={closeModal} size="lg" title={editing ? `${labels.item} Düzenle` : `Yeni ${labels.item}`}>
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── Dil sekmesi ── */}
          <div className="flex gap-2">
            {['tr', 'en'].map((l) => (
              <button type="button" key={l} onClick={() => setTab(l)}
                className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-colors ${tab === l ? 'bg-blue-600 text-white' : 'hover:bg-[var(--bg-muted)]'}`}
                style={tab !== l ? { color: 'var(--text-primary)' } : {}}>
                {l === 'tr' ? '🇹🇷 Türkçe' : '🇬🇧 English'}
              </button>
            ))}
          </div>

          {/* ── Temel Bilgiler ── */}
          <FormSection title="Temel Bilgiler">
            <Input
              label={`${labels.item} Adı *`}
              required
              value={form.name[tab]}
              onChange={(e) => setNested('name', tab, e.target.value)}
              placeholder={tab === 'tr' ? labels.placeholder : 'Product name'}
            />
            <Textarea
              label="Kısa Açıklama"
              value={form.description[tab]}
              onChange={(e) => setNested('description', tab, e.target.value)}
              rows={2}
              placeholder={tab === 'tr' ? 'Listede görünen kısa açıklama...' : 'Short description shown in listing...'}
            />
            <Textarea
              label="Detaylı Açıklama"
              value={form.fullDescription[tab]}
              onChange={(e) => setNested('fullDescription', tab, e.target.value)}
              rows={3}
              placeholder={tab === 'tr' ? 'Ürün detay sayfasında görünecek açıklama...' : 'Full description on product detail page...'}
            />
            <Input
              label="Kumaş / Malzeme Bilgisi"
              value={form.material[tab]}
              onChange={(e) => setNested('material', tab, e.target.value)}
              placeholder={tab === 'tr' ? '%100 Organik Pamuk, 220 GSM...' : '100% Organic Cotton, 220 GSM...'}
            />
          </FormSection>

          {/* ── Bedenler (sadece ürün sektörlerinde) ── */}
          {labels.sizes && (
            <FormSection title="Bedenler ve Stok Durumu">
              <div className="flex items-center gap-3 flex-wrap text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> Stokta var</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-200 inline-block" /> Stok yok</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border border-dashed border-current inline-block" style={{ color: 'var(--text-muted)' }} /> Eklenmemiş</span>
                <span className="ml-auto opacity-60">Tıklayarak durum değiştir</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_SIZES.map(name => (
                  <SizeChip
                    key={name}
                    name={name}
                    state={getSizeState(form.sizes, name)}
                    onClick={() => set('sizes', toggleSize(form.sizes, name))}
                  />
                ))}
                {/* Özel bedenler */}
                {form.sizes
                  .filter(s => !DEFAULT_SIZES.includes(s.name))
                  .map(s => (
                    <SizeChip
                      key={s.name}
                      name={s.name}
                      state={getSizeState(form.sizes, s.name)}
                      onClick={() => set('sizes', toggleSize(form.sizes, s.name))}
                    />
                  ))
                }
              </div>
              {/* Özel beden ekle */}
              <div className="flex gap-2 items-center mt-1">
                <input
                  type="text"
                  value={customSize}
                  onChange={e => setCustomSize(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomSize())}
                  placeholder="Özel beden (örn: 3XL, ONE SIZE...)"
                  className="flex-1 text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
                <button
                  type="button"
                  onClick={addCustomSize}
                  className="text-sm px-3 py-2 rounded-lg font-medium transition-colors bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100"
                >
                  + Ekle
                </button>
              </div>
            </FormSection>
          )}

          {/* ── Beden Rehberi (sadece ürün sektörlerinde) ── */}
          {labels.sizes && (
            <FormSection title="Beden Rehberi">
              <p className="text-xs -mt-1" style={{ color: 'var(--text-muted)' }}>
                Web sitesinde "Beden Rehberi" linkine tıklandığında açılır. Her ürün için farklı rehber tanımlayabilirsiniz.
              </p>
              <Textarea
                label={tab === 'tr' ? 'Beden Rehberi İçeriği (Türkçe)' : 'Size Guide Content (English)'}
                value={form.sizeGuide[tab]}
                onChange={(e) => setNested('sizeGuide', tab, e.target.value)}
                rows={3}
                placeholder={tab === 'tr'
                  ? 'XS: Göğüs 80–84 cm, Bel 60–64 cm\nS: Göğüs 84–88 cm, Bel 64–68 cm\n...'
                  : 'XS: Chest 80–84 cm, Waist 60–64 cm\nS: Chest 84–88 cm, Waist 64–68 cm\n...'}
              />
              <ImageUrlInput
                label="Beden Rehberi Görsel URL (isteğe bağlı)"
                value={form.sizeGuideImage}
                onChange={(e) => set('sizeGuideImage', e.target.value)}
                placeholder="https://... (tablo görseli)"
                hint="800×500px"
              />
            </FormSection>
          )}

          {/* ── Kategori & SKU ── */}
          <FormSection title="Kategori ve Ürün Kodu">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Kategori
                </label>
                <input
                  type="text"
                  list="category-suggestions"
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                  placeholder="T-Shirts, Hoodies..."
                  className="w-full rounded-lg px-3.5 py-2.5 border outline-none transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  style={{ background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: '16px' }}
                />
                <datalist id="category-suggestions">
                  {allCategories.map(cat => <option key={cat} value={cat} />)}
                </datalist>
                {form.category && (
                  <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                    Bu kategori web sitesinde filtre olarak görünecek
                  </p>
                )}
              </div>
              <Input
                label="Ürün Kodu (SKU)"
                value={form.sku}
                onChange={(e) => set('sku', e.target.value)}
                placeholder="VLT-001"
              />
            </div>
            {allCategories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Mevcut kategoriler:</span>
                {allCategories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => set('category', cat)}
                    className={`text-[11px] px-2 py-0.5 rounded-full transition-colors ${form.category === cat ? 'bg-blue-600 text-white' : 'hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
                    style={form.category !== cat ? { background: 'var(--bg-muted)', color: 'var(--text-muted)' } : {}}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </FormSection>

          {/* ── Fiyat & Görünüm ── */}
          <FormSection title="Fiyat ve Görünüm">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Fiyat"
                type="number"
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
                placeholder="1500"
              />
              <Select
                label="Para Birimi"
                value={form.currency}
                onChange={(e) => set('currency', e.target.value)}
              >
                <option value="TRY">₺ TRY</option>
                <option value="USD">$ USD</option>
                <option value="EUR">€ EUR</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>İkon</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {ICONS.map((ic) => (
                  <button type="button" key={ic} onClick={() => set('icon', ic)}
                    className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${form.icon === ic ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-[var(--bg-muted)]'}`}>
                    {ic}
                  </button>
                ))}
              </div>
              <Input
                placeholder="veya buraya emoji yapıştır"
                value={form.icon}
                onChange={(e) => set('icon', e.target.value)}
              />
            </div>

            <ImageUrlInput
              label="Ürün Görseli URL"
              value={form.image}
              onChange={(e) => set('image', e.target.value)}
              hint="600×800px (3:4)"
            />

            <div className="grid grid-cols-2 gap-4">
              {!labels.sizes && (
                <Input
                  label="Süre"
                  value={form.duration}
                  onChange={(e) => set('duration', e.target.value)}
                  placeholder="45 dakika"
                />
              )}
              <Input
                label="Sıra"
                type="number"
                value={form.order}
                onChange={(e) => set('order', Number(e.target.value))}
              />
            </div>
          </FormSection>

          {/* ── Aktif toggle ── */}
          <div className="flex items-center gap-3 py-1">
            <input
              type="checkbox"
              id="svcActive"
              checked={form.isActive}
              onChange={(e) => set('isActive', e.target.checked)}
              className="accent-blue-600 w-4 h-4"
            />
            <label htmlFor="svcActive" className="text-sm" style={{ color: 'var(--text-primary)' }}>
              Aktif — web sitesinde görünsün
            </label>
          </div>

          {/* ── Kaydet ── */}
          <div className="flex gap-3 pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
            <Button type="submit" disabled={save.isPending} className="flex-1">
              {save.isPending ? 'Kaydediliyor...' : (editing ? 'Güncelle' : 'Kaydet')}
            </Button>
            <Button type="button" variant="ghost" onClick={closeModal}>İptal</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
