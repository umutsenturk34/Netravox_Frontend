import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { Input, Textarea, Select, ImageUrlInput } from '../components/ui/Input';
import RichTextEditor from '../components/ui/RichTextEditor';
import { ArrowLeft, Save, Sparkles, X } from 'lucide-react';

const STATUSES = [
  { value: 'draft',     label: 'Taslak' },
  { value: 'published', label: 'Yayında' },
  { value: 'archived',  label: 'Arşiv' },
];

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const empty = {
  title:       { tr: '', en: '' },
  slug:        '',
  excerpt:     { tr: '', en: '' },
  content:     { tr: '', en: '' },
  coverImage:  '',
  tags:        '',
  author:      '',
  status:      'draft',
  seo: {
    metaTitle: { tr: '', en: '' },
    metaDesc:  { tr: '', en: '' },
    ogImage:        '',
    canonicalUrl:   '',
  },
};

export default function BlogEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { activeCompany } = useAuth();
  const isNew = !id;
  const [form, setForm] = useState(empty);
  const [tab, setTab] = useState('tr');
  const [seoOpen, setSeoOpen] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [aiModal, setAiModal] = useState(false);
  const [aiTitle, setAiTitle] = useState('');
  const [aiLang, setAiLang] = useState('tr');
  const [aiLoading, setAiLoading] = useState(false);
  const aiEnabled = activeCompany?.features?.aiContent;

  const { isLoading, data: postData } = useQuery({
    queryKey: ['blog-post', id],
    queryFn: () => api.get(`/blog/${id}`).then((r) => r.data),
    enabled: !isNew,
  });

  useEffect(() => {
    if (!postData) return;
    setForm({
      title:      { tr: postData.title?.tr || '', en: postData.title?.en || '' },
      slug:       postData.slug || '',
      excerpt:    { tr: postData.excerpt?.tr || '', en: postData.excerpt?.en || '' },
      content:    { tr: postData.content?.tr || '', en: postData.content?.en || '' },
      coverImage: postData.coverImage || '',
      tags:       (postData.tags || []).join(', '),
      author:     postData.author || '',
      status:     postData.status || 'draft',
      seo: {
        metaTitle:    { tr: postData.seo?.metaTitle?.tr || '', en: postData.seo?.metaTitle?.en || '' },
        metaDesc:     { tr: postData.seo?.metaDesc?.tr || '', en: postData.seo?.metaDesc?.en || '' },
        ogImage:      postData.seo?.ogImage || '',
        canonicalUrl: postData.seo?.canonicalUrl || '',
      },
    });
    setSlugTouched(true);
  }, [postData]);

  const save = useMutation({
    mutationFn: (data) =>
      isNew
        ? api.post('/blog', data).then((r) => r.data)
        : api.patch(`/blog/${id}`, data).then((r) => r.data),
    onSuccess: (data) => {
      toast.success(isNew ? 'Blog yazısı oluşturuldu' : 'Blog yazısı güncellendi');
      if (isNew) navigate(`/blog/${data._id}/edit`, { replace: true });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Hata oluştu'),
  });

  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function setLang(field, lang, value) {
    setForm((f) => ({ ...f, [field]: { ...f[field], [lang]: value } }));
    if (field === 'title' && lang === 'tr' && !slugTouched) {
      setField('slug', slugify(value));
    }
  }

  function setSeoField(field, value) {
    setForm((f) => ({ ...f, seo: { ...f.seo, [field]: value } }));
  }

  function setSeoLang(field, lang, value) {
    setForm((f) => ({ ...f, seo: { ...f.seo, [field]: { ...f.seo[field], [lang]: value } } }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.tr.trim()) { toast.error('Türkçe başlık zorunlu'); return; }
    if (!form.slug.trim())     { toast.error('Slug zorunlu'); return; }

    save.mutate({
      ...form,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
  }

  async function handleAiGenerate() {
    if (!aiTitle.trim()) { toast.error('Başlık giriniz'); return; }
    setAiLoading(true);
    try {
      const { data } = await api.post('/blog/generate', { title: aiTitle, language: aiLang });
      setForm((f) => ({
        ...f,
        title:   { ...f.title,   [aiLang]: data.title   || f.title[aiLang]   },
        excerpt: { ...f.excerpt, [aiLang]: data.excerpt  || f.excerpt[aiLang] },
        content: { ...f.content, [aiLang]: data.content  || f.content[aiLang] },
        slug:    (!slugTouched && aiLang === 'tr') ? (data.slug || f.slug) : f.slug,
        tags:    data.tags?.join(', ') || f.tags,
        seo: {
          ...f.seo,
          metaTitle: { ...f.seo.metaTitle, [aiLang]: data.metaTitle || '' },
          metaDesc:  { ...f.seo.metaDesc,  [aiLang]: data.metaDescription || '' },
        },
      }));
      if (data.slug && aiLang === 'tr' && !slugTouched) setSlugTouched(false);
      setTab(aiLang);
      setAiModal(false);
      toast.success('Blog yazısı oluşturuldu! İçeriği inceleyip düzenleyebilirsiniz.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI içerik üretilemedi');
    } finally {
      setAiLoading(false);
    }
  }

  if (!isNew && isLoading) {
    return <div className="p-6 text-sm" style={{ color: 'var(--text-muted)' }}>Yükleniyor...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/blog')} className="p-1.5 rounded-lg hover:bg-[var(--bg-muted)] transition-colors">
          <ArrowLeft size={16} style={{ color: 'var(--text-muted)' }} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {isNew ? 'Yeni Blog Yazısı' : 'Blog Yazısı Düzenle'}
          </h1>
        </div>
        {aiEnabled && (
          <button
            type="button"
            onClick={() => { setAiTitle(form.title.tr || ''); setAiModal(true); }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{ background: 'linear-gradient(135deg,#4338ca,#7c3aed)', color: '#fff' }}
          >
            <Sparkles size={14} />
            AI ile Üret
          </button>
        )}
        <Select
          value={form.status}
          onChange={(e) => setField('status', e.target.value)}
          options={STATUSES}
          style={{ width: '140px' }}
        />
        <Button onClick={handleSubmit} loading={save.isPending} icon={<Save size={14} />}>
          Kaydet
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dil sekmeleri */}
        <div className="flex gap-1 border-b" style={{ borderColor: 'var(--border)' }}>
          {['tr', 'en'].map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setTab(l)}
              className="px-4 py-2 text-sm font-medium transition-colors"
              style={{
                color: tab === l ? '#6366f1' : 'var(--text-muted)',
                borderBottom: tab === l ? '2px solid #6366f1' : '2px solid transparent',
              }}
            >
              {l === 'tr' ? 'Türkçe' : 'İngilizce'}
            </button>
          ))}
        </div>

        {/* Ana alanlar */}
        <div
          className="p-5 rounded-2xl border space-y-4"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <Input
            label={`Başlık (${tab.toUpperCase()})`}
            value={form.title[tab]}
            onChange={(e) => setLang('title', tab, e.target.value)}
            required={tab === 'tr'}
          />

          {tab === 'tr' && (
            <Input
              label="Slug (URL)"
              value={form.slug}
              onChange={(e) => { setField('slug', e.target.value); setSlugTouched(true); }}
              required
              placeholder="ornek-blog-yazisi"
            />
          )}

          <Textarea
            label={`Özet (${tab.toUpperCase()})`}
            value={form.excerpt[tab]}
            onChange={(e) => setLang('excerpt', tab, e.target.value)}
            rows={3}
            placeholder="Kısa açıklama (liste görünümünde gösterilir)"
          />

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              İçerik ({tab.toUpperCase()})
            </label>
            <RichTextEditor
              value={form.content[tab]}
              onChange={(v) => setLang('content', tab, v)}
            />
          </div>
        </div>

        {/* Meta alanlar */}
        <div
          className="p-5 rounded-2xl border space-y-4"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Yazı Bilgileri</h3>
          <ImageUrlInput
            label="Kapak Görseli URL"
            value={form.coverImage}
            onChange={(e) => setField('coverImage', e.target.value)}
            hint="1200×630px"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Yazar"
              value={form.author}
              onChange={(e) => setField('author', e.target.value)}
            />
            <Input
              label="Etiketler (virgülle ayırın)"
              value={form.tags}
              onChange={(e) => setField('tags', e.target.value)}
              placeholder="seo, web, pazarlama"
            />
          </div>
        </div>

        {/* SEO */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <button
            type="button"
            onClick={() => setSeoOpen((v) => !v)}
            className="w-full flex items-center justify-between p-5 text-sm font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            SEO Ayarları
            <span style={{ color: 'var(--text-muted)' }}>{seoOpen ? '▲' : '▼'}</span>
          </button>

          {seoOpen && (
            <div className="px-5 pb-5 space-y-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <Input
                label={`Meta Başlık (${tab.toUpperCase()})`}
                value={form.seo.metaTitle[tab]}
                onChange={(e) => setSeoLang('metaTitle', tab, e.target.value)}
              />
              <Textarea
                label={`Meta Açıklama (${tab.toUpperCase()})`}
                value={form.seo.metaDesc[tab]}
                onChange={(e) => setSeoLang('metaDesc', tab, e.target.value)}
                rows={3}
              />
              <ImageUrlInput
                label="OG Görsel URL"
                value={form.seo.ogImage}
                onChange={(e) => setSeoField('ogImage', e.target.value)}
                hint="1200×630px"
              />
              <Input
                label="Canonical URL"
                value={form.seo.canonicalUrl}
                onChange={(e) => setSeoField('canonicalUrl', e.target.value)}
              />
            </div>
          )}
        </div>
      </form>

      {/* AI Üretim Modal */}
      {aiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" style={{ background: 'var(--bg-surface)' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ background: 'linear-gradient(135deg,#1e1b4b,#4338ca)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-2">
                <Sparkles size={18} color="#c7d2fe" />
                <span className="font-bold text-white text-sm">AI ile Blog Yaz</span>
              </div>
              <button onClick={() => setAiModal(false)} className="text-white/60 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Başlığı girin — sektörünüze özel, SEO uyumlu tam blog yazısı otomatik oluşturulur.
              </p>

              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Blog Başlığı</label>
                <input
                  autoFocus
                  value={aiTitle}
                  onChange={(e) => setAiTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
                  placeholder="Örn: Restoranlarda Dijital Menü Kullanımı"
                  className="w-full rounded-xl px-4 py-3 text-sm border outline-none"
                  style={{ background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: '16px' }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Dil</label>
                <div className="flex gap-2">
                  {[{ v: 'tr', l: '🇹🇷 Türkçe' }, { v: 'en', l: '🇬🇧 İngilizce' }].map(({ v, l }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setAiLang(v)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all"
                      style={{
                        borderColor: aiLang === v ? '#6366f1' : 'var(--border)',
                        background: aiLang === v ? '#eef2ff' : 'var(--bg-base)',
                        color: aiLang === v ? '#4338ca' : 'var(--text-secondary)',
                      }}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {aiLoading && (
                <div className="rounded-xl p-4 text-center text-sm" style={{ background: '#eef2ff', color: '#4338ca' }}>
                  <div className="animate-pulse font-medium">✨ Blog yazısı oluşturuluyor...</div>
                  <div className="text-xs mt-1 opacity-70">Bu işlem 10-20 saniye sürebilir</div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setAiModal(false)}
                disabled={aiLoading}
                className="flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-base)' }}
              >
                İptal
              </button>
              <button
                onClick={handleAiGenerate}
                disabled={aiLoading || !aiTitle.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#4338ca,#7c3aed)' }}
              >
                {aiLoading ? 'Oluşturuluyor...' : '✨ Üret'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
