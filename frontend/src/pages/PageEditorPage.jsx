import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, Trash2, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import { Input, Select, Textarea, ImageUrlInput } from '../components/ui/Input';
import BlockEditor from '../components/ui/BlockEditor';

const TEMPLATES = [
  { value: 'home',        label: 'Ana Sayfa' },
  { value: 'about',       label: 'Hakkımızda' },
  { value: 'menu',        label: 'Menü' },
  { value: 'gallery',     label: 'Galeri' },
  { value: 'contact',     label: 'İletişim' },
  { value: 'reservation', label: 'Rezervasyon' },
  { value: 'generic',     label: 'Genel' },
  { value: 'legal',       label: 'Yasal' },
];

const STATUSES = [
  { value: 'draft',     label: 'Taslak' },
  { value: 'published', label: 'Yayında' },
  { value: 'archived',  label: 'Arşiv' },
];

const MANAGED_ELSEWHERE = {
  menu:        'Restoran Menüsü ekranından yönetilir.',
  gallery:     'Galeri ekranından yönetilir.',
  reservation: 'Rezervasyon ekranından yönetilir.',
};

const emptyFaq = () => ({ question: '', answer: '' });

const empty = {
  title:    { tr: '', en: '' },
  slug:     { tr: '', en: '' },
  template: 'generic',
  status:   'draft',
  seo:      { title: { tr: '', en: '' }, description: { tr: '', en: '' }, canonical: '', robots: 'index,follow', ogImage: '', schemaType: '', schema: null },
  content:  {},
  blocks:   [],
};

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// JSON-LD FAQ schema üret
function buildFaqSchema(faqItems) {
  if (!faqItems?.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}


/* --- SSS (FAQ) Yönetimi --- */
function FaqManager({ content, onChange, lang }) {
  const c = content || {};
  const faqKey = `faq_${lang}`;
  const items = c[faqKey] || [];

  const updateItems = (newItems) => onChange({ ...c, [faqKey]: newItems });

  const add = () => updateItems([...items, emptyFaq()]);

  const update = (i, field, val) => {
    const next = items.map((item, idx) => idx === i ? { ...item, [field]: val } : item);
    updateItems(next);
  };

  const remove = (i) => updateItems(items.filter((_, idx) => idx !== i));

  const move = (i, dir) => {
    const next = [...items];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    updateItems(next);
  };

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border p-4 space-y-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Soru {i + 1}</span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="w-6 h-6 rounded flex items-center justify-center hover:bg-[var(--bg-surface)] disabled:opacity-30">
                <ChevronUp size={13} style={{ color: 'var(--text-muted)' }} />
              </button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} className="w-6 h-6 rounded flex items-center justify-center hover:bg-[var(--bg-surface)] disabled:opacity-30">
                <ChevronDown size={13} style={{ color: 'var(--text-muted)' }} />
              </button>
              <button type="button" onClick={() => remove(i)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950/30">
                <Trash2 size={13} className="text-red-500" />
              </button>
            </div>
          </div>
          <Input
            label="Soru"
            value={item.question}
            onChange={(e) => update(i, 'question', e.target.value)}
            placeholder="Kullanıcıların sıkça sorduğu soru..."
          />
          <Textarea
            label="Cevap"
            rows={3}
            value={item.answer}
            onChange={(e) => update(i, 'answer', e.target.value)}
            placeholder="Sorunun cevabı..."
          />
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-dashed transition-colors hover:bg-[var(--bg-muted)]"
        style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
      >
        <PlusCircle size={15} />
        Soru / Cevap Ekle
      </button>
      {items.length > 0 && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {items.length} soru eklendi — kaydedince JSON-LD FAQPage schema otomatik oluşturulur.
        </p>
      )}
    </div>
  );
}

/* --- Ana bileşen --- */
export default function PageEditorPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { activeCompany } = useAuth();

  const [form, setForm] = useState(empty);
  const [activeTab, setActiveTab] = useState('temel');

  const { data: existing, isLoading } = useQuery({
    queryKey: ['pages', id],
    queryFn: () => api.get(`/pages/${id}`).then((r) => r.data),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        title:   existing.title   || { tr: '', en: '' },
        slug:    existing.slug    || { tr: '', en: '' },
        template: existing.template || 'generic',
        status:  existing.status  || 'draft',
        seo:     {
          title:       existing.seo?.title       || { tr: '', en: '' },
          description: existing.seo?.description || { tr: '', en: '' },
          canonical:   existing.seo?.canonical   || '',
          robots:      existing.seo?.robots      || 'index,follow',
          ogImage:     existing.seo?.ogImage     || '',
          schemaType:  existing.seo?.schemaType  || '',
          schema:      existing.seo?.schema      || null,
        },
        content: existing.content || {},
        blocks:  existing.blocks  || [],
      });
    }
  }, [existing]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      // Aktif dil FAQ'sını schema olarak kullan (TR öncelikli)
      const faqTr = (data.content?.faq_tr || []).filter((f) => f.question && f.answer);
      const faqEn = (data.content?.faq_en || []).filter((f) => f.question && f.answer);
      const faqForSchema = faqTr.length ? faqTr : faqEn;

      const isFaqSchema = data.seo?.schemaType === 'FAQPage' || (!data.seo?.schemaType && faqForSchema.length > 0);
      const payload = {
        ...data,
        seo: {
          ...data.seo,
          schema: isFaqSchema && faqForSchema.length ? buildFaqSchema(faqForSchema) : null,
        },
      };

      return isEdit
        ? api.patch(`/pages/${id}`, payload).then((r) => r.data)
        : api.post('/pages', payload).then((r) => r.data);
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      toast.success(isEdit ? 'Sayfa güncellendi' : 'Sayfa oluşturuldu');
      if (!isEdit) navigate(`/pages/${saved._id}/edit`);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Kaydedilemedi'),
  });

  const set = (path, value) => {
    setForm((prev) => {
      const next = { ...prev };
      const keys = path.split('.');
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) {
        cur[keys[i]] = { ...cur[keys[i]] };
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const handleTitleChange = (lang, val) => {
    set(`title.${lang}`, val);
    if (!isEdit) set(`slug.${lang}`, slugify(val));
  };

  const handlePreview = async () => {
    if (!activeCompany?._id) return toast.error('Firma seçilmedi');
    const slug = form.slug?.tr || '/';
    try {
      const { data } = await api.get(`/companies/${activeCompany._id}/preview-url?slug=${encodeURIComponent(slug)}`);
      window.open(data.url, '_blank');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Önizleme URL\'si alınamadı');
    }
  };

  if (isLoading) return (
    <div className="py-16 text-center" style={{ color: 'var(--text-muted)' }}>Yükleniyor...</div>
  );

  const tabs = [
    { id: 'temel',  label: 'Temel' },
    { id: 'blocks', label: 'İçerik' },
    { id: 'faq',    label: 'SSS / FAQ' },
    { id: 'seo',    label: 'SEO' },
  ];

  return (
    <div className="max-w-3xl pb-16">
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => navigate('/pages')}
            className="text-sm mb-1 hover:underline"
            style={{ color: 'var(--text-muted)' }}
          >
            ← Sayfalar
          </button>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {isEdit ? 'Sayfa Düzenle' : 'Yeni Sayfa'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {isEdit && (
            <button
              type="button"
              onClick={handlePreview}
              className="flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--bg-muted)]"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              <ExternalLink size={14} /> Önizle
            </button>
          )}
          <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </div>

      {/* Temel ayarlar */}
      <div className="rounded-xl border p-5 mb-4 space-y-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Temel Bilgiler</h2>
        <div className="grid grid-cols-2 gap-4">
          <Select label="Şablon" value={form.template} onChange={(e) => set('template', e.target.value)}>
            {TEMPLATES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
          <Select label="Durum" value={form.status} onChange={(e) => set('status', e.target.value)}>
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
        </div>
      </div>

      {/* Sekmeli içerik */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
        <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-5 py-3 text-sm font-medium transition-colors ${
                activeTab === t.id ? 'border-b-2 border-blue-600' : 'hover:bg-[var(--bg-muted)]'
              }`}
              style={{ color: activeTab === t.id ? '#2563EB' : 'var(--text-muted)' }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4">
          {/* Temel — başlık ve slug */}
          {activeTab === 'temel' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Başlık (TR)" value={form.title.tr} onChange={(e) => handleTitleChange('tr', e.target.value)} placeholder="Sayfa başlığı" />
                <Input label="Başlık (EN)" value={form.title.en} onChange={(e) => handleTitleChange('en', e.target.value)} placeholder="Page title" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Slug / URL (TR)" value={form.slug.tr} onChange={(e) => set('slug.tr', e.target.value)} placeholder="sayfa-url" />
                <Input label="Slug / URL (EN)" value={form.slug.en} onChange={(e) => set('slug.en', e.target.value)} placeholder="page-url" />
              </div>
              {MANAGED_ELSEWHERE[form.template] && (
                <div className="rounded-xl border p-4 flex gap-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
                  <span className="text-lg shrink-0">📋</span>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Bu sayfanın ana içeriği <strong>{MANAGED_ELSEWHERE[form.template]}</strong> Ek bölümler için <strong>İçerik</strong> sekmesinden blok ekleyebilirsiniz.
                  </p>
                </div>
              )}
            </>
          )}

          {/* İçerik — tüm şablonlar için blok editörü */}
          {activeTab === 'blocks' && (
            <BlockEditor
              blocks={form.blocks || []}
              onChange={(b) => set('blocks', b)}
            />
          )}

          {/* SSS / FAQ */}
          {activeTab === 'faq' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>SSS — Türkçe</h3>
                <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                  Türkçe sorular JSON-LD FAQPage schema'sı için kullanılır.
                </p>
                <FaqManager
                  content={form.content}
                  onChange={(c) => set('content', c)}
                  lang="tr"
                />
              </div>
              <div className="border-t pt-6" style={{ borderColor: 'var(--border)' }}>
                <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>SSS — İngilizce</h3>
                <FaqManager
                  content={form.content}
                  onChange={(c) => set('content', c)}
                  lang="en"
                />
              </div>
            </div>
          )}

          {/* SEO */}
          {activeTab === 'seo' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Meta Başlık (TR)" value={form.seo.title?.tr || ''} onChange={(e) => set('seo.title.tr', e.target.value)} placeholder="Meta başlık Türkçe" />
                <Input label="Meta Başlık (EN)" value={form.seo.title?.en || ''} onChange={(e) => set('seo.title.en', e.target.value)} placeholder="Meta title English" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Textarea label="Meta Açıklama (TR)" rows={3} value={form.seo.description?.tr || ''} onChange={(e) => set('seo.description.tr', e.target.value)} placeholder="Max 160 karakter" />
                <Textarea label="Meta Açıklama (EN)" rows={3} value={form.seo.description?.en || ''} onChange={(e) => set('seo.description.en', e.target.value)} placeholder="Max 160 characters" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Canonical URL" value={form.seo.canonical || ''} onChange={(e) => set('seo.canonical', e.target.value)} placeholder="https://..." />
                <Select label="Robots" value={form.seo.robots || 'index,follow'} onChange={(e) => set('seo.robots', e.target.value)}>
                  <option value="index,follow">index, follow</option>
                  <option value="noindex,follow">noindex, follow</option>
                  <option value="index,nofollow">index, nofollow</option>
                  <option value="noindex,nofollow">noindex, nofollow</option>
                </Select>
              </div>
              <ImageUrlInput label="OG Görsel URL" value={form.seo.ogImage || ''} onChange={(e) => set('seo.ogImage', e.target.value)} hint="1200×630px" />
              <Select label="Schema Türü (JSON-LD)" value={form.seo.schemaType || ''} onChange={(e) => set('seo.schemaType', e.target.value)}>
                <option value="">— Yok —</option>
                <option value="WebPage">WebPage</option>
                <option value="Article">Article</option>
                <option value="Service">Service</option>
                <option value="FAQPage">FAQPage (SSS'den otomatik)</option>
                <option value="Event">Event</option>
              </Select>

              {/* Schema önizleme */}
              {(form.seo.schemaType === 'FAQPage' || !form.seo.schemaType) && form.content?.faq_tr?.filter((f) => f.question).length > 0 && (
                <div className="rounded-lg border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    JSON-LD FAQPage Schema (otomatik)
                  </p>
                  <pre className="text-xs overflow-auto" style={{ color: 'var(--text-muted)', maxHeight: '200px' }}>
                    {JSON.stringify(
                      buildFaqSchema(form.content.faq_tr.filter((f) => f.question && f.answer)),
                      null, 2
                    )}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
