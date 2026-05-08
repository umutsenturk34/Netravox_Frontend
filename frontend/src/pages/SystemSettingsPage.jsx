import { useState, useEffect } from 'react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { Mail, Send, Key, RefreshCw, AlertCircle, Info } from 'lucide-react';

// Brevo API key: xkeysib- ile başlar, toplam ~70 karakter
const BREVO_KEY_RE = /^xkeysib-[A-Za-z0-9_-]{20,}$/;
// Email adresi: email@domain.com veya "Ad Soyad <email@domain.com>"
const EMAIL_RE = /^(?:"?[^"<>]+"?\s+)?<?\S+@\S+\.\S{2,}>?$/;

function validate(brevoKey, fromPanel, fromContact) {
  const errors = {};
  if (brevoKey && !brevoKey.includes('••••') && !BREVO_KEY_RE.test(brevoKey)) {
    errors.brevoKey = 'Geçersiz format. xkeysib- ile başlamalı.';
  }
  if (fromPanel && !EMAIL_RE.test(fromPanel.trim())) {
    errors.fromPanel = 'Geçersiz format. Örnek: Netravox Panel <noreply@netravox.com>';
  }
  if (fromContact && !EMAIL_RE.test(fromContact.trim())) {
    errors.fromContact = 'Geçersiz format. Örnek: Netravox <destek@netravox.com>';
  }
  return errors;
}

function Field({ label, hint, value, onChange, onBlur, placeholder, type = 'text', error }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
        {label}
      </label>
      {hint && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, lineHeight: 1.5 }}>{hint}</p>}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '9px 12px', borderRadius: 8,
          border: `1px solid ${error ? '#EF4444' : 'var(--border)'}`,
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box',
          transition: 'border-color 0.15s',
        }}
      />
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
          <AlertCircle size={12} color="#EF4444" />
          <span style={{ fontSize: 12, color: '#EF4444' }}>{error}</span>
        </div>
      )}
    </div>
  );
}

function Card({ icon: Icon, title, children }) {
  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '24px 28px', marginBottom: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <Icon size={16} style={{ color: 'var(--text-muted)' }} />
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
    </div>
  );
}

export default function SystemSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [testing, setTesting]   = useState(null);
  const [errors, setErrors]     = useState({});

  const [fromPanel,   setFromPanel]   = useState('');
  const [fromContact, setFromContact] = useState('');
  const [brevoKey,    setBrevoKey]    = useState('');

  useEffect(() => {
    api.get('/system-settings')
      .then(({ data }) => {
        setFromPanel(data.email?.fromPanel   || '');
        setFromContact(data.email?.fromContact || '');
        setBrevoKey(data.email?.brevoApiKey  || '');
      })
      .catch(() => toast.error('Ayarlar yüklenemedi'))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    const errs = validate(brevoKey, fromPanel, fromContact);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSaving(true);
    try {
      await api.patch('/system-settings', {
        email: { fromPanel, fromContact, brevoApiKey: brevoKey },
      });
      toast.success('Kaydedildi');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Kayıt başarısız');
    } finally {
      setSaving(false);
    }
  };

  const testEmail = async (type) => {
    const fromVal = type === 'panel' ? fromPanel : fromContact;
    if (fromVal && !EMAIL_RE.test(fromVal.trim())) {
      toast.error('Geçersiz e-posta formatı — önce düzelt');
      return;
    }
    setTesting(type);
    try {
      const { data } = await api.post('/system-settings/test-email', { type });
      toast.success(data.message);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Gönderilemedi');
    } finally {
      setTesting(null);
    }
  };

  if (loading) return (
    <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Yükleniyor…</div>
  );

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
          Sistem E-posta Ayarları
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
          Hangi adresin hangi mail türünde kullanılacağını buradan yönetin.
          Değerler boş bırakılırsa Railway env değişkenleri kullanılır.
        </p>
      </div>

      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 10,
        padding: '12px 16px', marginBottom: 24, fontSize: 13, color: '#92400E', lineHeight: 1.6,
      }}>
        <Info size={15} style={{ marginTop: 2, flexShrink: 0, color: '#F97316' }} />
        <span>
          <strong>Bu ayarlar seçili firmadan bağımsızdır.</strong> Hangi firmayı seçerseniz seçin,
          burada kaydedilen Brevo API anahtarı ve gönderici adresleri tüm Netravox sistemi için geçerlidir.
          Müşteri firmalarına özel adresler için <strong>Firmalar → Firma Seç → Firma Ayarları → SMTP</strong> kullanın.
        </span>
      </div>

      {/* Brevo API Key */}
      <Card icon={Key} title="Brevo API Anahtarı">
        <Field
          label="API Key"
          hint="app.brevo.com → SMTP & API → API Keys. Boş bırakılırsa Railway BREVO_API_KEY env değişkeni kullanılır."
          value={brevoKey}
          onChange={(v) => { setBrevoKey(v); setErrors(e => ({ ...e, brevoKey: undefined })); }}
          onBlur={() => {
            if (brevoKey && !brevoKey.includes('••••') && !BREVO_KEY_RE.test(brevoKey))
              setErrors(e => ({ ...e, brevoKey: 'Geçersiz format. xkeysib- ile başlamalı.' }));
          }}
          placeholder="xkeysib-••••••••••••"
          type="password"
          error={errors.brevoKey}
        />
      </Card>

      {/* Panel sistem mailleri */}
      <Card icon={Mail} title="Panel Sistem Mailleri (Şifre Sıfırlama, OTP)">
        <Field
          label="Gönderici (FROM)"
          hint={'Format: "Ad Soyad <adres@domain.com>" — Brevo\'da doğrulanmış sender olmalı.'}
          value={fromPanel}
          onChange={(v) => { setFromPanel(v); setErrors(e => ({ ...e, fromPanel: undefined })); }}
          onBlur={() => {
            if (fromPanel && !EMAIL_RE.test(fromPanel.trim()))
              setErrors(e => ({ ...e, fromPanel: 'Geçersiz format. Örnek: Netravox Panel <noreply@netravox.com>' }));
          }}
          placeholder="Netravox Panel <noreply@netravox.com>"
          error={errors.fromPanel}
        />
        <div>
          <button
            onClick={() => testEmail('panel')}
            disabled={testing === 'panel'}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: 'var(--bg-muted)', color: 'var(--text-secondary)',
              border: '1px solid var(--border)', cursor: 'pointer',
            }}
          >
            {testing === 'panel'
              ? <><RefreshCw size={13} className="animate-spin" /> Gönderiliyor…</>
              : <><Send size={13} /> Test Gönder</>
            }
          </button>
          <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--text-muted)' }}>
            Kendi e-postana örnek şifre sıfırlama maili gönderir
          </span>
        </div>
      </Card>

      {/* Müşteri iletişim formu */}
      <Card icon={Mail} title="Müşteri İletişim Formu Onay Maili">
        <Field
          label="Gönderici (FROM)"
          hint='Müşteri iletişim formunu gönderince alacağı onay mailinin FROM adresi.'
          value={fromContact}
          onChange={(v) => { setFromContact(v); setErrors(e => ({ ...e, fromContact: undefined })); }}
          onBlur={() => {
            if (fromContact && !EMAIL_RE.test(fromContact.trim()))
              setErrors(e => ({ ...e, fromContact: 'Geçersiz format. Örnek: Netravox <destek@netravox.com>' }));
          }}
          placeholder="Netravox <destek@netravox.com>"
          error={errors.fromContact}
        />
        <div>
          <button
            onClick={() => testEmail('contact')}
            disabled={testing === 'contact'}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: 'var(--bg-muted)', color: 'var(--text-secondary)',
              border: '1px solid var(--border)', cursor: 'pointer',
            }}
          >
            {testing === 'contact'
              ? <><RefreshCw size={13} className="animate-spin" /> Gönderiliyor…</>
              : <><Send size={13} /> Test Gönder</>
            }
          </button>
          <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--text-muted)' }}>
            Kendi e-postana örnek iletişim formu onayı gönderir
          </span>
        </div>
      </Card>

      {/* Müşteri (tenant) notu */}
      <div style={{
        background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 10,
        padding: '14px 18px', marginBottom: 24, fontSize: 13, color: '#0369A1', lineHeight: 1.6,
      }}>
        <strong>Müşteri firmaları için:</strong> Her firma Firmalar → Firma Seç → <em>Firma Ayarları → SMTP</em> bölümünden
        kendi gönderici adresini ve SMTP sunucusunu ayrıca yapılandırabilir.
        Firma SMTP'si aktifse o firma'nın tüm mailleri kendi sunucusundan gider.
      </div>

      <button
        onClick={save}
        disabled={saving}
        style={{
          padding: '10px 28px', borderRadius: 9, fontSize: 14, fontWeight: 700,
          background: '#6366F1', color: '#fff', border: 'none', cursor: 'pointer',
          opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? 'Kaydediliyor…' : 'Kaydet'}
      </button>
    </div>
  );
}
