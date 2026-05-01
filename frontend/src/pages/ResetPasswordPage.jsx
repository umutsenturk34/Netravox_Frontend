import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../api/client';
import { Input } from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  // Token'ı URL'den temizle — tarayıcı geçmişine / referer başlığına sızmasın
  if (token && typeof window !== 'undefined') {
    window.history.replaceState({}, '', '/reset-password');
  }

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="text-center">
          <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Geçersiz bağlantı</p>
          <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">Yeni sıfırlama bağlantısı iste</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Şifre en az 8 karakter olmalı');
    if (!/[A-Z]/.test(password)) return setError('Şifre en az bir büyük harf içermeli');
    if (!/[0-9]/.test(password)) return setError('Şifre en az bir rakam içermeli');
    if (password !== confirm) return setError('Şifreler eşleşmiyor');

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Bir hata oluştu');
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
            Yeni Şifre Belirle
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            En az 8 karakter, büyük harf ve rakam içermeli.
          </p>
        </div>

        {done ? (
          <div className="rounded-lg p-4 text-sm" style={{ background: '#F0FDF4', color: '#166534' }}>
            Şifreniz başarıyla güncellendi. Giriş sayfasına yönlendiriliyorsunuz...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Yeni Şifre"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="En az 8 karakter"
              required
              autoFocus
            />
            <Input
              label="Şifre Tekrar"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Şifreyi tekrar girin"
              required
              error={confirm && password !== confirm ? 'Şifreler eşleşmiyor' : ''}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={loading || !password || !confirm} className="w-full">
              {loading ? 'Kaydediliyor...' : 'Şifremi Güncelle'}
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
