import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { TableSkeleton } from '../components/ui/Skeleton';
import { TrendingUp, Calendar, ShoppingBag, Search, Download, X, FileText, CheckCircle } from 'lucide-react';
import DatePicker from '../components/ui/DatePicker';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';

/* ─── Ödeme yöntemi logolar (inline SVG) ─────────────────────────── */
const IyzicoLogo = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="6" fill="#6E0EBF"/>
    <text x="4" y="22" fontFamily="Arial,sans-serif" fontWeight="900" fontSize="11" fill="white" letterSpacing="-0.5">iyz</text>
    <circle cx="25" cy="16" r="4" fill="#A855F7" opacity="0.7"/>
    <circle cx="25" cy="16" r="2" fill="white"/>
  </svg>
);

const PayTRLogo = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="6" fill="#0A63FF"/>
    <text x="3" y="21" fontFamily="Arial,sans-serif" fontWeight="900" fontSize="9.5" fill="white" letterSpacing="-0.3">Pay</text>
    <text x="3" y="29" fontFamily="Arial,sans-serif" fontWeight="900" fontSize="9.5" fill="#7AB8FF" letterSpacing="-0.3">TR</text>
    <rect x="22" y="8" width="7" height="3" rx="1.5" fill="white" opacity="0.9"/>
    <rect x="22" y="14" width="7" height="3" rx="1.5" fill="white" opacity="0.6"/>
    <rect x="22" y="20" width="7" height="3" rx="1.5" fill="white" opacity="0.3"/>
  </svg>
);

const BankLogo = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="6" fill="#0EA5E9"/>
    <polygon points="16,5 28,11 28,13 4,13 4,11" fill="white" opacity="0.95"/>
    <rect x="6"  y="14" width="3" height="9" rx="1" fill="white" opacity="0.85"/>
    <rect x="11" y="14" width="3" height="9" rx="1" fill="white" opacity="0.85"/>
    <rect x="16" y="14" width="3" height="9" rx="1" fill="white" opacity="0.85"/>
    <rect x="21" y="14" width="3" height="9" rx="1" fill="white" opacity="0.85"/>
    <rect x="4"  y="24" width="24" height="2.5" rx="1" fill="white" opacity="0.95"/>
  </svg>
);

const CodLogo = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="6" fill="#10B981"/>
    <rect x="4" y="10" width="18" height="13" rx="2" fill="white" opacity="0.95"/>
    <path d="M22 14 L28 14 L28 22 L22 22 Z" fill="white" opacity="0.7"/>
    <circle cx="8"  cy="26" r="2.5" fill="#065F46"/>
    <circle cx="19" cy="26" r="2.5" fill="#065F46"/>
    <path d="M8 13 L14 13" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M8 16 L12 16" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const METHOD_META = {
  iyzico:           { label: 'İyzico',       Logo: IyzicoLogo, color: '#6E0EBF', bg: '#F5F0FF' },
  paytr:            { label: 'PayTR',         Logo: PayTRLogo,  color: '#0A63FF', bg: '#EFF6FF' },
  bank_transfer:    { label: 'Havale / EFT',  Logo: BankLogo,   color: '#0EA5E9', bg: '#F0F9FF' },
  cash_on_delivery: { label: 'Kapıda Ödeme',  Logo: CodLogo,    color: '#10B981', bg: '#F0FDF4' },
};

/* ─── Status + formatter ──────────────────────────────────────────── */
const STATUS = {
  pending:   { label: 'Bekliyor', dot: '#F59E0B', bg: '#FFFBEB', text: '#92400E' },
  paid:      { label: 'Ödendi',   dot: '#10B981', bg: '#ECFDF5', text: '#065F46' },
  cancelled: { label: 'İptal',    dot: '#EF4444', bg: '#FEF2F2', text: '#991B1B' },
  refunded:  { label: 'İade',     dot: '#F97316', bg: '#FFF7ED', text: '#9A3412' },
};

const fmt = (n, currency = 'TRY') =>
  Number(n).toLocaleString('tr-TR', { style: 'currency', currency, maximumFractionDigits: 2 });

/* ─── Premium Tooltip ─────────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl shadow-xl px-4 py-3 text-sm"
      style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', minWidth: 160 }}>
      <p className="text-xs mb-1.5" style={{ color: '#94a3b8' }}>
        {new Date(label).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
      </p>
      <p className="font-bold" style={{ color: '#f1f5f9' }}>
        {fmt(payload[0].value)}
      </p>
      {payload[0].payload.count > 0 && (
        <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
          {payload[0].payload.count} sipariş
        </p>
      )}
    </div>
  );
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch]         = useState('');
  const [status, setStatus]         = useState('');
  const [dateFrom, setDateFrom]     = useState('');
  const [dateTo, setDateTo]         = useState('');
  const [page, setPage]             = useState(1);
  const [confirmId, setConfirmId]   = useState(null);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [confirmPayId, setConfirmPayId]     = useState(null);

  const { data: stats } = useQuery({
    queryKey: ['orders-stats'],
    queryFn: () => api.get('/orders/stats').then((r) => r.data),
  });

  const { data: chartData } = useQuery({
    queryKey: ['orders-daily-stats'],
    queryFn: () => api.get('/orders/daily-stats', { params: { days: 30 } }).then((r) => r.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['orders', { search, status, dateFrom, dateTo, page }],
    queryFn: () => api.get('/orders', { params: { search, status, dateFrom, dateTo, page, limit: 20 } }).then((r) => r.data),
    keepPreviousData: true,
  });

  const confirmPayment = useMutation({
    mutationFn: (id) => api.patch(`/orders/${id}/confirm-payment`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['orders-stats'] });
      toast.success('Ödeme onaylandı');
      setConfirmPayId(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Onay başarısız'),
  });

  const cancelOrder = useMutation({
    mutationFn: (id) => api.patch(`/orders/${id}/status`, { status: 'cancelled' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['orders-stats'] });
      toast.success('Sipariş iptal edildi');
      setConfirmId(null);
      setConfirmChecked(false);
    },
    onError: (e) => {
      toast.error(e.response?.data?.message || 'İptal başarısız');
      setConfirmId(null);
      setConfirmChecked(false);
    },
  });

  const exportCsv = () => {
    api.get('/orders/export', {
      params: { status: status || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined },
      responseType: 'blob',
    }).then((r) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([r.data], { type: 'text/csv;charset=utf-8' }));
      a.download = `siparisler-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
    }).catch(() => toast.error('Dışa aktarma başarısız'));
  };

  const orders     = data?.orders || [];
  const totalPages = data?.pages  || 1;
  const daily      = chartData?.daily || [];
  const byMethod   = chartData?.byPaymentMethod || [];
  const totalMethodCount = byMethod.reduce((s, x) => s + x.count, 0);

  /* stat kart renkleri */
  const statCards = [
    { label: 'Bugün',   d: stats?.today,     Icon: Calendar,    grad: 'from-violet-500 to-purple-600',  glow: 'rgba(139,92,246,0.15)' },
    { label: 'Bu Ay',   d: stats?.thisMonth, Icon: TrendingUp,  grad: 'from-emerald-500 to-teal-600',   glow: 'rgba(16,185,129,0.15)' },
    { label: 'Toplam',  d: stats?.allTime,   Icon: ShoppingBag, grad: 'from-amber-500 to-orange-500',   glow: 'rgba(245,158,11,0.15)' },
  ];

  return (
    <div>
      {/* ── Başlık ── */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Siparişler</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Tüm ödeme kanallarından gelen siparişleri takip edin</p>
        </div>
        <button onClick={exportCsv}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:shadow-sm active:scale-[0.98]"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-surface)' }}>
          <Download size={14} /> Excel İndir
        </button>
      </div>

      {/* ── Özet Kartlar ── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {statCards.map(({ label, d, Icon, grad, glow }) => (
          <div key={label}
            className="rounded-2xl border p-5 flex items-center gap-4 transition-all hover:shadow-md"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', boxShadow: `0 2px 12px ${glow}` }}>
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center shrink-0 shadow-lg`}>
              <Icon size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
              <p className="text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                {d ? fmt(d.total) : '₺0,00'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {d?.count || 0} sipariş
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Grafik Alanı ── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Alan grafik */}
        <div className="col-span-2 rounded-2xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Son 30 Günlük Gelir</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Toplam: {fmt(daily.reduce((s, d) => s + d.total, 0))}
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
              30 Gün
            </span>
          </div>
          {daily.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={daily} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={false} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                  axisLine={false} tickLine={false}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 2' }} />
                <Area
                  type="monotone" dataKey="total"
                  stroke="#6366f1" strokeWidth={2.5}
                  fill="url(#revenueGrad)"
                  dot={false} activeDot={{ r: 5, fill: '#6366f1', strokeWidth: 2, stroke: 'white' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>
              Henüz veri yok
            </div>
          )}
        </div>

        {/* Ödeme yöntemi dağılımı */}
        <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Ödeme Yöntemleri</p>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Son 30 gün dağılımı</p>
          {byMethod.length > 0 ? (
            <div className="space-y-3.5">
              {byMethod.map((item) => {
                const meta = METHOD_META[item._id] || { label: item._id, Logo: BankLogo, color: '#6b7280', bg: '#f9fafb' };
                const pct  = totalMethodCount > 0 ? Math.round((item.count / totalMethodCount) * 100) : 0;
                return (
                  <div key={item._id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg p-1" style={{ background: meta.bg }}>
                          <meta.Logo size={18} />
                        </div>
                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{meta.label}</span>
                      </div>
                      <span className="text-xs font-semibold" style={{ color: meta.color }}>%{pct}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: meta.color }} />
                    </div>
                    <p className="text-xs mt-0.5 text-right" style={{ color: 'var(--text-muted)' }}>
                      {item.count} işlem · {fmt(item.total)}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <TrendingUp size={24} style={{ color: 'var(--border)' }} />
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Henüz ödeme yok</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Filtreler ── */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Sipariş no, müşteri ara..."
            className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm border outline-none focus:ring-2 focus:ring-[#6366f1]/20"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-xl px-3 py-2.5 text-sm border outline-none"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
          <option value="">Tüm Durumlar</option>
          {Object.entries(STATUS).map(([v, { label }]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
        <DatePicker value={dateFrom} onChange={(v) => { setDateFrom(v); setPage(1); }} placeholder="Başlangıç" />
        <DatePicker value={dateTo}   onChange={(v) => { setDateTo(v);   setPage(1); }} placeholder="Bitiş" />
      </div>

      {/* ── Tablo ── */}
      {isLoading ? <TableSkeleton rows={5} cols={6} /> : (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <table className="w-full text-sm">
            <thead style={{ background: 'var(--bg-muted)' }}>
              <tr>
                {['Sipariş No', 'Müşteri', 'Yöntem', 'Tarih', 'Tutar', 'Durum', 'İşlemler'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody style={{ background: 'var(--bg-surface)' }}>
              {orders.map((order) => {
                const st           = STATUS[order.status] || { label: order.status, dot: '#9ca3af', bg: '#f9fafb', text: '#374151' };
                const meta         = METHOD_META[order.paymentMethod];
                const canCancel    = ['paid', 'pending'].includes(order.status);
                const canConfirmPay = ['bank_transfer', 'cash_on_delivery'].includes(order.paymentMethod) && order.paymentStatus === 'pending';
                return (
                  <tr key={order._id} className="border-t hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
                    style={{ borderColor: 'var(--border)' }}
                    onClick={() => navigate(`/orders/${order._id}`)}>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                        {order.orderNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{order.customer?.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{order.customer?.email}</p>
                    </td>
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      {meta ? (
                        <div className="flex items-center gap-1.5">
                          <div className="rounded-md p-0.5" style={{ background: meta.bg }}>
                            <meta.Logo size={18} />
                          </div>
                          <span className="text-xs font-medium hidden xl:inline" style={{ color: meta.color }}>{meta.label}</span>
                        </div>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{order.paymentMethod}</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                      {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-sm whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                      {fmt(order.total, order.currency)}
                    </td>
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold w-fit"
                          style={{ background: st.bg, color: st.text }}>
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: st.dot }} />
                          {st.label}
                        </span>
                        {order.efatura?.status === 'sent' && (
                          <span className="flex items-center gap-1 text-xs font-medium" style={{ color: '#059669' }}>
                            <FileText size={10} /> e-Fatura
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        {canConfirmPay && (
                          <button
                            onClick={() => setConfirmPayId(order._id)}
                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-all hover:shadow-sm"
                            style={{ borderColor: '#6ee7b7', color: '#059669', background: '#f0fdf4' }}>
                            <CheckCircle size={11} /> Ödendi
                          </button>
                        )}
                        {canCancel && (
                          <button
                            onClick={() => setConfirmId(order._id)}
                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-all hover:shadow-sm"
                            style={{ borderColor: '#fca5a5', color: '#dc2626', background: '#fef2f2' }}>
                            <X size={11} /> İptal
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/orders/${order._id}`)}
                          className="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all hover:shadow-sm"
                          style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1' }}>
                          Detay
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!orders.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center">
                    <ShoppingBag size={32} className="mx-auto mb-3" style={{ color: 'var(--border)' }} />
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Henüz sipariş yok</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Sayfalama ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-5">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 rounded-xl text-sm font-medium border transition-all disabled:opacity-40 hover:shadow-sm"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-surface)' }}>
            ← Önceki
          </button>
          <span className="text-sm px-3 py-2 rounded-xl font-medium"
            style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
            {page} / {totalPages}
          </span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-xl text-sm font-medium border transition-all disabled:opacity-40 hover:shadow-sm"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-surface)' }}>
            Sonraki →
          </button>
        </div>
      )}

      {/* ── İptal Modal ── */}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => { setConfirmId(null); setConfirmChecked(false); }}>
          <div className="rounded-2xl p-6 w-full max-w-md shadow-2xl"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(220,38,38,0.1)' }}>
                <X size={20} style={{ color: '#dc2626' }} />
              </div>
              <div>
                <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Siparişi İptal Et</h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Bu işlem geri alınamaz</p>
              </div>
            </div>
            <div className="rounded-xl p-4 mb-4 text-sm space-y-2"
              style={{ background: 'rgba(220,38,38,0.04)', border: '1px solid rgba(220,38,38,0.15)' }}>
              <p style={{ color: 'var(--text-secondary)' }}>
                Bu sipariş <strong>kalıcı olarak iptal edilecek</strong> ve ödeme alınmışsa iade başlatılacaktır.
              </p>
            </div>
            <label className="flex items-start gap-3 cursor-pointer mb-5 select-none">
              <input type="checkbox" checked={confirmChecked} onChange={(e) => setConfirmChecked(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-red-600 shrink-0" />
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                Yukarıdaki bilgileri okudum, siparişi iptal etmek istediğimi <strong>onaylıyorum.</strong>
              </span>
            </label>
            <div className="flex gap-3">
              <button onClick={() => { setConfirmId(null); setConfirmChecked(false); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors hover:bg-[var(--bg-muted)]"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                Vazgeç
              </button>
              <button onClick={() => cancelOrder.mutate(confirmId)}
                disabled={cancelOrder.isPending || !confirmChecked}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: '#dc2626' }}>
                {cancelOrder.isPending ? 'İşleniyor...' : 'Evet, İptal Et'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Ödeme Onay Modal ── */}
      {confirmPayId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setConfirmPayId(null)}>
          <div className="rounded-2xl p-6 w-full max-w-md shadow-2xl"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(16,185,129,0.1)' }}>
                <CheckCircle size={20} style={{ color: '#10b981' }} />
              </div>
              <div>
                <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Ödemeyi Onayla</h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Havale / EFT veya kapıda ödeme</p>
              </div>
            </div>
            <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
              Müşterinin ödemesini aldığınızı onaylıyorsunuz. Sipariş durumu <strong>"Ödendi"</strong> olarak güncellenecek.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmPayId(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border hover:bg-[var(--bg-muted)]"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                Vazgeç
              </button>
              <button onClick={() => confirmPayment.mutate(confirmPayId)} disabled={confirmPayment.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
                style={{ background: '#10b981' }}>
                {confirmPayment.isPending ? 'Kaydediliyor...' : 'Evet, Ödendi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
