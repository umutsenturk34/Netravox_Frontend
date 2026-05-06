import { useSearchParams, useParams, useNavigate } from 'react-router-dom';

export default function CheckoutFailPage() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#07070f' }}>
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <span className="text-3xl">✗</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Ödeme Başarısız</h1>
        <p className="text-white/50 text-sm mb-6">Ödeme işlemi tamamlanamadı. Lütfen tekrar deneyin.</p>

        <div className="flex flex-col gap-3">
          <button onClick={() => navigate(`/checkout/${slug}`)}
            className="w-full py-3 rounded-xl font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            Tekrar Dene
          </button>
          <button onClick={() => navigate(`/`)}
            className="w-full py-3 rounded-xl text-sm text-white/50 border border-white/10">
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    </div>
  );
}
