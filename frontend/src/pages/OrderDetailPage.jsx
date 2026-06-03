import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import DatePicker from '../components/ui/DatePicker';
import {
  ArrowLeft, Download, X, CreditCard, Building2, Hash,
  FileText, CheckCircle, AlertCircle, Clock, Truck,
} from 'lucide-react';

/* ─── Ödeme logoları (inline SVG) ────────────────────────────────── */
const IyzicoLogo = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="7" fill="#6E0EBF"/>
    <text x="4" y="22" fontFamily="Arial,sans-serif" fontWeight="900" fontSize="11" fill="white" letterSpacing="-0.5">iyz</text>
    <circle cx="25" cy="16" r="4" fill="#A855F7" opacity="0.7"/>
    <circle cx="25" cy="16" r="2" fill="white"/>
  </svg>
);

const PayTRLogo = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="7" fill="#0A63FF"/>
    <text x="3" y="21" fontFamily="Arial,sans-serif" fontWeight="900" fontSize="9.5" fill="white" letterSpacing="-0.3">Pay</text>
    <text x="3" y="29" fontFamily="Arial,sans-serif" fontWeight="900" fontSize="9.5" fill="#7AB8FF" letterSpacing="-0.3">TR</text>
    <rect x="22" y="8"  width="7" height="3" rx="1.5" fill="white" opacity="0.9"/>
    <rect x="22" y="14" width="7" height="3" rx="1.5" fill="white" opacity="0.6"/>
    <rect x="22" y="20" width="7" height="3" rx="1.5" fill="white" opacity="0.3"/>
  </svg>
);

const BankLogo = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="7" fill="#0EA5E9"/>
    <polygon points="16,5 28,11 28,13 4,13 4,11" fill="white" opacity="0.95"/>
    <rect x="6"  y="14" width="3" height="9" rx="1" fill="white" opacity="0.85"/>
    <rect x="11" y="14" width="3" height="9" rx="1" fill="white" opacity="0.85"/>
    <rect x="16" y="14" width="3" height="9" rx="1" fill="white" opacity="0.85"/>
    <rect x="21" y="14" width="3" height="9" rx="1" fill="white" opacity="0.85"/>
    <rect x="4"  y="24" width="24" height="2.5" rx="1" fill="white" opacity="0.95"/>
  </svg>
);

const CodLogo = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="7" fill="#10B981"/>
    <rect x="4" y="10" width="18" height="13" rx="2" fill="white" opacity="0.95"/>
    <path d="M22 14 L28 14 L28 22 L22 22 Z" fill="white" opacity="0.7"/>
    <circle cx="8"  cy="26" r="2.5" fill="#065F46"/>
    <circle cx="19" cy="26" r="2.5" fill="#065F46"/>
    <path d="M8 13 L14 13" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M8 16 L12 16" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

/* ─── Lookup tablolar ─────────────────────────────────────────────── */
const METHOD_META = {
  iyzico:           { label: 'İyzico',       Logo: IyzicoLogo, color: '#6E0EBF', bg: '#F5F0FF', gradient: 'from-purple-600 to-violet-700' },
  paytr:            { label: 'PayTR',         Logo: PayTRLogo,  color: '#0A63FF', bg: '#EFF6FF', gradient: 'from-blue-500 to-blue-700' },
  bank_transfer:    { label: 'Havale / EFT',  Logo: BankLogo,   color: '#0EA5E9', bg: '#F0F9FF', gradient: 'from-sky-500 to-cyan-600' },
  cash_on_delivery: { label: 'Kapıda Ödeme',  Logo: CodLogo,    color: '#10B981', bg: '#F0FDF4', gradient: 'from-emerald-500 to-teal-600' },
};

const STATUS = {
  pending:   { label: 'Bekliyor',         dot: '#F59E0B', bg: '#FFFBEB', text: '#92400E' },
  paid:      { label: 'Ödendi',           dot: '#10B981', bg: '#ECFDF5', text: '#065F46' },
  preparing: { label: 'Hazırlanıyor',     dot: '#6366f1', bg: '#EEF2FF', text: '#3730A3' },
  shipped:   { label: 'Kargoya Verildi',  dot: '#0EA5E9', bg: '#F0F9FF', text: '#0C4A6E' },
  delivered: { label: 'Teslim Edildi',    dot: '#10B981', bg: '#ECFDF5', text: '#065F46' },
  completed: { label: 'Tamamlandı',       dot: '#10B981', bg: '#ECFDF5', text: '#065F46' },
  returned:  { label: 'İade Alındı',      dot: '#8B5CF6', bg: '#F5F3FF', text: '#5B21B6' },
  cancelled: { label: 'İptal',            dot: '#EF4444', bg: '#FEF2F2', text: '#991B1B' },
  refunded:  { label: 'İade',             dot: '#F97316', bg: '#FFF7ED', text: '#9A3412' },
};

const PAY_STATUS = {
  pending:  { label: 'Bekliyor',   color: '#F59E0B' },
  paid:     { label: 'Ödendi',     color: '#10B981' },
  failed:   { label: 'Başarısız',  color: '#EF4444' },
  refunded: { label: 'İade',       color: '#F97316' },
};

const CARD_ASSOC = { VISA: 'Visa', MASTER_CARD: 'Mastercard', TROY: 'Troy', AMEX: 'Amex' };

const fmt = (n, currency = 'TRY') =>
  Number(n).toLocaleString('tr-TR', { style: 'currency', currency, maximumFractionDigits: 2 });

/* ─── Küçük bileşenler ────────────────────────────────────────────── */
function InfoRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between items-center py-2.5 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
      <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="text-sm font-medium text-right" style={{ color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

function cancelMessage(order) {
  const isPaid = order.paymentStatus === 'paid';
  const method = order.paymentMethod;
  if (!isPaid) return { body: 'Ödeme henüz alınmamış. Sipariş iptal edilecek, iade işlemi yapılmayacak.', warn: null };
  if (method === 'iyzico') return {
    body: 'İyzico üzerinden otomatik iade başlatılacak ve tutar müşteriye iade edilecek.',
    warn: 'İade süresi bankanıza göre 1–10 iş günü alabilir.',
  };
  if (method === 'paytr') return {
    body: 'PayTR üzerinden otomatik iade başlatılacak ve tutar müşteriye iade edilecek.',
    warn: 'PayTR iadeleri genellikle 3–5 iş günü içinde gerçekleşir.',
  };
  if (method === 'bank_transfer') return {
    body: 'Havale/EFT ile ödeme alınmış. Müşteriye IBAN\'ınızdan manuel transfer yapmanız gerekecek.',
    warn: 'Sipariş "İade" olarak işaretlenecek, ancak parayı siz iade etmelisiniz.',
  };
  if (method === 'cash_on_delivery') return {
    body: 'Kapıda ödeme alınmış. Müşteriye nakit veya EFT olarak manuel iade yapmanız gerekecek.',
    warn: 'Sipariş "İade" olarak işaretlenecek, ancak parayı siz iade etmelisiniz.',
  };
  return { body: 'Sipariş iptal edilecektir.', warn: null };
}

/* ─── Ana bileşen ────────────────────────────────────────────────── */
/* ─── Sektör → fulfillment tipi ──────────────────────────────────── */
const FULFILLMENT = {
  retail:     'physical',
  rent:       'rental',
  dental:     'service', clinic:  'service', beauty: 'service',
  hotel:      'service', service: 'service', restaurant: 'service',
  other:      'service', default: 'service',
};

const COMPLETE_LABELS = {
  dental:     'Randevu Tamamlandı',
  clinic:     'Hizmet Tamamlandı',
  beauty:     'Hizmet Tamamlandı',
  hotel:      'Hizmet Tamamlandı',
  service:    'Hizmet Tamamlandı',
  restaurant: 'Sipariş Tamamlandı',
  default:    'Tamamlandı',
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { activeCompany } = useAuth();
  const qc = useQueryClient();

  const sector          = activeCompany?.sector || 'default';
  const fulfillmentType = FULFILLMENT[sector] || 'service';
  const completeLabel   = COMPLETE_LABELS[sector] || 'Tamamlandı';

  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelChecked, setCancelChecked] = useState(false);
  const [downloading, setDownloading]     = useState(false);
  const [shippingForm, setShippingForm]   = useState({
    carrier: '', trackingNumber: '', trackingUrl: '', estimatedDelivery: '',
  });

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.get(`/orders/${id}`).then((r) => r.data),
  });

  const cancelOrder = useMutation({
    mutationFn: () => api.patch(`/orders/${id}/status`, { status: 'cancelled' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order', id] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['orders-stats'] });
      setCancelConfirm(false);
      setCancelChecked(false);
      toast.success(order?.paymentStatus === 'paid' ? 'Sipariş iptal edildi — iade başlatıldı' : 'Sipariş iptal edildi');
    },
    onError: (e) => {
      toast.error(e.response?.data?.message || 'İptal edilemedi');
      setCancelConfirm(false);
      setCancelChecked(false);
    },
  });

  const updateShipping = useMutation({
    mutationFn: (data) => api.patch(`/orders/${id}/shipping`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order', id] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Kargo bilgisi güncellendi');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Güncelleme başarısız'),
  });

  const advanceStatus = useMutation({
    mutationFn: (status) => api.patch(`/orders/${id}/status`, { status }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order', id] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['orders-stats'] });
      toast.success('Sipariş durumu güncellendi');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Güncelleme başarısız'),
  });

  const confirmPayment = useMutation({
    mutationFn: () => api.patch(`/orders/${id}/confirm-payment`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order', id] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['orders-stats'] });
      toast.success('Ödeme onaylandı');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Onay başarısız'),
  });

  const downloadInvoice = async () => {
    setDownloading(true);
    try {
      const response = await api.get(`/orders/${id}/invoice`, { responseType: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(response.data);
      a.download = `${order?.invoiceNumber || 'fatura'}.pdf`;
      a.click();
    } catch {
      toast.error('PDF indirilemedi');
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 border-[#6366f1] border-t-transparent animate-spin" />
    </div>
  );
  if (!order) return <div className="p-6 text-sm" style={{ color: 'var(--text-muted)' }}>Sipariş bulunamadı.</div>;

  const st  = STATUS[order.status]               || { label: order.status,        dot: '#9ca3af', bg: '#f9fafb', text: '#374151' };
  const pst = PAY_STATUS[order.paymentStatus]    || { label: order.paymentStatus, color: '#9ca3af' };
  const mtd = METHOD_META[order.paymentMethod]   || { label: order.paymentMethod, Logo: CreditCard, color: '#6b7280', bg: '#f9fafb', gradient: 'from-gray-500 to-gray-600' };
  const iyz = order.iyzico || {};
  const pyt = order.paytr  || {};

  const DONE          = ['completed', 'returned', 'delivered', 'cancelled', 'refunded'];
  const canCancel     = !DONE.includes(order.status) && order.status !== 'cancelled';
  const canShip       = fulfillmentType === 'physical'
    && ['paid', 'preparing', 'shipped'].includes(order.status);
  const canConfirmPay = ['bank_transfer', 'cash_on_delivery'].includes(order.paymentMethod)
    && order.paymentStatus === 'pending'
    && !['cancelled', 'refunded'].includes(order.status);

  const installmentLabel = !iyz.installment || iyz.installment <= 1 ? 'Tek Çekim' : `${iyz.installment} Taksit`;
  const msg = cancelMessage(order);

  return (
    <div className="max-w-5xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-start gap-3 mb-7">
        <button onClick={() => navigate('/orders')}
          className="mt-1 p-2 rounded-xl hover:bg-[var(--bg-muted)] transition-colors shrink-0">
          <ArrowLeft size={16} style={{ color: 'var(--text-muted)' }} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold font-mono tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {order.orderNumber}
            </h1>
            {/* Durum badge */}
            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-semibold"
              style={{ background: st.bg, color: st.text }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
              {st.label}
            </span>
            {/* Ödeme yöntemi badge */}
            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium border"
              style={{ borderColor: mtd.color + '33', color: mtd.color, background: mtd.bg }}>
              <mtd.Logo size={14} />
              {mtd.label}
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {new Date(order.createdAt).toLocaleDateString('tr-TR', {
              day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>

        {/* Aksiyonlar */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {canConfirmPay && (
            <button onClick={() => confirmPayment.mutate()} disabled={confirmPayment.isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:shadow-md disabled:opacity-50"
              style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #6ee7b7' }}>
              <CheckCircle size={14} />
              {confirmPayment.isPending ? 'Kaydediliyor...' : 'Ödendi Onayla'}
            </button>
          )}

          {/* ── Hizmet sektörleri: tek "Tamamlandı" butonu ── */}
          {fulfillmentType === 'service' && order.status === 'paid' && (
            <button onClick={() => advanceStatus.mutate('completed')} disabled={advanceStatus.isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:shadow-md disabled:opacity-50"
              style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #6ee7b7' }}>
              <CheckCircle size={14} />
              {advanceStatus.isPending ? '...' : completeLabel}
            </button>
          )}

          {/* ── Araç kiralama: 2 aşamalı ── */}
          {fulfillmentType === 'rental' && order.status === 'paid' && (
            <button onClick={() => advanceStatus.mutate('preparing')} disabled={advanceStatus.isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:shadow-md disabled:opacity-50"
              style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #93c5fd' }}>
              <Truck size={14} />
              {advanceStatus.isPending ? '...' : 'Araç Teslim Et'}
            </button>
          )}
          {fulfillmentType === 'rental' && order.status === 'preparing' && (
            <button onClick={() => advanceStatus.mutate('returned')} disabled={advanceStatus.isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:shadow-md disabled:opacity-50"
              style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid #c4b5fd' }}>
              <CheckCircle size={14} />
              {advanceStatus.isPending ? '...' : 'Araç İade Alındı'}
            </button>
          )}

          {/* ── Fiziksel e-ticaret: 3 aşamalı ── */}
          {fulfillmentType === 'physical' && order.status === 'paid' && (
            <button onClick={() => advanceStatus.mutate('preparing')} disabled={advanceStatus.isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:shadow-md disabled:opacity-50"
              style={{ background: '#eef2ff', color: '#4f46e5', border: '1px solid #a5b4fc' }}>
              <CheckCircle size={14} />
              {advanceStatus.isPending ? '...' : 'Hazırlanıyor Al'}
            </button>
          )}
          {fulfillmentType === 'physical' && order.status === 'preparing' && (
            <button onClick={() => advanceStatus.mutate('shipped')} disabled={advanceStatus.isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:shadow-md disabled:opacity-50"
              style={{ background: '#f0f9ff', color: '#0284c7', border: '1px solid #7dd3fc' }}>
              <Truck size={14} />
              {advanceStatus.isPending ? '...' : 'Kargoya Ver'}
            </button>
          )}
          {fulfillmentType === 'physical' && order.status === 'shipped' && (
            <button onClick={() => advanceStatus.mutate('delivered')} disabled={advanceStatus.isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:shadow-md disabled:opacity-50"
              style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #6ee7b7' }}>
              <CheckCircle size={14} />
              {advanceStatus.isPending ? '...' : 'Teslim Edildi'}
            </button>
          )}

          <button onClick={downloadInvoice} disabled={downloading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:shadow-md"
            style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}>
            <Download size={14} />
            {downloading ? 'İndiriliyor...' : 'PDF Fatura'}
          </button>
          {canCancel && (
            <button onClick={() => setCancelConfirm(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:shadow-md"
              style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }}>
              <X size={14} /> İptal Et
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* ── Sol ── */}
        <div className="col-span-2 space-y-5">
          {/* Sipariş kalemleri */}
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
            <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
              <FileText size={15} style={{ color: 'var(--text-muted)' }} />
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Sipariş Kalemleri</h2>
            </div>
            <table className="w-full text-sm">
              <thead style={{ background: 'var(--bg-muted)' }}>
                <tr>
                  {['Ürün / Hizmet', 'Adet', 'Birim Fiyat', 'Toplam'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide"
                      style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, i) => (
                  <tr key={i} className="border-t" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-5 py-3.5 font-medium" style={{ color: 'var(--text-primary)' }}>{item.name}</td>
                    <td className="px-5 py-3.5 text-center font-mono" style={{ color: 'var(--text-secondary)' }}>{item.quantity}</td>
                    <td className="px-5 py-3.5" style={{ color: 'var(--text-secondary)' }}>{fmt(item.unitPrice, item.currency)}</td>
                    <td className="px-5 py-3.5 font-bold" style={{ color: 'var(--text-primary)' }}>
                      {fmt(item.unitPrice * item.quantity, item.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Toplam satırlar */}
            <div className="px-5 py-4 border-t space-y-2" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>Ara Toplam</span>
                <span style={{ color: 'var(--text-primary)' }}>{fmt(order.subtotal, order.currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>KDV (%{order.taxRate})</span>
                <span style={{ color: 'var(--text-primary)' }}>{fmt(order.taxAmount, order.currency)}</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-2 mt-1 border-t" style={{ borderColor: 'var(--border)' }}>
                <span style={{ color: 'var(--text-primary)' }}>Genel Toplam</span>
                <span className="text-lg" style={{ color: '#6366f1' }}>{fmt(order.total, order.currency)}</span>
              </div>
            </div>
          </div>

          {/* Müşteri Bilgileri */}
          <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Müşteri Bilgileri</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ['Ad Soyad', order.customer.name],
                ['E-posta',  order.customer.email],
                ['Telefon',  order.customer.phone],
                ['Şehir',    order.customer.city],
                ['İlçe',     order.customer.district],
                ['Adres',    order.customer.address],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label} className="space-y-0.5">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Sağ ── */}
        <div className="space-y-4">
          {/* Ödeme Bilgisi — üst kısım gradient header ile */}
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            {/* Gradient header */}
            <div className={`bg-gradient-to-br ${mtd.gradient} px-4 py-4`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <mtd.Logo size={24} />
                </div>
                <div>
                  <p className="text-xs text-white/70 font-medium">Ödeme Yöntemi</p>
                  <p className="text-sm font-bold text-white">{mtd.label}</p>
                </div>
                <div className="ml-auto">
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                    style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                    {pst.label}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-white/20">
                <p className="text-xs text-white/60">Toplam Tutar</p>
                <p className="text-xl font-bold text-white">{fmt(order.total, order.currency)}</p>
              </div>
            </div>

            {/* Detay satırları */}
            <div className="p-4" style={{ background: 'var(--bg-surface)' }}>
              <InfoRow label="Fatura No" value={<span className="font-mono text-xs">{order.invoiceNumber}</span>} />
              {iyz.paymentId && (
                <InfoRow label="İyzico Ödeme ID" value={<span className="font-mono text-xs">{iyz.paymentId}</span>} />
              )}
              {iyz.paymentTransactionId && (
                <InfoRow label="İyzico İşlem ID" value={<span className="font-mono text-xs">{iyz.paymentTransactionId}</span>} />
              )}
              {pyt.merchantOid && (
                <InfoRow label="PayTR Merchant OID" value={<span className="font-mono text-xs">{pyt.merchantOid}</span>} />
              )}
              {pyt.totalAmount > 0 && (
                <InfoRow label="PayTR Onaylanan" value={fmt(pyt.totalAmount, order.currency)} />
              )}
            </div>
          </div>

          {/* Kart Bilgisi — sadece iyzico */}
          {iyz.cardLastFourDigits && (
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
              <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
                <CreditCard size={14} style={{ color: 'var(--text-muted)' }} />
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Kart Bilgisi</h2>
              </div>
              <div className="p-4">
                {/* Premium kredi kartı görseli */}
                <div className="rounded-xl p-4 mb-3 relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%)' }}>
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, white, transparent)', transform: 'translate(30%, -30%)' }} />
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-8 h-5 rounded bg-amber-400/80" style={{ background: 'linear-gradient(135deg, #f59e0b, #fcd34d)' }} />
                    <p className="text-xs font-bold text-slate-300">{CARD_ASSOC[iyz.cardAssociation] || iyz.cardAssociation}</p>
                  </div>
                  <p className="text-sm font-mono text-white tracking-widest mb-2">
                    {iyz.binNumber ? iyz.binNumber.slice(0, 4) + ' ' + iyz.binNumber.slice(4, 6) + '** **** ' : '**** **** **** '}
                    {iyz.cardLastFourDigits}
                  </p>
                  {iyz.cardFamily && (
                    <p className="text-xs text-slate-400">{iyz.cardFamily}</p>
                  )}
                </div>
                <InfoRow label="Banka" value={
                  <span className="flex items-center gap-1.5">
                    <Building2 size={11} style={{ color: 'var(--text-muted)' }} />
                    {iyz.cardBankName}
                  </span>
                } />
                <InfoRow label="Taksit" value={
                  <span className="flex items-center gap-1.5 font-semibold" style={{ color: '#6366f1' }}>
                    <Hash size={11} />
                    {installmentLabel}
                  </span>
                } />
              </div>
            </div>
          )}

          {/* Havale/EFT bilgi */}
          {order.paymentMethod === 'bank_transfer' && (
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
              <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
                <BankLogo size={16} />
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Havale / EFT</h2>
              </div>
              <div className="p-4">
                <InfoRow label="Referans Kodu" value={
                  <span className="font-mono text-xs font-bold tracking-wide">{order.orderNumber}</span>
                } />
                {order.paymentStatus === 'pending' && (
                  <div className="mt-3 text-xs rounded-xl p-3 leading-relaxed"
                    style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.2)', color: '#a16207' }}>
                    Müşterinin referans koduyla havale yaptığını doğrulayın, ardından <strong>Ödendi Onayla</strong> butonuna basın.
                  </div>
                )}
                {order.paymentStatus === 'paid' && (
                  <div className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-600">
                    <CheckCircle size={14} /> Havale onaylandı
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Kapıda Ödeme */}
          {order.paymentMethod === 'cash_on_delivery' && (
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
              <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
                <CodLogo size={16} />
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Kapıda Ödeme</h2>
              </div>
              <div className="p-4">
                {order.paymentStatus === 'pending' && (
                  <div className="text-xs rounded-xl p-3 leading-relaxed"
                    style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', color: '#065f46' }}>
                    Kurye teslim ettiğinde <strong>Ödendi Onayla</strong> butonuna basarak siparişi tamamlayın.
                  </div>
                )}
                {order.paymentStatus === 'paid' && (
                  <div className="flex items-center gap-2 text-xs font-medium text-emerald-600">
                    <CheckCircle size={14} /> Kapıda ödeme alındı
                  </div>
                )}
              </div>
            </div>
          )}

          {/* e-Arşiv Fatura */}
          {order.efatura?.status && (
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
              <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
                <FileText size={14} style={{ color: 'var(--text-muted)' }} />
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>e-Arşiv Fatura</h2>
              </div>
              <div className="p-4">
                {order.efatura.status === 'sent' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
                      <CheckCircle size={14} /> Paraşüt'e gönderildi
                    </div>
                    {order.efatura.no && <InfoRow label="Fatura No" value={<span className="font-mono text-xs">{order.efatura.no}</span>} />}
                    {order.efatura.sentAt && <InfoRow label="Tarih" value={new Date(order.efatura.sentAt).toLocaleDateString('tr-TR')} />}
                    {order.efatura.pdfUrl && (
                      <a href={order.efatura.pdfUrl} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs font-semibold mt-3 px-3 py-2 rounded-xl transition-all hover:shadow-sm"
                        style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.15)' }}>
                        <Download size={12} /> e-Fatura PDF İndir
                      </a>
                    )}
                  </div>
                )}
                {order.efatura.status === 'failed' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-red-500">
                      <AlertCircle size={14} /> Oluşturulamadı
                    </div>
                    {order.efatura.error && (
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{order.efatura.error}</p>
                    )}
                  </div>
                )}
                {order.efatura.status === 'pending' && (
                  <div className="flex items-center gap-2 text-xs text-amber-600">
                    <Clock size={14} /> İşleniyor...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Kargo & Durum — sadece fiziksel e-ticaret */}
          {canShip && (
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
              <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
                <Truck size={14} style={{ color: 'var(--text-muted)' }} />
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Kargo & Durum</h2>
              </div>
              <div className="p-4 space-y-4">
                {/* Kargo form alanları */}
                <div className="space-y-2.5">
                  <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Kargo Bilgileri</p>
                  {[
                    { key: 'carrier',          label: 'Kargo Firması',     placeholder: order.shipping?.carrier || 'Yurtiçi, MNG, Aras...' },
                    { key: 'trackingNumber',   label: 'Takip Numarası',    placeholder: order.shipping?.trackingNumber || '1234567890' },
                    { key: 'trackingUrl',      label: 'Takip Linki',       placeholder: order.shipping?.trackingUrl || 'https://...' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{label}</label>
                      <input
                        type="text"
                        value={shippingForm[key]}
                        onChange={(e) => setShippingForm((p) => ({ ...p, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full rounded-lg px-3 py-2 text-sm border outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        style={{ background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: '14px' }}
                      />
                    </div>
                  ))}
                  <div>
                    <DatePicker
                      label="Tahmini Teslimat"
                      value={shippingForm.estimatedDelivery}
                      onChange={(v) => setShippingForm((p) => ({ ...p, estimatedDelivery: v }))}
                    />
                  </div>
                </div>

                {/* Mevcut kargo bilgileri (salt okunur) */}
                {order.shipping?.trackingNumber && (
                  <div className="rounded-xl p-3 text-xs space-y-1"
                    style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)' }}>
                    <p className="font-semibold" style={{ color: '#6366f1' }}>Kayıtlı Kargo Bilgisi</p>
                    {order.shipping.carrier && <p style={{ color: 'var(--text-secondary)' }}>Firma: {order.shipping.carrier}</p>}
                    {order.shipping.trackingNumber && <p style={{ color: 'var(--text-secondary)' }}>Takip: {order.shipping.trackingNumber}</p>}
                    {order.shipping.trackingUrl && (
                      <a href={order.shipping.trackingUrl} target="_blank" rel="noreferrer"
                        className="underline" style={{ color: '#6366f1' }}>
                        Takip Linki →
                      </a>
                    )}
                  </div>
                )}

                <button
                  onClick={() => {
                    const payload = {};
                    if (shippingForm.carrier)           payload.carrier           = shippingForm.carrier;
                    if (shippingForm.trackingNumber)    payload.trackingNumber    = shippingForm.trackingNumber;
                    if (shippingForm.trackingUrl)       payload.trackingUrl       = shippingForm.trackingUrl;
                    if (shippingForm.estimatedDelivery) payload.estimatedDelivery = shippingForm.estimatedDelivery;
                    if (!Object.keys(payload).length) return;
                    updateShipping.mutate(payload);
                  }}
                  disabled={updateShipping.isPending}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                  style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}
                >
                  {updateShipping.isPending ? 'Kaydediliyor...' : 'Güncelle'}
                </button>
              </div>
            </div>
          )}

          {/* Notlar */}
          {order.notes && (
            <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
              <h2 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Notlar</h2>
              <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{order.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── İptal Modal ── */}
      {cancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => { setCancelConfirm(false); setCancelChecked(false); }}>
          <div className="rounded-2xl p-6 w-full max-w-md shadow-2xl"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(220,38,38,0.1)' }}>
                <X size={20} style={{ color: '#dc2626' }} />
              </div>
              <div>
                <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Siparişi İptal Et</h3>
                <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{order.orderNumber}</p>
              </div>
            </div>

            <div className="rounded-xl p-4 mb-4 text-sm space-y-2"
              style={{ background: 'rgba(220,38,38,0.04)', border: '1px solid rgba(220,38,38,0.15)' }}>
              <p style={{ color: 'var(--text-secondary)' }}>
                Bu sipariş <strong>kalıcı olarak iptal edilecektir.</strong>
              </p>
              <p style={{ color: 'var(--text-secondary)' }}>{msg.body}</p>
              {msg.warn && (
                <p className="text-xs font-semibold" style={{ color: '#b45309' }}>{msg.warn}</p>
              )}
            </div>

            <label className="flex items-start gap-3 cursor-pointer mb-5 select-none">
              <input type="checkbox" checked={cancelChecked}
                onChange={(e) => setCancelChecked(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-red-600 shrink-0" />
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                Yukarıdaki bilgileri okudum ve siparişi iptal etmek istediğimi <strong>onaylıyorum.</strong>
              </span>
            </label>

            <div className="flex gap-3">
              <button onClick={() => { setCancelConfirm(false); setCancelChecked(false); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border hover:bg-[var(--bg-muted)]"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                Vazgeç
              </button>
              <button onClick={() => cancelOrder.mutate()}
                disabled={cancelOrder.isPending || !cancelChecked}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: '#dc2626' }}>
                {cancelOrder.isPending ? 'İşleniyor...' : 'Evet, İptal Et'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
