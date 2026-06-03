import { useState } from 'react';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function CachePage() {
  const { activeCompany } = useAuth();
  const [status, setStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');

  async function handleRevalidate() {
    if (!activeCompany?._id) return;
    setStatus('loading');
    setMessage('');
    try {
      const res = await api.post(`/companies/${activeCompany._id}/revalidate-website`);
      setStatus('success');
      setMessage(res.data?.message || 'Web sitesi önbelleği temizlendi.');
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  }

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <div
        className="rounded-2xl border p-8 flex flex-col items-center gap-6 text-center"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--bg-muted)' }}
        >
          <RefreshCw size={28} style={{ color: '#6366f1' }} />
        </div>

        <div>
          <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            Site Önbelleği
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            İçerik değişikliklerinin web sitesinde hemen görünmesi için önbelleği temizleyin.
          </p>
        </div>

        <button
          onClick={handleRevalidate}
          disabled={status === 'loading'}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
          style={{ background: '#6366f1' }}
        >
          <RefreshCw size={16} className={status === 'loading' ? 'animate-spin' : ''} />
          {status === 'loading' ? 'Temizleniyor...' : 'Siteyi Güncelle'}
        </button>

        {status === 'success' && (
          <div className="flex items-center gap-2 text-sm" style={{ color: '#16a34a' }}>
            <CheckCircle size={16} />
            <span>{message}</span>
          </div>
        )}

        {status === 'error' && (
          <div
            className="w-full rounded-lg px-4 py-3 text-sm text-left"
            style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
          >
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{message}</span>
            </div>
          </div>
        )}

        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Bu işlem yalnızca görüntüleme önbelleğini temizler, veri kaybı yaşanmaz.
        </p>
      </div>
    </div>
  );
}
