import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Input, ImageUrlInput } from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import { Plus, Pencil, Trash2, ChevronRight, FolderOpen, Folder } from 'lucide-react';

function toSlug(str) {
  return str
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const emptyForm = {
  name: { tr: '', en: '' },
  slug: { tr: '', en: '' },
  parent: '',
  image: '',
  order: 0,
  isActive: true,
  attributeGroups: [],
};

export default function CategoriesPage() {
  const { toast } = useToast();
  const { activeTenantId } = useAuth();
  const qc = useQueryClient();

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [tab, setTab] = useState('tr');
  const [expanded, setExpanded] = useState({});

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories', activeTenantId],
    queryFn: () => api.get('/categories').then((r) => r.data),
    enabled: !!activeTenantId,
  });

  const { data: attributeGroups = [] } = useQuery({
    queryKey: ['attribute-groups', activeTenantId],
    queryFn: () => api.get('/attribute-groups').then((r) => r.data),
    enabled: !!activeTenantId,
  });

  const save = useMutation({
    mutationFn: (body) =>
      editing
        ? api.patch(`/categories/${editing._id}`, body).then((r) => r.data)
        : api.post('/categories', body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast.success(editing ? 'Kategori güncellendi' : 'Kategori oluşturuldu');
      closeModal();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Hata oluştu'),
  });

  const del = useMutation({
    mutationFn: (id) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Kategori silindi');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Silinemedi'),
  });

  // Build tree
  const { roots, childrenMap } = useMemo(() => {
    const roots = categories.filter((c) => !c.parent);
    const childrenMap = {};
    categories.forEach((c) => {
      if (c.parent) {
        const pid = typeof c.parent === 'object' ? c.parent._id : c.parent;
        if (!childrenMap[pid]) childrenMap[pid] = [];
        childrenMap[pid].push(c);
      }
    });
    return { roots, childrenMap };
  }, [categories]);

  function openNew() {
    setEditing(null);
    setForm({ ...emptyForm, order: categories.length });
    setTab('tr');
    setModal(true);
  }

  function openEdit(cat) {
    setEditing(cat);
    const parentId = cat.parent
      ? (typeof cat.parent === 'object' ? cat.parent._id : cat.parent)
      : '';
    setForm({
      name: { tr: cat.name?.tr || '', en: cat.name?.en || '' },
      slug: { tr: cat.slug?.tr || '', en: cat.slug?.en || '' },
      parent: parentId,
      image: cat.image || '',
      order: cat.order ?? 0,
      isActive: cat.isActive ?? true,
      attributeGroups: (cat.attributeGroups || []).map(ag =>
        typeof ag === 'object' ? ag._id : ag
      ),
    });
    setTab('tr');
    setModal(true);
  }

  function closeModal() {
    setModal(false);
    setEditing(null);
    setForm(emptyForm);
  }

  function setName(lang, value) {
    setForm((f) => ({
      ...f,
      name: { ...f.name, [lang]: value },
      slug: { ...f.slug, [lang]: toSlug(value) },
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.tr.trim()) {
      toast.error('Türkçe kategori adı zorunlu');
      return;
    }
    const body = {
      ...form,
      parent: form.parent || null,
      image: form.image || null,
    };
    save.mutate(body);
  }

  const toggleExpand = (id) =>
    setExpanded((p) => ({ ...p, [id]: !p[id] }));

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Kategoriler
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Ürün ve hizmetleri kategorilere ayırın — iç içe kategori yapısı desteklenir
          </p>
        </div>
        <Button onClick={openNew} icon={<Plus size={14} />}>Yeni Kategori</Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: 'var(--bg-muted)' }} />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          title="Henüz kategori yok"
          description="İlk kategoriyi ekleyerek ürün/hizmetlerinizi düzenlemeye başlayın."
          action={<Button onClick={openNew} icon={<Plus size={14} />}>Yeni Kategori</Button>}
        />
      ) : (
        <div className="space-y-1.5">
          {roots.map((root) => {
            const children = childrenMap[root._id] || [];
            const isExpanded = !!expanded[root._id];

            return (
              <div key={root._id}>
                {/* Root category row */}
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-shadow hover:shadow-sm"
                  style={{
                    background: 'var(--bg-surface)',
                    borderColor: 'var(--border)',
                    opacity: root.isActive ? 1 : 0.5,
                  }}
                >
                  {children.length > 0 ? (
                    <button
                      onClick={() => toggleExpand(root._id)}
                      className="shrink-0 p-0.5 rounded transition-colors hover:bg-[var(--bg-muted)]"
                      title={isExpanded ? 'Daralt' : 'Genişlet'}
                    >
                      <ChevronRight
                        size={14}
                        style={{
                          color: 'var(--text-muted)',
                          transform: isExpanded ? 'rotate(90deg)' : 'none',
                          transition: 'transform 0.15s',
                        }}
                      />
                    </button>
                  ) : (
                    <span className="shrink-0 w-5" />
                  )}

                  {root.image ? (
                    <img
                      src={root.image}
                      alt=""
                      className="h-8 w-8 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <span className="shrink-0">
                      {children.length > 0
                        ? <FolderOpen size={18} style={{ color: 'var(--text-muted)' }} />
                        : <Folder size={18} style={{ color: 'var(--text-muted)' }} />
                      }
                    </span>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {root.name?.tr}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {root.slug?.tr && (
                        <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                          /{root.slug.tr}
                        </span>
                      )}
                      {children.length > 0 && (
                        <span
                          className="text-[11px] px-1.5 py-0.5 rounded-md"
                          style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}
                        >
                          {children.length} alt kategori
                        </span>
                      )}
                      {root.attributeGroups?.length > 0 && (
                        <span className="text-[11px] px-1.5 py-0.5 rounded-md"
                          style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
                          {root.attributeGroups.length} özellik
                        </span>
                      )}
                      {!root.isActive && (
                        <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                          Pasif
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(root)}
                      className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-muted)]"
                      title="Düzenle"
                    >
                      <Pencil size={14} style={{ color: 'var(--text-muted)' }} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`"${root.name?.tr}" kategorisini silmek istiyor musunuz?`))
                          del.mutate(root._id);
                      }}
                      className="p-1.5 rounded-lg transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
                      title="Sil"
                    >
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                </div>

                {/* Children */}
                {isExpanded && children.map((child) => (
                  <div
                    key={child._id}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border ml-8 mt-1 transition-shadow hover:shadow-sm"
                    style={{
                      background: 'var(--bg-surface)',
                      borderColor: 'var(--border)',
                      opacity: child.isActive ? 1 : 0.5,
                    }}
                  >
                    <span className="shrink-0 w-5 text-center text-xs" style={{ color: 'var(--text-muted)' }}>└</span>

                    {child.image ? (
                      <img src={child.image} alt="" className="h-7 w-7 rounded-lg object-cover shrink-0" />
                    ) : (
                      <Folder size={16} className="shrink-0" style={{ color: 'var(--text-muted)' }} />
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {child.name?.tr}
                      </p>
                      {child.slug?.tr && (
                        <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                          /{child.slug.tr}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEdit(child)}
                        className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-muted)]"
                        title="Düzenle"
                      >
                        <Pencil size={14} style={{ color: 'var(--text-muted)' }} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`"${child.name?.tr}" alt kategorisini silmek istiyor musunuz?`))
                            del.mutate(child._id);
                        }}
                        className="p-1.5 rounded-lg transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
                        title="Sil"
                      >
                        <Trash2 size={14} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modal} onClose={closeModal} title={editing ? 'Kategori Düzenle' : 'Yeni Kategori'}>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Dil sekmesi */}
          <div className="flex gap-2">
            {['tr', 'en'].map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setTab(l)}
                className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                  tab === l ? 'bg-blue-600 text-white' : 'hover:bg-[var(--bg-muted)]'
                }`}
                style={tab !== l ? { color: 'var(--text-primary)' } : {}}
              >
                {l === 'tr' ? '🇹🇷 Türkçe' : '🇬🇧 English'}
              </button>
            ))}
          </div>

          <Input
            label={`Kategori Adı${tab === 'tr' ? ' *' : ''}`}
            value={form.name[tab]}
            onChange={(e) => setName(tab, e.target.value)}
            required={tab === 'tr'}
            placeholder={tab === 'tr' ? 'Ör: T-Shirt\'ler' : 'Ör: T-Shirts'}
          />

          <Input
            label={`Slug (${tab.toUpperCase()})`}
            value={form.slug[tab]}
            onChange={(e) =>
              setForm((f) => ({ ...f, slug: { ...f.slug, [tab]: e.target.value } }))
            }
            placeholder={tab === 'tr' ? 't-shirtler' : 't-shirts'}
            hint="URL'de kullanılır — otomatik oluşturulur"
          />

          {/* Üst Kategori */}
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Üst Kategori (isteğe bağlı)
            </label>
            <select
              value={form.parent}
              onChange={(e) => setForm((f) => ({ ...f, parent: e.target.value }))}
              className="w-full rounded-lg px-3.5 py-2.5 border outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              style={{
                background: 'var(--bg-base)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
                fontSize: '16px',
              }}
            >
              <option value="">— Ana kategori (üst kategori yok) —</option>
              {roots
                .filter((r) => !editing || r._id !== editing._id)
                .map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name?.tr}
                  </option>
                ))}
            </select>
          </div>

          <ImageUrlInput
            label="Görsel URL (isteğe bağlı)"
            value={form.image}
            onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
            hint="400×400px"
          />

          {/* Özellik Grupları */}
          {attributeGroups.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Özellik Grupları
              </label>
              <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                Seçilen özellikler bu kategorideki ürün eklerken otomatik çıkar
              </p>
              <div className="space-y-1.5">
                {attributeGroups.map(ag => {
                  const checked = form.attributeGroups.includes(ag._id);
                  return (
                    <label key={ag._id}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-colors"
                      style={{
                        borderColor: checked ? '#6366f1' : 'var(--border)',
                        background: checked ? 'rgba(99,102,241,0.05)' : 'var(--bg-base)',
                      }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => setForm(f => ({
                          ...f,
                          attributeGroups: checked
                            ? f.attributeGroups.filter(id => id !== ag._id)
                            : [...f.attributeGroups, ag._id],
                        }))}
                        className="accent-indigo-600 w-4 h-4"
                      />
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {ag.name?.tr}
                      </span>
                      {ag.values?.length > 0 && (
                        <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
                          {ag.values.slice(0, 3).map(v => v.tr).join(', ')}
                          {ag.values.length > 3 ? `... +${ag.values.length - 3}` : ''}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Sıra"
              type="number"
              min="0"
              value={form.order}
              onChange={(e) =>
                setForm((f) => ({ ...f, order: Number(e.target.value) }))
              }
            />
            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="catActive"
                checked={form.isActive}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isActive: e.target.checked }))
                }
                className="accent-blue-600 w-4 h-4"
              />
              <label htmlFor="catActive" className="text-sm" style={{ color: 'var(--text-primary)' }}>
                Aktif — web sitesinde görünsün
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
            <Button type="submit" disabled={save.isPending} className="flex-1">
              {save.isPending ? 'Kaydediliyor...' : editing ? 'Güncelle' : 'Oluştur'}
            </Button>
            <Button type="button" variant="ghost" onClick={closeModal}>
              İptal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
