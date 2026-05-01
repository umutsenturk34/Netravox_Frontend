import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Input, Textarea, ImageUrlInput } from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

const TYPE_LABELS = { modal: 'Modal Pencere', banner: 'Üst Banner', bar: 'Alt Bar' };
const TYPE_COLORS = { modal: '#6366f1', banner: '#f59e0b', bar: '#10b981' };

const empty = {
  type: 'modal',
  title: { tr: '', en: '' }, content: { tr: '', en: '' },
  image: '', buttonText: { tr: '', en: '' }, buttonUrl: '',
  startDate: '', endDate: '', isActive: true,
};

export default function PopupsPage() {
  const { toast } = useToast();
  const { activeTenantId } = useAuth();
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [tab, setTab] = useState('tr');

  const { data: popups = [], isLoading } = useQuery({
    queryKey: ['popups', activeTenantId],
    queryFn: () => api.get('/popups').then((r) => r.data),
    enabled: !!activeTenantId,
  });

  const save = useMutation({
    mutationFn: (body) => {
      const payload = { ...body, startDate: body.startDate || null, endDate: body.endDate || null };
      return editing
        ? api.put(`/popups/${editing._id}`, payload).then((r) => r.data)
        : api.post('/popups', payload).then((r) => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['popups'] });
      toast.success(editing ? 'Popup güncellendi' : 'Popup oluşturuldu');
      closeModal();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Hata oluştu'),
  });

  const del = useMutation({
    mutationFn: (id) => api.delete(`/popups/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['popups'] }); toast.success('Silindi'); },
  });

  const toggle = useMutation({
    mutationFn: ({ id, isActive }) => api.put(`/popups/${id}`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['popups'] }),
  });

  function fmt(date) { return date ? new Date(date).toLocaleDateString('tr') : null; }

  function openNew() { setEditing(null); setForm(empty); setTab('tr'); setModal(true); }
  function openEdit(p) {
    setEditing(p);
    setForm({
      type: p.type || 'modal',
      title: { tr: p.title?.tr || '', en: p.title?.en || '' },
      content: { tr: p.content?.tr || '', en: p.content?.en || '' },
      image: p.image || '',
      buttonText: { tr: p.buttonText?.tr || '', en: p.buttonText?.en || '' },
      buttonUrl: p.buttonUrl || '',
      startDate: p.startDate ? p.startDate.slice(0, 10) : '',
      endDate: p.endDate ? p.endDate.slice(0, 10) : '',
      isActive: p.isActive,
    });
    setTab('tr'); setModal(true);
  }
  function closeModal() { setModal(false); setEditing(null); setForm(empty); }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.tr.trim()) { toast.error('Türkçe başlık zorunlu'); return; }
    save.mutate(form);
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Popup & Duyurular</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Ziyaretçilere gösterilecek duyuru ve popup'lar</p>
        </div>
        <Button onClick={openNew} icon={<Plus size={14} />}>Yeni Popup</Button>
      </div>

      {isLoading ? (
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Yükleniyor...</div>
      ) : popups.length === 0 ? (
        <EmptyState title="Henüz popup yok" description="İlk duyuruyu ekleyerek başlayın."
          action={<Button onClick={openNew} icon={<Plus size={14} />}>Yeni Popup</Button>} />
      ) : (
        <div className="space-y-2">
          {popups.map((p) => (
            <div key={p._id} className="flex items-center gap-3 p-4 rounded-xl border"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', opacity: p.isActive ? 1 : 0.5 }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: (TYPE_COLORS[p.type] || '#6366f1') + '18', color: TYPE_COLORS[p.type] || '#6366f1' }}>
                    {TYPE_LABELS[p.type] || p.type}
                  </span>
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{p.title?.tr}</p>
                </div>
                {(p.startDate || p.endDate) && (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {fmt(p.startDate) || '—'} → {fmt(p.endDate) || 'Süresiz'}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => toggle.mutate({ id: p._id, isActive: !p.isActive })}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-muted)] transition-colors">
                  {p.isActive ? <ToggleRight size={16} style={{ color: '#6366f1' }} /> : <ToggleLeft size={16} style={{ color: 'var(--text-muted)' }} />}
                </button>
                <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-[var(--bg-muted)] transition-colors">
                  <Pencil size={14} style={{ color: 'var(--text-muted)' }} />
                </button>
                <button onClick={() => { if (confirm('Popup silinsin mi?')) del.mutate(p._id); }}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                  <Trash2 size={14} className="text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modal} onClose={closeModal} title={editing ? 'Popup Düzenle' : 'Yeni Popup'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Tür</label>
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
              <option value="modal">Modal Pencere</option>
              <option value="banner">Üst Banner</option>
              <option value="bar">Alt Bar</option>
            </select>
          </div>

          <div className="flex gap-1 border-b" style={{ borderColor: 'var(--border)' }}>
            {['tr', 'en'].map((l) => (
              <button key={l} type="button" onClick={() => setTab(l)}
                className="px-4 py-2 text-sm font-medium transition-colors"
                style={{ color: tab === l ? '#6366f1' : 'var(--text-muted)', borderBottom: tab === l ? '2px solid #6366f1' : '2px solid transparent' }}>
                {l === 'tr' ? 'Türkçe' : 'İngilizce'}
              </button>
            ))}
          </div>

          <Input label={`Başlık (${tab.toUpperCase()})`} value={form.title[tab]}
            onChange={(e) => setForm((f) => ({ ...f, title: { ...f.title, [tab]: e.target.value } }))}
            required={tab === 'tr'} />
          <Textarea label={`İçerik (${tab.toUpperCase()})`} rows={3} value={form.content[tab]}
            onChange={(e) => setForm((f) => ({ ...f, content: { ...f.content, [tab]: e.target.value } }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={`Buton Metni (${tab.toUpperCase()})`} value={form.buttonText[tab]}
              onChange={(e) => setForm((f) => ({ ...f, buttonText: { ...f.buttonText, [tab]: e.target.value } }))} />
            <Input label="Buton URL" value={form.buttonUrl} onChange={(e) => setForm((f) => ({ ...f, buttonUrl: e.target.value }))} placeholder="https://" />
          </div>
          <ImageUrlInput label="Görsel URL" value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Başlangıç Tarihi" type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
            <Input label="Bitiş Tarihi" type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={closeModal}>İptal</Button>
            <Button type="submit" loading={save.isPending}>{editing ? 'Güncelle' : 'Oluştur'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
