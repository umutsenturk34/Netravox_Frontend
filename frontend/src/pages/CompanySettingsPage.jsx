import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import { Input, Select, ImageUrlInput } from '../components/ui/Input';

const ALL_MODULES = [
  { id: 'pages',           label: 'Sayfalar' },
  { id: 'media',           label: 'Medya' },
  { id: 'menus',           label: 'Navigasyon' },
  { id: 'restaurant',      label: 'Restoran Menüsü' },
  { id: 'dental',          label: 'Diş Hekimi Hizmetleri' },
  { id: 'services',        label: 'Ürünler & Hizmetler' },
  { id: 'real-estate',     label: 'Emlak İlanları' },
  { id: 'reservations',    label: 'Rezervasyonlar' },
  { id: 'forms',           label: 'Form Gönderileri' },
  { id: 'notifications',   label: 'Bildirimler' },
  { id: 'blog',            label: 'Blog Yazıları' },
  { id: 'blog-categories', label: 'Blog Kategorileri' },
  { id: 'faqs',            label: 'SSS Yönetimi' },
  { id: 'testimonials',    label: 'Referanslar' },
  { id: 'team',            label: 'Ekip' },
  { id: 'popups',          label: 'Popup & Duyurular' },
  { id: 'seo',             label: 'SEO' },
  { id: 'redirects',       label: 'Redirect' },
  { id: 'languages',       label: 'Diller' },
  { id: 'settings',        label: 'Firma Ayarları' },
];

const SECTORS = [
  { value: 'restaurant', label: 'Restoran' },
  { value: 'clinic', label: 'Klinik' },
  { value: 'beauty', label: 'Güzellik Merkezi' },
  { value: 'retail', label: 'Perakende' },
  { value: 'other', label: 'Diğer' },
];

const TABS = [
  { id: 'genel', label: 'Genel' },
  { id: 'iletisim', label: 'İletişim' },
  { id: 'icerik', label: 'İçerik' },
  { id: 'gorsel', label: 'Görseller' },
  { id: 'degerler', label: 'Değerler' },
  { id: 'email', label: 'E-posta Şablonları' },
  { id: 'smtp', label: 'SMTP Ayarları' },
  { id: 'sosyal', label: 'Sosyal & Diğer' },
  { id: 'entegrasyon', label: 'Entegrasyonlar' },
  { id: 'moduller', label: 'Modüller', agencyOnly: true },
];

const defaultContent = {
  heroTitle: { tr: '', en: '' },
  heroImage: '',
  homeImages: ['', '', '', ''],
  testimonial: { quote: { tr: '', en: '' }, author: '', role: '' },
  aboutHeroImage: '',
  aboutParagraph2: { tr: '', en: '' },
  aboutParagraph3: { tr: '', en: '' },
  aboutImages: ['', '', '', ''],
  values: [
    { icon: '🌿', title: { tr: '', en: '' }, description: { tr: '', en: '' } },
    { icon: '🏔', title: { tr: '', en: '' }, description: { tr: '', en: '' } },
    { icon: '👨‍🍳', title: { tr: '', en: '' }, description: { tr: '', en: '' } },
  ],
  menuSubtitle: { tr: '', en: '' },
  reservationSubtitle: { tr: '', en: '' },
  reservationSlots: [],
};

const DEFAULT_SMTP = { enabled: false, host: '', port: 587, secure: false, user: '', pass: '', fromName: '' };

export default function CompanySettingsPage() {
  const { activeTenantId, user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('genel');
  const [smtpForm, setSmtpForm] = useState(DEFAULT_SMTP);
  const [testingMail, setTestingMail] = useState(false);

  const [form, setForm] = useState({
    name: '',
    domain: '',
    subdomain: '',
    sector: 'restaurant',
    branding: { primaryColor: '#2563EB', secondaryColor: '#1E40AF', logoLight: '', logoDark: '', heroImage: '' },
    settings: { defaultLanguage: 'tr', supportedLanguages: ['tr'] },
    description: { tr: '', en: '' },
    contact: { phone: '', whatsapp: '', email: '', address: '', city: '', country: 'Türkiye', mapUrl: '' },
    workingHours: [
      { days: 'Pazartesi – Cuma', hours: '08:00 – 22:00' },
      { days: 'Cumartesi – Pazar', hours: '07:30 – 23:00' },
    ],
    socialLinks: { instagram: '', facebook: '', twitter: '', youtube: '', tiktok: '' },
    integrations: { analyticsPropertyId: '' },
    features: { aiContent: false, whatsapp: false },
    emailSettings: {
      senderName: '',
      replyTo: '',
      accentColor: '#8B1A1A',
      phone: '',
      location: '',
      footerQuote: '',
      confirmedSubject: '',
      confirmedMessage: '',
      rejectedSubject: '',
      rejectedMessage: '',
    },
    content: defaultContent,
  });

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', activeTenantId],
    queryFn: () => api.get(`/companies/${activeTenantId}`).then((r) => r.data),
    enabled: !!activeTenantId,
  });

  useEffect(() => {
    if (company) {
      const c = company.content || {};
      setForm({
        name: company.name || '',
        domain: company.domain || '',
        subdomain: company.subdomain || '',
        sector: company.sector || 'restaurant',
        branding: {
          primaryColor: company.branding?.primaryColor || '#2563EB',
          secondaryColor: company.branding?.secondaryColor || '#1E40AF',
          logoLight: company.branding?.logoLight || '',
          logoDark: company.branding?.logoDark || '',
        },
        settings: {
          defaultLanguage: company.settings?.defaultLanguage || 'tr',
          supportedLanguages: company.settings?.supportedLanguages || ['tr'],
        },
        description: { tr: company.description?.tr || '', en: company.description?.en || '' },
        contact: {
          phone: company.contact?.phone || '',
          whatsapp: company.contact?.whatsapp || '',
          email: company.contact?.email || '',
          address: company.contact?.address || '',
          city: company.contact?.city || '',
          country: company.contact?.country || 'Türkiye',
          mapUrl: company.contact?.mapUrl || '',
        },
        workingHours: company.workingHours?.length
          ? company.workingHours
          : [{ days: 'Pazartesi – Cuma', hours: '08:00 – 22:00' }, { days: 'Cumartesi – Pazar', hours: '07:30 – 23:00' }],
        socialLinks: {
          instagram: company.socialLinks?.instagram || '',
          facebook: company.socialLinks?.facebook || '',
          twitter: company.socialLinks?.twitter || '',
          youtube: company.socialLinks?.youtube || '',
          tiktok: company.socialLinks?.tiktok || '',
        },
        integrations: {
          analyticsPropertyId: company.integrations?.analyticsPropertyId || '',
        },
        features: {
          aiContent: company.features?.aiContent ?? false,
          whatsapp:  company.features?.whatsapp  ?? false,
        },
        emailSettings: {
          senderName: company.emailSettings?.senderName || '',
          replyTo: company.emailSettings?.replyTo || '',
          accentColor: company.emailSettings?.accentColor || '#8B1A1A',
          phone: company.emailSettings?.phone || '',
          location: company.emailSettings?.location || '',
          footerQuote: company.emailSettings?.footerQuote || '',
          confirmedSubject: company.emailSettings?.confirmedSubject || '',
          confirmedMessage: company.emailSettings?.confirmedMessage || '',
          rejectedSubject: company.emailSettings?.rejectedSubject || '',
          rejectedMessage: company.emailSettings?.rejectedMessage || '',
        },
        content: {
          heroTitle: { tr: c.heroTitle?.tr || '', en: c.heroTitle?.en || '' },
          heroImage: c.heroImage || '',
          homeImages: c.homeImages?.length === 4 ? c.homeImages : ['', '', '', ''],
          testimonial: {
            quote: { tr: c.testimonial?.quote?.tr || '', en: c.testimonial?.quote?.en || '' },
            author: c.testimonial?.author || '',
            role: c.testimonial?.role || '',
          },
          aboutHeroImage: c.aboutHeroImage || '',
          aboutParagraph2: { tr: c.aboutParagraph2?.tr || '', en: c.aboutParagraph2?.en || '' },
          aboutParagraph3: { tr: c.aboutParagraph3?.tr || '', en: c.aboutParagraph3?.en || '' },
          aboutImages: c.aboutImages?.length === 4 ? c.aboutImages : ['', '', '', ''],
          values: c.values?.length
            ? c.values.map((v) => ({
                icon: v.icon || '🌿',
                title: { tr: v.title?.tr || '', en: v.title?.en || '' },
                description: { tr: v.description?.tr || '', en: v.description?.en || '' },
              }))
            : defaultContent.values,
          menuSubtitle: { tr: c.menuSubtitle?.tr || '', en: c.menuSubtitle?.en || '' },
          reservationSubtitle: { tr: c.reservationSubtitle?.tr || '', en: c.reservationSubtitle?.en || '' },
          reservationSlots: c.reservationSlots?.length ? c.reservationSlots : [],
        },
      });
    }
  }, [company]);

  const saveMutation = useMutation({
    mutationFn: (data) => api.patch(`/companies/${activeTenantId}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company', activeTenantId] });
      toast.success('Ayarlar kaydedildi');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Kaydedilemedi'),
  });

  const { data: smtpData } = useQuery({
    queryKey: ['company-smtp', activeTenantId],
    queryFn: () => api.get(`/companies/${activeTenantId}/smtp`).then((r) => r.data),
    enabled: !!activeTenantId && activeTab === 'smtp',
  });

  useEffect(() => {
    if (smtpData) setSmtpForm({ ...DEFAULT_SMTP, ...smtpData });
  }, [smtpData]);

  const featuresMutation = useMutation({
    mutationFn: (data) => api.patch(`/companies/${activeTenantId}/features`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company', activeTenantId] });
      toast.success('Özellikler kaydedildi');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Kaydedilemedi'),
  });

  const smtpMutation = useMutation({
    mutationFn: (data) => api.patch(`/companies/${activeTenantId}/smtp`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company-smtp', activeTenantId] });
      toast.success('SMTP ayarları kaydedildi');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Kaydedilemedi'),
  });

  async function testSmtp() {
    setTestingMail(true);
    try {
      const { data } = await api.post(`/companies/${activeTenantId}/smtp/test`);
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Test maili gönderilemedi');
    } finally {
      setTestingMail(false);
    }
  }

  const setSmtp = (key, value) => setSmtpForm((p) => ({ ...p, [key]: value }));

  const set = (path, value) => {
    setForm((prev) => {
      const next = { ...prev };
      const keys = path.split('.');
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) {
        cur[keys[i]] = Array.isArray(cur[keys[i]]) ? [...cur[keys[i]]] : { ...cur[keys[i]] };
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const setArrayItem = (path, index, value) => {
    setForm((prev) => {
      const keys = path.split('.');
      const next = { ...prev };
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) {
        cur[keys[i]] = { ...cur[keys[i]] };
        cur = cur[keys[i]];
      }
      const arr = [...cur[keys[keys.length - 1]]];
      arr[index] = value;
      cur[keys[keys.length - 1]] = arr;
      return next;
    });
  };

  const setValueCard = (index, field, value) => {
    const updated = form.content.values.map((v, i) =>
      i === index ? { ...v, ...setNestedField(v, field, value) } : v
    );
    set('content.values', updated);
  };

  if (isLoading) {
    return <div className="py-12 text-center" style={{ color: 'var(--text-muted)' }}>Yükleniyor...</div>;
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Firma Ayarları</h1>
        <Button onClick={() => saveMutation.mutate(form)} loading={saveMutation.isPending}>
          Kaydet
        </Button>
      </div>

      {/* Tab bar */}
      <div className="mb-6 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {TABS.filter((t) => !t.agencyOnly || user?.isSuperAdmin || user?.isAgencyUser).map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0"
              style={{
                borderColor: activeTab === t.id ? 'var(--primary)' : 'transparent',
                color: activeTab === t.id ? 'var(--primary)' : 'var(--text-secondary)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {/* ── GENEL ── */}
        {activeTab === 'genel' && (
          <>
            <Section title="Genel Bilgiler">
              <Input label="Firma Adı" value={form.name} onChange={(e) => set('name', e.target.value)} />
              <Select label="Sektör" value={form.sector} onChange={(e) => set('sector', e.target.value)}>
                {SECTORS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </Select>
              <Input label="Domain (örn: gusto.com.tr)" value={form.domain} onChange={(e) => set('domain', e.target.value)} placeholder="gusto.com.tr" />
              <Input label="Subdomain (örn: gusto)" value={form.subdomain} onChange={(e) => set('subdomain', e.target.value)} placeholder="gusto" />
            </Section>

            <Section title="Marka Renkleri">
              <div className="grid grid-cols-2 gap-4">
                {[['Ana Renk', 'branding.primaryColor'], ['İkincil Renk', 'branding.secondaryColor']].map(([label, path]) => (
                  <div key={path}>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={form.branding[path.split('.')[1]] || '#2563EB'}
                        onChange={(e) => set(path, e.target.value)}
                        className="h-10 w-14 rounded border cursor-pointer"
                        style={{ borderColor: 'var(--border)', padding: '2px' }} />
                      <Input value={form.branding[path.split('.')[1]] || ''} onChange={(e) => set(path, e.target.value)} placeholder="#2563EB" className="flex-1" />
                    </div>
                  </div>
                ))}
              </div>
              <ImageUrlInput label="Logo (Açık Tema) URL" value={form.branding.logoLight} onChange={(e) => set('branding.logoLight', e.target.value)} hint="200×60px" />
              <ImageUrlInput label="Logo (Koyu Tema) URL" value={form.branding.logoDark} onChange={(e) => set('branding.logoDark', e.target.value)} hint="200×60px" />
            </Section>

            <Section title="Dil Ayarları">
              <Select label="Varsayılan Dil" value={form.settings.defaultLanguage} onChange={(e) => set('settings.defaultLanguage', e.target.value)}>
                <option value="tr">Türkçe</option>
                <option value="en">İngilizce</option>
              </Select>
            </Section>

            <Section title="Firma Tanıtım Metni">
              <Textarea label="Türkçe Açıklama" value={form.description.tr} onChange={(e) => set('description.tr', e.target.value)} placeholder="Firma hakkında kısa açıklama..." />
              <Textarea label="İngilizce Açıklama" value={form.description.en} onChange={(e) => set('description.en', e.target.value)} placeholder="Short description about the company..." />
            </Section>
          </>
        )}

        {/* ── İLETİŞİM ── */}
        {activeTab === 'iletisim' && (
          <>
            <Section title="İletişim Bilgileri">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Telefon" value={form.contact.phone} onChange={(e) => set('contact.phone', e.target.value)} placeholder="+90 262 123 45 67" />
                <Input label="E-posta" value={form.contact.email} onChange={(e) => set('contact.email', e.target.value)} placeholder="info@firma.com" />
              </div>
              <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">📱</span>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>WhatsApp İletişim Numarası</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Web sitesinde "WhatsApp'tan Sipariş Ver" butonu bu numarayı kullanır. Tüm sektörler için geçerlidir.</p>
                  </div>
                </div>
                <Input
                  label="WhatsApp Numarası"
                  value={form.contact.whatsapp}
                  onChange={(e) => set('contact.whatsapp', e.target.value)}
                  placeholder="+90 532 123 45 67"
                />
                {form.contact.whatsapp && (
                  <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                    Önizleme:{' '}
                    <a
                      href={`https://wa.me/${form.contact.whatsapp.replace(/\D/g, '').replace(/^0/, '90')}`}
                      target="_blank" rel="noopener noreferrer"
                      className="underline"
                      style={{ color: '#25D366' }}
                    >
                      wa.me/{form.contact.whatsapp.replace(/\D/g, '').replace(/^0/, '90')}
                    </a>
                  </p>
                )}
              </div>
              <Input label="Adres" value={form.contact.address} onChange={(e) => set('contact.address', e.target.value)} placeholder="Mahalle, Sokak No" />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Şehir" value={form.contact.city} onChange={(e) => set('contact.city', e.target.value)} placeholder="Kocaeli" />
                <Input label="Ülke" value={form.contact.country} onChange={(e) => set('contact.country', e.target.value)} placeholder="Türkiye" />
              </div>
              <Input label="Google Maps Embed URL" value={form.contact.mapUrl} onChange={(e) => set('contact.mapUrl', e.target.value)} placeholder="https://maps.google.com/..." />
            </Section>

            <Section title="Çalışma Saatleri">
              {form.workingHours.map((wh, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="flex-1">
                    <Input label={i === 0 ? 'Günler' : ''} value={wh.days}
                      onChange={(e) => { const u = [...form.workingHours]; u[i] = { ...u[i], days: e.target.value }; set('workingHours', u); }}
                      placeholder="Pazartesi – Cuma" />
                  </div>
                  <div className="flex-1">
                    <Input label={i === 0 ? 'Saatler' : ''} value={wh.hours}
                      onChange={(e) => { const u = [...form.workingHours]; u[i] = { ...u[i], hours: e.target.value }; set('workingHours', u); }}
                      placeholder="08:00 – 22:00" />
                  </div>
                  <button onClick={() => set('workingHours', form.workingHours.filter((_, j) => j !== i))}
                    className="mt-7 text-red-500 hover:text-red-700 text-sm px-2">✕</button>
                </div>
              ))}
              <button onClick={() => set('workingHours', [...form.workingHours, { days: '', hours: '' }])}
                className="text-sm" style={{ color: 'var(--primary)' }}>+ Satır Ekle</button>
            </Section>
          </>
        )}

        {/* ── İÇERİK ── */}
        {activeTab === 'icerik' && (
          <>
            <Section title="Ana Sayfa — Hero Bölümü">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Ana sayfanın tam ekran üst bölümündeki başlık</p>
              <Input label="Hero Başlık (Türkçe)" value={form.content.heroTitle.tr}
                onChange={(e) => set('content.heroTitle.tr', e.target.value)}
                placeholder="Doğayla İç İçe Bir Sofra Deneyimi" />
              <Input label="Hero Başlık (İngilizce)" value={form.content.heroTitle.en}
                onChange={(e) => set('content.heroTitle.en', e.target.value)}
                placeholder="A Dining Experience in the Heart of Nature" />
            </Section>

            <Section title="Testimonial (Müşteri Yorumu)">
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Ana sayfa ve hakkımızda sayfasında görünen alıntı</p>
              <Textarea label="Alıntı (Türkçe)" value={form.content.testimonial.quote.tr}
                onChange={(e) => set('content.testimonial.quote.tr', e.target.value)}
                placeholder="Hayatımda deneyimlediğim en lüks kahvaltıydı..." />
              <Textarea label="Alıntı (İngilizce)" value={form.content.testimonial.quote.en}
                onChange={(e) => set('content.testimonial.quote.en', e.target.value)}
                placeholder="The most luxurious breakfast I've ever had..." />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Yazar Adı" value={form.content.testimonial.author}
                  onChange={(e) => set('content.testimonial.author', e.target.value)}
                  placeholder="Ayşe Yılmaz" />
                <Input label="Yazar Rolü / Kaynağı" value={form.content.testimonial.role}
                  onChange={(e) => set('content.testimonial.role', e.target.value)}
                  placeholder="Misafir · Google Yorumu" />
              </div>
            </Section>

            <Section title="Hakkımızda — Ek Paragraflar">
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Firma tanıtım metninin altında gösterilir (Genel sekmesindeki açıklama 1. paragraf olarak kullanılır)</p>
              <Textarea label="2. Paragraf (Türkçe)" value={form.content.aboutParagraph2.tr}
                onChange={(e) => set('content.aboutParagraph2.tr', e.target.value)}
                placeholder="Tüm malzemelerimizi yerel çiftçilerden ve sürdürülebilir kaynaklardan temin ediyor..." rows={3} />
              <Textarea label="2. Paragraf (İngilizce)" value={form.content.aboutParagraph2.en}
                onChange={(e) => set('content.aboutParagraph2.en', e.target.value)}
                placeholder="We source all our ingredients from local farmers..." rows={3} />
              <Textarea label="3. Paragraf (Türkçe)" value={form.content.aboutParagraph3.tr}
                onChange={(e) => set('content.aboutParagraph3.tr', e.target.value)}
                placeholder="Köklü bir misafirperver anlayışıyla hizmet veren ekibimiz..." rows={3} />
              <Textarea label="3. Paragraf (İngilizce)" value={form.content.aboutParagraph3.en}
                onChange={(e) => set('content.aboutParagraph3.en', e.target.value)}
                placeholder="Our team, rooted in warm hospitality..." rows={3} />
            </Section>

            <Section title="Sayfa Alt Başlıkları">
              <Input label="Menü Sayfası Alt Başlığı (TR)" value={form.content.menuSubtitle.tr}
                onChange={(e) => set('content.menuSubtitle.tr', e.target.value)}
                placeholder="Yerel üreticilerden gelen taze malzemelerle hazırlanan, mevsimlik lezzetler." />
              <Input label="Menü Sayfası Alt Başlığı (EN)" value={form.content.menuSubtitle.en}
                onChange={(e) => set('content.menuSubtitle.en', e.target.value)} />
              <Input label="Rezervasyon Alt Başlığı (TR)" value={form.content.reservationSubtitle.tr}
                onChange={(e) => set('content.reservationSubtitle.tr', e.target.value)}
                placeholder="En az 24 saat öncesinden rezervasyon oluşturmanızı öneririz." />
              <Input label="Rezervasyon Alt Başlığı (EN)" value={form.content.reservationSubtitle.en}
                onChange={(e) => set('content.reservationSubtitle.en', e.target.value)} />
            </Section>

            <Section title="Rezervasyon Saat Dilimleri">
              <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Rezervasyon formunda gösterilecek saatler (HH:MM formatında, virgülle ayırın)</p>
              <Input
                label="Saatler"
                value={form.content.reservationSlots.join(', ')}
                onChange={(e) => set('content.reservationSlots', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                placeholder="08:00, 09:00, 10:00, 12:00, 13:00, 19:00, 20:00, 21:00"
              />
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Mevcut: {form.content.reservationSlots.length ? form.content.reservationSlots.join(' · ') : '(varsayılan kullanılır)'}
              </p>
            </Section>
          </>
        )}

        {/* ── GÖRSELLER ── */}
        {activeTab === 'gorsel' && (
          <>
            <Section title="Hero Görseli">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Ana sayfanın tam ekran arka plan görseli</p>
              <ImageUrlInput label="Hero Görsel URL" value={form.content.heroImage}
                onChange={(e) => set('content.heroImage', e.target.value)} hint="1600×900px" />
            </Section>

            <Section title="Ana Sayfa — Hakkımızda Önizleme Görselleri">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Ana sayfada 2×2 grid halinde gösterilen 4 görsel</p>
              {form.content.homeImages.map((url, i) => (
                <ImageUrlInput key={i} label={`Görsel ${i + 1}`} value={url}
                  onChange={(e) => setArrayItem('content.homeImages', i, e.target.value)} hint="600×800px" />
              ))}
            </Section>

            <Section title="Hakkımızda Sayfası Görselleri">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Hakkımızda hero görseli ve 2×2 grid görseller</p>
              <ImageUrlInput label="Hero Görseli (Hakkımızda)" value={form.content.aboutHeroImage}
                onChange={(e) => set('content.aboutHeroImage', e.target.value)} hint="1200×600px" />
              <div className="space-y-3">
                {form.content.aboutImages.map((url, i) => (
                  <ImageUrlInput key={i} label={`Yan Görsel ${i + 1}`} value={url}
                    onChange={(e) => setArrayItem('content.aboutImages', i, e.target.value)} hint="600×800px" />
                ))}
              </div>
            </Section>
          </>
        )}

        {/* ── DEĞERLER ── */}
        {activeTab === 'degerler' && (
          <Section title="Değerlerimiz Kartları">
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
              Hakkımızda sayfasında gösterilen değer kartları (örn: Sürdürülebilirlik, Doğa ile Uyum, Usta Eller)
            </p>
            {form.content.values.map((v, i) => (
              <div key={i} className="rounded-lg border p-4 space-y-3" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Kart {i + 1}</span>
                  {form.content.values.length > 1 && (
                    <button onClick={() => set('content.values', form.content.values.filter((_, j) => j !== i))}
                      className="text-xs text-red-500 hover:text-red-700">Sil</button>
                  )}
                </div>
                <Input label="İkon (emoji)" value={v.icon}
                  onChange={(e) => { const u = [...form.content.values]; u[i] = { ...u[i], icon: e.target.value }; set('content.values', u); }}
                  placeholder="🌿" />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Başlık (TR)" value={v.title.tr}
                    onChange={(e) => { const u = [...form.content.values]; u[i] = { ...u[i], title: { ...u[i].title, tr: e.target.value } }; set('content.values', u); }}
                    placeholder="Sürdürülebilirlik" />
                  <Input label="Başlık (EN)" value={v.title.en}
                    onChange={(e) => { const u = [...form.content.values]; u[i] = { ...u[i], title: { ...u[i].title, en: e.target.value } }; set('content.values', u); }}
                    placeholder="Sustainability" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Textarea label="Açıklama (TR)" rows={2} value={v.description.tr}
                    onChange={(e) => { const u = [...form.content.values]; u[i] = { ...u[i], description: { ...u[i].description, tr: e.target.value } }; set('content.values', u); }}
                    placeholder="Yerel üreticilerden gelen mevsimlik ürünler..." />
                  <Textarea label="Açıklama (EN)" rows={2} value={v.description.en}
                    onChange={(e) => { const u = [...form.content.values]; u[i] = { ...u[i], description: { ...u[i].description, en: e.target.value } }; set('content.values', u); }}
                    placeholder="Seasonal products from local producers..." />
                </div>
              </div>
            ))}
            <button
              onClick={() => set('content.values', [...form.content.values, { icon: '⭐', title: { tr: '', en: '' }, description: { tr: '', en: '' } }])}
              className="text-sm" style={{ color: 'var(--primary)' }}>
              + Kart Ekle
            </button>
          </Section>
        )}

        {/* ── E-POSTA ŞABLONLARI ── */}
        {activeTab === 'email' && (
          <>
            <Section title="Gönderici Ayarları">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Boş bırakılan alanlar firma adı ve iletişim bilgilerinden otomatik alınır.
              </p>
              <Input label="Gönderici Adı (From)" value={form.emailSettings.senderName}
                onChange={(e) => set('emailSettings.senderName', e.target.value)}
                placeholder="Gusto Kartepe" />
              <Input label="Yanıt Adresi (Reply-To)" value={form.emailSettings.replyTo}
                onChange={(e) => set('emailSettings.replyTo', e.target.value)}
                placeholder="info@gustokartepe.com" />
              <Input label="Telefon (e-postada gösterilir)" value={form.emailSettings.phone}
                onChange={(e) => set('emailSettings.phone', e.target.value)}
                placeholder="+90 262 500 12 34" />
              <Input label="Konum (başlık altında)" value={form.emailSettings.location}
                onChange={(e) => set('emailSettings.location', e.target.value)}
                placeholder="Kartepe · Kocaeli" />
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Vurgu Rengi
                </label>
                <div className="flex items-center gap-3">
                  <input type="color" value={form.emailSettings.accentColor}
                    onChange={(e) => set('emailSettings.accentColor', e.target.value)}
                    className="h-10 w-14 rounded border cursor-pointer"
                    style={{ borderColor: 'var(--border)', padding: '2px' }} />
                  <Input value={form.emailSettings.accentColor}
                    onChange={(e) => set('emailSettings.accentColor', e.target.value)}
                    placeholder="#8B1A1A" className="flex-1" />
                </div>
              </div>
              <Textarea label="Footer Alıntısı (e-posta alt kısmı)" value={form.emailSettings.footerQuote}
                onChange={(e) => set('emailSettings.footerQuote', e.target.value)}
                placeholder='"Doğayla iç içe bir sofra deneyimi için sizi bekliyoruz."'
                rows={2} />
            </Section>

            <Section title="✓ Onay E-postası">
              <div className="rounded-lg p-3 mb-2" style={{ background: '#F0FAF4', border: '1px solid #C3E6CB' }}>
                <p className="text-xs font-medium" style={{ color: '#2D6A4F' }}>
                  Rezervasyon "Onaylandı" durumuna geçtiğinde müşteriye gönderilir.
                </p>
              </div>
              <Input label="E-posta Konusu (Subject)" value={form.emailSettings.confirmedSubject}
                onChange={(e) => set('emailSettings.confirmedSubject', e.target.value)}
                placeholder="✓ Rezervasyonunuz Onaylandı — Gusto Kartepe" />
              <Textarea label="Onay Mesajı (hero bölümü altında)" value={form.emailSettings.confirmedMessage}
                onChange={(e) => set('emailSettings.confirmedMessage', e.target.value)}
                placeholder="Sizi aramızda görmekten mutluluk duyacağız. Aşağıda rezervasyon detaylarınızı bulabilirsiniz."
                rows={3} />
            </Section>

            <Section title="✕ Red E-postası">
              <div className="rounded-lg p-3 mb-2" style={{ background: '#FFF8ED', border: '1px solid #E8D5A0' }}>
                <p className="text-xs font-medium" style={{ color: '#8B6914' }}>
                  Rezervasyon "Reddedildi" durumuna geçtiğinde müşteriye gönderilir.
                </p>
              </div>
              <Input label="E-posta Konusu (Subject)" value={form.emailSettings.rejectedSubject}
                onChange={(e) => set('emailSettings.rejectedSubject', e.target.value)}
                placeholder="Rezervasyon Talebiniz Hakkında — Gusto Kartepe" />
              <Textarea label="Red Mesajı (müşteri adından sonra gelir)" value={form.emailSettings.rejectedMessage}
                onChange={(e) => set('emailSettings.rejectedMessage', e.target.value)}
                placeholder="maalesef talep ettiğiniz tarih ve saatte müsait masa bulunamamaktadır."
                rows={3} />
            </Section>
          </>
        )}

        {/* ── SMTP AYARLARI ── */}
        {activeTab === 'smtp' && (
          <>
            <Section title="Giden Mail Sunucusu (SMTP)">
              <div className="rounded-lg p-4 text-sm mb-2" style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
                <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Bu ne işe yarar?</p>
                <p>
                  İletişim formunu dolduran ziyaretçilere otomatik onay maili gönderilir. Burada firmanıza ait kurumsal
                  SMTP bilgilerini girerek maillerinizin kendi adresinizden gitmesini sağlayabilirsiniz.
                </p>
              </div>

              {/* Enable toggle */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setSmtp('enabled', !smtpForm.enabled)}
                  className="relative w-11 h-6 rounded-full transition-colors"
                  style={{ background: smtpForm.enabled ? 'var(--primary)' : 'var(--border)' }}
                >
                  <span
                    className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                    style={{ transform: smtpForm.enabled ? 'translateX(20px)' : 'translateX(0)' }}
                  />
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {smtpForm.enabled ? 'Özel SMTP etkin' : 'Özel SMTP devre dışı'}
                </span>
              </label>

              {smtpForm.enabled && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="SMTP Sunucu (Host)"
                      value={smtpForm.host}
                      onChange={(e) => setSmtp('host', e.target.value)}
                      placeholder="mail.netravox.com"
                    />
                    <Input
                      label="Port"
                      value={smtpForm.port}
                      onChange={(e) => setSmtp('port', e.target.value)}
                      placeholder="587"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={smtpForm.secure}
                      onChange={(e) => setSmtp('secure', e.target.checked)}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: 'var(--primary)' }}
                    />
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      SSL/TLS kullan (port 465 için işaretle)
                    </span>
                  </label>

                  <Input
                    label="Kullanıcı Adı (E-posta Adresi)"
                    value={smtpForm.user}
                    onChange={(e) => setSmtp('user', e.target.value)}
                    placeholder="info@netravox.com"
                  />

                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Şifre
                    </label>
                    <input
                      type="password"
                      value={smtpForm.pass}
                      onChange={(e) => setSmtp('pass', e.target.value)}
                      placeholder={smtpData?.pass === '••••••••' ? 'Kayıtlı şifre mevcut — değiştirmek için girin' : 'Mail hesabı şifresi'}
                      className="w-full rounded-lg px-3.5 py-2.5 border outline-none text-sm"
                      style={{ background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: '16px' }}
                    />
                  </div>

                  <Input
                    label="Gönderici Adı"
                    value={smtpForm.fromName}
                    onChange={(e) => setSmtp('fromName', e.target.value)}
                    placeholder="Netravox"
                  />
                </div>
              )}
            </Section>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => smtpMutation.mutate(smtpForm)}
                disabled={smtpMutation.isPending}
              >
                {smtpMutation.isPending ? 'Kaydediliyor...' : 'SMTP Ayarlarını Kaydet'}
              </Button>
              {smtpForm.enabled && (
                <button
                  onClick={testSmtp}
                  disabled={testingMail}
                  className="px-4 py-2 rounded-lg border text-sm font-medium transition-colors"
                  style={{
                    borderColor: 'var(--border)',
                    color: testingMail ? 'var(--text-muted)' : 'var(--text-primary)',
                    background: 'var(--bg-surface)',
                  }}
                >
                  {testingMail ? 'Gönderiliyor...' : '✉ Test Maili Gönder'}
                </button>
              )}
            </div>
          </>
        )}

        {/* ── SOSYAL & DİĞER ── */}
        {activeTab === 'sosyal' && (
          <Section title="Sosyal Medya">
            <Input label="Instagram" value={form.socialLinks.instagram} onChange={(e) => set('socialLinks.instagram', e.target.value)} placeholder="https://instagram.com/gustokartepe" />
            <Input label="Facebook" value={form.socialLinks.facebook} onChange={(e) => set('socialLinks.facebook', e.target.value)} placeholder="https://facebook.com/gustokartepe" />
            <Input label="Twitter / X" value={form.socialLinks.twitter} onChange={(e) => set('socialLinks.twitter', e.target.value)} placeholder="https://twitter.com/gustokartepe" />
            <Input label="YouTube" value={form.socialLinks.youtube} onChange={(e) => set('socialLinks.youtube', e.target.value)} placeholder="https://youtube.com/@gustokartepe" />
            <Input label="TikTok" value={form.socialLinks.tiktok} onChange={(e) => set('socialLinks.tiktok', e.target.value)} placeholder="https://tiktok.com/@gustokartepe" />
          </Section>
        )}

        {/* ── ENTEGRASYONLAR ── */}
        {activeTab === 'entegrasyon' && (
          <>
            <Section title="Google Analytics 4">
              <div className="rounded-lg p-4 text-sm mb-2" style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
                <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Nasıl bulunur?</p>
                <p>GA4 → Yönetici → Mülk Ayarları → <strong>Mülk Kimliği</strong> (sadece sayısal kısım, örn: <code>323456789</code>)</p>
                <p className="mt-1">Servis hesabı e-postasını da GA4 mülkünüze <strong>Görüntüleyici</strong> olarak eklemeniz gerekir.</p>
              </div>
              <Input
                label="GA4 Mülk Kimliği (Property ID)"
                value={form.integrations.analyticsPropertyId}
                onChange={(e) => set('integrations.analyticsPropertyId', e.target.value.replace(/\D/g, ''))}
                placeholder="323456789"
              />
            </Section>

            {user?.isSuperAdmin && (
              <Section title="🔒 Firma Özellikleri (Netravox Yönetimi)">
                <div className="rounded-lg p-4 text-sm mb-4" style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
                  Bu özellikler yalnızca Netravox Super Admin tarafından açılıp kapatılabilir.
                </div>

                <div className="space-y-4">
                  <FeatureToggle
                    icon="✨"
                    label="AI Blog Üretimi"
                    description={'Blog editöründe "AI ile Üret" butonu görünür. OpenAI API key sunucuda tanımlı olmalıdır.'}
                    enabled={form.features?.aiContent}
                    onToggle={() => set('features.aiContent', !form.features?.aiContent)}
                  />
                  <FeatureToggle
                    icon="💬"
                    label="WhatsApp Butonu"
                    description="Firma sitesinde sağ alt köşede WhatsApp iletişim balonu görünür. İletişim > WhatsApp numarası dolu olmalıdır."
                    enabled={form.features?.whatsapp}
                    onToggle={() => set('features.whatsapp', !form.features?.whatsapp)}
                  />
                </div>

                <div className="pt-2">
                  <Button
                    onClick={() => featuresMutation.mutate({ aiContent: form.features?.aiContent, whatsapp: form.features?.whatsapp })}
                    loading={featuresMutation.isPending}
                  >
                    Özellikleri Kaydet
                  </Button>
                </div>
              </Section>
            )}
          </>
        )}

        {activeTab === 'moduller' && (user?.isSuperAdmin || user?.isAgencyUser) && (
          <ModulesTab activeTenantId={activeTenantId} />
        )}
      </div>
    </div>
  );
}

function ModulesTab({ activeTenantId }) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: company } = useQuery({
    queryKey: ['company', activeTenantId],
    queryFn: () => api.get(`/companies/${activeTenantId}`).then((r) => r.data),
    enabled: !!activeTenantId,
  });

  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (company) setSelected(company.modules || []);
  }, [company]);

  const save = useMutation({
    mutationFn: (modules) => api.patch(`/companies/${activeTenantId}/modules`, { modules }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company'] });
      toast.success('Modüller kaydedildi');
    },
    onError: () => toast.error('Kaydedilemedi'),
  });

  if (!selected) return <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Yükleniyor...</div>;

  const isAllOpen = selected.length === 0;

  function toggleModule(id) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  }

  return (
    <div className="rounded-xl border p-5 space-y-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Modül Yönetimi</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Bu firmada hangi menü öğelerinin görüneceğini seçin.
          </p>
        </div>
        <Button onClick={() => save.mutate(selected)} loading={save.isPending} size="sm">Kaydet</Button>
      </div>

      <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--bg-muted)' }}>
        <input
          type="checkbox"
          id="all-open"
          checked={isAllOpen}
          onChange={() => setSelected(isAllOpen ? ALL_MODULES.map((m) => m.id) : [])}
          className="w-4 h-4 accent-indigo-600"
        />
        <label htmlFor="all-open" className="text-sm font-medium cursor-pointer" style={{ color: 'var(--text-primary)' }}>
          Tüm modüller açık (varsayılan)
        </label>
      </div>

      {!isAllOpen && (
        <div className="grid grid-cols-2 gap-2">
          {ALL_MODULES.map((m) => (
            <label key={m.id} className="flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer hover:bg-[var(--bg-muted)] transition-colors"
              style={{ borderColor: 'var(--border)' }}>
              <input
                type="checkbox"
                checked={selected.includes(m.id)}
                onChange={() => toggleModule(m.id)}
                className="w-4 h-4 accent-indigo-600"
              />
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{m.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-xl border p-5 space-y-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
      <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      {children}
    </div>
  );
}

function FeatureToggle({ icon, label, description, enabled, onToggle }) {
  return (
    <div className="flex items-start gap-4 py-3 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
      <div
        onClick={onToggle}
        className="relative w-11 h-6 rounded-full flex-shrink-0 cursor-pointer transition-colors mt-0.5"
        style={{ background: enabled ? 'var(--primary)' : 'var(--border)' }}
      >
        <span
          className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
          style={{ transform: enabled ? 'translateX(20px)' : 'translateX(0)' }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {icon} {label}
          <span className="ml-2 text-xs font-normal px-1.5 py-0.5 rounded" style={{ background: enabled ? 'var(--primary)' : 'var(--border)', color: enabled ? '#fff' : 'var(--text-secondary)' }}>
            {enabled ? 'Etkin' : 'Devre dışı'}
          </span>
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{description}</p>
      </div>
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}</label>}
      <textarea
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-lg px-3.5 py-2.5 border outline-none resize-none text-sm"
        style={{ background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: '16px' }}
      />
    </div>
  );
}

function setNestedField(obj, path, value) {
  const keys = path.split('.');
  const result = { ...obj };
  let cur = result;
  for (let i = 0; i < keys.length - 1; i++) {
    cur[keys[i]] = { ...cur[keys[i]] };
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
  return result;
}
