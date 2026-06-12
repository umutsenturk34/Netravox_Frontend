import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Input, Textarea, Select, ImageUrlInput } from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import { Tag, X } from 'lucide-react';

const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const ICONS = ['🦷', '🔬', '💎', '🩺', '✨', '🎯', '🏥', '💉', '👕', '🧥', '🧢', '👜', '⭐', '🎁', '📦', '🛍️', '🚗', '🚙', '🏎️', '🚌', '⚡'];

// extra: 'dental' | 'fitness' | 'education' | 'realEstate' | null
const SECTOR_LABELS = {
  // ── Kurumsal ──
  dental:       { page: 'Diş Hekimi Hizmetleri', item: 'Hizmet', placeholder: 'Diş Beyazlatma',        sizes: false, material: false, vehicle: false, category: false, sku: false, badge: false, gallery: false, categoryPlaceholder: '',                           extra: 'dental'     },
  clinic:       { page: 'Klinik Hizmetleri',      item: 'Hizmet', placeholder: 'Muayene',               sizes: false, material: false, vehicle: false, category: false, sku: false, badge: false, gallery: false, categoryPlaceholder: '',                           extra: null         },
  beauty:       { page: 'Güzellik Hizmetleri',    item: 'Hizmet', placeholder: 'Saç Boyama',            sizes: false, material: false, vehicle: false, category: false, sku: false, badge: false, gallery: false, categoryPlaceholder: '',                           extra: null         },
  hotel:        { page: 'Hizmet & Olanaklar',     item: 'Hizmet', placeholder: 'Spa & Wellness',        sizes: false, material: false, vehicle: false, category: false, sku: false, badge: false, gallery: false, categoryPlaceholder: '',                           extra: null         },
  law:          { page: 'Hukuk Hizmetleri',       item: 'Hizmet', placeholder: 'Gayrimenkul Hukuku',    sizes: false, material: false, vehicle: false, category: true,  sku: false, badge: false, gallery: false, categoryPlaceholder: 'Ceza, Ticaret, Aile...',    extra: null         },
  accounting:   { page: 'Muhasebe Hizmetleri',   item: 'Hizmet', placeholder: 'Vergi Danışmanlığı',    sizes: false, material: false, vehicle: false, category: true,  sku: false, badge: false, gallery: false, categoryPlaceholder: 'Vergi, SGK, Denetim...',    extra: null         },
  architecture: { page: 'Mimarlık Hizmetleri',   item: 'Hizmet', placeholder: 'İç Mimarlık Projesi',   sizes: false, material: false, vehicle: false, category: true,  sku: false, badge: false, gallery: false, categoryPlaceholder: 'İç Mimarlık, Peyzaj...',    extra: null         },
  agency:       { page: 'Ajans Hizmetleri',       item: 'Hizmet', placeholder: 'SEO Paketi',            sizes: false, material: false, vehicle: false, category: true,  sku: false, badge: false, gallery: false, categoryPlaceholder: 'SEO, Sosyal Medya, Web...',  extra: null         },
  education:    { page: 'Kurslar & Eğitimler',   item: 'Kurs',   placeholder: 'İngilizce Kursu',        sizes: false, material: false, vehicle: false, category: true,  sku: false, badge: false, gallery: false, categoryPlaceholder: 'Dil, Programlama, Sanat...', extra: 'education'  },
  fitness:      { page: 'Dersler & Paketler',     item: 'Ders',   placeholder: 'Yoga Dersi',             sizes: false, material: false, vehicle: false, category: true,  sku: false, badge: false, gallery: false, categoryPlaceholder: 'Yoga, Pilates, Crossfit...',  extra: 'fitness'   },
  real_estate:  { page: 'Emlak İlanları',          item: 'İlan',   placeholder: 'Satılık Daire',         sizes: false, material: false, vehicle: false, category: true,  sku: false, badge: false, gallery: true,  categoryPlaceholder: 'Daire, Villa, Arsa...',       extra: 'realEstate' },
  service:      { page: 'Hizmetler',              item: 'Hizmet', placeholder: 'Hizmet adı',             sizes: false, material: false, vehicle: false, category: false, sku: false, badge: false, gallery: false, categoryPlaceholder: '',                           extra: null         },
  other:        { page: 'Ürünler & Hizmetler',    item: 'Ürün',   placeholder: 'Ürün/Hizmet adı',      sizes: false, material: false, vehicle: false, category: false, sku: false, badge: false, gallery: false, categoryPlaceholder: '',                           extra: null         },
  // ── E-ticaret ──
  rent:             { page: 'Araç Filosu',   item: 'Araç', placeholder: 'Toyota Corolla',            sizes: false, material: false, vehicle: true,  category: true,  sku: false, badge: true,  gallery: false, categoryPlaceholder: 'SUV, Sedan, Van...',            extra: null         },
  retail:           { page: 'Ürünler',       item: 'Ürün', placeholder: 'Ürün adı',                  sizes: true,  material: true,  vehicle: false, category: true,  sku: true,  badge: true,  gallery: true,  categoryPlaceholder: 'T-Shirts, Hoodies...',          extra: null         },
  fashion:          { page: 'Koleksiyon',    item: 'Ürün', placeholder: 'Ürün adı',                  sizes: true,  material: true,  vehicle: false, category: true,  sku: true,  badge: true,  gallery: true,  categoryPlaceholder: 'Elbiseler, Pantolonlar...',     extra: null         },
  food:             { page: 'Ürünler',       item: 'Ürün', placeholder: 'Ürün adı',                  sizes: false, material: false, vehicle: false, category: true,  sku: true,  badge: true,  gallery: true,  categoryPlaceholder: 'Atıştırmalıklar, İçecekler...', extra: null        },
  cosmetics:        { page: 'Ürünler',       item: 'Ürün', placeholder: 'Ürün adı',                  sizes: false, material: false, vehicle: false, category: true,  sku: true,  badge: true,  gallery: true,  categoryPlaceholder: 'Cilt Bakım, Makyaj...',         extra: null         },
  sports:           { page: 'Ürünler',       item: 'Ürün', placeholder: 'Ürün adı',                  sizes: true,  material: false, vehicle: false, category: true,  sku: true,  badge: true,  gallery: true,  categoryPlaceholder: 'Ayakkabı, Forma, Ekipman...',   extra: null         },
  home_living:      { page: 'Ürünler',       item: 'Ürün', placeholder: 'Ürün adı',                  sizes: false, material: true,  vehicle: false, category: true,  sku: true,  badge: true,  gallery: true,  categoryPlaceholder: 'Mobilya, Tekstil, Dekor...',    extra: null         },
  jewelry:          { page: 'Ürünler',       item: 'Ürün', placeholder: 'Ürün adı',                  sizes: false, material: true,  vehicle: false, category: true,  sku: true,  badge: true,  gallery: true,  categoryPlaceholder: 'Yüzük, Kolye, Bileklik...',    extra: null         },
  restaurant_order: { page: 'Ürünler',       item: 'Ürün', placeholder: 'Ürün adı',                  sizes: false, material: false, vehicle: false, category: true,  sku: false, badge: false, gallery: true,  categoryPlaceholder: 'Başlangıçlar, Ana Yemekler...', extra: null        },
  default:          { page: 'Ürünler & Hizmetler', item: 'Ürün', placeholder: 'Ürün/Hizmet adı',    sizes: false, material: false, vehicle: false, category: false, sku: false, badge: false, gallery: false, categoryPlaceholder: '',                              extra: null         },
};

const FUEL_TYPES    = ['Benzin', 'Dizel', 'Hibrit', 'Elektrik', 'LPG', 'Benzin+LPG'];
const TRANSMISSIONS = ['Otomatik', 'Manuel', 'Yarı Otomatik'];
const LUGGAGE_OPTS  = ['Küçük (1 valiz)', 'Orta (2 valiz)', 'Büyük (3 valiz)', 'XL (4+ valiz)'];
const VEHICLE_CLASS = ['Ekonomik', 'Orta Segment', 'Üst Segment', 'SUV', 'Lüks', 'Pickup', 'Minivan', 'Elektrikli', 'Spor'];
const MILEAGE_OPTS  = ['300 km/gün', '500 km/gün', 'Sınırsız'];
const DIFFICULTY    = ['Başlangıç', 'Orta', 'İleri', 'Tüm Seviyeler'];
const EDU_LEVEL     = ['Başlangıç', 'Orta', 'İleri', 'Tüm Seviyeler'];
const HEATING_TYPES = ['Kombi', 'Merkezi', 'Doğalgaz', 'Elektrik', 'Soba', 'Klima', 'Yerden Isıtma', 'Diğer'];
const RE_TYPES      = ['Satılık', 'Kiralık', 'Günlük Kiralık', 'Devren'];

const emptyService = {
  name: { tr: '', en: '' },
  description: { tr: '', en: '' },
  fullDescription: { tr: '', en: '' },
  shortDescription: { tr: '', en: '' },
  material: { tr: '', en: '' },
  sizes: [],
  sizeGuide: { tr: '', en: '' },
  sizeGuideImage: '',
  badge: '',
  gallery: [],
  category: '',
  sku: '',
  icon: '',
  image: '',
  price: '',
  currency: 'TRY',
  duration: '',
  trackStock: false,
  stock: '',
  lowStockThreshold: '',
  campaignPrice: '',
  campaignStartDate: '',
  campaignEndDate: '',
  tags: [],
  seo: { metaTitle: { tr: '', en: '' }, metaDescription: { tr: '', en: '' }, slug: { tr: '', en: '' } },
  isActive: true,
  order: 0,
  specs: {
    brand: '', model: '', year: '', color: '',
    fuel: '', transmission: '', seats: '', luggage: '', class: '', mileage: '',
  },
  sectorFields: {},
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

export default function ServicesPage() {
  const { toast } = useToast();
  const { activeTenantId, activeCompany } = useAuth();
  const labels = SECTOR_LABELS[activeCompany?.sector] || SECTOR_LABELS.default;
  const qc = useQueryClient();

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyService);
  const [tab, setTab] = useState('tr');
  const [customSize, setCustomSize] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [galleryInput, setGalleryInput] = useState('');
  const [filterSearch,   setFilterSearch]   = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services', activeTenantId],
    queryFn: () => api.get('/services').then((r) => r.data),
    enabled: !!activeTenantId,
  });

  const { data: categoryOptions = [] } = useQuery({
    queryKey: ['categories', activeTenantId],
    queryFn: () => api.get('/categories').then((r) => r.data),
    enabled: !!activeTenantId && labels.category,
  });

  const updateCache = (updater) =>
    qc.setQueryData(['services', activeTenantId], (old) => updater(old || []));

  const save = useMutation({
    mutationFn: (data) =>
      editing
        ? api.patch(`/services/${editing._id}`, data).then((r) => r.data)
        : api.post('/services', data).then((r) => r.data),
    onSuccess: (saved) => {
      updateCache((old) => {
        const idx = old.findIndex((s) => s._id === saved._id);
        if (idx >= 0) { const n = [...old]; n[idx] = saved; return n; }
        return [...old, saved];
      });
      toast.success(editing ? `${labels.item} güncellendi` : `${labels.item} oluşturuldu`);
      closeModal();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Hata oluştu'),
  });

  const del = useMutation({
    mutationFn: (id) => api.delete(`/services/${id}`),
    onSuccess: (_, id) => {
      updateCache((old) => old.filter((s) => s._id !== id));
      toast.success(`${labels.item} silindi`);
    },
  });

  const toggle = useMutation({
    mutationFn: ({ id, isActive }) => api.patch(`/services/${id}`, { isActive }).then((r) => r.data),
    onSuccess: (saved) => {
      updateCache((old) => old.map((s) => (s._id === saved._id ? saved : s)));
    },
  });

  function openNew() {
    setEditing(null);
    setForm(emptyService);
    setTab('tr');
    setModal(true);
  }

  function openEdit(svc) {
    setEditing(svc);
    const catId = svc.category
      ? (typeof svc.category === 'object' ? svc.category._id : svc.category)
      : '';
    setForm({
      name: { tr: svc.name?.tr || '', en: svc.name?.en || '' },
      description: { tr: svc.description?.tr || '', en: svc.description?.en || '' },
      fullDescription: { tr: svc.fullDescription?.tr || '', en: svc.fullDescription?.en || '' },
      shortDescription: { tr: svc.shortDescription?.tr || '', en: svc.shortDescription?.en || '' },
      material: { tr: svc.material?.tr || '', en: svc.material?.en || '' },
      sizes: svc.sizes || [],
      sizeGuide: { tr: svc.sizeGuide?.tr || '', en: svc.sizeGuide?.en || '' },
      sizeGuideImage: svc.sizeGuideImage || '',
      badge: svc.badge || '',
      gallery: svc.gallery || [],
      category: catId,
      sku: svc.sku || '',
      icon: svc.icon || '',
      image: svc.image || '',
      price: svc.price || '',
      currency: svc.currency || 'TRY',
      duration: svc.duration || '',
      trackStock: svc.trackStock ?? false,
      stock: svc.stock ?? '',
      lowStockThreshold: svc.lowStockThreshold ?? '',
      campaignPrice: svc.campaignPrice ?? '',
      campaignStartDate: svc.campaignStartDate ? svc.campaignStartDate.slice(0, 10) : '',
      campaignEndDate: svc.campaignEndDate ? svc.campaignEndDate.slice(0, 10) : '',
      tags: svc.tags || [],
      seo: {
        metaTitle: { tr: svc.seo?.metaTitle?.tr || '', en: svc.seo?.metaTitle?.en || '' },
        metaDescription: { tr: svc.seo?.metaDescription?.tr || '', en: svc.seo?.metaDescription?.en || '' },
        slug: { tr: svc.seo?.slug?.tr || '', en: svc.seo?.slug?.en || '' },
      },
      isActive: svc.isActive ?? true,
      order: svc.order || 0,
      specs: {
        brand:        svc.specs?.brand        || '',
        model:        svc.specs?.model        || '',
        year:         svc.specs?.year         || '',
        color:        svc.specs?.color        || '',
        fuel:         svc.specs?.fuel         || '',
        transmission: svc.specs?.transmission || '',
        seats:        svc.specs?.seats        || '',
        luggage:      svc.specs?.luggage      || '',
        class:        svc.specs?.class        || '',
        mileage:      svc.specs?.mileage      || '',
      },
      sectorFields: svc.sectorFields
        ? Object.fromEntries(Object.entries(svc.sectorFields))
        : {},
    });
    setTab('tr');
    setModal(true);
  }

  function closeModal() {
    setModal(false);
    setEditing(null);
    setCustomSize('');
    setTagInput('');
    setGalleryInput('');
  }

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));
  const setNested = (key, l, val) => setForm((p) => ({ ...p, [key]: { ...p[key], [l]: val } }));
  const setSF = (key, val) => setForm((p) => ({ ...p, sectorFields: { ...p.sectorFields, [key]: val } }));

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

  // Category lookup helpers
  const catById = Object.fromEntries(categoryOptions.map((c) => [c._id, c]));
  function catName(id) {
    if (!id) return null;
    return catById[id]?.name?.tr || null;
  }

  // Apply filters
  const displayed = services.filter(svc => {
    const q = filterSearch.trim().toLowerCase();
    const matchSearch = !q ||
      svc.name?.tr?.toLowerCase().includes(q) ||
      svc.name?.en?.toLowerCase().includes(q) ||
      svc.sku?.toLowerCase().includes(q) ||
      svc._id?.toLowerCase().includes(q);
    const catId = svc.category
      ? (typeof svc.category === 'object' ? svc.category._id : svc.category)
      : '';
    const matchCat = !filterCategory || catId === filterCategory;
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
              placeholder={labels.sku ? 'Ad, SKU veya ID ile ara...' : 'Ad veya ID ile ara...'}
              className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              style={{ background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: '14px' }}
            />
            {filterSearch && (
              <button onClick={() => setFilterSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-1.5" style={{ color: 'var(--text-muted)' }}>✕</button>
            )}
          </div>
          {/* Kategori filtresi */}
          {labels.category && categoryOptions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <button
                onClick={() => setFilterCategory('')}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${!filterCategory ? 'bg-blue-600 text-white' : 'hover:bg-[var(--bg-muted)]'}`}
                style={filterCategory ? { color: 'var(--text-primary)' } : {}}
              >
                Tümü ({services.length})
              </button>
              {categoryOptions.map(cat => {
                const catCount = services.filter(s => {
                  const id = s.category ? (typeof s.category === 'object' ? s.category._id : s.category) : '';
                  return id === cat._id;
                }).length;
                return (
                  <button
                    key={cat._id}
                    onClick={() => setFilterCategory(cat._id === filterCategory ? '' : cat._id)}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${filterCategory === cat._id ? 'bg-blue-600 text-white' : 'hover:bg-[var(--bg-muted)]'}`}
                    style={filterCategory !== cat._id ? { color: 'var(--text-primary)' } : {}}
                  >
                    {cat.name?.tr} ({catCount})
                  </button>
                );
              })}
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
                      key={svc.image}
                      src={svc.image}
                      alt={svc.name?.tr || ''}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const ph = e.currentTarget.parentNode?.querySelector('[data-placeholder]');
                        if (ph) ph.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  {/* Placeholder — gösterilir eğer görsel yoksa veya yüklenemezse */}
                  <div
                    data-placeholder=""
                    className="w-full h-full items-center justify-center flex-col gap-1"
                    style={{ display: svc.image ? 'none' : 'flex' }}
                  >
                    <span className="text-4xl opacity-30">{svc.icon || '📦'}</span>
                    <span className="text-[11px] font-medium opacity-40" style={{ color: 'var(--text-muted)' }}>Görsel yok</span>
                  </div>

                  {/* Aktif/Pasif rozet — sağ üst */}
                  <span className={`absolute top-2.5 right-2.5 text-[11px] px-2.5 py-1 rounded-full font-semibold shadow-sm backdrop-blur-sm ${
                    svc.isActive
                      ? 'bg-green-500/90 text-white'
                      : 'bg-black/40 text-white/80'
                  }`}>
                    {svc.isActive ? 'Aktif' : 'Pasif'}
                  </span>

                  {/* Badge — sol üst */}
                  {svc.badge && (
                    <span className="absolute top-2.5 left-2.5 text-[10px] px-2 py-0.5 rounded-full font-bold bg-orange-500 text-white shadow-sm">
                      {svc.badge}
                    </span>
                  )}

                  {/* Galeri sayısı — sağ alt */}
                  {svc.gallery?.length > 0 && (
                    <span className="absolute bottom-2.5 right-2.5 text-[10px] px-1.5 py-0.5 rounded font-medium bg-black/50 text-white">
                      +{svc.gallery.length} 📷
                    </span>
                  )}

                  {/* Fiyat rozeti — sol alt */}
                  {svc.price && (
                    <span className="absolute bottom-2.5 left-2.5 text-xs px-2.5 py-1 rounded-full font-bold shadow-sm backdrop-blur-sm bg-black/60 text-white">
                      {svc.campaignPrice ? (
                        <>
                          <span className="line-through opacity-60 mr-1">
                            {svc.price.toLocaleString('tr-TR')}{svc.currency === 'TRY' ? '₺' : svc.currency}
                          </span>
                          <span className="text-yellow-300">
                            {svc.campaignPrice.toLocaleString('tr-TR')}{svc.currency === 'TRY' ? '₺' : svc.currency}
                          </span>
                        </>
                      ) : (
                        <>{svc.price.toLocaleString('tr-TR')} {svc.currency === 'TRY' ? '₺' : svc.currency}</>
                      )}
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

                  {(labels.category || labels.sku) && (
                    <div className="flex flex-wrap gap-1.5">
                      {labels.category && svc.category && (() => {
                        const cid = typeof svc.category === 'object' ? svc.category._id : svc.category;
                        const cname = catName(cid);
                        if (!cname) return null;
                        return (
                          <span
                            className="text-[11px] px-2 py-0.5 rounded-md font-medium cursor-pointer hover:opacity-80 transition-opacity"
                            style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}
                            onClick={() => setFilterCategory(cid)}
                            title="Bu kategoriye göre filtrele"
                          >
                            📂 {cname}
                          </span>
                        );
                      })()}
                      {labels.sku && svc.sku && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md font-mono"
                          style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
                          # {svc.sku}
                        </span>
                      )}
                    </div>
                  )}

                  {svc.description?.tr && (
                    <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-muted)' }}>{svc.description.tr}</p>
                  )}

                  {sp && (
                    <div className="text-[11px] space-y-0.5">
                      {sp.inStock && <p className="text-green-600 dark:text-green-400">✓ {sp.inStock}</p>}
                      {sp.out     && <p className="text-red-400 line-through">{sp.out}</p>}
                    </div>
                  )}

                  {svc.trackStock && (
                    <span className="text-[11px] px-2 py-0.5 rounded-md font-medium w-fit"
                      style={{
                        background: svc.stock > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        color: svc.stock > 0 ? '#059669' : '#dc2626',
                      }}>
                      {svc.stock > 0 ? `📦 ${svc.stock} adet stokta` : '⚠️ Stok tükendi'}
                    </span>
                  )}

                  {/* Sektöre özel özet bilgiler */}
                  {svc.sectorFields && Object.keys(svc.sectorFields).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {svc.sectorFields.difficulty && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md" style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
                          🎯 {svc.sectorFields.difficulty}
                        </span>
                      )}
                      {svc.sectorFields.level && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md" style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
                          📊 {svc.sectorFields.level}
                        </span>
                      )}
                      {svc.sectorFields.certificate && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md" style={{ background: 'rgba(16,185,129,0.1)', color: '#059669' }}>
                          🎓 Sertifika
                        </span>
                      )}
                      {svc.sectorFields.anesthesia && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
                          💉 Anestezi
                        </span>
                      )}
                      {svc.sectorFields.area && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md" style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
                          📐 {svc.sectorFields.area} m²
                        </span>
                      )}
                      {svc.sectorFields.rooms && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md" style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
                          🚪 {svc.sectorFields.rooms}
                        </span>
                      )}
                      {svc.sectorFields.listingType && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md" style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
                          {svc.sectorFields.listingType}
                        </span>
                      )}
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
              placeholder={tab === 'tr' ? 'Detay sayfasında görünecek açıklama...' : 'Full description on detail page...'}
            />
            {labels.material && (
              <Input
                label="Kumaş / Malzeme Bilgisi"
                value={form.material[tab]}
                onChange={(e) => setNested('material', tab, e.target.value)}
                placeholder={tab === 'tr' ? '%100 Organik Pamuk, 220 GSM...' : '100% Organic Cotton, 220 GSM...'}
              />
            )}
            {labels.badge && (
              <Input
                label="Rozet / Etiket (isteğe bağlı)"
                value={form.badge}
                onChange={(e) => set('badge', e.target.value)}
                placeholder="YENİ, Çok Satan, Fırsat, En Popüler..."
              />
            )}
          </FormSection>

          {/* ── Araç Özellikleri (sadece rent sektörü) ── */}
          {labels.vehicle && (
            <FormSection title="Araç Özellikleri">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Marka"
                  value={form.specs.brand}
                  onChange={(e) => setForm(p => ({ ...p, specs: { ...p.specs, brand: e.target.value } }))}
                  placeholder="Toyota, BMW, Tesla..."
                />
                <Input
                  label="Model"
                  value={form.specs.model}
                  onChange={(e) => setForm(p => ({ ...p, specs: { ...p.specs, model: e.target.value } }))}
                  placeholder="Corolla, 5 Serisi, Model 3..."
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Model Yılı"
                  value={form.specs.year}
                  onChange={(e) => setForm(p => ({ ...p, specs: { ...p.specs, year: e.target.value } }))}
                  placeholder="2024"
                />
                <Input
                  label="Renk"
                  value={form.specs.color}
                  onChange={(e) => setForm(p => ({ ...p, specs: { ...p.specs, color: e.target.value } }))}
                  placeholder="Beyaz, Siyah, Gri..."
                />
                <Input
                  label="Koltuk Sayısı"
                  value={form.specs.seats}
                  onChange={(e) => setForm(p => ({ ...p, specs: { ...p.specs, seats: e.target.value } }))}
                  placeholder="5"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Yakıt Türü</label>
                  <select
                    value={form.specs.fuel}
                    onChange={(e) => setForm(p => ({ ...p, specs: { ...p.specs, fuel: e.target.value } }))}
                    className="w-full rounded-lg px-3.5 py-2.5 border outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    style={{ background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: '16px' }}
                  >
                    <option value="">Seçin...</option>
                    {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Vites</label>
                  <select
                    value={form.specs.transmission}
                    onChange={(e) => setForm(p => ({ ...p, specs: { ...p.specs, transmission: e.target.value } }))}
                    className="w-full rounded-lg px-3.5 py-2.5 border outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    style={{ background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: '16px' }}
                  >
                    <option value="">Seçin...</option>
                    {TRANSMISSIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Araç Sınıfı</label>
                  <select
                    value={form.specs.class}
                    onChange={(e) => setForm(p => ({ ...p, specs: { ...p.specs, class: e.target.value } }))}
                    className="w-full rounded-lg px-3.5 py-2.5 border outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    style={{ background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: '16px' }}
                  >
                    <option value="">Seçin...</option>
                    {VEHICLE_CLASS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Bagaj</label>
                  <select
                    value={form.specs.luggage}
                    onChange={(e) => setForm(p => ({ ...p, specs: { ...p.specs, luggage: e.target.value } }))}
                    className="w-full rounded-lg px-3.5 py-2.5 border outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    style={{ background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: '16px' }}
                  >
                    <option value="">Seçin...</option>
                    {LUGGAGE_OPTS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>KM Limiti</label>
                  <select
                    value={form.specs.mileage}
                    onChange={(e) => setForm(p => ({ ...p, specs: { ...p.specs, mileage: e.target.value } }))}
                    className="w-full rounded-lg px-3.5 py-2.5 border outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    style={{ background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: '16px' }}
                  >
                    <option value="">Seçin...</option>
                    {MILEAGE_OPTS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            </FormSection>
          )}

          {/* ── Diş Hekimi Ek Alanları ── */}
          {labels.extra === 'dental' && (
            <FormSection title="Tedavi Detayları">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="sfAnesthesia"
                  checked={!!form.sectorFields.anesthesia}
                  onChange={(e) => setSF('anesthesia', e.target.checked)}
                  className="accent-blue-600 w-4 h-4"
                />
                <label htmlFor="sfAnesthesia" className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  Lokal anestezi uygulanır
                </label>
              </div>
            </FormSection>
          )}

          {/* ── Fitness Ek Alanları ── */}
          {labels.extra === 'fitness' && (
            <FormSection title="Ders Detayları">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Zorluk Seviyesi</label>
                  <select
                    value={form.sectorFields.difficulty || ''}
                    onChange={(e) => setSF('difficulty', e.target.value)}
                    className="w-full rounded-lg px-3.5 py-2.5 border outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    style={{ background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: '16px' }}
                  >
                    <option value="">Seçin...</option>
                    {DIFFICULTY.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <Input
                  label="Eğitmen Adı"
                  value={form.sectorFields.instructor || ''}
                  onChange={(e) => setSF('instructor', e.target.value)}
                  placeholder="Ayşe Kaya"
                />
              </div>
            </FormSection>
          )}

          {/* ── Eğitim Ek Alanları ── */}
          {labels.extra === 'education' && (
            <FormSection title="Kurs Detayları">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Seviye</label>
                  <select
                    value={form.sectorFields.level || ''}
                    onChange={(e) => setSF('level', e.target.value)}
                    className="w-full rounded-lg px-3.5 py-2.5 border outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    style={{ background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: '16px' }}
                  >
                    <option value="">Seçin...</option>
                    {EDU_LEVEL.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <Input
                  label="Eğitmen Adı"
                  value={form.sectorFields.instructor || ''}
                  onChange={(e) => setSF('instructor', e.target.value)}
                  placeholder="Mehmet Yılmaz"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="sfCertificate"
                  checked={!!form.sectorFields.certificate}
                  onChange={(e) => setSF('certificate', e.target.checked)}
                  className="accent-blue-600 w-4 h-4"
                />
                <label htmlFor="sfCertificate" className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  Sertifika verilir
                </label>
              </div>
            </FormSection>
          )}

          {/* ── Emlak Ek Alanları ── */}
          {labels.extra === 'realEstate' && (
            <FormSection title="Emlak Özellikleri">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>İlan Türü</label>
                  <select
                    value={form.sectorFields.listingType || ''}
                    onChange={(e) => setSF('listingType', e.target.value)}
                    className="w-full rounded-lg px-3.5 py-2.5 border outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    style={{ background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: '16px' }}
                  >
                    <option value="">Seçin...</option>
                    {RE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <Input
                  label="Alan (m²)"
                  type="number"
                  value={form.sectorFields.area || ''}
                  onChange={(e) => setSF('area', e.target.value)}
                  placeholder="120"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Oda Sayısı"
                  value={form.sectorFields.rooms || ''}
                  onChange={(e) => setSF('rooms', e.target.value)}
                  placeholder="3+1"
                />
                <Input
                  label="Kat"
                  value={form.sectorFields.floor || ''}
                  onChange={(e) => setSF('floor', e.target.value)}
                  placeholder="3 / 7"
                />
                <Input
                  label="Yapım Yılı"
                  value={form.sectorFields.buildYear || ''}
                  onChange={(e) => setSF('buildYear', e.target.value)}
                  placeholder="2018"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Isıtma</label>
                <select
                  value={form.sectorFields.heating || ''}
                  onChange={(e) => setSF('heating', e.target.value)}
                  className="w-full rounded-lg px-3.5 py-2.5 border outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  style={{ background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: '16px' }}
                >
                  <option value="">Seçin...</option>
                  {HEATING_TYPES.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </FormSection>
          )}

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

          {/* ── Kategori & SKU — sadece category veya sku bayrağı olan sektörlerde ── */}
          {(labels.category || labels.sku) && (
            <FormSection title={labels.category && labels.sku ? 'Kategori ve Ürün Kodu' : labels.category ? 'Kategori' : 'Ürün Kodu'}>
              <div className={labels.category && labels.sku ? 'grid grid-cols-2 gap-4' : ''}>
                {labels.category && (
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Kategori
                    </label>
                    {categoryOptions.length > 0 ? (
                      <select
                        value={form.category}
                        onChange={(e) => set('category', e.target.value)}
                        className="w-full rounded-lg px-3.5 py-2.5 border outline-none transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        style={{ background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: '16px' }}
                      >
                        <option value="">— Kategori seç —</option>
                        {categoryOptions.filter(c => !c.parent).map(root => {
                          const children = categoryOptions.filter(c => {
                            const pid = c.parent ? (typeof c.parent === 'object' ? c.parent._id : c.parent) : null;
                            return pid === root._id;
                          });
                          return (
                            <optgroup key={root._id} label={root.name?.tr}>
                              <option value={root._id}>{root.name?.tr}</option>
                              {children.map(child => (
                                <option key={child._id} value={child._id}>↳ {child.name?.tr}</option>
                              ))}
                            </optgroup>
                          );
                        })}
                      </select>
                    ) : (
                      <p className="text-xs italic py-2" style={{ color: 'var(--text-muted)' }}>
                        Henüz kategori yok — önce Kategoriler sayfasından kategori ekleyin.
                      </p>
                    )}
                  </div>
                )}
                {labels.sku && (
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Ürün Kodu (SKU)
                    </label>
                    {editing ? (
                      <div
                        className="w-full rounded-lg px-3.5 py-2.5 border font-mono text-sm select-all"
                        style={{ background: 'var(--bg-muted)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                      >
                        {form.sku || '—'}
                      </div>
                    ) : (
                      <div
                        className="w-full rounded-lg px-3.5 py-2.5 border text-sm italic"
                        style={{ background: 'var(--bg-muted)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                      >
                        Kayıt sonrası otomatik oluşturulur
                      </div>
                    )}
                  </div>
                )}
              </div>
            </FormSection>
          )}

          {/* ── Fiyat & Görünüm ── */}
          <FormSection title={labels.vehicle ? 'Günlük Fiyat ve Görünüm' : 'Fiyat ve Görünüm'}>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={labels.vehicle ? 'Günlük Fiyat (₺/gün)' : 'Fiyat'}
                type="number"
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
                placeholder={labels.vehicle ? '750' : '1500'}
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
              label="Ana Görsel URL"
              value={form.image}
              onChange={(e) => set('image', e.target.value)}
              hint="600×800px (3:4) — listede ve detay sayfasında kullanılır"
            />

            {labels.gallery && (
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider pb-1 border-b" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
                  Ek Görseller (Galeri)
                </p>
                {form.gallery.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.gallery.map((url, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={url}
                          alt={`Görsel ${i + 1}`}
                          className="w-16 h-16 object-cover rounded-lg border"
                          style={{ borderColor: 'var(--border)' }}
                          onError={(e) => { e.currentTarget.src = ''; e.currentTarget.style.display = 'none'; }}
                        />
                        <button
                          type="button"
                          onClick={() => set('gallery', form.gallery.filter((_, idx) => idx !== i))}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={galleryInput}
                    onChange={(e) => setGalleryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const url = galleryInput.trim();
                        if (url && !form.gallery.includes(url)) {
                          set('gallery', [...form.gallery, url]);
                          setGalleryInput('');
                        }
                      }
                    }}
                    placeholder="https://... görsel URL ekle"
                    className="flex-1 text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const url = galleryInput.trim();
                      if (url && !form.gallery.includes(url)) {
                        set('gallery', [...form.gallery, url]);
                        setGalleryInput('');
                      }
                    }}
                    className="text-sm px-3 py-2 rounded-lg font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-100 transition-colors"
                  >
                    + Ekle
                  </button>
                </div>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {form.gallery.length} görsel eklendi — detay sayfasında galeri olarak gösterilir
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {!labels.sizes && !labels.vehicle && (
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

          {/* ── Stok Takibi ── */}
          <FormSection title="Stok Takibi">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="trackStock"
                checked={form.trackStock}
                onChange={(e) => set('trackStock', e.target.checked)}
                className="accent-blue-600 w-4 h-4"
              />
              <label htmlFor="trackStock" className="text-sm" style={{ color: 'var(--text-primary)' }}>
                Stok takibi aktif — satın alınca stok otomatik düşer
              </label>
            </div>
            {form.trackStock && (
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Mevcut Stok Adedi"
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => set('stock', e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="100"
                />
                <Input
                  label="Düşük Stok Uyarı Eşiği"
                  type="number"
                  min="0"
                  value={form.lowStockThreshold}
                  onChange={(e) => set('lowStockThreshold', e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="10"
                  hint="Bu değerin altına düşünce uyarı verilir"
                />
              </div>
            )}
          </FormSection>

          {/* ── Kampanya Fiyatı ── */}
          <FormSection title="Kampanya / İndirim">
            <p className="text-xs -mt-1" style={{ color: 'var(--text-muted)' }}>
              Kampanya fiyatı girilirse web sitesinde orijinal fiyat üzeri çizili, kampanya fiyatı öne çıkarılmış gösterilir.
            </p>
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Kampanya Fiyatı"
                type="number"
                min="0"
                value={form.campaignPrice}
                onChange={(e) => set('campaignPrice', e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="999"
              />
              <Input
                label="Başlangıç Tarihi"
                type="date"
                value={form.campaignStartDate}
                onChange={(e) => set('campaignStartDate', e.target.value)}
              />
              <Input
                label="Bitiş Tarihi"
                type="date"
                value={form.campaignEndDate}
                onChange={(e) => set('campaignEndDate', e.target.value)}
              />
            </div>
            {form.campaignPrice && (
              <p className="text-[11px] text-green-600 dark:text-green-400">
                ✓ Kampanya fiyatı aktif
                {form.campaignStartDate && form.campaignEndDate
                  ? ` — ${form.campaignStartDate} ile ${form.campaignEndDate} arasında geçerli`
                  : ' — tarih sınırı yok'}
              </p>
            )}
          </FormSection>

          {/* ── Etiketler ── */}
          <FormSection title="Etiketler">
            <p className="text-xs -mt-1" style={{ color: 'var(--text-muted)' }}>
              Arama ve filtreleme için etiket ekleyin. Enter veya virgül ile ekleyin.
            </p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full"
                  style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)' }}
                >
                  <Tag size={10} />
                  {tag}
                  <button
                    type="button"
                    onClick={() => set('tags', form.tags.filter((t) => t !== tag))}
                    className="ml-0.5 hover:text-red-500"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    const tag = tagInput.trim().toLowerCase().replace(/,/g, '');
                    if (tag && !form.tags.includes(tag)) {
                      set('tags', [...form.tags, tag]);
                    }
                    setTagInput('');
                  }
                }}
                placeholder="etiket ekle..."
                className="flex-1 text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
              <button
                type="button"
                onClick={() => {
                  const tag = tagInput.trim().toLowerCase();
                  if (tag && !form.tags.includes(tag)) set('tags', [...form.tags, tag]);
                  setTagInput('');
                }}
                className="text-sm px-3 py-2 rounded-lg font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-100 transition-colors"
              >
                + Ekle
              </button>
            </div>
          </FormSection>

          {/* ── SEO ── */}
          <FormSection title="SEO">
            <Input
              label={`Meta Başlık (${tab.toUpperCase()})`}
              value={form.seo.metaTitle[tab]}
              onChange={(e) => setForm((p) => ({ ...p, seo: { ...p.seo, metaTitle: { ...p.seo.metaTitle, [tab]: e.target.value } } }))}
              placeholder={tab === 'tr' ? 'Sayfada görünen başlık...' : 'Page title...'}
              hint="~60 karakter önerilir"
            />
            <Textarea
              label={`Meta Açıklama (${tab.toUpperCase()})`}
              value={form.seo.metaDescription[tab]}
              onChange={(e) => setForm((p) => ({ ...p, seo: { ...p.seo, metaDescription: { ...p.seo.metaDescription, [tab]: e.target.value } } }))}
              rows={2}
              placeholder={tab === 'tr' ? 'Arama sonuçlarında görünen açıklama...' : 'Description in search results...'}
              hint="~160 karakter önerilir"
            />
            <Input
              label={`URL Slug (${tab.toUpperCase()})`}
              value={form.seo.slug[tab]}
              onChange={(e) => setForm((p) => ({ ...p, seo: { ...p.seo, slug: { ...p.seo.slug, [tab]: e.target.value } } }))}
              placeholder={tab === 'tr' ? 'urun-url-adresi' : 'product-url-path'}
              hint="Boş bırakılırsa sistem otomatik oluşturur"
            />
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
