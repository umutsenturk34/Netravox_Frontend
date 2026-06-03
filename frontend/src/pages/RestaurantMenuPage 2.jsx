import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Input, Textarea, Select } from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';

const emptyCat = { name: { tr: '', en: '' }, order: 0, isActive: true };
const emptyItem = {
  name: { tr: '', en: '' },
  description: { tr: '', en: '' },
  price: '',
  currency: 'TRY',
  categoryId: '',
  isActive: true,
  allergens: [],
};

const ALLERGENS = ['gluten', 'dairy', 'eggs', 'nuts', 'peanuts', 'soy', 'fish', 'shellfish'];

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

  const toggleAllergen = (a) => {
    setItemForm((prev) => ({
      ...prev,
      allergens: prev.allergens.includes(a)
        ? prev.allergens.filter((x) => x !== a)
        : [...prev.allergens, a],
    }));
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
                      <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{item.name?.tr}</div>
                      {item.description?.tr && (
                        <div className="text-xs truncate max-w-xs" style={{ color: 'var(--text-muted)' }}>{item.description.tr}</div>
                      )}
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
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Alerjenler</label>
            <div className="flex flex-wrap gap-2">
              {ALLERGENS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAllergen(a)}
                  className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                    itemForm.allergens.includes(a)
                      ? 'bg-orange-100 border-orange-300 text-orange-700'
                      : 'hover:bg-[var(--bg-muted)]'
                  }`}
                  style={!itemForm.allergens.includes(a) ? { borderColor: 'var(--border)', color: 'var(--text-secondary)' } : {}}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
