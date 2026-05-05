import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

function detectTenantSlug() {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  if (parts.length >= 3 && parts[parts.length - 2] === 'netravox') {
    const sub = parts[0];
    if (sub !== 'panel' && sub !== 'www') return sub;
  }
  return null;
}

const inputStyle = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#fff',
};
const inputFocus = {
  border: '1px solid rgba(99,102,241,0.6)',
  background: 'rgba(99,102,241,0.08)',
};

export default function LoginPage() {
  const { login, finalizeLogin } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState('credentials'); // credentials | otp
  const [otpToken, setOtpToken] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [form, setForm] = useState({ email: '', password: '' });
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tenant, setTenant] = useState(null);
  const [tenantLoading, setTenantLoading] = useState(false);

  const codeRef = useRef(null);
  const tenantSlug = detectTenantSlug();

  useEffect(() => {
    if (!tenantSlug) return;
    setTenantLoading(true);
    api.get(`/public/tenant-info?slug=${tenantSlug}`)
      .then(({ data }) => setTenant(data))
      .catch(() => setTenant(null))
      .finally(() => setTenantLoading(false));
  }, [tenantSlug]);

  useEffect(() => {
    if (step === 'otp') setTimeout(() => codeRef.current?.focus(), 100);
  }, [step]);

  const handleCredentials = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(form.email, form.password, tenantSlug || undefined);

      if (result?.otpRequired) {
        setOtpToken(result.otpToken);
        // E-postayı maskele: ab***@gmail.com
        const [local, domain] = form.email.split('@');
        setMaskedEmail(`${local.slice(0, 2)}***@${domain}`);
        setStep('otp');
        return;
      }

      if (result?.mustChangePassword) {
        navigate('/force-password-change');
        return;
      }

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Giriş yapılamadı');
    } finally {
      setLoading(false);
    }
  };

  const handleOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/otp/verify', { otpToken, code });
      const user = await finalizeLogin(data);
      navigate(user?.mustChangePassword ? '/force-password-change' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Kod hatalı');
      setCode('');
      codeRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const logo = tenant?.branding?.logoDark || tenant?.branding?.logoLight;
  const displayName = tenant?.name || 'Netravox CMS';

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #07070f 0%, #0d0d1a 50%, #07070f 100%)' }}
    >
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          {tenantLoading ? (
            <div className="w-16 h-16 rounded-2xl bg-white/5 animate-pulse mb-4" />
          ) : logo ? (
            <img src={logo} alt={displayName} className="h-14 w-auto object-contain mb-4" />
          ) : (
            <img src="/logo-dark.svg" alt="Netravox" className="h-10 w-auto object-contain mb-4" />
          )}
          <h1 className="text-xl font-bold text-white tracking-tight">{displayName}</h1>
          {tenantSlug && !tenantLoading && !tenant && (
            <p className="text-xs mt-1 text-red-400">Firma bulunamadı</p>
          )}
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
          {/* ── Adım 1: Email + Şifre ── */}
          {step === 'credentials' && (
            <>
              <p className="text-sm mb-6 text-center" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Panel hesabınıza giriş yapın
              </p>
              <form onSubmit={handleCredentials} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
                    style={{ color: 'rgba(255,255,255,0.4)' }}>E-posta</label>
                  <input
                    type="email" required value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                    style={inputStyle} placeholder="ornek@email.com" autoComplete="email"
                    onFocus={(e) => Object.assign(e.target.style, inputFocus)}
                    onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
                    style={{ color: 'rgba(255,255,255,0.4)' }}>Şifre</label>
                  <input
                    type="password" required value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                    style={inputStyle} placeholder="••••••••" autoComplete="current-password"
                    onFocus={(e) => Object.assign(e.target.style, inputFocus)}
                    onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                  />
                </div>
                {error && <ErrorBox message={error} />}
                <SubmitButton loading={loading} label="Giriş Yap" loadingLabel="Giriş yapılıyor..." />
              </form>
              <div className="mt-5 text-center">
                <Link to="/forgot-password" className="text-xs transition-colors hover:text-indigo-400"
                  style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Şifremi Unuttum
                </Link>
              </div>
            </>
          )}

          {/* ── Adım 2: Email OTP ── */}
          {step === 'otp' && (
            <>
              <div className="flex flex-col items-center mb-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                  style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
                  <span className="text-2xl">✉️</span>
                </div>
                <p className="text-white font-semibold">E-posta Doğrulaması</p>
                <p className="text-xs mt-1.5 text-center leading-relaxed"
                  style={{ color: 'rgba(255,255,255,0.45)' }}>
                  <span className="font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>{maskedEmail}</span>
                  {' '}adresine 6 haneli doğrulama kodu gönderdik.
                </p>
              </div>
              <form onSubmit={handleOtp} className="space-y-4">
                <input
                  ref={codeRef}
                  type="text" inputMode="numeric" pattern="[0-9]{6}"
                  maxLength={6} required value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full rounded-xl px-4 py-3 text-center text-3xl font-mono font-bold outline-none transition-all tracking-widest"
                  style={inputStyle} placeholder="000000" autoComplete="one-time-code"
                  onFocus={(e) => Object.assign(e.target.style, inputFocus)}
                  onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                />
                {error && <ErrorBox message={error} />}
                <SubmitButton loading={loading} label="Doğrula" loadingLabel="Doğrulanıyor..." />
              </form>
              <button
                onClick={() => { setStep('credentials'); setError(''); setCode(''); }}
                className="w-full mt-3 text-xs transition-colors hover:text-indigo-400"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                ← Geri dön
              </button>
            </>
          )}
        </div>

        <p className="text-center mt-6 text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Netravox CMS · v1.0
        </p>
      </div>
    </div>
  );
}

function ErrorBox({ message }) {
  return (
    <div className="rounded-lg px-4 py-3 text-sm"
      style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
      {message}
    </div>
  );
}

function SubmitButton({ loading, label, loadingLabel }) {
  return (
    <button
      type="submit" disabled={loading}
      className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all mt-2"
      style={{
        background: loading ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        cursor: loading ? 'not-allowed' : 'pointer',
        boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.35)',
      }}
    >
      {loading ? loadingLabel : label}
    </button>
  );
}
