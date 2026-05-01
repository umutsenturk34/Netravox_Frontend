import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';

function MenuItemRow({ item, depth = 0, onEdit, onDelete }) {
  return (
    <>
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b hover:bg-[var(--bg-muted)] transition-colors"
        style={{ borderColor: 'var(--border)', paddingLeft: `${16 + depth * 20}px` }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>☰</span>
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.label}</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.url}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onEdit(item)} className="text-xs px-2 py-1 rounded hover:bg-[var(--bg-muted)]" style={{ color: 'var(--text-muted)' }}>Düzenle</button>
          <button onClick={() => onDelete(item)} className="text-xs px-2 py-1 rounded hover:bg-red-50 text-red-500">Sil</button>
        </div>
      </div>
      {item.children?.map((child, i) => (
        <MenuItemRow key={i} item={child} depth={depth + 1} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </>
  );
}

const emptyItem = { label: '', url: '', order: 0 };

export default function MenusPage() {
  const { toast } = useToast();
  const { activeTenantId } = useAuth();
  const qc = useQueryClient();
  const [selectedMenuId, setSelectedMenuId] = useState(null);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [newMenuForm, setNewMenuForm] = useState({ name: '', language: 'tr' });
  const [showItemModal, setShowItemModal] = useState(false);
  const [itemForm, setItemForm] = useState(emptyItem);
  const [editingItem, setEditingItem] = useState(null);

  const { data: menus = [] } = useQuery({
    queryKey: ['menus', activeTenantId],
    queryFn: () => api.get('/menus').then((r) => r.data),
    enabled: !!activeTenantId,
  });

  const selectedMenu = menus.find((m) => m._id === selectedMenuId) || menus[0] || null;
  const effectiveId = selectedMenu?._id;

  const createMenuMutation = useMutation({
    mutationFn: (data) => api.post('/menus', data).then((r) => r.data),
    onSuccess: (menu) => {
      qc.invalidateQueries({ queryKey: ['menus'] });
      setSelectedMenuId(menu._id);
      setShowCreateMenu(false);
      setNewMenuForm({ name: '', language: 'tr' });
      toast.success('Menü oluşturuldu');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Oluşturulamadı'),
  });

  const updateItemsMutation = useMutation({
    mutationFn: ({ id, items }) => api.put(`/menus/${id}`, { items }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menus'] });
      toast.success('Menü kaydedildi');
    },
    onError: () => toast.error('Kaydedilemedi'),
  });

  const deleteMenuMutation = useMutation({
    mutationFn: (id) => api.delete(`/menus/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menus'] });
      setSelectedMenuId(null);
      toast.success('Menü silindi');
    },
  });

  const handleSaveItem = () => {
    if (!itemForm.label || !itemForm.url) return;
    const currentItems = selectedMenu?.items || [];
    let newItems;
    if (editingItem !== null) {
      newItems = currentItems.map((it, i) => (i === editingItem ? itemForm : it));
    } else {
      newItems = [...currentItems, { ...itemForm, order: currentItems.length }];
    }
    updateItemsMutation.mutate({ id: effectiveId, items: newItems });
    setShowItemModal(false);
    setEditingItem(null);
    setItemForm(emptyItem);
  };

  const handleDeleteItem = (target) => {
    const currentItems = selectedMenu?.items || [];
    const newItems = currentItems.filter((it) => it !== target);
    updateItemsMutation.mutate({ id: effectiveId, items: newItems });
  };

  const openEditItem = (item) => {
    const idx = selectedMenu?.items?.indexOf(item);
    setEditingItem(idx ?? null);
    setItemForm({ label: item.label, url: item.url, order: item.order ?? 0 });
    setShowItemModal(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Navigasyon Menüleri</h1>
        <Button onClick={() => setShowCreateMenu(true)}>+ Yeni Menü</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Menü listesi */}
        <div>
          <p className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Menüler</p>
          <div className="space-y-1">
            {menus.map((m) => (
              <div
                key={m._id}
                onClick={() => setSelectedMenuId(m._id)}
                className={`px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                  (selectedMenu?._id === m._id) ? 'bg-blue-50 text-blue-700' : 'hover:bg-[var(--bg-muted)]'
                }`}
                style={selectedMenu?._id !== m._id ? { color: 'var(--text-primary)' } : {}}
              >
                <span className="font-medium">{m.name}</span>
                <span className="ml-2 text-xs uppercase" style={{ color: 'var(--text-muted)' }}>{m.language}</span>
              </div>
            ))}
            {!menus.length && (
              <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>Henüz menü yok</p>
            )}
          </div>
        </div>

        {/* Menü içeriği */}
        <div className="lg:col-span-3">
          {selectedMenu ? (
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between px-4 py-3" style={{ background: 'var(--bg-muted)' }}>
                <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{selectedMenu.name}</h2>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => { setItemForm(emptyItem); setEditingItem(null); setShowItemModal(true); }}>
                    + Öğe Ekle
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => deleteMenuMutation.mutate(effectiveId)}
                  >
                    Menüyü Sil
                  </Button>
                </div>
              </div>
              <div style={{ background: 'var(--bg-surface)' }}>
                {selectedMenu.items?.length ? (
                  selectedMenu.items.map((item, i) => (
                    <MenuItemRow
                      key={i}
                      item={item}
                      onEdit={openEditItem}
                      onDelete={handleDeleteItem}
                    />
                  ))
                ) : (
                  <EmptyState
                    title="Öğe yok"
                    description="Bu menüye henüz öğe eklenmedi"
                    action={
                      <Button size="sm" onClick={() => { setItemForm(emptyItem); setEditingItem(null); setShowItemModal(true); }}>
                        + Öğe Ekle
                      </Button>
                    }
                  />
                )}
              </div>
            </div>
          ) : (
            <EmptyState
              title="Menü seçin"
              description="Sol taraftan bir menü seçin ya da yeni oluşturun"
              action={<Button onClick={() => setShowCreateMenu(true)}>+ Yeni Menü</Button>}
            />
          )}
        </div>
      </div>

      {/* Yeni Menü Modal */}
      <Modal
        isOpen={showCreateMenu}
        onClose={() => setShowCreateMenu(false)}
        title="Yeni Menü Oluştur"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowCreateMenu(false)}>İptal</Button>
            <Button onClick={() => createMenuMutation.mutate(newMenuForm)} disabled={!newMenuForm.name || createMenuMutation.isPending}>
              {createMenuMutation.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Menü Adı"
            value={newMenuForm.name}
            onChange={(e) => setNewMenuForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Örn: Ana Menü"
          />
          <Select
            label="Dil"
            value={newMenuForm.language}
            onChange={(e) => setNewMenuForm((p) => ({ ...p, language: e.target.value }))}
          >
            <option value="tr">Türkçe</option>
            <option value="en">İngilizce</option>
          </Select>
        </div>
      </Modal>

      {/* Öğe Modal */}
      <Modal
        isOpen={showItemModal}
        onClose={() => setShowItemModal(false)}
        title={editingItem !== null ? 'Öğe Düzenle' : 'Öğe Ekle'}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowItemModal(false)}>İptal</Button>
            <Button onClick={handleSaveItem} disabled={!itemForm.label || !itemForm.url}>Kaydet</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Etiket"
            value={itemForm.label}
            onChange={(e) => setItemForm((p) => ({ ...p, label: e.target.value }))}
            placeholder="Bağlantı metni"
          />
          <Input
            label="URL"
            value={itemForm.url}
            onChange={(e) => setItemForm((p) => ({ ...p, url: e.target.value }))}
            placeholder="/hakkimizda veya https://..."
          />
          <Input
            label="Sıra"
            type="number"
            value={itemForm.order}
            onChange={(e) => setItemForm((p) => ({ ...p, order: Number(e.target.value) }))}
          />
        </div>
      </Modal>
    </div>
  );
}
