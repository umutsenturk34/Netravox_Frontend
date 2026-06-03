import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import {
  Users, Search, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Eye, Trash2, X, MailCheck, MailX, ShieldCheck,
} from 'lucide-react';

const LIMIT = 20;

export default function CustomersPage() {
  const [customers, setCustomers]     = useState([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [pages, setPages]             = useState(1);
  const [loading, setLoading]         = useState(false);
  const [q, setQ]                     = useState('');
  const [status, setStatus]           = useState('');
  const [emailVerified, setEmailVerified] = useState('');
  const [selected, setSelected]       = useState(null);
  const [detailOpen, setDetailOpen]   = useState(false);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: LIMIT });
      if (q.trim())      params.set('q', q.trim());
      if (status)        params.set('status', status);
      if (emailVerified) params.set('emailVerified', emailVerified);
      const { data } = await api.get(`/customers?${params}`);
      setCustomers(data.customers || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      setPage(p);
    } catch {
      setCustomers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [q, status, emailVerified]);

  useEffect(() => { load(1); }, [q, status, emailVerified]);

  const toggleStatus = async (customer) => {
    try {
      const { data } = await api.patch(`/customers/${customer._id}/status`, { isActive: !customer.isActive });
      setCustomers((prev) => prev.map((c) => (c._id === data._id ? data : c)));
      if (selected?._id === data._id) setSelected(data);
    } catch { /* silent */ }
  };

  const manualVerify = async (customer) => {
    try {
      const { data } = await api.patch(`/customers/${customer._id}/verify-email`);
      setCustomers((prev) => prev.map((c) => (c._id === data._id ? data : c)));
      if (selected?._id === data._id) setSelected(data);
    } catch { /* silent */ }
  };

  const deleteCustomer = async (id) => {
    if (!window.confirm('Bu müşteriyi kalıcı olarak silmek istediğinizden emin misiniz?')) return;
    try {
      await api.delete(`/customers/${id}`);
      setCustomers((prev) => prev.filter((c) => c._id !== id));
      setTotal((t) => t - 1);
      if (selected?._id === id) setDetailOpen(false);
    } catch { /* silent */ }
  };

  const openDetail = async (id) => {
    try {
      const { data } = await api.get(`/customers/${id}`);
      setSelected(data);
      setDetailOpen(true);
    } catch { /* silent */ }
  };

  const fmt = (iso) => iso
    ? new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(99,102,241,0.1)' }}
          >
            <Users size={18} style={{ color: '#6366f1' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Müşteriler</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{total} kayıtlı müşteri</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Ad, soyad veya email ara…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: '16px' }}
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: '16px' }}
        >
          <option value="">Tüm Durumlar</option>
          <option value="active">Aktif</option>
          <option value="inactive">Pasif</option>
        </select>
        <select
          value={emailVerified}
          onChange={(e) => setEmailVerified(e.target.value)}
          className="px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: '16px' }}
        >
          <option value="">Tüm E-postalar</option>
          <option value="verified">Doğrulanmış</option>
          <option value="unverified">Doğrulanmamış</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
              {['Müşteri', 'Email', 'Telefon', 'Kayıt Tarihi', 'Durum', ''].map((h) => (
                <th key={h} className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide"
                  style={{ color: 'var(--text-muted)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
                  Yükleniyor…
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
                  Müşteri bulunamadı
                </td>
              </tr>
            ) : customers.map((c, idx) => (
              <tr
                key={c._id}
                className="border-b transition-colors hover:bg-[var(--bg-muted)]"
                style={{ borderColor: idx < customers.length - 1 ? 'var(--border)' : 'transparent' }}
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}
                    >
                      {c.firstName?.[0]}{c.lastName?.[0]}
                    </div>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {c.firstName} {c.lastName}
                    </span>
                  </div>
                </td>
                {/* Email + verified badge */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span style={{ color: 'var(--text-secondary)' }}>{c.email}</span>
                    {c.isEmailVerified
                      ? <MailCheck size={13} title="E-posta doğrulandı" style={{ color: '#16a34a', flexShrink: 0 }} />
                      : <MailX    size={13} title="E-posta doğrulanmadı" style={{ color: '#f59e0b', flexShrink: 0 }} />
                    }
                  </div>
                </td>
                <td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>{c.phone || '—'}</td>
                <td className="py-3 px-4 text-sm" style={{ color: 'var(--text-muted)' }}>{fmt(c.createdAt)}</td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => toggleStatus(c)}
                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium transition-all"
                    style={c.isActive
                      ? { background: 'rgba(34,197,94,0.12)', color: '#16a34a' }
                      : { background: 'rgba(239,68,68,0.12)', color: '#dc2626' }
                    }
                  >
                    {c.isActive ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                    {c.isActive ? 'Aktif' : 'Pasif'}
                  </button>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openDetail(c._id)}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#6366f1'; e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      onClick={() => deleteCustomer(c._id)}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>
          <span>
            {total} müşteriden {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} gösteriliyor
          </span>
          <div className="flex gap-1 items-center">
            <button
              onClick={() => load(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--bg-muted)]"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="px-3 py-1 rounded-lg text-xs font-medium"
              style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
              {page} / {pages}
            </span>
            <button
              onClick={() => load(page + 1)}
              disabled={page >= pages}
              className="p-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--bg-muted)]"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {detailOpen && selected && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/40 backdrop-blur-sm"
            onClick={() => setDetailOpen(false)}
          />
          <div
            className="w-[400px] flex flex-col overflow-y-auto shadow-2xl"
            style={{ background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)' }}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Müşteri Detayı</h2>
              <button
                onClick={() => setDetailOpen(false)}
                className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-muted)]"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Avatar + name */}
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold"
                  style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}
                >
                  {selected.firstName?.[0]}{selected.lastName?.[0]}
                </div>
                <div>
                  <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    {selected.firstName} {selected.lastName}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{selected.email}</p>
                    {selected.isEmailVerified
                      ? <MailCheck size={12} style={{ color: '#16a34a' }} title="Doğrulandı" />
                      : <MailX    size={12} style={{ color: '#f59e0b' }} title="Doğrulanmadı" />
                    }
                  </div>
                </div>
              </div>

              {/* E-posta doğrulama banner — sadece doğrulanmamışsa */}
              {!selected.isEmailVerified && (
                <div
                  className="flex items-center justify-between gap-3 rounded-xl p-3"
                  style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
                >
                  <div className="flex items-center gap-2">
                    <MailX size={15} style={{ color: '#f59e0b', flexShrink: 0 }} />
                    <p className="text-xs" style={{ color: '#92400e' }}>
                      E-posta adresi henüz doğrulanmadı
                    </p>
                  </div>
                  <button
                    onClick={() => manualVerify(selected)}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg whitespace-nowrap transition-all"
                    style={{ background: 'rgba(245,158,11,0.15)', color: '#b45309' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(245,158,11,0.25)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(245,158,11,0.15)'}
                  >
                    Manuel Doğrula
                  </button>
                </div>
              )}

              {selected.isEmailVerified && (
                <div
                  className="flex items-center gap-2 rounded-xl p-3"
                  style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.15)' }}
                >
                  <ShieldCheck size={15} style={{ color: '#16a34a' }} />
                  <p className="text-xs font-medium" style={{ color: '#15803d' }}>E-posta doğrulandı</p>
                </div>
              )}

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Telefon',      value: selected.phone || '—' },
                  { label: 'Durum',        value: selected.isActive ? 'Aktif' : 'Pasif' },
                  { label: 'Kayıt Tarihi', value: fmt(selected.createdAt) },
                  { label: 'Adres Sayısı', value: selected.addresses?.length ?? 0 },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl p-3" style={{ background: 'var(--bg-muted)' }}>
                    <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Addresses */}
              {selected.addresses?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                    Kayıtlı Adresler
                  </p>
                  <div className="space-y-2">
                    {selected.addresses.map((a) => (
                      <div key={a._id} className="rounded-xl p-3" style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)' }}>
                        <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                          {a.label} — {a.fullName}
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                          {a.addressLine}{a.district ? `, ${a.district}` : ''}, {a.city}{a.postalCode ? ` ${a.postalCode}` : ''}
                        </p>
                        {a.isDefault && (
                          <span className="text-xs mt-1 inline-block font-medium" style={{ color: '#6366f1' }}>
                            Varsayılan
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => toggleStatus(selected)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={selected.isActive
                    ? { background: 'rgba(239,68,68,0.1)', color: '#ef4444' }
                    : { background: 'rgba(34,197,94,0.1)', color: '#16a34a' }
                  }
                >
                  {selected.isActive ? 'Pasife Al' : 'Aktife Al'}
                </button>
                <button
                  onClick={() => deleteCustomer(selected._id)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
