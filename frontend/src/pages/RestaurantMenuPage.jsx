import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Input, Textarea, Select, ImageUrlInput } from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';

const emptyCat = { name: { tr: '', en: '' }, order: 0, isActive: true };
const emptyItem = {
  name: { tr: '', en: '' },
  description: { tr: '', en: '' },
  price: '',
  currency: 'TRY',
  categoryId: '',
  isActive: true,
  isFeatured: false,
  image: '',
  allergens: [],
};


export default function RestaurantMenuPage() {
  const { toast } = useToast();
  const { activeTenantId } = useAuth();
  const qc = useQueryClient();

  const [selectedCatId, setSelectedCatId] = useState(null);
  const [catModal, setCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catForm, setCatForm] = useState(emptyCat);

  const [itemModal, setItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState(emptyItem);
  const [itemTab, setItemTab] = useState('tr');

  const { data: cats = [] } = useQuery({
    queryKey: ['restaurant', activeTenantId, 'categories'],
    queryFn: () => api.get('/restaurant/categories').then((r) => r.data),
    enabled: !!activeTenantId,
  });

  const { data: items = [] } = useQuery({
    queryKey: ['restaurant', activeTenantId, 'items'],
    queryFn: () => api.get('/restaurant/items').then((r) => r.data),
    enabled: !!activeTenantId,
  });

  const selectedCat = cats.find((c) => c._id === selectedCatId) || cats[0] || null;
  const visibleItems = selectedCat
    ? items.filter((it) => it.categoryId?._id === selectedCat._id || it.categoryId === selectedCat._id)
    : items;

  // Category mutations
  const saveCat = useMutation({
    mutationFn: (data) =>
      editingCat
        ? api.patch(`/restaurant/categories/${editingCat._id}`, data).then((r) => r.data)
        : api.post('/restaurant/categories', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['restaurant', activeTenantId, 'categories'] });
      toast.success(editingCat ? 'Kategori güncellendi' : 'Kategori oluşturuldu');
      setCatModal(false);
      setCatForm(emptyCat);
      setEditingCat(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Kaydedilemedi'),
  });

  const deleteCat = useMutation({
    mutationFn: (id) => api.delete(`/restaurant/categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['restaurant', activeTenantId, 'categories'] });
      setSelectedCatId(null);
      toast.success('Kategori silindi');
    },
    onError: () => toast.error('Silinemedi'),
  });

  // Item mutations
  const saveItem = useMutation({
    mutationFn: (data) =>
      editingItem
        ? api.patch(`/restaurant/items/${editingItem._id}`, data).then((r) => r.data)
        : api.post('/restaurant/items', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['restaurant', activeTenantId, 'items'] });
      toast.success(editingItem ? 'Ürün güncellendi' : 'Ürün eklendi');
      setItemModal(false);
      setItemForm(emptyItem);
      setEditingItem(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Kaydedilemedi'),
  });

  const deleteItem = useMutation({
    mutationFn: (id) => api.delete(`/restaurant/items/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['restaurant', activeTenantId, 'items'] });
      toast.success('Ürün silindi');
    },
    onError: () => toast.error('Silinemedi'),
  });

  const toggleItemActive = useMutation({
    mutationFn: ({ id, isActive }) => api.patch(`/restaurant/items/${id}`, { isActive }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['restaurant', activeTenantId, 'items'] }),
  });

  const openNewCat = () => { setEditingCat(null); setCatForm(emptyCat); setCatModal(true); };
  const openEditCat = (cat) => {
    setEditingCat(cat);
    setCatForm({ name: cat.name || { tr: '', en: '' }, order: cat.order || 0, isActive: cat.isActive ?? true });
    setCatModal(true);
  };

  const openNewItem = () => {
    setEditingItem(null);
    setItemForm({ ...emptyItem, categoryId: selectedCat?._id || '' });
    setItemTab('tr');
    setItemModal(true);
  };
  const openEditItem = (item) => {
    setEditingItem(item);
    setItemForm({
      name: item.name || { tr: '', en: '' },
      description: item.description || { tr: '', en: '' },
      price: item.price || '',
      currency: item.currency || 'TRY',
      categoryId: item.categoryId?._id || item.categoryId || '',
      isActive: item.isActive ?? true,
      isFeatured: item.isFeatured ?? false,
      image: item.image || '',
      allergens: item.allergens || [],
    });
    setItemTab('tr');
    setItemModal(true);
  };

  const setItem = (path, value) => {
    setItemForm((prev) => {
      const next = { ...prev };
      const keys = path.split('.');
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) {
        cur[keys[i]] = { ...cur[keys[i]] };
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const addAllergen = (e) => {
    if (!['Enter', ','].includes(e.key)) return;
    e.preventDefault();
    const val = e.target.value.trim().replace(/,/g, '');
    if (!val || itemForm.allergens.includes(val)) { e.target.value = ''; return; }
    setItemForm((prev) => ({ ...prev, allergens: [...prev.allergens, val] }));
    e.target.value = '';
  };

  const removeAllergen = (a) => {
    setItemForm((prev) => ({ ...prev, allergens: prev.allergens.filter((x) => x !== a) }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Restoran Menüsü</h1>
        <Button onClick={openNewItem}>+ Ürün Ekle</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Kategoriler */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Kategoriler</h2>
            <button onClick={openNewCat} className="text-xs text-blue-600 hover:underline">+ Ekle</button>
          </div>
          <div className="space-y-1">
            <div
              onClick={() => setSelectedCatId(null)}
              className={`px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${!selectedCat ? 'bg-blue-50 text-blue-700' : 'hover:bg-[var(--bg-muted)]'}`}
              style={selectedCat ? { color: 'var(--text-primary)' } : {}}
            >
              Tümü
            </div>
            {cats.map((c) => (
              <div
                key={c._id}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors group ${
                  selectedCat?._id === c._id ? 'bg-blue-50 text-blue-700' : 'hover:bg-[var(--bg-muted)]'
                }`}
                style={selectedCat?._id !== c._id ? { color: 'var(--text-primary)' } : {}}
                onClick={() => setSelectedCatId(c._id)}
              >
                <span>{c.name?.tr || c.name?.en}</span>
                <div className="hidden group-hover:flex gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEditCat(c); }}
                    className="text-xs px-1.5 py-0.5 rounded hover:bg-[var(--bg-muted)]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    ✎
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteCat.mutate(c._id); }}
                    className="text-xs px-1.5 py-0.5 rounded hover:bg-red-50 text-red-500"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
            {!cats.length && (
              <p className="text-xs py-4 text-center" style={{ color: 'var(--text-muted)' }}>Kategori yok</p>
            )}
          </div>
        </div>

        {/* Ürünler */}
        <div className="lg:col-span-3">
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            <table className="w-full text-sm">
              <thead style={{ background: 'var(--bg-muted)' }}>
                <tr>
                  {['Ürün', 'Kategori', 'Fiyat', 'Durum', ''].map((h, i) => (
                    <th key={i} className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody style={{ background: 'var(--bg-surface)' }}>
                {visibleItems.map((item) => (
                  <tr key={item._id} className="border-t hover:bg-[var(--bg-muted)] transition-colors" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {item.image ? (
                          <img src={item.image} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-lg"
                            style={{ background: 'var(--bg-muted)' }}>🍽️</div>
                        )}
                        <div>
                          <div className="font-medium flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                            {item.name?.tr}
                            {item.isFeatured && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: '#8B1A1A', color: '#fff' }}>Öne Çıkan</span>
                            )}
                          </div>
                          {item.description?.tr && (
                            <div className="text-xs truncate max-w-xs" style={{ color: 'var(--text-muted)' }}>{item.description.tr}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                      {item.categoryId?.name?.tr || '—'}
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                      {item.price ? `${item.price} ${item.currency || 'TRY'}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleItemActive.mutate({ id: item._id, isActive: !item.isActive })}
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer ${
                          item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {item.isActive ? 'Aktif' : 'Pasif'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEditItem(item)} className="text-xs px-2 py-1 rounded hover:bg-[var(--bg-muted)]" style={{ color: 'var(--text-muted)' }}>Düzenle</button>
                        <button onClick={() => deleteItem.mutate(item._id)} className="text-xs px-2 py-1 rounded hover:bg-red-50 text-red-500">Sil</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!visibleItems.length && (
                  <tr>
                    <td colSpan={5} className="py-0">
                      <EmptyState
                        title="Henüz ürün yok"
                        description={selectedCat ? `${selectedCat.name?.tr} kategorisinde ürün bulunmuyor` : 'Menüye ürün ekleyin'}
                        action={<Button size="sm" onClick={openNewItem}>+ Ürün Ekle</Button>}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Kategori Modal */}
      <Modal
        isOpen={catModal}
        onClose={() => setCatModal(false)}
        title={editingCat ? 'Kategori Düzenle' : 'Yeni Kategori'}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setCatModal(false)}>İptal</Button>
            <Button onClick={() => saveCat.mutate(catForm)} disabled={!catForm.name.tr || saveCat.isPending}>
              {saveCat.isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Kategori Adı (TR)"
            value={catForm.name.tr}
            onChange={(e) => setCatForm((p) => ({ ...p, name: { ...p.name, tr: e.target.value } }))}
            placeholder="Örn: Başlangıçlar"
          />
          <Input
            label="Kategori Adı (EN)"
            value={catForm.name.en}
            onChange={(e) => setCatForm((p) => ({ ...p, name: { ...p.name, en: e.target.value } }))}
            placeholder="Starters"
          />
          <Input
            label="Sıra"
            type="number"
            value={catForm.order}
            onChange={(e) => setCatForm((p) => ({ ...p, order: Number(e.target.value) }))}
          />
        </div>
      </Modal>

      {/* Ürün Modal */}
      <Modal
        isOpen={itemModal}
        onClose={() => setItemModal(false)}
        title={editingItem ? 'Ürün Düzenle' : 'Yeni Ürün'}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setItemModal(false)}>İptal</Button>
            <Button
              onClick={() => saveItem.mutate(itemForm)}
              disabled={!itemForm.name.tr || !itemForm.categoryId || saveItem.isPending}
            >
              {saveItem.isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* TR / EN tabs */}
          <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
            {['tr', 'en'].map((lang) => (
              <button
                key={lang}
                onClick={() => setItemTab(lang)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${itemTab === lang ? 'border-b-2 border-blue-600' : ''}`}
                style={{ color: itemTab === lang ? '#2563EB' : 'var(--text-muted)' }}
              >
                {lang === 'tr' ? 'Türkçe' : 'İngilizce'}
              </button>
            ))}
          </div>
          <Input
            label="Ürün Adı"
            value={itemForm.name[itemTab]}
            onChange={(e) => setItem(`name.${itemTab}`, e.target.value)}
            placeholder={itemTab === 'tr' ? 'Ürün adı' : 'Product name'}
          />
          <Textarea
            label="Açıklama"
            rows={2}
            value={itemForm.description[itemTab]}
            onChange={(e) => setItem(`description.${itemTab}`, e.target.value)}
            placeholder={itemTab === 'tr' ? 'Kısa açıklama' : 'Short description'}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fiyat"
              type="number"
              step="0.01"
              value={itemForm.price}
              onChange={(e) => setItem('price', e.target.value)}
              placeholder="0.00"
            />
            <Select
              label="Para Birimi"
              value={itemForm.currency}
              onChange={(e) => setItem('currency', e.target.value)}
            >
              <option value="TRY">TRY ₺</option>
              <option value="EUR">EUR €</option>
              <option value="USD">USD $</option>
            </Select>
          </div>
          <Select
            label="Kategori"
            value={itemForm.categoryId}
            onChange={(e) => setItem('categoryId', e.target.value)}
          >
            <option value="">Kategori seç</option>
            {cats.map((c) => (
              <option key={c._id} value={c._id}>{c.name?.tr}</option>
            ))}
          </Select>
          {/* Fotoğraf */}
          <div>
            <ImageUrlInput
              label="Fotoğraf URL (opsiyonel)"
              value={itemForm.image}
              onChange={(e) => setItem('image', e.target.value)}
              hint="600×400px önerilen"
            />
            {itemForm.image && (
              <img src={itemForm.image} alt="önizleme" className="mt-2 h-28 w-full object-cover rounded-lg" />
            )}
          </div>

          {/* Öne Çıkan */}
          <div
            className="flex items-center justify-between rounded-lg px-4 py-3 cursor-pointer"
            style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)' }}
            onClick={() => setItem('isFeatured', !itemForm.isFeatured)}
          >
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>⭐ Şefin Seçimi / Öne Çıkan</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Ana sayfada ve restoran sayfasında öne çıkan ürün olarak gösterilir</p>
            </div>
            <div className="relative w-10 h-5 rounded-full flex-shrink-0 transition-colors"
              style={{ background: itemForm.isFeatured ? '#10b981' : 'var(--border)' }}>
              <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                style={{ transform: itemForm.isFeatured ? 'translateX(20px)' : 'translateX(0)' }} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Alerjenler</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {itemForm.allergens.map((a) => (
                <span key={a} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-orange-100 border border-orange-300 text-orange-700">
                  {a}
                  <button type="button" onClick={() => removeAllergen(a)} className="ml-0.5 hover:text-orange-900 font-bold leading-none">×</button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="Alerjen yaz, Enter ile ekle (örn: gluten, fıstık…)"
              onKeyDown={addAllergen}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
            />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Enter veya virgül ile ekle</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
