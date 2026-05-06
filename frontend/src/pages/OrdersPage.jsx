import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { TableSkeleton } from '../components/ui/Skeleton';
import { ShoppingBag, TrendingUp, Calendar, Search } from 'lucide-react';

const STATUS_LABELS = {
  pending:   { label: 'Bekliyor',    color: 'bg-yellow-100 text-yellow-700' },
  paid:      { label: 'Ödendi',      color: 'bg-green-100 text-green-700' },
  preparing: { label: 'Hazırlanıyor',color: 'bg-blue-100 text-blue-700' },
  shipped:   { label: 'Kargoda',     color: 'bg-purple-100 text-purple-700' },
  delivered: { label: 'Teslim Edildi',color:'bg-teal-100 text-teal-700' },
  cancelled: { label: 'İptal',       color: 'bg-red-100 text-red-700' },
  refunded:  { label: 'İade',        color: 'bg-orange-100 text-orange-700' },
};

const fmt = (n, currency = 'TRY') =>
  Number(n).toLocaleString('tr-TR', { style: 'currency', currency, maximumFractionDigits: 2 });

export default function OrdersPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const { data: stats } = useQuery({
    queryKey: ['orders-stats'],
    queryFn: () => api.get('/orders/stats').then((r) => r.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['orders', { search, status, dateFrom, dateTo, page }],
    queryFn: () => api.get('/orders', { params: { search, status, dateFrom, dateTo, page, limit: 20 } }).then((r) => r.data),
    keepPreviousData: true,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status: s }) => api.patch(`/orders/${id}/status`, { status: s }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orders'] }); qc.invalidateQueries({ queryKey: ['orders-stats'] }); },
    onError: () => toast.error('Durum güncellenemedi'),
  });

  const orders = data?.orders || [];
  const totalPages = data?.pages || 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Siparişler</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Gelen siparişleri yönetin, fatura indirin</p>
        </div>
      </div>

      {/* Özet kartlar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Bugün',   data: stats?.today,     icon: Calendar,    color: '#6366f1' },
          { label: 'Bu Ay',   data: stats?.thisMonth, icon: TrendingUp,  color: '#10b981' },
          { label: 'Toplam',  data: stats?.allTime,   icon: ShoppingBag, color: '#f59e0b' },
        ].map(({ label, data: d, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border p-4 flex items-center gap-3"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${color}18` }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                {d ? fmt(d.total) : '—'}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{d?.count || 0} sipariş</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Sipariş no, müşteri ara..."
            className="w-full rounded-xl pl-9 pr-4 py-2 text-sm border outline-none"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-xl px-3 py-2 text-sm border outline-none"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
          <option value="">Tüm Durumlar</option>
          {Object.entries(STATUS_LABELS).map(([v, { label }]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
          className="rounded-xl px-3 py-2 text-sm border outline-none"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
        <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
          className="rounded-xl px-3 py-2 text-sm border outline-none"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
      </div>

      {/* Tablo */}
      {isLoading ? <TableSkeleton rows={5} cols={6} /> : (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <table className="w-full text-sm">
            <thead style={{ background: 'var(--bg-muted)' }}>
              <tr>
                {['Sipariş No', 'Müşteri', 'Tarih', 'Tutar', 'Durum', 'İşlemler'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody style={{ background: 'var(--bg-surface)' }}>
              {orders.map((order) => {
                const st = STATUS_LABELS[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-500' };
                return (
                  <tr key={order._id} className="border-t hover:bg-[var(--bg-muted)] transition-colors"
                    style={{ borderColor: 'var(--border)' }}>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {order.orderNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{order.customer?.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{order.customer?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-4 py-3 font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {fmt(order.total, order.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.color}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={order.status}
                          onChange={(e) => updateStatus.mutate({ id: order._id, status: e.target.value })}
                          className="text-xs rounded-lg border px-2 py-1 outline-none"
                          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                        >
                          {Object.entries(STATUS_LABELS).map(([v, { label }]) => (
                            <option key={v} value={v}>{label}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => navigate(`/orders/${order._id}`)}
                          className="text-xs px-2.5 py-1 rounded-lg transition-colors"
                          style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}
                        >
                          Detay
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!orders.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                    Henüz sipariş yok
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Sayfalama */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 rounded-lg text-sm border disabled:opacity-40"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>← Önceki</button>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-lg text-sm border disabled:opacity-40"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>Sonraki →</button>
        </div>
      )}
    </div>
  );
}
