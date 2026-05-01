import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Input, Textarea } from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import { Plus, Pencil, Trash2 } from 'lucide-react';

function toSlug(str) {
  return str.toLowerCase()
    .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s')
    .replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const empty = { name: { tr: '', en: '' }, slug: { tr: '', en: '' }, description: { tr: '', en: '' }, order: 0 };

export default function BlogCategoriesPage() {
  const { toast } = useToast();
  const { activeTenantId } = useAuth();
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [tab, setTab] = useState('tr');

  const { data: cats = [], isLoading } = useQuery({
    queryKey: ['blog-categories', activeTenantId],
    queryFn: () => api.get('/blog-categories').then((r) => r.data),
    enabled: !!activeTenantId,
  });

  const save = useMutation({
    mutationFn: (body) =>
      editing
        ? api.put(`/blog-categories/${editing._id}`, body).then((r) => r.data)
        : api.post('/blog-categories', body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blog-categories'] });
      toast.success(editing ? 'Kategori güncellendi' : 'Kategori oluşturuldu');
      closeModal();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Hata oluştu'),
  });

  const del = useMutation({
    mutationFn: (id) => api.delete(`/blog-categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blog-categories'] });
      toast.success('Kategori silindi');
    },
  });

  function openNew() {
    setEditing(null);
    setForm({ ...empty, order: cats.length });
    setTab('tr');
    setModal(true);
  }

  function openEdit(cat) {
    setEditing(cat);
    setForm({
      name: { tr: cat.name?.tr || '', en: cat.name?.en || '' },
      slug: { tr: cat.slug?.tr || '', en: cat.slug?.en || '' },
      description: { tr: cat.description?.tr || '', en: cat.description?.en || '' },
      order: cat.order ?? 0,
    });
    setTab('tr');
    setModal(true);
  }

  function closeModal() { setModal(false); setEditing(null); setForm(empty); }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.tr.trim() || !form.slug.tr.trim()) {
      toast.error('Türkçe ad ve slug zorunlu');
      return;
    }
    save.mutate(form);
  }

  function setLang(field, lang, value) {
    setForm((f) => ({ ...f, [field]: { ...f[field], [lang]: value } }));
    if (field === 'name' && lang === 'tr') {
      setForm((f) => ({ ...f, slug: { ...f.slug, tr: toSlug(value) } }));
    }
    if (field === 'name' && lang === 'en') {
      setForm((f) => ({ ...f, slug: { ...f.slug, en: toSlug(value) } }));
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Blog Kategorileri</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Blog yazılarını kategorilere ayırın</p>
        </div>
        <Button onClick={openNew} icon={<Plus size={14} />}>Yeni Kategori</Button>
      </div>

      {isLoading ? (
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Yükleniyor...</div>
      ) : cats.length === 0 ? (
        <EmptyState
          title="Henüz kategori yok"
          description="İlk blog kategorisini ekleyerek başlayın."
          action={<Button onClick={openNew} icon={<Plus size={14} />}>Yeni Kategori</Button>}
        />
      ) : (
        <div className="space-y-2">
          {cats.map((cat) => (
            <div
              key={cat._id}
              className="flex items-center gap-3 p-4 rounded-xl border"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', opacity: cat.isActive ? 1 : 0.5 }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{cat.name?.tr}</p>
                <span className="text-xs font-mono px-1.5 py-0.5 rounded mt-1 inline-block" style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
                  /{cat.slug?.tr}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg hover:bg-[var(--bg-muted)] transition-colors">
                  <Pencil size={14} style={{ color: 'var(--text-muted)' }} />
                </button>
                <button
                  onClick={() => { if (confirm('Kategori silinsin mi?')) del.mutate(cat._id); }}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <Trash2 size={14} className="text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modal} onClose={closeModal} title={editing ? 'Kategori Düzenle' : 'Yeni Kategori'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-1 border-b" style={{ borderColor: 'var(--border)' }}>
            {['tr', 'en'].map((l) => (
              <button key={l} type="button" onClick={() => setTab(l)}
                className="px-4 py-2 text-sm font-medium transition-colors"
                style={{ color: tab === l ? '#6366f1' : 'var(--text-muted)', borderBottom: tab === l ? '2px solid #6366f1' : '2px solid transparent' }}>
                {l === 'tr' ? 'Türkçe' : 'İngilizce'}
              </button>
            ))}
          </div>
          <Input label={`Kategori Adı (${tab.toUpperCase()})`} value={form.name[tab]} onChange={(e) => setLang('name', tab, e.target.value)} required={tab === 'tr'} />
          <Input label={`Slug (${tab.toUpperCase()})`} value={form.slug[tab]} onChange={(e) => setLang('slug', tab, e.target.value)} placeholder="url-dostu-slug" required={tab === 'tr'} />
          <Textarea label={`Açıklama (${tab.toUpperCase()})`} value={form.description[tab]} onChange={(e) => setLang('description', tab, e.target.value)} rows={3} />
          <Input label="Sıralama" type="number" value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={closeModal}>İptal</Button>
            <Button type="submit" loading={save.isPending}>{editing ? 'Güncelle' : 'Oluştur'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
