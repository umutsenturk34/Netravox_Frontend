import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/Skeleton';

const emptyForm = { from: '', to: '', type: 301, isActive: true };

export default function RedirectsPage() {
  const { toast } = useToast();
  const { activeTenantId } = useAuth();
  const qc = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const { data: redirects = [], isLoading } = useQuery({
    queryKey: ['redirects', activeTenantId],
    queryFn: () => api.get('/seo/redirects').then((r) => r.data),
    enabled: !!activeTenantId,
  });

  const isValidUrl = (url) => {
    if (!url) return false;
    if (url.startsWith('/')) return true;
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  };

  const handleSave = () => {
    if (!form.from.startsWith('/')) {
      toast.error('Kaynak URL "/" ile başlamalı');
      return;
    }
    if (!isValidUrl(form.to)) {
      toast.error('Geçersiz hedef URL');
      return;
    }
    saveMutation.mutate(form);
  };

  const saveMutation = useMutation({
    mutationFn: (data) =>
      editingId
        ? api.patch(`/seo/redirects/${editingId}`, data).then((r) => r.data)
        : api.post('/seo/redirects', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['redirects'] });
      toast.success(editingId ? 'Redirect güncellendi' : 'Redirect eklendi');
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Kaydedilemedi'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/seo/redirects/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['redirects'] });
      toast.success('Redirect silindi');
    },
    onError: () => toast.error('Silinemedi'),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }) => api.patch(`/seo/redirects/${id}`, { isActive }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['redirects'] }),
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (r) => {
    setEditingId(r._id);
    setForm({ from: r.from, to: r.to, type: r.type, isActive: r.isActive });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Redirect Yönetimi</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Eski URL'leri yeni adreslere yönlendirin
          </p>
        </div>
        <Button onClick={openCreate}>+ Redirect Ekle</Button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : redirects.length === 0 ? (
        <EmptyState
          title="Henüz redirect yok"
          description="URL yönlendirme kuralları buradan yönetilir"
          action={<Button onClick={openCreate}>+ Redirect Ekle</Button>}
        />
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <table className="w-full text-sm">
            <thead style={{ background: 'var(--bg-muted)' }}>
              <tr>
                {['Kaynak', 'Hedef', 'Tip', 'Durum', ''].map((h, i) => (
                  <th key={i} className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody style={{ background: 'var(--bg-surface)' }}>
              {redirects.map((r) => (
                <tr key={r._id} className="border-t hover:bg-[var(--bg-muted)] transition-colors" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-primary)' }}>{r.from}</td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <span className="mr-1" style={{ color: 'var(--text-muted)' }}>→</span>
                    {r.to}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-mono font-medium bg-blue-50 text-blue-700">
                      {r.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive.mutate({ id: r._id, isActive: !r.isActive })}
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer ${
                        r.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {r.isActive ? 'Aktif' : 'Pasif'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(r)}
                        className="text-xs px-2 py-1 rounded hover:bg-[var(--bg-muted)]"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(r._id)}
                        className="text-xs px-2 py-1 rounded hover:bg-red-50 text-red-500"
                      >
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingId ? 'Redirect Düzenle' : 'Redirect Ekle'}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeModal}>İptal</Button>
            <Button
              onClick={handleSave}
              disabled={!form.from || !form.to || saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Kaynak URL"
            value={form.from}
            onChange={(e) => setForm((p) => ({ ...p, from: e.target.value }))}
            placeholder="/eski-sayfa"
          />
          <Input
            label="Hedef URL"
            value={form.to}
            onChange={(e) => setForm((p) => ({ ...p, to: e.target.value }))}
            placeholder="/yeni-sayfa veya https://..."
          />
          <Select
            label="Redirect Tipi"
            value={form.type}
            onChange={(e) => setForm((p) => ({ ...p, type: Number(e.target.value) }))}
          >
            <option value={301}>301 — Kalıcı yönlendirme</option>
            <option value={302}>302 — Geçici yönlendirme</option>
          </Select>
        </div>
      </Modal>
    </div>
  );
}
