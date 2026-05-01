import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/ui/Modal';
import { Select } from '../components/ui/Input';
import Button from '../components/ui/Button';

const statusLabel = { new: 'Yeni', seen: 'Görüldü', replied: 'Yanıtlandı' };
const statusColor = {
  new: 'bg-blue-100 text-blue-700',
  seen: 'bg-yellow-100 text-yellow-700',
  replied: 'bg-green-100 text-green-700',
};

const formTypeLabel = { contact: 'İletişim', reservation: 'Rezervasyon', other: 'Diğer' };

export default function FormsPage() {
  const { toast } = useToast();
  const { activeTenantId } = useAuth();
  const qc = useQueryClient();
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['forms', activeTenantId, filterType, filterStatus],
    queryFn: () => {
      const params = new URLSearchParams({ limit: 50 });
      if (filterType) params.set('formType', filterType);
      if (filterStatus) params.set('status', filterStatus);
      return api.get(`/forms?${params}`).then((r) => r.data);
    },
    enabled: !!activeTenantId,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/forms/${id}/status`, { status }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['forms'] });
      toast.success('Durum güncellendi');
      if (selected) setSelected((prev) => ({ ...prev, status: prev.status }));
    },
    onError: () => toast.error('Güncellenemedi'),
  });

  const handleStatusChange = (id, status) => {
    updateStatus.mutate({ id, status });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Form Gönderileri</h1>
        <div className="flex gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-sm rounded-lg px-3 py-2 border outline-none focus:ring-2 focus:ring-blue-500/20"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: '16px' }}
          >
            <option value="">Tüm Tipler</option>
            <option value="contact">İletişim</option>
            <option value="reservation">Rezervasyon</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-sm rounded-lg px-3 py-2 border outline-none focus:ring-2 focus:ring-blue-500/20"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: '16px' }}
          >
            <option value="">Tüm Durumlar</option>
            <option value="new">Yeni</option>
            <option value="seen">Görüldü</option>
            <option value="replied">Yanıtlandı</option>
          </select>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full text-sm">
          <thead style={{ background: 'var(--bg-muted)' }}>
            <tr>
              {['Gönderen', 'Tip', 'Tarih', 'Durum', ''].map((h, i) => (
                <th key={i} className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody style={{ background: 'var(--bg-surface)' }}>
            {isLoading && (
              <tr><td colSpan={5} className="px-4 py-8 text-center" style={{ color: 'var(--text-muted)' }}>Yükleniyor...</td></tr>
            )}
            {data?.data?.map((form) => (
              <tr
                key={form._id}
                className="border-t hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
                style={{ borderColor: 'var(--border)' }}
                onClick={() => setSelected(form)}
              >
                <td className="px-4 py-3">
                  <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {form.fields?.name || form.fields?.email || '—'}
                  </div>
                  {form.fields?.email && form.fields?.name && (
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{form.fields.email}</div>
                  )}
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                  {formTypeLabel[form.formType] || form.formType}
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>
                  {new Date(form.submittedAt).toLocaleDateString('tr-TR', {
                    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[form.status] || ''}`}>
                    {statusLabel[form.status] || form.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={form.status}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleStatusChange(form._id, e.target.value)}
                    className="text-xs rounded px-2 py-1 border outline-none"
                    style={{ background: 'var(--bg-muted)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: '14px' }}
                  >
                    <option value="new">Yeni</option>
                    <option value="seen">Görüldü</option>
                    <option value="replied">Yanıtlandı</option>
                  </select>
                </td>
              </tr>
            ))}
            {!isLoading && !data?.data?.length && (
              <tr><td colSpan={5} className="px-4 py-8 text-center" style={{ color: 'var(--text-muted)' }}>Henüz form gönderisi yok</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detay Modal */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Form Detayı — ${formTypeLabel[selected?.formType] || ''}`}
        size="lg"
        footer={
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setSelected(null)}>Kapat</Button>
          </div>
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex gap-3 flex-wrap">
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[selected.status]}`}>
                {statusLabel[selected.status]}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {new Date(selected.submittedAt).toLocaleDateString('tr-TR', {
                  day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </span>
              {selected.ipAddress && (
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>IP: {selected.ipAddress}</span>
              )}
            </div>
            <div className="rounded-lg p-4 space-y-2" style={{ background: 'var(--bg-muted)' }}>
              {Object.entries(selected.fields || {}).map(([key, val]) => (
                <div key={key} className="flex gap-3">
                  <span className="text-sm font-medium w-32 shrink-0 capitalize" style={{ color: 'var(--text-secondary)' }}>{key}</span>
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{String(val).slice(0, 500)}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleStatusChange(selected._id, 'seen')}
              >
                Görüldü olarak işaretle
              </Button>
              <Button
                size="sm"
                onClick={() => handleStatusChange(selected._id, 'replied')}
              >
                Yanıtlandı olarak işaretle
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
