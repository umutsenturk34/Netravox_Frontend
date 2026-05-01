import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Input, Textarea, Select } from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';

const TYPE_LABELS = { apartment: 'Daire', house: 'Müstakil', villa: 'Villa', office: 'Ofis', land: 'Arsa', commercial: 'İşyeri', other: 'Diğer' };

const emptyProperty = {
  title: { tr: '', en: '' },
  description: { tr: '', en: '' },
  price: '',
  currency: 'TRY',
  type: 'sale',
  propertyType: 'apartment',
  size: '',
  rooms: '',
  bathrooms: '',
  floor: '',
  totalFloors: '',
  buildYear: '',
  location: { address: '', district: '', city: '' },
  images: [''],
  features: '',
  status: 'available',
  isFeatured: false,
  isActive: true,
};

export default function PropertiesManagePage() {
  const { toast } = useToast();
  const { activeTenantId } = useAuth();
  const qc = useQueryClient();

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyProperty);
  const [tab, setTab] = useState('tr');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const queryParams = new URLSearchParams();
  if (filterType) queryParams.set('type', filterType);
  if (filterStatus) queryParams.set('status', filterStatus);

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['properties', activeTenantId, filterType, filterStatus],
    queryFn: () => api.get(`/properties?${queryParams.toString()}`).then((r) => r.data),
    enabled: !!activeTenantId,
  });

  const save = useMutation({
    mutationFn: (data) => {
      const payload = {
        ...data,
        images: data.images.filter(Boolean),
        features: typeof data.features === 'string' ? data.features.split(',').map((f) => f.trim()).filter(Boolean) : data.features,
      };
      return editing
        ? api.patch(`/properties/${editing._id}`, payload).then((r) => r.data)
        : api.post('/properties', payload).then((r) => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['properties'] });
      toast.success(editing ? 'İlan güncellendi' : 'İlan oluşturuldu');
      closeModal();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Hata oluştu'),
  });

  const del = useMutation({
    mutationFn: (id) => api.delete(`/properties/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['properties'] });
      toast.success('İlan silindi');
    },
  });

  const toggleFeatured = useMutation({
    mutationFn: ({ id, isFeatured }) => api.patch(`/properties/${id}`, { isFeatured }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['properties'] }),
  });

  function openNew() {
    setEditing(null);
    setForm(emptyProperty);
    setTab('tr');
    setModal(true);
  }

  function openEdit(p) {
    setEditing(p);
    setForm({
      title: { tr: p.title?.tr || '', en: p.title?.en || '' },
      description: { tr: p.description?.tr || '', en: p.description?.en || '' },
      price: p.price || '',
      currency: p.currency || 'TRY',
      type: p.type || 'sale',
      propertyType: p.propertyType || 'apartment',
      size: p.size || '',
      rooms: p.rooms || '',
      bathrooms: p.bathrooms || '',
      floor: p.floor || '',
      totalFloors: p.totalFloors || '',
      buildYear: p.buildYear || '',
      location: { address: p.location?.address || '', district: p.location?.district || '', city: p.location?.city || '' },
      images: p.images?.length ? p.images : [''],
      features: Array.isArray(p.features) ? p.features.join(', ') : '',
      status: p.status || 'available',
      isFeatured: p.isFeatured || false,
      isActive: p.isActive ?? true,
    });
    setTab('tr');
    setModal(true);
  }

  function closeModal() {
    setModal(false);
    setEditing(null);
  }

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));
  const setNested = (key, lang, val) => setForm((p) => ({ ...p, [key]: { ...p[key], [lang]: val } }));
  const setLoc = (key, val) => setForm((p) => ({ ...p, location: { ...p.location, [key]: val } }));
  const setImg = (i, val) => setForm((p) => { const imgs = [...p.images]; imgs[i] = val; return { ...p, images: imgs }; });

  function handleSubmit(e) {
    e.preventDefault();
    save.mutate(form);
  }

  const statusColor = { available: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', sold: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', rented: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', passive: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' };
  const statusLabel = { available: 'Aktif', sold: 'Satıldı', rented: 'Kiralandı', passive: 'Pasif' };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Emlak İlanları</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{properties.length} ilan listeleniyor</p>
        </div>
        <Button onClick={openNew}>+ Yeni İlan</Button>
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">Tüm Türler</option>
          <option value="sale">Satılık</option>
          <option value="rent">Kiralık</option>
        </Select>
        <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Tüm Durumlar</option>
          <option value="available">Aktif</option>
          <option value="sold">Satıldı</option>
          <option value="rented">Kiralandı</option>
          <option value="passive">Pasif</option>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'var(--bg-muted)' }} />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <EmptyState title="İlan bulunamadı" description="Filtrelerinizi değiştirin veya yeni ilan ekleyin." action={<Button onClick={openNew}>+ Yeni İlan</Button>} />
      ) : (
        <div className="space-y-3">
          {properties.map((p) => (
            <div key={p._id} className="rounded-xl border flex gap-4 overflow-hidden transition-shadow hover:shadow-md" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              {p.images?.[0] && (
                <img src={p.images[0]} alt="" className="w-24 h-20 object-cover shrink-0" />
              )}
              <div className="flex-1 py-3 pr-4 flex flex-col justify-center gap-1.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{p.title?.tr}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {TYPE_LABELS[p.propertyType] || p.propertyType} · {p.location?.district || p.location?.city}
                      {p.size && ` · ${p.size} m²`}
                      {p.rooms && ` · ${p.rooms} oda`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {p.isFeatured && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 font-medium">⭐ Öne Çıkan</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[p.status] || ''}`}>{statusLabel[p.status] || p.status}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.type === 'sale' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                      {p.type === 'sale' ? 'Satılık' : 'Kiralık'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
                    {p.price ? `${p.price.toLocaleString('tr-TR')} ${p.currency === 'TRY' ? '₺' : p.currency}` : 'Fiyat için arayın'}
                  </span>
                  <div className="flex gap-2 ml-auto">
                    <button onClick={() => toggleFeatured.mutate({ id: p._id, isFeatured: !p.isFeatured })}
                      className="text-xs px-2.5 py-1 rounded-lg transition-colors hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400">
                      {p.isFeatured ? '★ Öne Çıkan' : '☆ Öne Çıkar'}
                    </button>
                    <button onClick={() => openEdit(p)}
                      className="text-xs px-2.5 py-1 rounded-lg transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      style={{ color: 'var(--color-primary)' }}>
                      Düzenle
                    </button>
                    <button onClick={() => { if (confirm('İlanı silmek istediğinize emin misiniz?')) del.mutate(p._id); }}
                      className="text-xs px-2.5 py-1 rounded-lg transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400">
                      Sil
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={closeModal} title={editing ? 'İlan Düzenle' : 'Yeni İlan'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dil sekmesi */}
          <div className="flex gap-2 border-b pb-3" style={{ borderColor: 'var(--border)' }}>
            {['tr', 'en'].map((l) => (
              <button type="button" key={l} onClick={() => setTab(l)}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${tab === l ? 'bg-blue-600 text-white' : 'hover:bg-[var(--bg-muted)]'}`}
                style={tab !== l ? { color: 'var(--text-primary)' } : {}}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          <Input label="Başlık *" required value={form.title[tab]} onChange={(e) => setNested('title', tab, e.target.value)} placeholder={tab === 'tr' ? 'Boğaz Manzaralı 3+1 Daire' : '3+1 Apartment with Bosphorus View'} />
          <Textarea label="Açıklama" value={form.description[tab]} onChange={(e) => setNested('description', tab, e.target.value)} rows={3} />

          <div className="grid grid-cols-2 gap-4">
            <Select label="İlan Türü" value={form.type} onChange={(e) => set('type', e.target.value)}>
              <option value="sale">Satılık</option>
              <option value="rent">Kiralık</option>
            </Select>
            <Select label="Mülk Tipi" value={form.propertyType} onChange={(e) => set('propertyType', e.target.value)}>
              <option value="apartment">Daire</option>
              <option value="house">Müstakil</option>
              <option value="villa">Villa</option>
              <option value="office">Ofis</option>
              <option value="land">Arsa</option>
              <option value="commercial">İşyeri</option>
              <option value="other">Diğer</option>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input label="Fiyat" type="number" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="8500000" />
            <Select label="Para Birimi" value={form.currency} onChange={(e) => set('currency', e.target.value)}>
              <option value="TRY">₺ TRY</option>
              <option value="USD">$ USD</option>
              <option value="EUR">€ EUR</option>
            </Select>
            <Select label="Durum" value={form.status} onChange={(e) => set('status', e.target.value)}>
              <option value="available">Aktif</option>
              <option value="sold">Satıldı</option>
              <option value="rented">Kiralandı</option>
              <option value="passive">Pasif</option>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input label="m²" type="number" value={form.size} onChange={(e) => set('size', e.target.value)} placeholder="165" />
            <Input label="Oda Sayısı" type="number" value={form.rooms} onChange={(e) => set('rooms', e.target.value)} placeholder="3" />
            <Input label="Banyo" type="number" value={form.bathrooms} onChange={(e) => set('bathrooms', e.target.value)} placeholder="2" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input label="Kat" type="number" value={form.floor} onChange={(e) => set('floor', e.target.value)} placeholder="7" />
            <Input label="Toplam Kat" type="number" value={form.totalFloors} onChange={(e) => set('totalFloors', e.target.value)} placeholder="15" />
            <Input label="Yapım Yılı" type="number" value={form.buildYear} onChange={(e) => set('buildYear', e.target.value)} placeholder="2018" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input label="Adres" value={form.location.address} onChange={(e) => setLoc('address', e.target.value)} placeholder="Caddebostan Mah." />
            <Input label="İlçe" value={form.location.district} onChange={(e) => setLoc('district', e.target.value)} placeholder="Beşiktaş" />
            <Input label="Şehir" value={form.location.city} onChange={(e) => setLoc('city', e.target.value)} placeholder="İstanbul" />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Özellikler (virgülle ayırın)</label>
            <Input value={form.features} onChange={(e) => set('features', e.target.value)} placeholder="Deniz manzarası, Kapalı garaj, Merkezi ısıtma" />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Görseller (URL)</label>
            {form.images.map((img, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <Input value={img} onChange={(e) => setImg(i, e.target.value)} placeholder="https://..." />
                {i > 0 && (
                  <button type="button" onClick={() => setForm((p) => ({ ...p, images: p.images.filter((_, j) => j !== i) }))}
                    className="text-red-500 px-2 text-sm shrink-0">×</button>
                )}
              </div>
            ))}
            {form.images.length < 6 && (
              <button type="button" onClick={() => setForm((p) => ({ ...p, images: [...p.images, ''] }))}
                className="text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-[var(--bg-muted)]"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                + Görsel Ekle
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" id="propFeatured" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} className="accent-blue-600 w-4 h-4" />
            <label htmlFor="propFeatured" className="text-sm" style={{ color: 'var(--text-primary)' }}>Öne Çıkan İlan (Ana sayfada göster)</label>
          </div>

          <div className="flex gap-3 pt-2">
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
