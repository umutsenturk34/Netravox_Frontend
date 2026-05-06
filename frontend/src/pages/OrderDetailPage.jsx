import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { ArrowLeft, Download, XCircle } from 'lucide-react';

const STATUS_LABELS = {
  pending:   { label: 'Bekliyor',      color: 'bg-yellow-100 text-yellow-700' },
  paid:      { label: 'Ödendi',        color: 'bg-green-100 text-green-700' },
  preparing: { label: 'Hazırlanıyor',  color: 'bg-blue-100 text-blue-700' },
  shipped:   { label: 'Kargoda',       color: 'bg-purple-100 text-purple-700' },
  delivered: { label: 'Teslim Edildi', color: 'bg-teal-100 text-teal-700' },
  cancelled: { label: 'İptal',         color: 'bg-red-100 text-red-700' },
  refunded:  { label: 'İade',          color: 'bg-orange-100 text-orange-700' },
};

const PAYMENT_STATUS_LABELS = {
  pending:  { label: 'Bekliyor', color: 'text-yellow-600' },
  paid:     { label: 'Ödendi',   color: 'text-green-600' },
  failed:   { label: 'Başarısız',color: 'text-red-600' },
  refunded: { label: 'İade',     color: 'text-orange-600' },
};

const fmt = (n, currency = 'TRY') =>
  Number(n).toLocaleString('tr-TR', { style: 'currency', currency, maximumFractionDigits: 2 });

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [newStatus, setNewStatus] = useState('');
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.get(`/orders/${id}`).then((r) => r.data),
    onSuccess: (d) => setNewStatus(d.status),
  });

  const updateStatus = useMutation({
    mutationFn: (s) => api.patch(`/orders/${id}/status`, { status: s }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order', id] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Durum güncellendi');
    },
    onError: () => toast.error('Güncellenemedi'),
  });

  const cancelOrder = useMutation({
    mutationFn: () => api.post(`/orders/${id}/cancel`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order', id] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      setCancelConfirm(false);
      toast.success('Sipariş iptal edildi');
    },
    onError: () => toast.error('İptal edilemedi'),
  });

  const downloadInvoice = async () => {
    setDownloading(true);
    try {
      const response = await api.get(`/orders/${id}/invoice`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${order?.invoiceNumber || 'fatura'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('PDF indirilemedi');
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) return <div className="p-6 text-sm" style={{ color: 'var(--text-muted)' }}>Yükleniyor...</div>;
  if (!order) return <div className="p-6 text-sm" style={{ color: 'var(--text-muted)' }}>Sipariş bulunamadı.</div>;

  const st = STATUS_LABELS[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-600' };
  const pst = PAYMENT_STATUS_LABELS[order.paymentStatus] || { label: order.paymentStatus, color: 'text-gray-600' };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/orders')}
          className="p-1.5 rounded-lg hover:bg-[var(--bg-muted)] transition-colors">
          <ArrowLeft size={16} style={{ color: 'var(--text-muted)' }} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{order.orderNumber}</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.color}`}>{st.label}</span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {new Date(order.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <button
          onClick={downloadInvoice}
          disabled={downloading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}
        >
          <Download size={14} />
          {downloading ? 'İndiriliyor...' : 'PDF Fatura'}
        </button>
        {order.status !== 'cancelled' && order.status !== 'delivered' && (
          <button
            onClick={() => setCancelConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
          >
            <XCircle size={14} /> İptal Et
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Sol — Ana içerik */}
        <div className="col-span-2 space-y-5">
          {/* Ürünler */}
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
            <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Sipariş Kalemleri</h2>
            </div>
            <table className="w-full text-sm">
              <thead style={{ background: 'var(--bg-muted)' }}>
                <tr>
                  {['Ürün / Hizmet', 'Adet', 'Birim Fiyat', 'Toplam'].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, i) => (
                  <tr key={i} className="border-t" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-4 py-3 font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{item.name}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{item.quantity}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{fmt(item.unitPrice, item.currency)}</td>
                    <td className="px-4 py-3 font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {fmt(item.unitPrice * item.quantity, item.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-4 border-t space-y-1.5" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>Ara Toplam</span>
                <span style={{ color: 'var(--text-primary)' }}>{fmt(order.subtotal, order.currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>KDV (%{order.taxRate})</span>
                <span style={{ color: 'var(--text-primary)' }}>{fmt(order.taxAmount, order.currency)}</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-1.5 border-t" style={{ borderColor: 'var(--border)' }}>
                <span style={{ color: 'var(--text-primary)' }}>Genel Toplam</span>
                <span style={{ color: '#6366f1' }}>{fmt(order.total, order.currency)}</span>
              </div>
            </div>
          </div>

          {/* Müşteri bilgileri */}
          <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Müşteri Bilgileri</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Ad Soyad', order.customer.name],
                ['E-posta', order.customer.email],
                ['Telefon', order.customer.phone],
                ['Şehir', order.customer.city],
                ['İlçe', order.customer.district],
                ['Adres', order.customer.address],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
                  <p style={{ color: 'var(--text-primary)' }}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sağ — Durum yönetimi */}
        <div className="space-y-4">
          <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Durum Güncelle</h2>
            <select
              value={newStatus || order.status}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none mb-3"
              style={{ background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            >
              {Object.entries(STATUS_LABELS).map(([v, { label }]) => (
                <option key={v} value={v}>{label}</option>
              ))}
            </select>
            <Button
              onClick={() => updateStatus.mutate(newStatus)}
              disabled={updateStatus.isPending || newStatus === order.status}
              className="w-full"
            >
              {updateStatus.isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>

          <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Ödeme Bilgisi</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Durum</span>
                <span className={`font-semibold ${pst.color}`}>{pst.label}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Yöntem</span>
                <span style={{ color: 'var(--text-primary)' }}>{order.paymentMethod === 'iyzico' ? 'İyzico' : 'Manuel'}</span>
              </div>
              {order.iyzico?.paymentId && (
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>Ödeme ID</span>
                  <span className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{order.iyzico.paymentId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Fatura No</span>
                <span className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{order.invoiceNumber}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* İptal Onay Modal */}
      <Modal
        isOpen={cancelConfirm}
        onClose={() => setCancelConfirm(false)}
        title="Siparişi İptal Et"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setCancelConfirm(false)}>Vazgeç</Button>
            <Button variant="danger" onClick={() => cancelOrder.mutate()} disabled={cancelOrder.isPending}>
              {cancelOrder.isPending ? 'İptal ediliyor...' : 'Evet, İptal Et'}
            </Button>
          </div>
        }
      >
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          <strong>{order.orderNumber}</strong> numaralı sipariş iptal edilecek. Bu işlem geri alınamaz.
        </p>
      </Modal>
    </div>
  );
}
