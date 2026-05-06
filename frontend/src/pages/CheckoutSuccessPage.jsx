import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';

const fmt = (n, currency = 'TRY') =>
  Number(n).toLocaleString('tr-TR', { style: 'currency', currency, maximumFractionDigits: 2 });

export default function CheckoutSuccessPage() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const orderId = params.get('orderId');
  const navigate = useNavigate();

  const { data: order, isLoading } = useQuery({
    queryKey: ['public-order', orderId],
    queryFn: () => api.get(`/public/${slug}/orders/${orderId}`).then((r) => r.data),
    enabled: !!orderId,
  });

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#07070f' }}>
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
          <span className="text-3xl">✓</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Ödeme Başarılı!</h1>
        <p className="text-white/50 text-sm mb-6">Siparişiniz alındı. Onay e-postası gönderildi.</p>

        {!isLoading && order && (
          <div className="rounded-2xl p-5 text-left mb-6"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex justify-between text-sm mb-3">
              <span className="text-white/50">Sipariş No</span>
              <span className="font-mono font-semibold text-white">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between text-sm mb-3">
              <span className="text-white/50">Müşteri</span>
              <span className="text-white">{order.customer?.name}</span>
            </div>
            <div className="flex justify-between text-sm font-bold">
              <span className="text-white/50">Toplam</span>
              <span className="text-indigo-400">{fmt(order.total, order.currency)}</span>
            </div>
          </div>
        )}

        <button onClick={() => navigate(`/${slug}`)}
          className="w-full py-3 rounded-xl font-semibold text-white transition-all"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
          Ana Sayfaya Dön
        </button>
      </div>
    </div>
  );
}
