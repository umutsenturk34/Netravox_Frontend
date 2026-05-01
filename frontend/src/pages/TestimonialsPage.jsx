import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Input, Textarea, ImageUrlInput } from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Star } from 'lucide-react';

const empty = {
  name: '', role: '', company: '', avatar: '',
  content: { tr: '', en: '' }, rating: 5, order: 0, isActive: true,
};

export default function TestimonialsPage() {
  const { toast } = useToast();
  const { activeTenantId } = useAuth();
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [tab, setTab] = useState('tr');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['testimonials', activeTenantId],
    queryFn: () => api.get('/testimonials').then((r) => r.data),
    enabled: !!activeTenantId,
  });

  const save = useMutation({
    mutationFn: (body) =>
      editing
        ? api.patch(`/testimonials/${editing._id}`, body).then((r) => r.data)
        : api.post('/testimonials', body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['testimonials'] });
      toast.success(editing ? 'Referans güncellendi' : 'Referans oluşturuldu');
      closeModal();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Hata oluştu'),
  });

  const del = useMutation({
    mutationFn: (id) => api.delete(`/testimonials/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['testimonials'] }); toast.success('Referans silindi'); },
  });

  const toggle = useMutation({
    mutationFn: ({ id, isActive }) => api.patch(`/testimonials/${id}`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['testimonials'] }),
  });

  function openNew() { setEditing(null); setForm({ ...empty, order: items.length }); setTab('tr'); setModal(true); }
  function openEdit(item) {
    setEditing(item);
    setForm({ name: item.name || '', role: item.role || '', company: item.company || '', avatar: item.avatar || '',
      content: { tr: item.content?.tr || '', en: item.content?.en || '' },
      rating: item.rating ?? 5, order: item.order ?? 0, isActive: item.isActive });
    setTab('tr'); setModal(true);
  }
  function closeModal() { setModal(false); setEditing(null); setForm(empty); }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.content.tr.trim()) { toast.error('Ad ve Türkçe içerik zorunlu'); return; }
    save.mutate(form);
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Referanslar</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Müşteri yorumları ve referansları</p>
        </div>
        <Button onClick={openNew} icon={<Plus size={14} />}>Yeni Referans</Button>
      </div>

      {isLoading ? (
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Yükleniyor...</div>
      ) : items.length === 0 ? (
        <EmptyState title="Henüz referans yok" description="İlk müşteri referansını ekleyin."
          action={<Button onClick={openNew} icon={<Plus size={14} />}>Yeni Referans</Button>} />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item._id} className="flex items-start gap-3 p-4 rounded-xl border"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', opacity: item.isActive ? 1 : 0.5 }}>
              {item.avatar && <img src={item.avatar} alt={item.name} className="w-10 h-10 rounded-full object-cover shrink-0" />}
              {!item.avatar && (
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                  style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
                  {item.name?.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
                  <div className="flex gap-0.5">
                    {Array.from({ length: item.rating || 5 }).map((_, i) => (
                      <Star key={i} size={11} fill="#f59e0b" stroke="none" />
                    ))}
                  </div>
                </div>
                {(item.role || item.company) && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {[item.role, item.company].filter(Boolean).join(' · ')}
                  </p>
                )}
                <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{item.content?.tr}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => toggle.mutate({ id: item._id, isActive: !item.isActive })}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-muted)] transition-colors">
                  {item.isActive ? <ToggleRight size={16} style={{ color: '#6366f1' }} /> : <ToggleLeft size={16} style={{ color: 'var(--text-muted)' }} />}
                </button>
                <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-[var(--bg-muted)] transition-colors">
                  <Pencil size={14} style={{ color: 'var(--text-muted)' }} />
                </button>
                <button onClick={() => { if (confirm('Referans silinsin mi?')) del.mutate(item._id); }}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                  <Trash2 size={14} className="text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modal} onClose={closeModal} title={editing ? 'Referans Düzenle' : 'Yeni Referans'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Ad Soyad" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            <Input label="Ünvan / Görevi" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Firma" value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} />
            <Input label="Puan (1-5)" type="number" min={1} max={5} value={form.rating}
              onChange={(e) => setForm((f) => ({ ...f, rating: Number(e.target.value) }))} />
          </div>
          <ImageUrlInput label="Profil Fotoğrafı URL" value={form.avatar} onChange={(e) => setForm((f) => ({ ...f, avatar: e.target.value }))} />

          <div className="flex gap-1 border-b" style={{ borderColor: 'var(--border)' }}>
            {['tr', 'en'].map((l) => (
              <button key={l} type="button" onClick={() => setTab(l)}
                className="px-4 py-2 text-sm font-medium transition-colors"
                style={{ color: tab === l ? '#6366f1' : 'var(--text-muted)', borderBottom: tab === l ? '2px solid #6366f1' : '2px solid transparent' }}>
                {l === 'tr' ? 'Türkçe' : 'İngilizce'}
              </button>
            ))}
          </div>
          <Textarea label={`Yorum (${tab.toUpperCase()})`} rows={4}
            value={form.content[tab]}
            onChange={(e) => setForm((f) => ({ ...f, content: { ...f.content, [tab]: e.target.value } }))}
            required={tab === 'tr'} />
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
