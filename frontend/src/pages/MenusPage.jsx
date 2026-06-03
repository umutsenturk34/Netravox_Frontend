import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, GripVertical, Plus, Trash2, X } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';

const emptyChild = { label: '', url: '#' };
const emptyItem  = { label: '', url: '', order: 0, children: [] };

// ── Alt öğe satırı ─────────────────────────────────────────────────────────
function ChildRow({ child, index, onChange, onRemove }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border px-3 py-2" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
      <GripVertical size={14} style={{ color: 'var(--text-muted)' }} className="shrink-0" />
      <div className="flex flex-1 gap-2 min-w-0">
        <input
          className="flex-1 min-w-0 rounded border px-2 py-1 text-sm"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
          placeholder="Etiket (ör. Menü)"
          value={child.label}
          onChange={(e) => onChange(index, { ...child, label: e.target.value })}
        />
        <input
          className="flex-1 min-w-0 rounded border px-2 py-1 text-sm font-mono"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-muted)' }}
          placeholder="URL (ör. /restoran/menu ya da #)"
          value={child.url}
          onChange={(e) => onChange(index, { ...child, url: e.target.value })}
        />
      </div>
      <button type="button" onClick={() => onRemove(index)} className="shrink-0 p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition">
        <X size={14} />
      </button>
    </div>
  );
}

// ── Ana menü öğesi satırı ───────────────────────────────────────────────────
function MenuItemRow({ item, onEdit, onDelete }) {
  const [collapsed, setCollapsed] = useState(true);
  const hasChildren = (item.children || []).length > 0;

  return (
    <div>
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b hover:bg-[var(--bg-muted)] transition-colors"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <GripVertical size={14} style={{ color: 'var(--text-muted)' }} className="shrink-0" />
          <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.label}</span>
          <span className="text-xs truncate hidden sm:block" style={{ color: 'var(--text-muted)' }}>{item.url}</span>
          {hasChildren && (
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              className="flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium transition"
              style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}
            >
              <ChevronRight size={11} className={`transition-transform ${collapsed ? '' : 'rotate-90'}`} />
              {item.children.length} alt öğe
            </button>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onEdit(item)}
            className="text-xs px-2.5 py-1 rounded-lg hover:bg-[var(--bg-muted)] transition font-medium"
            style={{ color: 'var(--text-muted)' }}
          >
            Düzenle
          </button>
          <button
            onClick={() => onDelete(item)}
            className="text-xs px-2 py-1 rounded-lg hover:bg-red-50 transition text-red-500 hover:text-red-700"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {hasChildren && !collapsed && (
        <div style={{ background: 'var(--bg-muted)' }}>
          {item.children.map((child, i) => (
            <div
              key={i}
              className="flex items-center gap-2 border-b px-8 py-2"
              style={{ borderColor: 'var(--border)' }}
            >
              <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} className="shrink-0" />
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{child.label}</span>
              <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{child.url}</span>
              {(!child.url || child.url === '#') && (
                <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                  Yakında
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Ana bileşen ─────────────────────────────────────────────────────────────
export default function MenusPage() {
  const { toast } = useToast();
  const { activeTenantId } = useAuth();
  const qc = useQueryClient();

  const [selectedMenuId, setSelectedMenuId] = useState(null);
  const [showCreateMenu, setShowCreateMenu]  = useState(false);
  const [newMenuForm, setNewMenuForm]         = useState({ name: '', language: 'tr' });
  const [showItemModal, setShowItemModal]     = useState(false);
  const [itemForm, setItemForm]               = useState(emptyItem);
  const [editingIndex, setEditingIndex]       = useState(null);

  const { data: menus = [] } = useQuery({
    queryKey: ['menus', activeTenantId],
    queryFn: () => api.get('/menus').then((r) => r.data),
    enabled: !!activeTenantId,
  });

  const selectedMenu  = menus.find((m) => m._id === selectedMenuId) || menus[0] || null;
  const effectiveId   = selectedMenu?._id;

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
      toast.success('Kaydedildi');
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

  // ── Çocuk yönetimi ────────────────────────────────────────────────────────
  const handleChildChange = (index, updated) => {
    setItemForm((prev) => {
      const children = [...(prev.children || [])];
      children[index] = updated;
      return { ...prev, children };
    });
  };

  const handleChildRemove = (index) => {
    setItemForm((prev) => ({
      ...prev,
      children: (prev.children || []).filter((_, i) => i !== index),
    }));
  };

  const handleChildAdd = () => {
    setItemForm((prev) => ({
      ...prev,
      children: [...(prev.children || []), { ...emptyChild }],
    }));
  };

  // ── Öğe kaydet ────────────────────────────────────────────────────────────
  const handleSaveItem = () => {
    if (!itemForm.label || !itemForm.url) return;
    const currentItems = selectedMenu?.items || [];
    const cleaned = {
      ...itemForm,
      children: (itemForm.children || []).filter((c) => c.label),
    };
    let newItems;
    if (editingIndex !== null) {
      newItems = currentItems.map((it, i) => (i === editingIndex ? cleaned : it));
    } else {
      newItems = [...currentItems, { ...cleaned, order: currentItems.length }];
    }
    updateItemsMutation.mutate({ id: effectiveId, items: newItems });
    setShowItemModal(false);
    setEditingIndex(null);
    setItemForm(emptyItem);
  };

  const handleDeleteItem = (target) => {
    const currentItems = selectedMenu?.items || [];
    const newItems = currentItems.filter((_, i) => i !== currentItems.indexOf(target));
    updateItemsMutation.mutate({ id: effectiveId, items: newItems });
  };

  const openEditItem = (item) => {
    const idx = selectedMenu?.items?.indexOf(item) ?? null;
    setEditingIndex(idx);
    setItemForm({
      label: item.label || '',
      url: item.url || '',
      order: item.order ?? 0,
      children: item.children ? item.children.map((c) => ({ label: c.label || '', url: c.url || '#' })) : [],
    });
    setShowItemModal(true);
  };

  const openAddItem = () => {
    setItemForm(emptyItem);
    setEditingIndex(null);
    setShowItemModal(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Navigasyon Menüleri</h1>
        <Button onClick={() => setShowCreateMenu(true)}>+ Yeni Menü</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Sol: menü listesi */}
        <div>
          <p className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Menüler</p>
          <div className="space-y-1">
            {menus.map((m) => (
              <div
                key={m._id}
                onClick={() => setSelectedMenuId(m._id)}
                className={`px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                  selectedMenu?._id === m._id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-[var(--bg-muted)]'
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

        {/* Sağ: menü içeriği */}
        <div className="lg:col-span-3">
          {selectedMenu ? (
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between px-4 py-3" style={{ background: 'var(--bg-muted)' }}>
                <div>
                  <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{selectedMenu.name}</h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Öğe eklerken "Alt Menü" bölümünden dropdown alt bağlantılar tanımlayabilirsiniz.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={openAddItem}>
                    <Plus size={13} className="mr-1" />
                    Öğe Ekle
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => deleteMenuMutation.mutate(effectiveId)}>
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
                    action={<Button size="sm" onClick={openAddItem}>+ Öğe Ekle</Button>}
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
            <Button
              onClick={() => createMenuMutation.mutate(newMenuForm)}
              disabled={!newMenuForm.name || createMenuMutation.isPending}
            >
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
            placeholder="Örn: main-nav veya footer-nav"
          />
          <div className="rounded-lg p-3 text-xs space-y-1" style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
            <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Tanınan menü adları:</p>
            <p><code className="font-mono">main-nav</code> → Header navigasyonu</p>
            <p><code className="font-mono">footer-nav</code> → Footer "Hızlı Bağlantılar" alanı</p>
          </div>
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

      {/* Öğe Ekle / Düzenle Modal */}
      <Modal
        isOpen={showItemModal}
        onClose={() => setShowItemModal(false)}
        title={editingIndex !== null ? 'Öğeyi Düzenle' : 'Yeni Öğe Ekle'}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowItemModal(false)}>İptal</Button>
            <Button onClick={handleSaveItem} disabled={!itemForm.label || !itemForm.url || updateItemsMutation.isPending}>
              {updateItemsMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Ana öğe alanları */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Etiket"
              value={itemForm.label}
              onChange={(e) => setItemForm((p) => ({ ...p, label: e.target.value }))}
              placeholder="Restoran"
            />
            <Input
              label="URL"
              value={itemForm.url}
              onChange={(e) => setItemForm((p) => ({ ...p, url: e.target.value }))}
              placeholder="/restoran ya da #"
            />
          </div>
          <Input
            label="Sıra"
            type="number"
            value={itemForm.order}
            onChange={(e) => setItemForm((p) => ({ ...p, order: Number(e.target.value) }))}
          />

          {/* Alt menü (children) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Alt Menü (Dropdown)</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  URL olarak <code className="bg-[var(--bg-muted)] px-1 rounded">#</code> yazarsan "Yakında" badge'i gösterilir.
                </p>
              </div>
              <button
                type="button"
                onClick={handleChildAdd}
                className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition hover:bg-[var(--bg-muted)]"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              >
                <Plus size={12} />
                Alt Öğe Ekle
              </button>
            </div>

            {(itemForm.children || []).length === 0 ? (
              <div
                className="rounded-lg border border-dashed px-4 py-4 text-center text-sm"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              >
                Alt öğe yok — bu bağlantı doğrudan link olarak görünür.
              </div>
            ) : (
              <div className="space-y-2">
                {(itemForm.children || []).map((child, i) => (
                  <ChildRow
                    key={i}
                    child={child}
                    index={i}
                    onChange={handleChildChange}
                    onRemove={handleChildRemove}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
