import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import api from '../api/client';

const fmt = (n, currency = 'TRY') =>
  Number(n).toLocaleString('tr-TR', { style: 'currency', currency, maximumFractionDigits: 2 });

const TAX_RATE = 20;

export default function CheckoutPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { items, updateQuantity, removeFromCart, clearCart, subtotal } = useCart();
  const taxAmount = +(subtotal * TAX_RATE / 100).toFixed(2);
  const total = +(subtotal + taxAmount).toFixed(2);

  const [step, setStep] = useState('cart'); // cart | form | payment
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkoutHtml, setCheckoutHtml] = useState('');
  const formRef = useRef(null);

  const [customer, setCustomer] = useState({ name: '', email: '', phone: '', address: '', city: '', district: '' });
  const set = (k, v) => setCustomer((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (step === 'payment' && checkoutHtml && formRef.current) {
      formRef.current.innerHTML = checkoutHtml;
      const scripts = formRef.current.querySelectorAll('script');
      scripts.forEach((s) => {
        const newScript = document.createElement('script');
        if (s.src) newScript.src = s.src;
        else newScript.textContent = s.textContent;
        document.body.appendChild(newScript);
      });
    }
  }, [step, checkoutHtml]);

  if (!items.length && step === 'cart') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#07070f' }}>
        <div className="text-center">
          <p className="text-4xl mb-4">🛒</p>
          <p className="text-white text-lg font-semibold mb-2">Sepetiniz boş</p>
          <p className="text-white/50 text-sm mb-6">Ürün ekleyerek alışverişe başlayın.</p>
          <button onClick={() => navigate(-1)} className="text-indigo-400 text-sm underline">Geri dön</button>
        </div>
      </div>
    );
  }

  const handleProceedToForm = () => setStep('form');

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!customer.name || !customer.email) { setError('Ad ve e-posta zorunlu'); return; }
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post(`/public/${slug}/cart/checkout`, {
        items: items.map((i) => ({ serviceId: i.serviceId, name: i.name, quantity: i.quantity, unitPrice: i.unitPrice })),
        customer,
      });
      setCheckoutHtml(data.checkoutFormContent);
      clearCart();
      setStep('payment');
    } catch (err) {
      setError(err.response?.data?.message || 'Ödeme başlatılamadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#07070f', color: '#fff' }}>
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Adım göstergesi */}
        <div className="flex items-center gap-2 mb-8 text-sm">
          {[['cart', 'Sepet'], ['form', 'Bilgiler'], ['payment', 'Ödeme']].map(([key, label], i, arr) => (
            <div key={key} className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === key ? 'bg-indigo-600 text-white' : 'bg-white/10 text-white/40'}`}>{i + 1}</span>
              <span className={step === key ? 'text-white font-medium' : 'text-white/40'}>{label}</span>
              {i < arr.length - 1 && <span className="text-white/20 mx-1">›</span>}
            </div>
          ))}
        </div>

        {/* ── Adım 1: Sepet ── */}
        {step === 'cart' && (
          <div>
            <h1 className="text-xl font-bold mb-5">Sepetim</h1>
            <div className="space-y-3 mb-6">
              {items.map((item) => (
                <div key={item.serviceId} className="flex items-center gap-4 rounded-2xl p-4"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-white/50 text-xs mt-0.5">{fmt(item.unitPrice, item.currency)} / adet</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.serviceId, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors text-sm">−</button>
                    <span className="w-6 text-center text-sm">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.serviceId, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors text-sm">+</button>
                  </div>
                  <p className="font-semibold text-sm w-24 text-right">{fmt(item.unitPrice * item.quantity, item.currency)}</p>
                  <button onClick={() => removeFromCart(item.serviceId)}
                    className="text-white/30 hover:text-red-400 transition-colors text-xs">✕</button>
                </div>
              ))}
            </div>
            <div className="rounded-2xl p-4 space-y-2 mb-5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex justify-between text-sm text-white/60">
                <span>Ara Toplam</span><span>{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-white/60">
                <span>KDV (%{TAX_RATE})</span><span>{fmt(taxAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-white/10">
                <span>Toplam</span><span className="text-indigo-400">{fmt(total)}</span>
              </div>
            </div>
            <button onClick={handleProceedToForm}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              Devam Et →
            </button>
          </div>
        )}

        {/* ── Adım 2: Müşteri bilgileri ── */}
        {step === 'form' && (
          <div>
            <h1 className="text-xl font-bold mb-5">Teslimat Bilgileri</h1>
            <form onSubmit={handleSubmitOrder} className="space-y-4">
              {[
                { label: 'Ad Soyad *', key: 'name', type: 'text', placeholder: 'Adınız Soyadınız' },
                { label: 'E-posta *', key: 'email', type: 'email', placeholder: 'ornek@email.com' },
                { label: 'Telefon', key: 'phone', type: 'tel', placeholder: '+90 5xx xxx xx xx' },
                { label: 'Şehir', key: 'city', type: 'text', placeholder: 'İstanbul' },
                { label: 'İlçe', key: 'district', type: 'text', placeholder: 'Kadıköy' },
                { label: 'Adres', key: 'address', type: 'text', placeholder: 'Sokak, Mahalle, No' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium mb-1.5 text-white/50 uppercase tracking-wide">{label}</label>
                  <input type={type} value={customer[key]} onChange={(e) => set(key, e.target.value)}
                    placeholder={placeholder} required={label.includes('*')}
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                </div>
              ))}
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep('cart')}
                  className="flex-1 py-3 rounded-xl text-sm text-white/50 border border-white/10">← Geri</button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  {loading ? 'İşleniyor...' : 'Ödemeye Geç →'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Adım 3: İyzico ödeme formu ── */}
        {step === 'payment' && (
          <div>
            <h1 className="text-xl font-bold mb-5">Güvenli Ödeme</h1>
            <p className="text-white/50 text-sm mb-5">Kart bilgileriniz İyzico'nun güvenli altyapısı üzerinden işlenir.</p>
            <div ref={formRef} id="iyzipay-checkout-form" className="responsive" />
          </div>
        )}
      </div>
    </div>
  );
}
