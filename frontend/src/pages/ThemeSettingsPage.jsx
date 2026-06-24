import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import { ImageUrlInput } from '../components/ui/Input';
import {
  Check, Palette, Layout, Type, Image, Sliders, ChevronDown,
  ExternalLink, Home, ShoppingBag, Package, Star, Shield, Code,
  RefreshCw, Monitor,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
const STOREFRONT_BASE = import.meta.env.VITE_STOREFRONT_URL || 'http://localhost:3005';

const THEMES = [
  {
    value: 'minimal',
    label: 'Minimal',
    desc: 'Beyaz, sade, temiz. Her kategorideki mağaza için evrensel şablon.',
    tags: ['Sade', 'Modern', 'Temiz'],
    colors: { primary: '#111827', accent: '#6366f1', bg: '#ffffff', surface: '#f9fafb' },
  },
  {
    value: 'fashion',
    label: 'Fashion',
    desc: 'Büyük hero görseli, zarif tipografi. Görsel odaklı premium tasarım.',
    tags: ['Zarif', 'Görselli', 'Premium'],
    colors: { primary: '#0F172A', accent: '#D97706', bg: '#FAFAF9', surface: '#F5F0EB' },
  },
  {
    value: 'bold',
    label: 'Bold',
    desc: 'Koyu arka plan, neon vurgular. Güçlü ve modern grid düzeni.',
    tags: ['Güçlü', 'Koyu', 'Kontrastlı'],
    colors: { primary: '#6366f1', accent: '#00D4FF', bg: '#0F0F1A', surface: '#1a1a2e' },
  },
  {
    value: 'restaurant',
    label: 'Warm',
    desc: 'Sıcak tonlar, yuvarlak köşeler. Davetkar ve samimi hissiyat.',
    tags: ['Sıcak', 'Davetkar', 'Yuvarlak'],
    colors: { primary: '#7C2D12', accent: '#F59E0B', bg: '#FFFBF5', surface: '#FEF3C7' },
  },
];

const RADIUS_OPTIONS = [
  { value: 'none', label: 'Yok',   preview: '0px' },
  { value: 'sm',   label: 'Az',    preview: '4px' },
  { value: 'md',   label: 'Orta',  preview: '8px' },
  { value: 'lg',   label: 'Fazla', preview: '12px' },
  { value: 'full', label: 'Tam',   preview: '999px' },
];

const HERO_LAYOUTS = [
  {
    value: 'centered', label: 'Ortalanmış', desc: 'Başlık ve buton ortada',
    icon: (
      <svg viewBox="0 0 80 50" className="w-full h-full">
        <rect width="80" height="50" rx="3" fill="currentColor" opacity="0.08"/>
        <rect x="20" y="12" width="40" height="6" rx="2" fill="currentColor" opacity="0.4"/>
        <rect x="28" y="22" width="24" height="4" rx="1" fill="currentColor" opacity="0.25"/>
        <rect x="30" y="32" width="20" height="7" rx="2" fill="currentColor" opacity="0.5"/>
      </svg>
    ),
  },
  {
    value: 'split', label: 'Bölünmüş', desc: 'Sol metin, sağ görsel',
    icon: (
      <svg viewBox="0 0 80 50" className="w-full h-full">
        <rect width="80" height="50" rx="3" fill="currentColor" opacity="0.08"/>
        <rect x="4" y="10" width="34" height="6" rx="2" fill="currentColor" opacity="0.4"/>
        <rect x="4" y="20" width="28" height="3" rx="1" fill="currentColor" opacity="0.2"/>
        <rect x="4" y="26" width="24" height="3" rx="1" fill="currentColor" opacity="0.2"/>
        <rect x="4" y="35" width="16" height="7" rx="2" fill="currentColor" opacity="0.5"/>
        <rect x="44" y="6" width="32" height="38" rx="3" fill="currentColor" opacity="0.15"/>
      </svg>
    ),
  },
  {
    value: 'fullscreen', label: 'Tam Ekran', desc: 'Görsel arka planda',
    icon: (
      <svg viewBox="0 0 80 50" className="w-full h-full">
        <rect width="80" height="50" rx="3" fill="currentColor" opacity="0.15"/>
        <rect x="10" y="15" width="60" height="7" rx="2" fill="currentColor" opacity="0.5"/>
        <rect x="22" y="26" width="36" height="4" rx="1" fill="currentColor" opacity="0.3"/>
        <rect x="28" y="34" width="24" height="8" rx="2" fill="currentColor" opacity="0.6"/>
      </svg>
    ),
  },
];

const PAGES = [
  { id: 'home',           label: 'Ana Sayfa',     icon: Home },
  { id: 'products',       label: 'Ürünler',        icon: ShoppingBag },
  { id: 'product-detail', label: 'Ürün Detay',     icon: Package },
  { id: 'general',        label: 'Görünüm',        icon: Palette },
];

const DEFAULT_BADGES = [
  { icon: '🚚', title: 'Ücretsiz Kargo', sub: '200₺ ve üzeri siparişlerde' },
  { icon: '🔄', title: 'Kolay İade',     sub: '30 gün içinde iade garantisi' },
  { icon: '🔒', title: 'Güvenli Ödeme',  sub: '256-bit SSL şifreleme' },
  { icon: '📞', title: '7/24 Destek',    sub: 'Her zaman yanınızdayız' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Alt bileşenler
// ─────────────────────────────────────────────────────────────────────────────
function AccordionSection({ icon: Icon, title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--bg-base)' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-3.5 transition-colors"
        style={{ background: 'var(--bg-muted)', borderBottom: open ? '1px solid var(--border)' : 'none' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--primary) 12%, transparent)' }}>
            <Icon size={14} style={{ color: 'var(--primary)' }} />
          </div>
          <span className="font-semibold text-sm text-left" style={{ color: 'var(--text-primary)' }}>{title}</span>
        </div>
        <ChevronDown size={14} style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
      </button>
      {open && <div className="p-5 space-y-4">{children}</div>}
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</label>
      {hint && <p className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder }) {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full rounded-lg px-3 py-2.5 border outline-none text-sm"
      style={{ background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
    />
  );
}

function Toggle({ label, desc, enabled, onToggle }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
      <div>
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
        {desc && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</p>}
      </div>
      <button type="button" onClick={onToggle} className="relative w-10 h-5 rounded-full flex-shrink-0 transition-colors ml-4" style={{ background: enabled ? 'var(--primary)' : 'var(--border)' }}>
        <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform" style={{ transform: enabled ? 'translateX(20px)' : 'translateX(0)' }} />
      </button>
    </div>
  );
}

// Her tema için görsel olarak farklı SVG mockup
function ThemeMockup({ themeValue }) {
  if (themeValue === 'minimal') return (
    <svg viewBox="0 0 280 210" className="w-full h-full">
      {/* Beyaz zemin */}
      <rect width="280" height="210" fill="#ffffff"/>
      {/* Nav - açık gri */}
      <rect x="0" y="0" width="280" height="22" fill="#f9fafb"/>
      <rect x="10" y="7" width="32" height="8" rx="2" fill="#111827"/>
      <rect x="190" y="8" width="20" height="6" rx="1" fill="#9ca3af"/>
      <rect x="215" y="8" width="20" height="6" rx="1" fill="#9ca3af"/>
      <rect x="240" y="8" width="20" height="6" rx="1" fill="#9ca3af"/>
      {/* Hero - ortalanmış, görsel yok, sade */}
      <rect x="0" y="22" width="280" height="72" fill="#f3f4f6"/>
      <rect x="70" y="38" width="140" height="10" rx="2" fill="#111827" opacity="0.85"/>
      <rect x="90" y="53" width="100" height="6" rx="1" fill="#6b7280" opacity="0.6"/>
      <rect x="110" y="65" width="60" height="18" rx="3" fill="#6366f1"/>
      {/* Ürün grid - 3 kart, beyaz, köşeli */}
      <rect x="10" y="104" width="80" height="90" rx="3" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1"/>
      <rect x="100" y="104" width="80" height="90" rx="3" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1"/>
      <rect x="190" y="104" width="80" height="90" rx="3" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1"/>
      <rect x="16" y="110" width="68" height="46" rx="2" fill="#e5e7eb"/>
      <rect x="106" y="110" width="68" height="46" rx="2" fill="#e5e7eb"/>
      <rect x="196" y="110" width="68" height="46" rx="2" fill="#e5e7eb"/>
      <rect x="16" y="161" width="40" height="5" rx="1" fill="#374151"/>
      <rect x="106" y="161" width="40" height="5" rx="1" fill="#374151"/>
      <rect x="196" y="161" width="40" height="5" rx="1" fill="#374151"/>
      <rect x="16" y="170" width="26" height="5" rx="1" fill="#6366f1"/>
      <rect x="106" y="170" width="26" height="5" rx="1" fill="#6366f1"/>
      <rect x="196" y="170" width="26" height="5" rx="1" fill="#6366f1"/>
      {/* Ayırıcı çizgi güven rozetleri */}
      <rect x="0" y="98" width="280" height="1" fill="#e5e7eb"/>
    </svg>
  );

  if (themeValue === 'fashion') return (
    <svg viewBox="0 0 280 210" className="w-full h-full">
      {/* Krem zemin */}
      <rect width="280" height="210" fill="#FAFAF9"/>
      {/* Nav - neredeyse şeffaf */}
      <rect x="0" y="0" width="280" height="22" fill="#FAFAF9"/>
      <rect x="10" y="7" width="28" height="8" rx="1" fill="#0F172A" opacity="0.9"/>
      <rect x="200" y="8" width="18" height="6" rx="1" fill="#0F172A" opacity="0.4"/>
      <rect x="224" y="8" width="18" height="6" rx="1" fill="#0F172A" opacity="0.4"/>
      <rect x="248" y="8" width="22" height="6" rx="1" fill="#0F172A" opacity="9"/>
      {/* Hero - tam genişlik koyu görsel */}
      <rect x="0" y="22" width="280" height="100" fill="#1a1a2a"/>
      <rect x="0" y="22" width="280" height="100" fill="url(#fashionGrad)" opacity="0.6"/>
      <defs>
        <linearGradient id="fashionGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D97706" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#0F172A" stopOpacity="0.9"/>
        </linearGradient>
      </defs>
      <rect x="60" y="42" width="160" height="7" rx="1" fill="white" opacity="0.5"/>
      <rect x="40" y="55" width="200" height="16" rx="2" fill="white" opacity="0.95"/>
      <rect x="80" y="76" width="120" height="7" rx="1" fill="white" opacity="0.5"/>
      <rect x="100" y="89" width="80" height="22" rx="11" fill="#D97706"/>
      {/* Ürün showcase - 2 geniş kart */}
      <rect x="10" y="132" width="124" height="68" rx="4" fill="#F5F0EB"/>
      <rect x="146" y="132" width="124" height="68" rx="4" fill="#F5F0EB"/>
      <rect x="14" y="136" width="116" height="44" rx="2" fill="#d1c4b0"/>
      <rect x="150" y="136" width="116" height="44" rx="2" fill="#d1c4b0"/>
      <rect x="14" y="184" width="60" height="5" rx="1" fill="#0F172A" opacity="0.7"/>
      <rect x="150" y="184" width="60" height="5" rx="1" fill="#0F172A" opacity="0.7"/>
      <rect x="14" y="193" width="36" height="5" rx="1" fill="#D97706"/>
      <rect x="150" y="193" width="36" height="5" rx="1" fill="#D97706"/>
    </svg>
  );

  if (themeValue === 'bold') return (
    <svg viewBox="0 0 280 210" className="w-full h-full">
      {/* Koyu zemin */}
      <rect width="280" height="210" fill="#0F0F1A"/>
      {/* Nav */}
      <rect x="0" y="0" width="280" height="22" fill="#1a1a2e"/>
      <rect x="10" y="7" width="28" height="8" rx="2" fill="#6366f1"/>
      <rect x="190" y="8" width="18" height="6" rx="1" fill="#94a3b8" opacity="0.5"/>
      <rect x="214" y="8" width="18" height="6" rx="1" fill="#94a3b8" opacity="0.5"/>
      <rect x="238" y="8" width="32" height="6" rx="3" fill="#6366f1"/>
      {/* Hero - bölünmüş layout */}
      <rect x="0" y="22" width="280" height="82" fill="#0a0a14"/>
      <rect x="0" y="22" width="280" height="82" fill="#6366f1" opacity="0.05"/>
      {/* Sol metin */}
      <rect x="10" y="30" width="50" height="7" rx="2" fill="#6366f1" opacity="0.8"/>
      <rect x="10" y="42" width="118" height="12" rx="2" fill="white" opacity="0.9"/>
      <rect x="10" y="58" width="90" height="5" rx="1" fill="#94a3b8" opacity="0.5"/>
      <rect x="10" y="67" width="50" height="16" rx="2" fill="#6366f1"/>
      <rect x="66" y="67" width="44" height="16" rx="2" fill="transparent" stroke="#6366f1" strokeWidth="1"/>
      {/* Sağ görsel kutusu */}
      <rect x="148" y="26" width="122" height="74" rx="4" fill="#1a1a2e"/>
      <rect x="152" y="30" width="114" height="66" rx="2" fill="#6366f1" opacity="0.08"/>
      {/* Neon accent lines */}
      <rect x="152" y="30" width="3" height="66" rx="1" fill="#00D4FF" opacity="0.6"/>
      {/* Trust badges */}
      <rect x="0" y="104" width="280" height="18" fill="#1a1a2e"/>
      <rect x="10" y="109" width="8" height="8" rx="1" fill="#00D4FF" opacity="0.7"/>
      <rect x="24" y="109" width="40" height="4" rx="1" fill="#94a3b8" opacity="0.5"/>
      <rect x="80" y="109" width="8" height="8" rx="1" fill="#00D4FF" opacity="0.7"/>
      <rect x="94" y="109" width="40" height="4" rx="1" fill="#94a3b8" opacity="0.5"/>
      <rect x="150" y="109" width="8" height="8" rx="1" fill="#00D4FF" opacity="0.7"/>
      <rect x="164" y="109" width="40" height="4" rx="1" fill="#94a3b8" opacity="0.5"/>
      <rect x="220" y="109" width="8" height="8" rx="1" fill="#00D4FF" opacity="0.7"/>
      <rect x="234" y="109" width="36" height="4" rx="1" fill="#94a3b8" opacity="0.5"/>
      {/* Ürün grid - 4 koyu kart */}
      {[0,1,2,3].map(i => (
        <g key={i}>
          <rect x={10 + i * 66} y="130" width="58" height="74" rx="3" fill="#1a1a2e"/>
          <rect x={14 + i * 66} y="134" width="50" height="42" rx="2" fill="#6366f1" opacity="0.1"/>
          <rect x={14 + i * 66} y="180" width="30" height="4" rx="1" fill="white" opacity="0.6"/>
          <rect x={14 + i * 66} y="188" width="20" height="4" rx="1" fill="#00D4FF" opacity="0.8"/>
        </g>
      ))}
    </svg>
  );

  // restaurant / warm
  return (
    <svg viewBox="0 0 280 210" className="w-full h-full">
      {/* Krem/sıcak zemin */}
      <rect width="280" height="210" fill="#FFFBF5"/>
      {/* Nav yuvarlak */}
      <rect x="0" y="0" width="280" height="24" fill="#FEF3C7"/>
      <rect x="10" y="7" width="36" height="10" rx="5" fill="#7C2D12"/>
      <rect x="190" y="9" width="20" height="6" rx="3" fill="#92400e" opacity="0.4"/>
      <rect x="216" y="9" width="20" height="6" rx="3" fill="#92400e" opacity="0.4"/>
      <rect x="242" y="9" width="28" height="6" rx="3" fill="#F59E0B"/>
      {/* Hero - sıcak görsel */}
      <rect x="0" y="24" width="280" height="88" fill="#92400e" opacity="0.15"/>
      <rect x="0" y="24" width="280" height="88" fill="#7C2D12" opacity="0.08"/>
      <ellipse cx="200" cy="68" rx="70" ry="52" fill="#F59E0B" opacity="0.08"/>
      <rect x="50" y="38" width="180" height="12" rx="6" fill="#7C2D12" opacity="0.85"/>
      <rect x="70" y="55" width="140" height="6" rx="3" fill="#92400e" opacity="0.5"/>
      <rect x="95" y="67" width="90" height="32" rx="16" fill="#F59E0B"/>
      <rect x="97" y="74" width="86" height="18" rx="9" fill="#7C2D12" opacity="0.2"/>
      {/* Yuvarlak köşeli ürün kartları */}
      <rect x="10" y="122" width="80" height="80" rx="12" fill="#FEF3C7"/>
      <rect x="100" y="122" width="80" height="80" rx="12" fill="#FEF3C7"/>
      <rect x="190" y="122" width="80" height="80" rx="12" fill="#FEF3C7"/>
      <rect x="16" y="128" width="68" height="46" rx="8" fill="#F59E0B" opacity="0.2"/>
      <rect x="106" y="128" width="68" height="46" rx="8" fill="#F59E0B" opacity="0.2"/>
      <rect x="196" y="128" width="68" height="46" rx="8" fill="#F59E0B" opacity="0.2"/>
      <rect x="16" y="179" width="42" height="5" rx="2" fill="#7C2D12" opacity="0.7"/>
      <rect x="106" y="179" width="42" height="5" rx="2" fill="#7C2D12" opacity="0.7"/>
      <rect x="196" y="179" width="42" height="5" rx="2" fill="#7C2D12" opacity="0.7"/>
      <rect x="16" y="188" width="28" height="5" rx="2" fill="#F59E0B"/>
      <rect x="106" y="188" width="28" height="5" rx="2" fill="#F59E0B"/>
      <rect x="196" y="188" width="28" height="5" rx="2" fill="#F59E0B"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Ana bileşen
// ─────────────────────────────────────────────────────────────────────────────
export default function ThemeSettingsPage() {
  const { activeTenantId } = useAuth();
  const { toast }          = useToast();
  const qc                 = useQueryClient();
  const iframeRef          = useRef(null);

  const [selectedTheme, setSelectedTheme]     = useState(null);
  const [previewingTheme, setPreviewingTheme] = useState(null); // seçili ama henüz kaydedilmemiş
  const [customizing, setCustomizing]         = useState(false);
  const [activePage, setActivePage]           = useState('home');
  const [iframeKey, setIframeKey]             = useState(0);

  const [form, setForm] = useState({
    theme: 'minimal', fontHeading: '', fontBody: '',
    borderRadius: 'md', heroLayout: 'centered',
    showReviews: true, showWishlist: true, showLoyalty: true, customCss: '',
    primaryColor: '#111827', secondaryColor: '#F8FAFC', accentColor: '#6366f1',
    heroTitle: '', heroSubtitle: '', heroCtaText: '', heroImage: '',
    featuredSectionTitle: 'Öne Çıkan Ürünler',
    trustBadges: DEFAULT_BADGES,
  });

  const set      = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setBadge = (i, key, val) => setForm(p => {
    const badges = [...p.trustBadges];
    badges[i] = { ...badges[i], [key]: val };
    return { ...p, trustBadges: badges };
  });

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', activeTenantId],
    queryFn:  () => api.get(`/companies/${activeTenantId}`).then(r => r.data),
    enabled:  !!activeTenantId,
  });

  useEffect(() => {
    if (!company) return;
    const ts = company.themeSettings || {};
    const br = company.branding     || {};
    const ct = company.content      || {};
    const theme = ts.theme || 'minimal';
    setForm({
      theme, fontHeading: ts.fontHeading || '', fontBody: ts.fontBody || '',
      borderRadius: ts.borderRadius || 'md', heroLayout: ts.heroLayout || 'centered',
      showReviews: ts.showReviews ?? true, showWishlist: ts.showWishlist ?? true,
      showLoyalty: ts.showLoyalty ?? true, customCss: ts.customCss || '',
      primaryColor:   br.primaryColor   || '#111827',
      secondaryColor: br.secondaryColor || '#F8FAFC',
      accentColor:    br.accentColor    || '#6366f1',
      heroTitle:            ct.heroTitle?.tr            || '',
      heroSubtitle:         ct.heroSubtitle?.tr         || '',
      heroCtaText:          ct.heroCtaText?.tr          || '',
      heroImage:            ct.heroImage                || '',
      featuredSectionTitle: ct.featuredSectionTitle     || 'Öne Çıkan Ürünler',
      trustBadges: ct.trustBadges?.length ? ct.trustBadges : DEFAULT_BADGES,
    });
    setSelectedTheme(theme);
    if (ts.theme) setCustomizing(true);
  }, [company]);

  const saveMutation = useMutation({
    mutationFn: () => api.patch(`/companies/${activeTenantId}`, {
      themeSettings: {
        theme: form.theme, fontHeading: form.fontHeading || null, fontBody: form.fontBody || null,
        borderRadius: form.borderRadius, heroLayout: form.heroLayout,
        showReviews: form.showReviews, showWishlist: form.showWishlist,
        showLoyalty: form.showLoyalty, customCss: form.customCss || null,
      },
      branding: {
        ...(company?.branding || {}),
        primaryColor: form.primaryColor, secondaryColor: form.secondaryColor, accentColor: form.accentColor,
      },
      content: {
        ...(company?.content || {}),
        heroTitle:    { tr: form.heroTitle,    en: company?.content?.heroTitle?.en    || form.heroTitle },
        heroSubtitle: { tr: form.heroSubtitle, en: company?.content?.heroSubtitle?.en || form.heroSubtitle },
        heroCtaText:  { tr: form.heroCtaText,  en: company?.content?.heroCtaText?.en  || form.heroCtaText },
        heroImage:            form.heroImage,
        featuredSectionTitle: form.featuredSectionTitle || null,
        trustBadges:          form.trustBadges,
      },
    }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company', activeTenantId] });
      toast.success('Tema ayarları kaydedildi');
      setPreviewingTheme(null); // artık kaydedildi, /slug canlı URL'e geç
      setTimeout(() => setIframeKey(k => k + 1), 600);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Kaydedilemedi'),
  });

  const handleSelectTheme = (themeValue) => {
    const def = THEMES.find(t => t.value === themeValue);
    setSelectedTheme(themeValue);
    setPreviewingTheme(themeValue);
    setForm(p => ({ ...p, theme: themeValue, primaryColor: def.colors.primary, accentColor: def.colors.accent, secondaryColor: def.colors.bg }));
    setCustomizing(true);
    setIframeKey(k => k + 1); // büyük önizlemeyi yenile
  };

  // Real-time preview: form değişince iframe'e postMessage gönder
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow || !company?.slug) return;
    iframe.contentWindow.postMessage({ type: 'NETRAVOX_PREVIEW', payload: form }, STOREFRONT_BASE);
  }, [form, company?.slug]);

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Yükleniyor...</p>
    </div>
  );

  const liveUrl        = company?.slug ? `${STOREFRONT_BASE}/${company.slug}` : null;
  const previewUrl     = company?.slug
    ? previewingTheme
      ? `${STOREFRONT_BASE}/preview/${company.slug}/${previewingTheme}`
      : liveUrl
    : null;
  const activeThemeDef = THEMES.find(t => t.value === selectedTheme);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex absolute inset-0 overflow-hidden">

      {/* ── SOL PANEL: Editor ── */}
      <div className="w-[400px] flex-shrink-0 flex flex-col overflow-hidden border-r" style={{ borderColor: 'var(--border)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
          <div>
            <h1 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Tema Ayarları</h1>
            {selectedTheme && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Aktif: {activeThemeDef?.label}</p>
            )}
          </div>
          <Button
            onClick={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
            disabled={saveMutation.isPending || !activeTenantId}
          >
            Kaydet
          </Button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">

          {/* Tema Galerisi */}
          <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>Tema Seç</p>
            <div className="grid grid-cols-2 gap-2.5">
              {THEMES.map(t => {
                const isActive = selectedTheme === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => handleSelectTheme(t.value)}
                    className="group relative text-left rounded-xl overflow-hidden border-2 transition-all duration-200"
                    style={{
                      borderColor: isActive ? 'var(--primary)' : 'var(--border)',
                      boxShadow:   isActive ? '0 0 0 2px color-mix(in srgb, var(--primary) 25%, transparent)' : 'none',
                    }}
                  >
                    {/* Kart önizlemesi: iframe varsa göster, yoksa SVG mockup */}
                    <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
                      {company?.slug ? (
                        <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
                          {/* SVG fallback arka planda görünür */}
                          <div style={{ position: 'absolute', inset: 0 }}><ThemeMockup themeValue={t.value} /></div>
                          {/* Scaled iframe üstte */}
                          <iframe
                            src={`${STOREFRONT_BASE}/preview/${company.slug}/${t.value}`}
                            style={{
                              position: 'absolute', top: 0, left: 0,
                              width: '1280px', height: '960px',
                              transform: 'scale(0.145)',
                              transformOrigin: 'top left',
                              pointerEvents: 'none',
                              border: 'none',
                            }}
                            tabIndex={-1}
                            title={`${t.label} önizleme`}
                          />
                        </div>
                      ) : (
                        <ThemeMockup themeValue={t.value} />
                      )}
                      {isActive && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow" style={{ background: 'var(--primary)' }}>
                          <Check size={10} color="#fff" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <div className="px-2.5 py-2" style={{ background: isActive ? 'color-mix(in srgb, var(--primary) 6%, var(--bg-base))' : 'var(--bg-base)' }}>
                      <p className="font-semibold text-xs" style={{ color: isActive ? 'var(--primary)' : 'var(--text-primary)' }}>{t.label}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {t.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sayfa sekmeleri + içerik */}
          {customizing && (
            <>
              {/* Yatay sekme tabı */}
              <div className="flex border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
                {PAGES.map(p => {
                  const Icon   = p.icon;
                  const active = activePage === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setActivePage(p.id)}
                      className="flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-all border-b-2"
                      style={{
                        borderColor: active ? 'var(--primary)' : 'transparent',
                        color:       active ? 'var(--primary)' : 'var(--text-muted)',
                        background:  active ? 'color-mix(in srgb, var(--primary) 5%, transparent)' : 'transparent',
                      }}
                    >
                      <Icon size={14} />
                      {p.label}
                    </button>
                  );
                })}
              </div>

              {/* Section içerikleri */}
              <div className="p-4 space-y-3">

                {/* ── ANA SAYFA ── */}
                {activePage === 'home' && (
                  <>
                    <AccordionSection icon={Image} title="Hero Bölümü" defaultOpen>
                      <Field label="Ana Sayfa Başlığı">
                        <TextInput value={form.heroTitle} onChange={e => set('heroTitle', e.target.value)} placeholder="Teknolojiyi Doğru Adresten Al" />
                      </Field>
                      <Field label="Alt Başlık / Slogan">
                        <TextInput value={form.heroSubtitle} onChange={e => set('heroSubtitle', e.target.value)} placeholder="En iyi fiyatlar, en hızlı teslimat." />
                      </Field>
                      <Field label="CTA Buton Yazısı">
                        <TextInput value={form.heroCtaText} onChange={e => set('heroCtaText', e.target.value)} placeholder="Ürünleri Keşfet" />
                      </Field>
                      <ImageUrlInput label="Hero Görseli" value={form.heroImage} onChange={v => set('heroImage', v)} hint="Önerilen: 1400×600px" />
                      <Field label="Hero Düzeni">
                        <div className="grid grid-cols-3 gap-2">
                          {HERO_LAYOUTS.map(l => {
                            const active = form.heroLayout === l.value;
                            return (
                              <button key={l.value} type="button" onClick={() => set('heroLayout', l.value)} className="rounded-lg p-2 border-2 transition-all text-center" style={{ borderColor: active ? 'var(--primary)' : 'var(--border)', background: active ? 'color-mix(in srgb, var(--primary) 8%, var(--bg-base))' : 'var(--bg-muted)' }}>
                                <div className="w-full h-10 mb-1" style={{ color: active ? 'var(--primary)' : 'var(--text-muted)' }}>{l.icon}</div>
                                <p className="text-[10px] font-semibold" style={{ color: active ? 'var(--primary)' : 'var(--text-primary)' }}>{l.label}</p>
                              </button>
                            );
                          })}
                        </div>
                      </Field>
                    </AccordionSection>

                    <AccordionSection icon={Shield} title="Güven Rozetleri">
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Hero'nun altında gösterilen 4 özellik rozeti. İkon için emoji kullanın.</p>
                      {form.trustBadges.map((badge, i) => (
                        <div key={i} className="rounded-lg border p-3 space-y-2.5" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
                          <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Rozet {i + 1}</p>
                          <div className="grid grid-cols-[52px_1fr] gap-2">
                            <Field label="İkon">
                              <TextInput value={badge.icon} onChange={e => setBadge(i, 'icon', e.target.value)} placeholder="🚚" />
                            </Field>
                            <Field label="Başlık">
                              <TextInput value={badge.title} onChange={e => setBadge(i, 'title', e.target.value)} placeholder="Ücretsiz Kargo" />
                            </Field>
                          </div>
                          <Field label="Alt Metin">
                            <TextInput value={badge.sub} onChange={e => setBadge(i, 'sub', e.target.value)} placeholder="200₺ ve üzeri siparişlerde" />
                          </Field>
                        </div>
                      ))}
                    </AccordionSection>

                    <AccordionSection icon={Star} title="Öne Çıkan Ürünler">
                      <Field label="Bölüm Başlığı">
                        <TextInput value={form.featuredSectionTitle} onChange={e => set('featuredSectionTitle', e.target.value)} placeholder="Öne Çıkan Ürünler" />
                      </Field>
                    </AccordionSection>
                  </>
                )}

                {/* ── ÜRÜNLER LİSTESİ ── */}
                {activePage === 'products' && (
                  <AccordionSection icon={Sliders} title="Filtre & Listeleme" defaultOpen>
                    <div className="rounded-lg border p-4 text-sm" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
                      <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Otomatik yönetilen bölümler</p>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                        Kategori filtreleri, fiyat aralığı ve ürün ızgarası mağazanızda otomatik görünür.
                        Kategorileri yönetmek için <strong>Kategoriler</strong> sayfasını kullanın.
                      </p>
                    </div>
                  </AccordionSection>
                )}

                {/* ── ÜRÜN DETAY ── */}
                {activePage === 'product-detail' && (
                  <AccordionSection icon={Sliders} title="Görünür Bölümler" defaultOpen>
                    <Toggle
                      label="Müşteri Yorumları"
                      desc="Ürün sayfasında yorum bölümünü göster"
                      enabled={form.showReviews}
                      onToggle={() => set('showReviews', !form.showReviews)}
                    />
                    <Toggle
                      label="Favori / İstek Listesi"
                      desc="Ürünlerde kalp ikonu ve istek listesi"
                      enabled={form.showWishlist}
                      onToggle={() => set('showWishlist', !form.showWishlist)}
                    />
                    <Toggle
                      label="Sadakat Puanı Bilgisi"
                      desc="Sipariş tamamlandığında kazanılacak puan"
                      enabled={form.showLoyalty}
                      onToggle={() => set('showLoyalty', !form.showLoyalty)}
                    />
                  </AccordionSection>
                )}

                {/* ── GENEL GÖRÜNÜM ── */}
                {activePage === 'general' && (
                  <>
                    <AccordionSection icon={Palette} title="Renkler" defaultOpen>
                      <div className="space-y-4">
                        {[
                          { key: 'primaryColor',   label: 'Ana Renk',    desc: 'Butonlar, linkler' },
                          { key: 'accentColor',    label: 'Aksan Rengi', desc: 'Fiyat, rozet' },
                          { key: 'secondaryColor', label: 'Arka Plan',   desc: 'Sayfa zemin rengi' },
                        ].map(({ key, label, desc }) => (
                          <Field key={key} label={label} hint={desc}>
                            <div className="flex items-center gap-2">
                              <div className="w-9 h-9 rounded-lg border-2 flex-shrink-0 cursor-pointer relative overflow-hidden" style={{ borderColor: 'var(--border)', background: form[key] }}>
                                <input type="color" value={form[key]} onChange={e => set(key, e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                              </div>
                              <input type="text" value={form[key]} onChange={e => set(key, e.target.value)} className="flex-1 rounded-lg px-3 py-2 border text-sm font-mono outline-none" style={{ background: 'var(--bg-muted)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} maxLength={7} />
                            </div>
                          </Field>
                        ))}
                      </div>
                    </AccordionSection>

                    <AccordionSection icon={Type} title="Yazı Tipleri">
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Google Fonts adı girin. Boş bırakılırsa tema varsayılanı kullanılır.</p>
                      <Field label="Başlık Yazı Tipi">
                        <TextInput value={form.fontHeading} onChange={e => set('fontHeading', e.target.value)} placeholder="Playfair Display" />
                      </Field>
                      <Field label="Metin Yazı Tipi">
                        <TextInput value={form.fontBody} onChange={e => set('fontBody', e.target.value)} placeholder="Inter" />
                      </Field>
                    </AccordionSection>

                    <AccordionSection icon={Layout} title="Köşe Yuvarlama">
                      <div className="flex gap-2">
                        {RADIUS_OPTIONS.map(r => {
                          const active = form.borderRadius === r.value;
                          return (
                            <button key={r.value} type="button" onClick={() => set('borderRadius', r.value)} className="flex-1 flex flex-col items-center gap-1.5 py-2 border-2 transition-all rounded-lg" style={{ borderColor: active ? 'var(--primary)' : 'var(--border)', background: active ? 'color-mix(in srgb, var(--primary) 8%, var(--bg-base))' : 'var(--bg-muted)' }}>
                              <div className="w-6 h-6 border-2" style={{ borderColor: active ? 'var(--primary)' : 'var(--text-muted)', borderRadius: r.preview }} />
                              <span className="text-[10px] font-medium" style={{ color: active ? 'var(--primary)' : 'var(--text-secondary)' }}>{r.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </AccordionSection>

                    <AccordionSection icon={Code} title="Özel CSS">
                      <textarea
                        value={form.customCss}
                        onChange={e => set('customCss', e.target.value)}
                        rows={7}
                        placeholder={`.my-element {\n  color: var(--color-primary);\n}`}
                        className="w-full rounded-lg px-3 py-2.5 border outline-none text-sm font-mono resize-y"
                        style={{ background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                        spellCheck={false}
                      />
                    </AccordionSection>
                  </>
                )}

              </div>
            </>
          )}
        </div>
      </div>

      {/* ── SAĞ PANEL: Canlı Önizleme ── */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#e5e7eb' }}>

        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b flex-shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--bg-base)' }}>
          <Monitor size={14} style={{ color: 'var(--text-muted)' }} />
          <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono overflow-hidden" style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
            {previewingTheme && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase flex-shrink-0" style={{ background: 'color-mix(in srgb, var(--primary) 15%, transparent)', color: 'var(--primary)' }}>
                Önizleme
              </span>
            )}
            <span className="truncate">{previewUrl || 'Firma bulunamadı'}</span>
          </div>
          <button
            type="button"
            onClick={() => setIframeKey(k => k + 1)}
            className="p-1.5 rounded-lg transition-colors hover:bg-gray-100"
            title="Yenile"
            style={{ color: 'var(--text-muted)' }}
          >
            <RefreshCw size={14} />
          </button>
          {previewUrl && (
            <a href={previewUrl} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg transition-colors hover:bg-gray-100" title="Yeni sekmede aç" style={{ color: 'var(--text-muted)' }}>
              <ExternalLink size={14} />
            </a>
          )}
        </div>

        {/* iframe */}
        {previewUrl ? (
          <iframe
            key={iframeKey}
            ref={iframeRef}
            src={previewUrl}
            className="flex-1 w-full"
            style={{ border: 'none' }}
            title="Mağaza Önizlemesi"
            onLoad={() => {
              const iframe = iframeRef.current;
              if (iframe?.contentWindow) {
                iframe.contentWindow.postMessage({ type: 'NETRAVOX_PREVIEW', payload: form }, STOREFRONT_BASE);
              }
            }}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3" style={{ color: 'var(--text-muted)' }}>
            <Monitor size={40} opacity={0.3} />
            <p className="text-sm">Firma seçilmedi</p>
          </div>
        )}
      </div>

    </div>
  );
}
