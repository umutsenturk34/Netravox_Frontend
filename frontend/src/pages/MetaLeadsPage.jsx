import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, Trash2, RefreshCw } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';

const statusLabel  = { new: 'Yeni', seen: 'Görüldü', contacted: 'İletişim Kuruldu' };
const statusColor  = {
  new:       'bg-blue-100 text-blue-700',
  seen:      'bg-yellow-100 text-yellow-700',
  contacted: 'bg-green-100 text-green-700',
};

function getField(fieldData, ...names) {
  for (const name of names) {
    const f = fieldData?.find((d) => d.name === name);
    if (f?.value) return f.value;
  }
  return null;
}

function LeadName({ fieldData }) {
  const full  = getField(fieldData, 'full_name');
  const first = getField(fieldData, 'first_name');
  const last  = getField(fieldData, 'last_name');
  const name  = full || [first, last].filter(Boolean).join(' ') || '—';
  const email = getField(fieldData, 'email');
  const phone = getField(fieldData, 'phone_number', 'phone');
  return (
    <div>
      <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{name}</div>
      {email && <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{email}</div>}
      {phone && !email && <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{phone}</div>}
    </div>
  );
}

export default function MetaLeadsPage() {
  const { toast }          = useToast();
  const { activeTenantId } = useAuth();
  const qc                 = useQueryClient();
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch]             = useState('');
  const [selected, setSelected]         = useState(null);
  const [notesDraft, setNotesDraft]     = useState('');
  const [exporting, setExporting]       = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['meta-leads', activeTenantId, filterStatus, search, page],
    queryFn: () => {
      const params = new URLSearchParams({ limit: 25, page });
      if (filterStatus) params.set('status', filterStatus);
      if (search)       params.set('search', search);
      return api.get(`/meta-leads?${params}`).then((r) => r.data);
    },
    enabled: !!activeTenantId,
  });

  const updateLead = useMutation({
    mutationFn: ({ id, ...body }) => api.patch(`/meta-leads/${id}`, body).then((r) => r.data),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['meta-leads'] });
      toast.success('Güncellendi');
      if (selected?._id === updated._id) setSelected(updated);
    },
    onError: () => toast.error('Güncellenemedi'),
  });

  const deleteLead = useMutation({
    mutationFn: (id) => api.delete(`/meta-leads/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meta-leads'] });
      toast.success('Lead silindi');
      setSelected(null);
    },
    onError: () => toast.error('Silinemedi'),
  });

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      const res = await api.get(`/meta-leads/export?${params}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `meta-leads-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Dışa aktarılamadı');
    } finally {
      setExporting(false);
    }
  };

  const openDetail = (lead) => {
    setSelected(lead);
    setNotesDraft(lead.notes || '');
    if (lead.status === 'new') {
      updateLead.mutate({ id: lead._id, status: 'seen' });
    }
  };

  const totalPages = data ? Math.ceil(data.total / 25) : 1;

  return (
    <div>
      {/* Başlık */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Meta Lead Ads</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Facebook / Instagram reklam formlarından gelen müşteri talepleri
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 rounded-lg border transition-colors hover:bg-[var(--bg-muted)]"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            title="Yenile"
          >
            <RefreshCw size={15} />
          </button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExport}
            loading={exporting}
          >
            <Download size={14} className="mr-1.5" />
            Excel İndir
          </Button>
        </div>
      </div>

      {/* Filtreler */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="İsim, e-posta veya telefon ara..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="text-sm rounded-lg px-3 py-2 border outline-none focus:ring-2 focus:ring-blue-500/20 flex-1 max-w-xs"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: '16px' }}
        />
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="text-sm rounded-lg px-3 py-2 border outline-none focus:ring-2 focus:ring-blue-500/20"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: '16px' }}
        >
          <option value="">Tüm Durumlar</option>
          <option value="new">Yeni</option>
          <option value="seen">Görüldü</option>
          <option value="contacted">İletişim Kuruldu</option>
        </select>
      </div>

      {/* Tablo */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full text-sm">
          <thead style={{ background: 'var(--bg-muted)' }}>
            <tr>
              {['Kişi', 'Tarih', 'Kampanya', 'Durum', ''].map((h, i) => (
                <th key={i} className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody style={{ background: 'var(--bg-surface)' }}>
            {isLoading && (
              <tr><td colSpan={5} className="px-4 py-8 text-center" style={{ color: 'var(--text-muted)' }}>Yükleniyor...</td></tr>
            )}
            {data?.data?.map((lead) => (
              <tr
                key={lead._id}
                className="border-t hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
                style={{ borderColor: 'var(--border)' }}
                onClick={() => openDetail(lead)}
              >
                <td className="px-4 py-3"><LeadName fieldData={lead.fieldData} /></td>
                <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>
                  {lead.createdTime
                    ? new Date(lead.createdTime).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : new Date(lead.receivedAt).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>
                  {lead.campaignId ? (
                    <span className="font-mono text-xs">{lead.campaignId.slice(-8)}</span>
                  ) : '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[lead.status] || ''}`}>
                    {statusLabel[lead.status] || lead.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={lead.status}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => updateLead.mutate({ id: lead._id, status: e.target.value })}
                    className="text-xs rounded px-2 py-1 border outline-none"
                    style={{ background: 'var(--bg-muted)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: '14px' }}
                  >
                    <option value="new">Yeni</option>
                    <option value="seen">Görüldü</option>
                    <option value="contacted">İletişim Kuruldu</option>
                  </select>
                </td>
              </tr>
            ))}
            {!isLoading && !data?.data?.length && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Henüz lead yok</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Meta reklam formlarından gelen talepler burada görünecek.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Sayfalama */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>
          <span>{data?.total} kayıt</span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 rounded-lg border disabled:opacity-40"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}
            >
              ← Önceki
            </button>
            <span className="px-3 py-1.5">{page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 rounded-lg border disabled:opacity-40"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}
            >
              Sonraki →
            </button>
          </div>
        </div>
      )}

      {/* Detay Modal */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Lead Detayı"
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              onClick={() => {
                if (confirm('Bu lead silinsin mi?')) deleteLead.mutate(selected._id);
              }}
              className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 transition-colors"
            >
              <Trash2 size={14} />
              Sil
            </button>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setSelected(null)}>Kapat</Button>
              <Button
                size="sm"
                loading={updateLead.isPending}
                onClick={() => updateLead.mutate({ id: selected._id, notes: notesDraft })}
              >
                Notu Kaydet
              </Button>
            </div>
          </div>
        }
      >
        {selected && (
          <div className="space-y-5">
            {/* Meta bilgileri */}
            <div className="grid grid-cols-2 gap-3 text-xs rounded-lg p-3" style={{ background: 'var(--bg-muted)' }}>
              {[
                ['Lead ID', selected.leadId],
                ['Form ID', selected.formId],
                ['Sayfa ID', selected.pageId],
                ['Kampanya ID', selected.campaignId],
                ['Reklam Seti', selected.adsetId],
                ['Reklam ID', selected.adId],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label}>
                  <span style={{ color: 'var(--text-muted)' }}>{label}: </span>
                  <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Form alanları */}
            <div className="rounded-lg p-4 space-y-2.5" style={{ border: '1px solid var(--border)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
                Form Yanıtları
              </p>
              {selected.fieldData?.length ? selected.fieldData.map((f, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-sm font-medium w-36 shrink-0 capitalize" style={{ color: 'var(--text-secondary)' }}>
                    {f.name.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{f.value || '—'}</span>
                </div>
              )) : (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Form alanları henüz yüklenmedi</p>
              )}
            </div>

            {/* Durum */}
            <div className="flex items-center gap-3">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Durum:</span>
              <div className="flex gap-2">
                {['new', 'seen', 'contacted'].map((s) => (
                  <button
                    key={s}
                    onClick={() => updateLead.mutate({ id: selected._id, status: s })}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      selected.status === s
                        ? statusColor[s]
                        : 'opacity-50 hover:opacity-80'
                    }`}
                    style={selected.status !== s ? { background: 'var(--bg-muted)', color: 'var(--text-muted)' } : {}}
                  >
                    {statusLabel[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* Notlar */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Notlar
              </label>
              <textarea
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="Müşteri ile ilgili notlar..."
                className="w-full rounded-lg px-3 py-2 text-sm border outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: '16px' }}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
