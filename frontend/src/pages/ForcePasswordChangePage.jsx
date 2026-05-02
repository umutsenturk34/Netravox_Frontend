import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ForcePasswordChangePage() {
  const { clearMustChangePassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ newPassword: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) {
      toast.error('Şifreler eşleşmiyor');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/set-password', { newPassword: form.newPassword });
      toast.success('Şifreniz güncellendi. Lütfen tekrar giriş yapın.');
      clearMustChangePassword();
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Şifre güncellenemedi');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff',
  };

  const handleFocus = (e) => {
    e.target.style.border = '1px solid rgba(245,158,11,0.6)';
    e.target.style.background = 'rgba(245,158,11,0.06)';
  };
  const handleBlur = (e) => {
    e.target.style.border = '1px solid rgba(255,255,255,0.1)';
    e.target.style.background = 'rgba(255,255,255,0.06)';
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: 'linear-gradient(135deg, #07070f 0%, #0d0d1a 50%, #07070f 100%)',
      }}
    >
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #f59e0b, transparent)' }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #d97706, transparent)' }}
        />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
          >
            <span className="text-white text-2xl">🔐</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Şifrenizi Güncelleyin</h1>
        </div>

        <div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
          }}
        >
          <p className="text-sm mb-6 text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>
            İlk girişinizde şifrenizi değiştirmeniz zorunludur.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                Yeni Şifre
              </label>
              <input
                type="password"
                required
                value={form.newPassword}
                onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={inputStyle}
                placeholder="En az 8 karakter, büyük harf, rakam"
                autoComplete="new-password"
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>

            <div>
              <label
                className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                Şifre Tekrar
              </label>
              <input
                type="password"
                required
                value={form.confirm}
                onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={inputStyle}
                placeholder="Şifreyi tekrar girin"
                autoComplete="new-password"
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>

            <p className="text-xs pt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
              En az 8 karakter, 1 büyük harf, 1 küçük harf ve 1 rakam içermelidir.
            </p>

            <button
              type="submit"
              disabled={loading || !form.newPassword || !form.confirm}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all"
              style={{
                background: loading || !form.newPassword || !form.confirm
                  ? 'rgba(245,158,11,0.35)'
                  : 'linear-gradient(135deg, #f59e0b, #d97706)',
                cursor: loading || !form.newPassword || !form.confirm ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(245,158,11,0.3)',
              }}
            >
              {loading ? 'Güncelleniyor...' : 'Şifremi Güncelle'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Netravox CMS · v1.0
        </p>
      </div>
    </div>
  );
}
