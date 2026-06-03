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

const empty = {
  name: '', title: { tr: '', en: '' }, bio: { tr: '', en: '' },
  photo: '', specialty: '', order: 0, isActive: true,
  socialLinks: { linkedin: '', instagram: '', twitter: '' },
};

export default function TeamPage() {
  const { toast } = useToast();
  const { activeTenantId } = useAuth();
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [tab, setTab] = useState('tr');

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['team', activeTenantId],
    queryFn: () => api.get('/team').then((r) => r.data),
    enabled: !!activeTenantId,
  });

  const save = useMutation({
    mutationFn: (body) =>
      editing
        ? api.patch(`/team/${editing._id}`, body).then((r) => r.data)
        : api.post('/team', body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team'] });
      toast.success(editing ? 'Güncellendi' : 'Ekip üyesi oluşturuldu');
      closeModal();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Hata oluştu'),
  });

  const del = useMutation({
    mutationFn: (id) => api.delete(`/team/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['team'] }); toast.success('Silindi'); },
  });

  const toggle = useMutation({
    mutationFn: ({ id, isActive }) => api.patch(`/team/${id}`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team'] }),
  });

  function openNew() { setEditing(null); setForm({ ...empty, order: members.length }); setTab('tr'); setModal(true); }
  function openEdit(m) {
    setEditing(m);
    setForm({
      name: m.name || '', specialty: m.specialty || '', photo: m.photo || '', order: m.order ?? 0, isActive: m.isActive,
      title: { tr: m.title?.tr || '', en: m.title?.en || '' },
      bio: { tr: m.bio?.tr || '', en: m.bio?.en || '' },
      socialLinks: { linkedin: m.socialLinks?.linkedin || '', instagram: m.socialLinks?.instagram || '', twitter: m.socialLinks?.twitter || '' },
    });
    setTab('tr'); setModal(true);
  }
  function closeModal() { setModal(false); setEditing(null); setForm(empty); }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.title.tr.trim()) { toast.error('Ad ve Türkçe unvan zorunlu'); return; }
    save.mutate(form);
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Ekip</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Çalışanlar ve uzmanlar</p>
        </div>
        <Button onClick={openNew} icon={<Plus size={14} />}>Yeni Üye</Button>
      </div>

      {isLoading ? (
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Yükleniyor...</div>
      ) : members.length === 0 ? (
        <EmptyState title="Henüz ekip üyesi yok" description="İlk üyeyi ekleyerek başlayın."
          action={<Button onClick={openNew} icon={<Plus size={14} />}>Yeni Üye</Button>} />
      ) : (
        <div className="space-y-2">
          {members.map((m) => (
            <div key={m._id} className="flex items-center gap-3 p-4 rounded-xl border"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', opacity: m.isActive ? 1 : 0.5 }}>
              {m.photo
                ? <img src={m.photo} alt={m.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                : <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                    style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>{m.name?.charAt(0)}</div>
              }
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{m.name}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {m.title?.tr}{m.specialty && ` · ${m.specialty}`}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => toggle.mutate({ id: m._id, isActive: !m.isActive })}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-muted)] transition-colors">
                  {m.isActive ? <ToggleRight size={16} style={{ color: '#6366f1' }} /> : <ToggleLeft size={16} style={{ color: 'var(--text-muted)' }} />}
                </button>
                <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg hover:bg-[var(--bg-muted)] transition-colors">
                  <Pencil size={14} style={{ color: 'var(--text-muted)' }} />
                </button>
                <button onClick={() => { if (confirm('Silmek istediğinize emin misiniz?')) del.mutate(m._id); }}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                  <Trash2 size={14} className="text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modal} onClose={closeModal} title={editing ? 'Üye Düzenle' : 'Yeni Ekip Üyesi'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Ad Soyad" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            <Input label="Uzmanlık Alanı" value={form.specialty} onChange={(e) => setForm((f) => ({ ...f, specialty: e.target.value }))} placeholder="örn. İmplant Uzmanı" />
          </div>
          <ImageUrlInput label="Fotoğraf URL" value={form.photo} onChange={(e) => setForm((f) => ({ ...f, photo: e.target.value }))} hint="400×400px — kare, yüz odaklı" />

          <div className="flex gap-1 border-b" style={{ borderColor: 'var(--border)' }}>
            {['tr', 'en'].map((l) => (
              <button key={l} type="button" onClick={() => setTab(l)}
                className="px-4 py-2 text-sm font-medium transition-colors"
                style={{ color: tab === l ? '#6366f1' : 'var(--text-muted)', borderBottom: tab === l ? '2px solid #6366f1' : '2px solid transparent' }}>
                {l === 'tr' ? 'Türkçe' : 'İngilizce'}
              </button>
            ))}
          </div>
          <Input label={`Unvan (${tab.toUpperCase()})`} value={form.title[tab]}
            onChange={(e) => setForm((f) => ({ ...f, title: { ...f.title, [tab]: e.target.value } }))}
            placeholder="Dr., Uzm., vb." required={tab === 'tr'} />
          <Textarea label={`Biyografi (${tab.toUpperCase()})`} rows={3} value={form.bio[tab]}
            onChange={(e) => setForm((f) => ({ ...f, bio: { ...f.bio, [tab]: e.target.value } }))} />

          <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Sosyal Medya</p>
            <div className="grid grid-cols-3 gap-3">
              <Input label="LinkedIn" value={form.socialLinks.linkedin} placeholder="URL"
                onChange={(e) => setForm((f) => ({ ...f, socialLinks: { ...f.socialLinks, linkedin: e.target.value } }))} />
              <Input label="Instagram" value={form.socialLinks.instagram} placeholder="URL"
                onChange={(e) => setForm((f) => ({ ...f, socialLinks: { ...f.socialLinks, instagram: e.target.value } }))} />
              <Input label="Twitter / X" value={form.socialLinks.twitter} placeholder="URL"
                onChange={(e) => setForm((f) => ({ ...f, socialLinks: { ...f.socialLinks, twitter: e.target.value } }))} />
            </div>
          </div>
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
