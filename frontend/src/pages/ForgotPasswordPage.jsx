import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { Input } from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--bg-base)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl border p-8"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="mb-8">
          <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            Şifremi Unuttum
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            E-posta adresinizi girin, size sıfırlama bağlantısı gönderelim.
          </p>
        </div>

        {sent ? (
          <div className="rounded-lg p-4 text-sm" style={{ background: '#F0FDF4', color: '#166534' }}>
            Bağlantı gönderildi. E-posta kutunuzu kontrol edin.
            <br />
            <span style={{ color: 'var(--text-muted)' }}>Gelen kutunuzda göremiyorsanız spam klasörünü kontrol edin.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="E-posta"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@firma.com"
              required
              autoFocus
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={loading || !email} className="w-full">
              {loading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
            </Button>
          </form>
        )}

        <Link
          to="/login"
          className="block text-center text-sm mt-6 hover:underline"
          style={{ color: 'var(--text-muted)' }}
        >
          ← Giriş sayfasına dön
        </Link>
      </div>
    </div>
  );
}
