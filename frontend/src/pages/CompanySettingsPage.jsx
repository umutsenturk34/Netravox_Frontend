import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import { Input, Select, ImageUrlInput } from '../components/ui/Input';
import {
  Building2, Phone, Mail, Server,
  Share2, Plug, CreditCard, Layers, RefreshCw,
} from 'lucide-react';

const ALL_MODULES = [
  { id: 'pages',           label: 'Sayfalar' },
  { id: 'media',           label: 'Medya' },
  { id: 'menus',           label: 'Navigasyon' },
  { id: 'restaurant',      label: 'Restoran Menüsü' },
  { id: 'dental',          label: 'Diş Hekimi Hizmetleri' },
  { id: 'services',        label: 'Ürünler & Hizmetler' },
  { id: 'real-estate',     label: 'Emlak İlanları' },
  { id: 'reservations',    label: 'Rezervasyonlar' },
  { id: 'orders',          label: 'Siparişler & Kuponlar' },
  { id: 'customers',       label: 'Müşteriler' },
  { id: 'forms',           label: 'Form Gönderileri' },
  { id: 'notifications',   label: 'Bildirimler' },
  { id: 'blog',            label: 'Blog Yazıları' },
  { id: 'blog-categories', label: 'Blog Kategorileri' },
  { id: 'faqs',            label: 'SSS Yönetimi' },
  { id: 'testimonials',    label: 'Referanslar' },
  { id: 'team',            label: 'Ekip' },
  { id: 'popups',          label: 'Popup & Duyurular' },
  { id: 'meta-leads',      label: 'Meta Lead Ads' },
  { id: 'analytics',       label: 'Analitik (GA4)' },
  { id: 'seo',             label: 'SEO' },
  { id: 'redirects',       label: 'Redirect' },
  { id: 'languages',       label: 'Diller' },
  { id: 'cache',           label: 'Siteyi Güncelle (Cache)' },
  { id: 'settings',        label: 'Firma Ayarları' },
];

const KURUMSAL_SECTORS = [
  { value: 'restaurant',   label: 'Restoran / Kafe' },
  { value: 'dental',       label: 'Diş Kliniği' },
  { value: 'beauty',       label: 'Güzellik Salonu / Kuaför' },
  { value: 'hotel',        label: 'Otel / Pansiyon' },
  { value: 'clinic',       label: 'Klinik (Genel)' },
  { value: 'law',          label: 'Hukuk Bürosu' },
  { value: 'accounting',   label: 'Muhasebe / Mali Müşavirlik' },
  { value: 'architecture', label: 'Mimarlık / İç Mimarlık' },
  { value: 'agency',       label: 'Dijital / Kreatif Ajans' },
  { value: 'education',    label: 'Eğitim / Kurs Merkezi' },
  { value: 'fitness',      label: 'Spor Salonu / Gym' },
  { value: 'real_estate',  label: 'Gayrimenkul' },
  { value: 'service',      label: 'Genel Hizmet' },
  { value: 'other',        label: 'Diğer' },
];

const ETICARET_SECTORS = [
  { value: 'retail',           label: 'Genel Perakende / Giyim' },
  { value: 'fashion',          label: 'Premium Moda' },
  { value: 'food',             label: 'Gıda (Paketli Ürün)' },
  { value: 'cosmetics',        label: 'Kozmetik / Güzellik Ürünleri' },
  { value: 'sports',           label: 'Spor Malzemeleri' },
  { value: 'home_living',      label: 'Ev & Yaşam' },
  { value: 'jewelry',          label: 'Takı & Aksesuar' },
  { value: 'electronics',      label: 'Elektronik / Teknoloji' },
  { value: 'books',            label: 'Kitap & Kırtasiye' },
  { value: 'baby',             label: 'Bebek & Çocuk' },
  { value: 'pet',              label: 'Evcil Hayvan (Pet Shop)' },
  { value: 'automotive',       label: 'Otomotiv Aksesuar' },
  { value: 'toy',              label: 'Oyuncak' },
  { value: 'rent',             label: 'Araç / Ekipman Kiralama' },
  { value: 'restaurant_order', label: 'Restoran (Online Sipariş)' },
];

const TABS = [
  { id: 'genel',        label: 'Genel',               Icon: Building2,  desc: 'Firma adı, sektör, domain, marka renkleri ve dil ayarları.' },
  { id: 'iletisim',     label: 'İletişim',             Icon: Phone,      desc: 'Telefon, e-posta, adres, çalışma saatleri ve Google Maps bağlantısı.' },
  { id: 'email',        label: 'E-posta Şablonları',   Icon: Mail,       desc: 'Rezervasyon onay / red maillerinin içeriği ve gönderici bilgileri.' },
  { id: 'smtp',         label: 'SMTP Ayarları',        Icon: Server,     desc: 'Maillerin firmanın kendi SMTP sunucusundan gönderilmesi için bağlantı bilgileri.', agencyOnly: true },
  { id: 'sosyal',       label: 'Sosyal & Diğer',       Icon: Share2,     desc: 'Instagram, Facebook, Twitter, YouTube ve TikTok bağlantıları.' },
  { id: 'entegrasyon',  label: 'Entegrasyonlar',       Icon: Plug,       desc: 'Google Analytics 4, Meta Lead Ads ve diğer harici servis bağlantıları.' },
  { id: 'odeme',        label: 'Ödeme',                Icon: CreditCard,    desc: 'İyzico API anahtarları, KDV oranı, para birimi ve fatura prefix ayarları.', moduleRequired: 'orders' },
  { id: 'moduller',     label: 'Modüller',             Icon: Layers,        desc: 'Bu firmada görünecek panel modüllerini açıp kapatın.', agencyOnly: true },
];

const defaultContent = {
  // ana sayfa
  heroTitle: { tr: '', en: '' },
  heroImage: '',
  homeHeadline: '',
  homeSubtext: '',
  storyImage: '',
  panoramaImage: '',
  detailImages: ['', '', '', ''],
  homeStats: [{ value: '', label: '' }, { value: '', label: '' }],
  homeStoryCards: [
    { image: '', title: '', description: '', eyebrow: '' },
    { image: '', title: '', description: '', eyebrow: '' },
    { image: '', title: '', description: '', eyebrow: '' },
    { image: '', title: '', description: '', eyebrow: '' },
  ],
  experienceSectionEyebrow: '',
  experienceSectionTitle: '',
  experienceSectionDesc: '',
  ctaTitle: '',
  ctaSubtext: '',
  ctaButton: '',
  homeQuotes: [{ text: '', author: '', role: '' }],
  // hakkimizda
  aboutHeroImage: '',
  aboutSplitImage: '',
  aboutParagraph2: { tr: '', en: '' },
  aboutParagraph3: { tr: '', en: '' },
  aboutImages: ['', '', '', ''],
  aboutQuote: { text: '', author: '' },
  experienceCards: [
    { img: '', title: '', desc: '' },
    { img: '', title: '', desc: '' },
    { img: '', title: '', desc: '' },
  ],
  values: [
    { icon: '🌿', title: { tr: '', en: '' }, description: { tr: '', en: '' } },
    { icon: '🏔', title: { tr: '', en: '' }, description: { tr: '', en: '' } },
    { icon: '👨‍🍳', title: { tr: '', en: '' }, description: { tr: '', en: '' } },
  ],
  // restoran
  testimonial: { quote: { tr: '', en: '' }, author: '', role: '' },
  menuSubtitle: { tr: '', en: '' },
  reservationHeroImage: '',
  reservationHeroTitle: { tr: '', en: '' },
  reservationHeroSubtitle: { tr: '', en: '' },
  reservationSubtitle: { tr: '', en: '' },
  reservationSlots: [],
  gallery: [],
  chefName: '',
  chefPhoto: '',
  chefQuote: { tr: '', en: '' },
  // footer
  footerLinksTitle: '',
  footerContactTitle: '',
  footerHoursTitle: '',
  // iletisim
  instagramPhotos: ['', '', '', ''],
  // managed elsewhere — preserved on save
  tables: [],
};

const DEFAULT_SMTP = { enabled: false, host: '', port: 587, secure: false, user: '', pass: '', fromName: '' };

export default function CompanySettingsPage() {
  const { activeTenantId, user, activeCompany } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('genel');
  const [smtpForm, setSmtpForm] = useState(DEFAULT_SMTP);
  const [testingMail, setTestingMail] = useState(false);
  const [payForm, setPayForm] = useState({ enabled: false, apiKey: '', secretKey: '', sandbox: true, taxRate: 20, currency: 'TRY', invoicePrefix: 'INV' });
  const [testingPay, setTestingPay] = useState(false);
  const [revalidating, setRevalidating] = useState(false);
  const [form, setForm] = useState({
    name: '',
    domain: '',
    subdomain: '',
    companyType: 'kurumsal',
    sector: 'restaurant',
    branding: { primaryColor: '#2563EB', secondaryColor: '#1E40AF', logoLight: '', logoDark: '', favicon: '', heroImage: '' },
    settings: { defaultLanguage: 'tr', supportedLanguages: ['tr'] },
    description: { tr: '', en: '' },
    contact: { phone: '', whatsapp: '', email: '', address: '', city: '', country: 'Türkiye', mapUrl: '', mapEmbedUrl: '' },
    workingHours: [
      { days: 'Pazartesi – Cuma', hours: '08:00 – 22:00' },
      { days: 'Cumartesi – Pazar', hours: '07:30 – 23:00' },
    ],
    socialLinks: { instagram: '', facebook: '', twitter: '', youtube: '', tiktok: '' },
    integrations: { analyticsPropertyId: '', metaPageId: '', metaPageAccessToken: '', metaWebhookVerifyToken: '', metaDatasetId: '' },
    features: { aiContent: false, whatsapp: false, tableCount: 0 },
    emailSettings: {
      senderName: '',
      fromEmail: '',
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
        companyType: company.companyType || 'kurumsal',
        sector: company.sector || 'restaurant',
        branding: {
          primaryColor: company.branding?.primaryColor || '#2563EB',
          secondaryColor: company.branding?.secondaryColor || '#1E40AF',
          logoLight: company.branding?.logoLight || '',
          logoDark: company.branding?.logoDark || '',
          favicon: company.branding?.favicon || '',
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
          mapEmbedUrl: company.contact?.mapEmbedUrl || '',
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
          analyticsPropertyId:    company.integrations?.analyticsPropertyId    || '',
          metaPageId:             company.integrations?.metaPageId             || '',
          metaPageAccessToken:    company.integrations?.metaPageAccessToken     ? '••••••••' : '',
          metaWebhookVerifyToken: company.integrations?.metaWebhookVerifyToken || '',
          metaDatasetId:          company.integrations?.metaDatasetId          || '',
          websiteUrl:             company.integrations?.websiteUrl             || '',
          revalidateSecret:       company.integrations?.revalidateSecret        || '',
        },
        features: {
          aiContent:  company.features?.aiContent  ?? false,
          whatsapp:   company.features?.whatsapp   ?? false,
          tableCount: company.features?.tableCount ?? 0,
        },
        emailSettings: {
          senderName: company.emailSettings?.senderName || '',
          fromEmail: company.emailSettings?.fromEmail || '',
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
          // ana sayfa
          heroTitle:    { tr: c.heroTitle?.tr  || '', en: c.heroTitle?.en  || '' },
          heroImage:    c.heroImage    || '',
          homeHeadline: c.homeHeadline || '',
          homeSubtext:  c.homeSubtext  || '',
          storyImage:   c.storyImage   || '',
          panoramaImage:c.panoramaImage|| '',
          detailImages: (() => { const a = c.detailImages?.length ? [...c.detailImages] : []; while (a.length < 4) a.push(''); return a.slice(0, 4); })(),
          homeStats: c.homeStats?.length
            ? c.homeStats
            : defaultContent.homeStats,
          homeStoryCards: c.homeStoryCards?.length
            ? c.homeStoryCards.map((h) => ({ image: h.image||'', title: h.title||'', description: h.description||'', eyebrow: h.eyebrow||'' }))
            : defaultContent.homeStoryCards,
          experienceSectionEyebrow: c.experienceSectionEyebrow || '',
          experienceSectionTitle:   c.experienceSectionTitle   || '',
          experienceSectionDesc:    c.experienceSectionDesc    || '',
          ctaTitle:   c.ctaTitle   || '',
          ctaSubtext: c.ctaSubtext || '',
          ctaButton:  c.ctaButton  || '',
          homeQuotes: c.homeQuotes?.length
            ? c.homeQuotes.map((q) => ({ text: q.text||'', author: q.author||'', role: q.role||'' }))
            : defaultContent.homeQuotes,
          // hakkimizda
          aboutHeroImage:  c.aboutHeroImage  || '',
          aboutSplitImage: c.aboutSplitImage || '',
          aboutParagraph2: { tr: c.aboutParagraph2?.tr || '', en: c.aboutParagraph2?.en || '' },
          aboutParagraph3: { tr: c.aboutParagraph3?.tr || '', en: c.aboutParagraph3?.en || '' },
          aboutImages: (() => { const a = c.aboutImages?.length ? [...c.aboutImages] : []; while (a.length < 4) a.push(''); return a.slice(0, 4); })(),
          aboutQuote: { text: c.aboutQuote?.text || '', author: c.aboutQuote?.author || '' },
          experienceCards: c.experienceCards?.length
            ? c.experienceCards.map((e) => ({ img: e.img||'', title: e.title||'', desc: e.desc||'' }))
            : defaultContent.experienceCards,
          values: c.values?.length
            ? c.values.map((v) => ({
                icon: v.icon || '🌿',
                title: { tr: v.title?.tr || '', en: v.title?.en || '' },
                description: { tr: v.description?.tr || '', en: v.description?.en || '' },
              }))
            : defaultContent.values,
          // restoran
          testimonial: {
            quote: { tr: c.testimonial?.quote?.tr || '', en: c.testimonial?.quote?.en || '' },
            author: c.testimonial?.author || '',
            role:   c.testimonial?.role   || '',
          },
          menuSubtitle:            { tr: c.menuSubtitle?.tr            || '', en: c.menuSubtitle?.en            || '' },
          reservationHeroImage:    c.reservationHeroImage    || '',
          reservationHeroTitle:    { tr: c.reservationHeroTitle?.tr    || '', en: c.reservationHeroTitle?.en    || '' },
          reservationHeroSubtitle: { tr: c.reservationHeroSubtitle?.tr || '', en: c.reservationHeroSubtitle?.en || '' },
          reservationSubtitle:     { tr: c.reservationSubtitle?.tr     || '', en: c.reservationSubtitle?.en     || '' },
          reservationSlots: c.reservationSlots?.length ? c.reservationSlots : [],
          gallery:   c.gallery   || [],
          chefName:  c.chefName  || '',
          chefPhoto: c.chefPhoto || '',
          chefQuote: { tr: c.chefQuote?.tr || '', en: c.chefQuote?.en || '' },
          // footer
          footerLinksTitle:   c.footerLinksTitle   || '',
          footerContactTitle: c.footerContactTitle || '',
          footerHoursTitle:   c.footerHoursTitle   || '',
          // iletisim
          instagramPhotos: (() => { const a = c.instagramPhotos?.length ? [...c.instagramPhotos] : []; while (a.length < 4) a.push(''); return a.slice(0, 4); })(),
          // preserved on save — not edited here
          tables: c.tables || [],
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

  const { data: payData } = useQuery({
    queryKey: ['company-payment', activeTenantId],
    queryFn: () => api.get(`/companies/${activeTenantId}/payment`).then((r) => r.data),
    enabled: !!activeTenantId && activeTab === 'odeme',
  });

  useEffect(() => {
    if (payData) {
      setPayForm({
        enabled:       payData.iyzico?.enabled   ?? false,
        apiKey:        payData.iyzico?.apiKey    || '',
        secretKey:     payData.iyzico?.secretKey || '',
        sandbox:       payData.iyzico?.sandbox   ?? true,
        taxRate:       payData.taxRate            ?? 20,
        currency:      payData.currency           || 'TRY',
        invoicePrefix: payData.invoicePrefix      || 'INV',
      });
    }
  }, [payData]);

  useEffect(() => { if (smtpData) setSmtpForm({ ...DEFAULT_SMTP, ...smtpData }); }, [smtpData]);


  const integrationsMutation = useMutation({
    mutationFn: (data) => api.patch(`/companies/${activeTenantId}/integrations`, data).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['company'] }); toast.success('Entegrasyon ayarları kaydedildi'); },
    onError: () => toast.error('Kaydedilemedi'),
  });

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

  const payMutation = useMutation({
    mutationFn: () => api.patch(`/companies/${activeTenantId}/payment`, {
      iyzico: { enabled: payForm.enabled, apiKey: payForm.apiKey, secretKey: payForm.secretKey, sandbox: payForm.sandbox },
      taxRate: payForm.taxRate,
      currency: payForm.currency,
      invoicePrefix: payForm.invoicePrefix,
    }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company-payment', activeTenantId] });
      toast.success('Ödeme ayarları kaydedildi');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Kaydedilemedi'),
  });


  async function testPayConnection() {
    setTestingPay(true);
    try {
      await api.post(`/companies/${activeTenantId}/payment/test`);
      toast.success('İyzico bağlantısı başarılı!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bağlantı başarısız — API Key / Secret Key kontrol edin');
    } finally {
      setTestingPay(false);
    }
  }

  async function revalidateWebsite() {
    if (!activeCompany?._id) return;
    setRevalidating(true);
    try {
      await api.post(`/companies/${activeCompany._id}/revalidate-website`);
      toast.success('Web sitesi önbelleği temizlendi — değişiklikler yayına alındı');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Web sitesine ulaşılamadı — site URL ve secret kontrol edin');
    } finally {
      setRevalidating(false);
    }
  }

  const setPay = (key, value) => setPayForm((p) => ({ ...p, [key]: value }));

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

      {/* Tab bar — segmented control */}
      <div className="flex flex-wrap gap-1.5 p-1.5 rounded-2xl mb-6 w-fit"
        style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)' }}>
        {TABS.filter((t) =>
          (!t.agencyOnly || user?.isSuperAdmin || user?.isAgencyUser) &&
          (!t.moduleRequired || company?.modules?.includes('*') || company?.modules?.includes(t.moduleRequired))
        ).map((t) => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap"
              style={{
                background: active ? 'var(--bg-surface)' : 'transparent',
                color: active ? '#6366f1' : 'var(--text-secondary)',
                boxShadow: active
                  ? '0 1px 4px rgba(0,0,0,0.08), 0 0 0 1px rgba(99,102,241,0.15)'
                  : 'none',
              }}
            >
              <t.Icon size={14} strokeWidth={active ? 2.5 : 1.8} />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="flex gap-8 items-start">
        {/* ── Sol: form içeriği ── */}
        <div className="flex-1 min-w-0 space-y-6">
        {/* ── GENEL ── */}
        {activeTab === 'genel' && (
          <>
            <Section title="Genel Bilgiler">
              <Input label="Firma Adı" value={form.name} onChange={(e) => set('name', e.target.value)} />
              <Select
                label="Firma Tipi"
                value={form.companyType}
                onChange={(e) => {
                  const t = e.target.value;
                  const defaultSector = t === 'eticaret' ? 'retail' : 'restaurant';
                  set('companyType', t);
                  set('sector', defaultSector);
                }}
              >
                <option value="kurumsal">🏢 Kurumsal (tanıtım / hizmet sitesi)</option>
                <option value="eticaret">🛒 E-Ticaret (ürün satışı / kiralama)</option>
              </Select>
              <Select label="Sektör" value={form.sector} onChange={(e) => set('sector', e.target.value)}>
                {(form.companyType === 'eticaret' ? ETICARET_SECTORS : KURUMSAL_SECTORS).map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </Select>
              <Input label="Domain (örn: firmaniz.com.tr)" value={form.domain} onChange={(e) => set('domain', e.target.value)} placeholder="firmaniz.com.tr" />
              <Input label="Subdomain (örn: firmaadi)" value={form.subdomain} onChange={(e) => set('subdomain', e.target.value)} placeholder="firmaadi" />
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
              <ImageUrlInput label="Favicon URL" value={form.branding.favicon} onChange={(e) => set('branding.favicon', e.target.value)} hint=".ico, .png veya .svg — 32×32px önerilir" />
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

            <Section title="Footer Bölüm Başlıkları">
              <div className="rounded-lg p-3 text-xs mb-2" style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
                Boş bırakırsan varsayılan başlıklar kullanılır (Hızlı Bağlantılar / İletişim / Çalışma Saatleri).
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input label="Bağlantılar Başlığı" value={form.content.footerLinksTitle}
                  onChange={(e) => set('content.footerLinksTitle', e.target.value)}
                  placeholder="Hızlı Bağlantılar" />
                <Input label="İletişim Başlığı" value={form.content.footerContactTitle}
                  onChange={(e) => set('content.footerContactTitle', e.target.value)}
                  placeholder="İletişim" />
                <Input label="Saatler Başlığı" value={form.content.footerHoursTitle}
                  onChange={(e) => set('content.footerHoursTitle', e.target.value)}
                  placeholder="Çalışma Saatleri" />
              </div>
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
              <Input label="Google Maps Bağlantısı" value={form.contact.mapUrl} onChange={(e) => set('contact.mapUrl', e.target.value)} placeholder="https://maps.google.com/..." />
              <Input label="Google Maps Embed URL (iframe)" value={form.contact.mapEmbedUrl} onChange={(e) => set('contact.mapEmbedUrl', e.target.value)} placeholder="https://www.google.com/maps/embed?pb=..." hint="Haritayı web sitesine gömmek için Google Maps → Paylaş → Haritayı göm → src değeri" />
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



        {/* ── E-POSTA ŞABLONLARI ── */}
        {activeTab === 'email' && (
          <>
            <Section title="Gönderici Ayarları">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Boş bırakılan alanlar firma adı ve iletişim bilgilerinden otomatik alınır.
              </p>
              <Input label="Gönderici Adı (From)" value={form.emailSettings.senderName}
                onChange={(e) => set('emailSettings.senderName', e.target.value)}
                placeholder="Firma Adı" />
              <Input label="Gönderici E-postası (FROM adresi)" value={form.emailSettings.fromEmail}
                onChange={(e) => set('emailSettings.fromEmail', e.target.value)}
                placeholder="info@firmaniz.com"
                hint={'İletişim formu onay maillerinde gönderici adresi. Brevo\'da netravox.com doğrulandığından @netravox.com uzantılı adresler direkt çalışır; başka domain için SMTP Ayarları sekmesini kullanın.'} />
              <Input label="Yanıt Adresi (Reply-To)" value={form.emailSettings.replyTo}
                onChange={(e) => set('emailSettings.replyTo', e.target.value)}
                placeholder="info@firmaniz.com" />
              <Input label="Telefon (e-postada gösterilir)" value={form.emailSettings.phone}
                onChange={(e) => set('emailSettings.phone', e.target.value)}
                placeholder="+90 212 000 00 00" />
              <Input label="Konum (başlık altında)" value={form.emailSettings.location}
                onChange={(e) => set('emailSettings.location', e.target.value)}
                placeholder="İstanbul · Türkiye" />
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
                placeholder='"Müşterilerimize en iyi hizmeti sunmak için buradayız."'
                rows={2} />
            </Section>

            {['restaurant', 'clinic', 'beauty'].includes(form.sector) && (
              <>
                <Section title="✓ Onay E-postası">
                  <div className="rounded-lg p-3 mb-2" style={{ background: '#F0FAF4', border: '1px solid #C3E6CB' }}>
                    <p className="text-xs font-medium" style={{ color: '#2D6A4F' }}>
                      Rezervasyon "Onaylandı" durumuna geçtiğinde müşteriye gönderilir.
                    </p>
                  </div>
                  <Input label="E-posta Konusu (Subject)" value={form.emailSettings.confirmedSubject}
                    onChange={(e) => set('emailSettings.confirmedSubject', e.target.value)}
                    placeholder="✓ Rezervasyonunuz Onaylandı" />
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
                    placeholder="Rezervasyon Talebiniz Hakkında" />
                  <Textarea label="Red Mesajı (müşteri adından sonra gelir)" value={form.emailSettings.rejectedMessage}
                    onChange={(e) => set('emailSettings.rejectedMessage', e.target.value)}
                    placeholder="maalesef talep ettiğiniz tarih ve saatte müsaitlik bulunamamaktadır."
                    rows={3} />
                </Section>
              </>
            )}
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

        {/* ── REZERVASYON ── */}
        {activeTab === 'reservations' && (
          <>
            <Section title="Rezervasyon Hero Banner">
              <ImageUrlInput
                label="Banner Görseli"
                value={form.content.reservationHeroImage}
                onChange={(e) => set('content.reservationHeroImage', e.target.value)}
                hint="1920×1080px — yatay, restoran atmosfer görseli"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Başlık (TR)" value={form.content.reservationHeroTitle.tr}
                  onChange={(e) => set('content.reservationHeroTitle.tr', e.target.value)}
                  placeholder="Rezervasyon" />
                <Input label="Başlık (EN)" value={form.content.reservationHeroTitle.en}
                  onChange={(e) => set('content.reservationHeroTitle.en', e.target.value)}
                  placeholder="Reservation" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Alt Metin (TR)" value={form.content.reservationHeroSubtitle.tr}
                  onChange={(e) => set('content.reservationHeroSubtitle.tr', e.target.value)}
                  placeholder="Doğanın içinde özel masanızı ayırtın..." />
                <Input label="Alt Metin (EN)" value={form.content.reservationHeroSubtitle.en}
                  onChange={(e) => set('content.reservationHeroSubtitle.en', e.target.value)}
                  placeholder="Reserve your special table in nature..." />
              </div>
            </Section>
          </>
        )}

        {/* ── SOSYAL & DİĞER ── */}
        {activeTab === 'sosyal' && (
          <Section title="Sosyal Medya">
            <Input label="Instagram" value={form.socialLinks.instagram} onChange={(e) => set('socialLinks.instagram', e.target.value)} placeholder="https://instagram.com/firmaadi" />
            <Input label="Facebook" value={form.socialLinks.facebook} onChange={(e) => set('socialLinks.facebook', e.target.value)} placeholder="https://facebook.com/firmaadi" />
            <Input label="Twitter / X" value={form.socialLinks.twitter} onChange={(e) => set('socialLinks.twitter', e.target.value)} placeholder="https://twitter.com/firmaadi" />
            <Input label="YouTube" value={form.socialLinks.youtube} onChange={(e) => set('socialLinks.youtube', e.target.value)} placeholder="https://youtube.com/@firmaadi" />
            <Input label="TikTok" value={form.socialLinks.tiktok} onChange={(e) => set('socialLinks.tiktok', e.target.value)} placeholder="https://tiktok.com/@firmaadi" />
          </Section>
        )}

        {/* ── ENTEGRASYONLAR ── */}
        {activeTab === 'entegrasyon' && (
          <>
            {/* ── Google Analytics 4 + Meta Lead Ads ── */}
            <Section title="Google Analytics 4">
              <div className="rounded-lg p-4 text-sm mb-4" style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
                GA4 Mülk Kimliğini (Property ID) girin. GA4 Admin → Mülk Bilgileri sayfasında bulunur (örn: 323456789).
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>GA4 Property ID</label>
                  <input
                    type="text"
                    value={form.integrations?.analyticsPropertyId || ''}
                    onChange={(e) => set('integrations.analyticsPropertyId', e.target.value)}
                    placeholder="323456789"
                    className="w-full max-w-sm rounded-lg px-3 py-2 text-sm border outline-none focus:ring-2 focus:ring-blue-500/20"
                    style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: '16px' }}
                  />
                </div>
              </div>
            </Section>

            <Section title="Meta Lead Ads">
              <div className="rounded-lg p-4 text-sm mb-4" style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
                <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Nasıl kurulur?</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Meta for Developers → Uygulamanıza <strong>Leadgen</strong> webhook aboneliği ekleyin</li>
                  <li>Callback URL: <code className="bg-black/10 px-1 rounded">https://ALAN_ADINIZ/api/meta-leads/webhook</code></li>
                  <li>Verify Token olarak aşağıdaki değeri girin</li>
                  <li>Page ID ve Page Access Token bilgilerini ekleyin</li>
                </ol>
              </div>
              <div className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Facebook Sayfa ID (Page ID)</label>
                  <input
                    type="text"
                    value={form.integrations?.metaPageId || ''}
                    onChange={(e) => set('integrations.metaPageId', e.target.value)}
                    placeholder="123456789012345"
                    className="w-full rounded-lg px-3 py-2 text-sm border outline-none focus:ring-2 focus:ring-blue-500/20"
                    style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: '16px' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Page Access Token</label>
                  <input
                    type="password"
                    value={form.integrations?.metaPageAccessToken || ''}
                    onChange={(e) => set('integrations.metaPageAccessToken', e.target.value)}
                    placeholder="EAAxxxxx..."
                    autoComplete="new-password"
                    className="w-full rounded-lg px-3 py-2 text-sm border outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                    style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: '16px' }}
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Meta for Developers → Erişim Jetonları bölümünden alınır. Uzun ömürlü (Long-lived) token önerilir.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Webhook Doğrulama Jetonu (Verify Token)</label>
                  <input
                    type="text"
                    value={form.integrations?.metaWebhookVerifyToken || ''}
                    onChange={(e) => set('integrations.metaWebhookVerifyToken', e.target.value)}
                    placeholder="Rastgele bir şifre belirleyin (örn: netlead_abc123)"
                    className="w-full rounded-lg px-3 py-2 text-sm border outline-none focus:ring-2 focus:ring-blue-500/20"
                    style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: '16px' }}
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Meta webhook kurulumunda bu değeri Verify Token olarak girin.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Dataset ID (Pixel ID) — Dönüşüm Optimizasyonu
                  </label>
                  <input
                    type="text"
                    value={form.integrations?.metaDatasetId || ''}
                    onChange={(e) => set('integrations.metaDatasetId', e.target.value)}
                    placeholder="1955285295096775"
                    className="w-full rounded-lg px-3 py-2 text-sm border outline-none focus:ring-2 focus:ring-blue-500/20"
                    style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: '16px' }}
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Meta Events Manager → Veri Setleri bölümünden alınır. Leadler "İletişim Kuruldu" yapıldığında Meta'ya dönüşüm sinyali gönderilir.
                  </p>
                </div>
              </div>
            </Section>

            <Section title="Web Sitesi Bağlantısı">
              <div className="space-y-4 mb-5">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Web Sitesi URL
                  </label>
                  <input
                    type="text"
                    value={form.integrations?.websiteUrl || ''}
                    onChange={(e) => set('integrations.websiteUrl', e.target.value)}
                    placeholder="https://www.gustokartepe.com"
                    className="w-full rounded-lg px-3 py-2 text-sm border outline-none focus:ring-2 focus:ring-blue-500/20"
                    style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: '16px' }}
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Lokal test için <code>http://localhost:3006</code>, production için canlı domain.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Revalidate / Önizleme Secret
                  </label>
                  <input
                    type="text"
                    value={form.integrations?.revalidateSecret || ''}
                    onChange={(e) => set('integrations.revalidateSecret', e.target.value)}
                    placeholder="gusto-revalidate-2026"
                    className="w-full rounded-lg px-3 py-2 text-sm border outline-none focus:ring-2 focus:ring-blue-500/20"
                    style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: '16px' }}
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Storefront'un <code>.env</code> dosyasındaki <code>REVALIDATE_SECRET</code> değeriyle aynı olmalı.
                  </p>
                </div>
              </div>
              <div className="rounded-lg p-4 text-sm mb-5" style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
                Panel'den içerik güncellediğinizde "Siteyi Güncelle" butonuna basarak önbelleği temizleyin. Değişiklikler birkaç saniye içinde web sitesine yansır.
              </div>
              <button
                onClick={revalidateWebsite}
                disabled={revalidating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-60"
                style={{ background: '#10b981', color: '#fff' }}
              >
                <RefreshCw size={14} className={revalidating ? 'animate-spin' : ''} />
                {revalidating ? 'Güncelleniyor...' : 'Siteyi Güncelle'}
              </button>
            </Section>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => integrationsMutation.mutate({
                  analyticsPropertyId:    form.integrations?.analyticsPropertyId    || '',
                  metaPageId:             form.integrations?.metaPageId             || '',
                  metaPageAccessToken:    form.integrations?.metaPageAccessToken    || '',
                  metaWebhookVerifyToken: form.integrations?.metaWebhookVerifyToken || '',
                  metaDatasetId:          form.integrations?.metaDatasetId          || '',
                  websiteUrl:             form.integrations?.websiteUrl             || '',
                  revalidateSecret:       form.integrations?.revalidateSecret       || '',
                })}
                disabled={integrationsMutation.isPending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-60 text-white"
                style={{ background: '#2563EB' }}
              >
                {integrationsMutation.isPending ? 'Kaydediliyor...' : 'Entegrasyon Ayarlarını Kaydet'}
              </button>
            </div>

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

        {/* ── ÖDEME ── */}
        {activeTab === 'odeme' && (() => {
          const MASKED    = '••••••••';
          const KEY_RE    = /^[a-zA-Z0-9\-]{20,}$/;
          const PREFIX_RE = /^[A-Z]{2,6}$/;
          const errs = {};
          if (payForm.apiKey && payForm.apiKey !== MASKED && !KEY_RE.test(payForm.apiKey))
            errs.apiKey = 'En az 20 karakter, yalnızca harf · rakam · tire (-)';
          if (payForm.secretKey && payForm.secretKey !== MASKED && !KEY_RE.test(payForm.secretKey))
            errs.secretKey = 'En az 20 karakter, yalnızca harf · rakam · tire (-)';
          const tax = Number(payForm.taxRate);
          if (isNaN(tax) || tax < 0 || tax > 100 || !Number.isInteger(tax))
            errs.taxRate = '0–100 arasında tam sayı (örn: 20)';
          if (!PREFIX_RE.test(payForm.invoicePrefix))
            errs.invoicePrefix = '2–6 büyük İngilizce harf (örn: INV, FAT, ORD)';
          const hasErrors = Object.values(errs).some(Boolean);
          const canSave   = !hasErrors && (!payForm.enabled || (payForm.apiKey && payForm.secretKey));
          const canTest   = !errs.apiKey && payForm.apiKey && payForm.apiKey !== MASKED;
          return (
            <>
              <Section title="İyzico Ödeme Sistemi">
                <div className="rounded-lg p-4 text-sm mb-2" style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
                  <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Nasıl çalışır?</p>
                  <p>
                    Kendi iyzico merchant hesabınızı <strong>merchant.iyzipay.com</strong> adresinden açın.
                    Onay sonrası API Key ve Secret Key bilgilerini aşağıya girin.
                    Sandbox (test) modunda deneyin, sonra canlıya geçin.
                  </p>
                </div>

                <div className="flex items-center justify-between rounded-xl p-4"
                  style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)' }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>İyzico Online Ödeme</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Müşterileriniz web sitenizden kart ile ödeme yapabilir</p>
                  </div>
                  <button type="button" onClick={() => setPay('enabled', !payForm.enabled)}
                    className="relative w-12 h-6 rounded-full transition-colors"
                    style={{ background: payForm.enabled ? '#6366f1' : 'var(--border)' }}>
                    <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                      style={{ transform: payForm.enabled ? 'translateX(24px)' : 'translateX(0)' }} />
                  </button>
                </div>

                <Input
                  label="İyzico API Key"
                  value={payForm.apiKey}
                  onChange={(e) => setPay('apiKey', e.target.value.trim())}
                  placeholder="sandbox-AbCdEfGhIjKlMnOpQrSt"
                  error={errs.apiKey}
                />
                <Input
                  label="İyzico Secret Key"
                  type="password"
                  value={payForm.secretKey}
                  onChange={(e) => setPay('secretKey', e.target.value.trim())}
                  placeholder="••••••••"
                  error={errs.secretKey}
                />

                <div className="flex items-center justify-between rounded-xl p-4"
                  style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Test Modu (Sandbox)</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Kapalıysa gerçek ödemeler alınır — canlıya geçince kapatın
                    </p>
                  </div>
                  <button type="button" onClick={() => setPay('sandbox', !payForm.sandbox)}
                    className="relative w-12 h-6 rounded-full transition-colors"
                    style={{ background: payForm.sandbox ? '#f59e0b' : '#22c55e' }}>
                    <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                      style={{ transform: payForm.sandbox ? 'translateX(24px)' : 'translateX(0)' }} />
                  </button>
                </div>
              </Section>

              <Section title="Fatura & Ödeme Ayarları">
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="KDV Oranı (%)"
                    type="number"
                    min={0} max={100}
                    value={payForm.taxRate}
                    onChange={(e) => setPay('taxRate', e.target.value === '' ? '' : Number(e.target.value))}
                    error={errs.taxRate}
                  />
                  <Select
                    label="Para Birimi"
                    value={payForm.currency}
                    onChange={(e) => setPay('currency', e.target.value)}
                  >
                    <option value="TRY">TRY — Türk Lirası</option>
                    <option value="USD">USD — Dolar</option>
                    <option value="EUR">EUR — Euro</option>
                  </Select>
                  <Input
                    label="Fatura Prefix"
                    value={payForm.invoicePrefix}
                    onChange={(e) => setPay('invoicePrefix', e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6))}
                    placeholder="INV"
                    error={errs.invoicePrefix}
                  />
                </div>
              </Section>

              <div className="flex gap-3">
                <Button variant="secondary" onClick={testPayConnection}
                  disabled={testingPay || !canTest}>
                  {testingPay ? 'Test ediliyor...' : 'Bağlantıyı Test Et'}
                </Button>
                <Button onClick={() => payMutation.mutate()}
                  loading={payMutation.isPending}
                  disabled={payMutation.isPending || !canSave}>
                  Kaydet
                </Button>
              </div>
            </>
          );
        })()}

        {activeTab === 'moduller' && (user?.isSuperAdmin || user?.isAgencyUser) && (
          <ModulesTab activeTenantId={activeTenantId} />
        )}
        </div>{/* flex-1 form */}

        {/* ── Sağ: bölüm bilgi kartı ── */}
        <SectionInfo tabs={TABS} activeTab={activeTab} />
      </div>{/* flex gap-8 */}
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

function SectionInfo({ tabs, activeTab }) {
  const tab = tabs.find((t) => t.id === activeTab);
  if (!tab) return <div className="w-52 shrink-0" />;
  const { Icon, label, desc } = tab;
  return (
    <div className="w-52 shrink-0 sticky top-6 space-y-3">
      {/* Bölüm kartı */}
      <div className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        {/* Gradient header */}
        <div className="px-5 pt-5 pb-4"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.06) 100%)' }}>
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-3"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
            }}>
            <Icon size={20} style={{ color: '#fff' }} strokeWidth={2} />
          </div>
          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{label}</p>
        </div>
        <div className="px-5 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{desc}</p>
        </div>
      </div>

      {/* Kaydet hatırlatma */}
      <div className="rounded-2xl px-4 py-3.5 flex items-start gap-3"
        style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.18)' }}>
        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: '#6366f1' }}>
          <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>!</span>
        </div>
        <div>
          <p className="text-xs font-semibold mb-0.5" style={{ color: '#6366f1' }}>Kaydetmeyi unutma</p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Değişiklikler sağ üstteki <strong>Kaydet</strong> butonuyla kaydedilir.
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
      <div className="px-5 py-4 border-b"
        style={{
          borderColor: 'var(--border)',
          background: 'linear-gradient(to right, rgba(99,102,241,0.04), transparent)',
        }}>
        <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      </div>
      <div className="p-5 space-y-4">
        {children}
      </div>
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
