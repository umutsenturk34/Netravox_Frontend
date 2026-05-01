import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/client';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Input';

const emptyForm = { name: '', slug: '', sector: 'restaurant' };

const toSlug = (str) =>
  str.toLowerCase().replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default function CompaniesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  if (!user?.isSuperAdmin) {
    return <p style={{ color: 'var(--text-muted)' }}>Bu sayfaya erişim yetkiniz yok.</p>;
  }

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => api.get('/companies').then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (data) =>
      editingId
        ? api.patch(`/companies/${editingId}`, data).then((r) => r.data)
        : api.post('/companies', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies'] });
      toast.success(editingId ? 'Firma güncellendi' : 'Firma oluşturuldu');
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Kaydedilemedi'),
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditingId(c._id);
    setForm({ name: c.name, slug: c.slug, sector: c.sector || 'restaurant' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setForm((p) => ({ ...p, name, ...(editingId ? {} : { slug: toSlug(name) }) }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Firmalar</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Sisteme kayıtlı tüm firmalar</p>
        </div>
        <Button onClick={openCreate}>+ Firma Ekle</Button>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full text-sm">
          <thead style={{ background: 'var(--bg-muted)' }}>
            <tr>
              {['Firma', 'Slug', 'Sektör', 'Durum', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody style={{ background: 'var(--bg-surface)' }}>
            {isLoading && (
              <tr><td colSpan={5} className="px-4 py-8 text-center" style={{ color: 'var(--text-muted)' }}>Yükleniyor...</td></tr>
            )}
            {companies.map((c) => (
              <tr key={c._id} className="border-t hover:bg-[var(--bg-muted)] transition-colors" style={{ borderColor: 'var(--border)' }}>
                <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{c.name}</td>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{c.slug}</td>
                <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{c.sector}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {c.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => openEdit(c)}
                    className="text-xs px-2 py-1 rounded hover:bg-[var(--bg-muted)]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Düzenle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingId ? 'Firma Düzenle' : 'Yeni Firma'}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeModal}>İptal</Button>
            <Button
              onClick={() => saveMutation.mutate(form)}
              disabled={!form.name || !form.slug || saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Firma Adı"
            value={form.name}
            onChange={handleNameChange}
            placeholder="Gusto Kartepe"
          />
          <Input
            label="Slug"
            value={form.slug}
            onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
            placeholder="gusto-kartepe"
          />
          <Select
            label="Sektör"
            value={form.sector}
            onChange={(e) => setForm((p) => ({ ...p, sector: e.target.value }))}
          >
            <option value="restaurant">Restoran</option>
            <option value="dental">Diş Kliniği</option>
            <option value="hotel">Otel</option>
            <option value="other">Diğer</option>
          </Select>
        </div>
      </Modal>
    </div>
  );
}
