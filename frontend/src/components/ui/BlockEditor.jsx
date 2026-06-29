import { useState } from 'react';
import {
  PlusCircle, Trash2, ChevronUp, ChevronDown, ChevronDown as Expand,
  Image as ImageIcon, Type, LayoutGrid, Zap, BarChart2, Columns, HelpCircle, GripVertical,
  MessageSquare, Layers, List,
} from 'lucide-react';
import { ImageUrlInput, Input, Textarea, Select } from './Input';
import RichTextEditor from './RichTextEditor';
import MediaPickerModal from './MediaPickerModal';

function VideoPickerInput({ label, value, onChange, hint }) {
  const [open, setOpen] = useState(false);
  const filename = value ? value.split('/').pop() : null;
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</label>}
      <div className="flex items-center gap-2 rounded-lg border px-3 py-2" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
        <span className="flex-1 truncate text-xs" style={{ color: value ? 'var(--text-primary)' : 'var(--text-muted)' }}>
          {filename || 'Video seçilmedi'}
        </span>
        {value && (
          <button type="button" onClick={() => onChange('')} className="text-xs shrink-0 hover:opacity-70" style={{ color: 'var(--text-muted)' }}>✕</button>
        )}
        <button type="button" onClick={() => setOpen(true)} className="shrink-0 rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white transition hover:bg-blue-700">
          {value ? 'Değiştir' : 'Video Seç / Yükle'}
        </button>
      </div>
      {hint && <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
      <MediaPickerModal open={open} onClose={() => setOpen(false)} onSelect={(url) => { onChange(url); setOpen(false); }} />
    </div>
  );
}

// ── Block type definitions ─────────────────────────────────────────────────
export const BLOCK_TYPES = [
  { type: 'hero',         label: 'Hero Bölümü',       icon: ImageIcon,     desc: 'Tam genişlik görsel + başlık + CTA düğmeleri' },
  { type: 'richtext',     label: 'Zengin Metin',       icon: Type,          desc: 'HTML formatında içerik bloğu' },
  { type: 'gallery',      label: 'Galeri',             icon: LayoutGrid,    desc: 'Görsel grid (2–4 kolon)' },
  { type: 'cta',          label: 'CTA Bölümü',         icon: Zap,           desc: 'Başlık + açıklama + eylem düğmeleri' },
  { type: 'stats',        label: 'İstatistikler',      icon: BarChart2,     desc: 'Sayısal veri kartları' },
  { type: 'image-text',   label: 'Görsel + Metin',     icon: Columns,       desc: 'İki kolonlu görsel ve metin' },
  { type: 'faq',          label: 'Soru-Cevap',         icon: HelpCircle,    desc: 'Accordion SSS listesi' },
  { type: 'testimonials', label: 'Yorumlar',           icon: MessageSquare, desc: 'Müşteri / misafir yorum kartları' },
  { type: 'cards',        label: 'Kart Grid',          icon: Layers,        desc: 'Görsel + başlık + açıklama kartları' },
  { type: 'values',       label: 'Değerler Listesi',   icon: List,          desc: 'İkon + başlık + açıklama maddeleri' },
];

function emptyBlock(type) {
  const base = { type, order: 0, data: {} };
  switch (type) {
    case 'hero':
      return { ...base, data: { image: '', video: '', title: { tr: '', en: '' }, subtitle: { tr: '', en: '' }, overlay: 0.5, cta: [] } };
    case 'richtext':
      return { ...base, data: { content: { tr: '', en: '' } } };
    case 'gallery':
      return { ...base, data: { images: [], columns: 3 } };
    case 'cta':
      return { ...base, data: { title: { tr: '', en: '' }, description: { tr: '', en: '' }, btn1: { text: { tr: '', en: '' }, url: '' }, btn2: { text: { tr: '', en: '' }, url: '' } } };
    case 'stats':
      return { ...base, data: { items: [] } };
    case 'image-text':
      return { ...base, data: { image: '', imagePosition: 'left', title: { tr: '', en: '' }, text: { tr: '', en: '' } } };
    case 'faq':
      return { ...base, data: { items: [] } };
    case 'testimonials':
      return { ...base, data: { eyebrow: '', title: { tr: '', en: '' }, items: [] } };
    case 'cards':
      return { ...base, data: { eyebrow: '', title: { tr: '', en: '' }, items: [] } };
    case 'values':
      return { ...base, data: { eyebrow: '', title: { tr: '', en: '' }, items: [] } };
    default:
      return base;
  }
}

// ── Individual block data editors ──────────────────────────────────────────

function HeroBlockEditor({ data, onChange, lang }) {
  const d = data || {};
  const set = (k, v) => onChange({ ...d, [k]: v });
  const setLang = (k, v) => onChange({ ...d, [k]: { ...(d[k] || {}), [lang]: v } });

  const addCta = () => set('cta', [...(d.cta || []), { text: { tr: '', en: '' }, url: '', style: 'primary' }]);
  const removeCta = (i) => set('cta', (d.cta || []).filter((_, idx) => idx !== i));
  const updateCta = (i, field, val) => {
    const arr = (d.cta || []).map((c, idx) => idx !== i ? c : { ...c, [field]: val });
    set('cta', arr);
  };
  const updateCtaLang = (i, field, val) => {
    const arr = (d.cta || []).map((c, idx) => idx !== i ? c : { ...c, [field]: { ...(c[field] || {}), [lang]: val } });
    set('cta', arr);
  };

  return (
    <div className="space-y-4">
      <Input label="Üst Etiket (Eyebrow)" value={d.eyebrow || ''} onChange={(e) => set('eyebrow', e.target.value)} placeholder="Kartepe / Kocaeli" />
      <ImageUrlInput label="Arka Plan Görseli" value={d.image || ''} onChange={(e) => set('image', e.target.value)} hint="1600×900px önerilen — video yüklenirse görsel kullanılmaz" />
      <VideoPickerInput label="Arka Plan Videosu (MP4)" value={d.video || ''} onChange={(url) => set('video', url)} hint="S3'ten yüklenen MP4 — sessiz & otomatik oynar, görsel varsa video önceliklidir" />
      <Input label={`Başlık (${lang.toUpperCase()})`} value={d.title?.[lang] || ''} onChange={(e) => setLang('title', e.target.value)} placeholder="Ana başlık..." />
      <Textarea rows={2} label={`Alt Başlık (${lang.toUpperCase()})`} value={d.subtitle?.[lang] || ''} onChange={(e) => setLang('subtitle', e.target.value)} placeholder="Açıklama metni..." />
      <div className="flex gap-2">
        {['center', 'bottom'].map((pos) => (
          <button key={pos} type="button" onClick={() => set('textPosition', pos)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${(d.textPosition || 'center') === pos ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/30' : ''}`}
            style={(d.textPosition || 'center') !== pos ? { borderColor: 'var(--border)', color: 'var(--text-muted)' } : {}}>
            {pos === 'center' ? '↕ Ortada' : '↓ Altta'}
          </button>
        ))}
      </div>
      <div>
        <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>CTA Düğmeleri</label>
        <div className="space-y-2">
          {(d.cta || []).map((c, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-center">
              <Input value={c.text?.[lang] || ''} onChange={(e) => updateCtaLang(i, 'text', e.target.value)} placeholder={`Düğme ${i + 1} metni`} />
              <Input value={c.url || ''} onChange={(e) => updateCta(i, 'url', e.target.value)} placeholder="/sayfa-url" />
              <select value={c.style || 'primary'} onChange={(e) => updateCta(i, 'style', e.target.value)}
                className="rounded-lg px-2 py-2 text-xs border outline-none"
                style={{ background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                <option value="primary">Dolu</option>
                <option value="outline">Çerçeveli</option>
              </select>
              <button type="button" onClick={() => removeCta(i)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
        {(d.cta || []).length < 3 && (
          <button type="button" onClick={addCta} className="mt-2 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-dashed" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            <PlusCircle size={13} /> Düğme Ekle
          </button>
        )}
      </div>
    </div>
  );
}

function RichTextBlockEditor({ data, onChange, lang }) {
  const d = data || {};
  return (
    <RichTextEditor
      value={d.content?.[lang] || ''}
      onChange={(val) => onChange({ ...d, content: { ...(d.content || {}), [lang]: val } })}
      placeholder={lang === 'tr' ? 'İçerik...' : 'Content...'}
    />
  );
}

function GalleryBlockEditor({ data, onChange, lang = 'tr' }) {
  const d = data || {};
  const images = d.images || [];
  const update = (i, val) => { const a = [...images]; a[i] = val; onChange({ ...d, images: a }); };
  const add = () => onChange({ ...d, images: [...images, ''] });
  const remove = (i) => onChange({ ...d, images: images.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-3">
      <Input label="Üst Etiket (Eyebrow)" value={d.eyebrow || ''} onChange={(e) => onChange({ ...d, eyebrow: e.target.value })} placeholder="Galeri" />
      <Input label={`Başlık (${lang.toUpperCase()})`} value={typeof d.title === 'object' ? (d.title?.[lang] || '') : (d.title || '')} onChange={(e) => onChange({ ...d, title: { ...(typeof d.title === 'object' ? d.title : {}), [lang]: e.target.value } })} placeholder="Göz Alıcı Detaylar" />
      <div className="flex gap-2">
        {['grid', 'featured'].map((lay) => (
          <button key={lay} type="button" onClick={() => onChange({ ...d, layout: lay })}
            className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${(d.layout || 'grid') === lay ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/30' : ''}`}
            style={(d.layout || 'grid') !== lay ? { borderColor: 'var(--border)', color: 'var(--text-muted)' } : {}}>
            {lay === 'grid' ? '⊞ Grid' : '⬛ 1 Büyük + 4 Küçük'}
          </button>
        ))}
      </div>
      {(d.layout || 'grid') === 'grid' && (
        <Select label="Kolon Sayısı" value={String(d.columns || 3)} onChange={(e) => onChange({ ...d, columns: Number(e.target.value) })}>
          <option value="2">2 Kolon</option>
          <option value="3">3 Kolon</option>
          <option value="4">4 Kolon</option>
        </Select>
      )}
      <div className="rounded-lg border p-3 space-y-2" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
        <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>CTA Linki (opsiyonel)</p>
        <div className="grid grid-cols-2 gap-2">
          <Input value={d.cta?.text?.[lang] || ''} onChange={(e) => onChange({ ...d, cta: { ...(d.cta || {}), text: { ...(d.cta?.text || {}), [lang]: e.target.value } } })} placeholder="Galeriyi Gör" />
          <Input value={d.cta?.url || ''} onChange={(e) => onChange({ ...d, cta: { ...(d.cta || {}), url: e.target.value } })} placeholder="/restoran/galeri" />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Görseller</label>
          <span className="text-[11px] px-1.5 py-0.5 rounded font-medium" style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
            Yatay: 1200×800px · Dikey: 800×1200px
          </span>
        </div>
        <div className="space-y-3">
          {images.map((v, i) => (
            <div key={i} className="rounded-lg border p-2" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>Görsel {i + 1}</span>
                <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
              </div>
              <ImageUrlInput
                value={v}
                onChange={(e) => update(i, e.target.value)}
                placeholder="https://... veya medyadan seç"
              />
            </div>
          ))}
        </div>
        {images.length < 24 && (
          <button type="button" onClick={add} className="mt-2 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-dashed" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            <PlusCircle size={13} /> Görsel Ekle
          </button>
        )}
      </div>
    </div>
  );
}

function CtaBlockEditor({ data, onChange, lang }) {
  const d = data || {};
  const set = (k, v) => onChange({ ...d, [k]: v });
  const setLang = (k, v) => onChange({ ...d, [k]: { ...(d[k] || {}), [lang]: v } });
  const setBtn = (btn, field, val) => set(btn, { ...(d[btn] || {}), [field]: val });
  const setBtnLang = (btn, field, val) => set(btn, { ...(d[btn] || {}), [field]: { ...((d[btn] || {})[field] || {}), [lang]: val } });

  return (
    <div className="space-y-4">
      <Input label={`Başlık (${lang.toUpperCase()})`} value={d.title?.[lang] || ''} onChange={(e) => setLang('title', e.target.value)} placeholder="CTA başlığı..." />
      <Textarea rows={2} label={`Açıklama (${lang.toUpperCase()})`} value={d.description?.[lang] || ''} onChange={(e) => setLang('description', e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2 p-3 rounded-lg border" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
          <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Düğme 1 (Dolu)</p>
          <Input value={d.btn1?.text?.[lang] || ''} onChange={(e) => setBtnLang('btn1', 'text', e.target.value)} placeholder="Buton metni" />
          <Input value={d.btn1?.url || ''} onChange={(e) => setBtn('btn1', 'url', e.target.value)} placeholder="/url" />
        </div>
        <div className="space-y-2 p-3 rounded-lg border" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
          <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Düğme 2 (Çerçeve)</p>
          <Input value={d.btn2?.text?.[lang] || ''} onChange={(e) => setBtnLang('btn2', 'text', e.target.value)} placeholder="Buton metni" />
          <Input value={d.btn2?.url || ''} onChange={(e) => setBtn('btn2', 'url', e.target.value)} placeholder="/url" />
        </div>
      </div>
    </div>
  );
}

function StatsBlockEditor({ data, onChange, lang }) {
  const d = data || {};
  const items = d.items || [];
  const update = (i, field, val) => {
    const arr = items.map((it, idx) => idx !== i ? it : { ...it, [field]: val });
    onChange({ ...d, items: arr });
  };
  const updateLang = (i, field, val) => {
    const arr = items.map((it, idx) => idx !== i ? it : { ...it, [field]: { ...(it[field] || {}), [lang]: val } });
    onChange({ ...d, items: arr });
  };
  const add = () => onChange({ ...d, items: [...items, { icon: '⭐', value: '', label: { tr: '', en: '' } }] });
  const remove = (i) => onChange({ ...d, items: items.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i} className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center p-2 rounded-lg border" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
          <input value={it.icon || ''} onChange={(e) => update(i, 'icon', e.target.value)} placeholder="🔢" className="w-10 text-center rounded px-1 py-1.5 text-sm border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }} />
          <Input value={it.value || ''} onChange={(e) => update(i, 'value', e.target.value)} placeholder="200+" />
          <Input value={it.label?.[lang] || ''} onChange={(e) => updateLang(i, 'label', e.target.value)} placeholder={`Etiket (${lang.toUpperCase()})`} />
          <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
        </div>
      ))}
      {items.length < 8 && (
        <button type="button" onClick={add} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-dashed" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
          <PlusCircle size={13} /> İstatistik Ekle
        </button>
      )}
    </div>
  );
}

function ImageTextBlockEditor({ data, onChange, lang }) {
  const d = data || {};
  const set = (k, v) => onChange({ ...d, [k]: v });
  const setLang = (k, v) => onChange({ ...d, [k]: { ...(d[k] || {}), [lang]: v } });

  return (
    <div className="space-y-4">
      <Input label="Üst Etiket (Eyebrow)" value={d.eyebrow || ''} onChange={(e) => set('eyebrow', e.target.value)} placeholder="Doğa & Lezzet" />
      <ImageUrlInput label="Görsel URL" value={d.image || ''} onChange={(e) => set('image', e.target.value)} hint="600×400px önerilen" />
      <div className="flex gap-2">
        <button type="button" onClick={() => set('imagePosition', 'left')}
          className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${d.imagePosition !== 'right' ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/30' : ''}`}
          style={d.imagePosition === 'right' ? { borderColor: 'var(--border)', color: 'var(--text-muted)' } : {}}>
          ← Görsel Solda
        </button>
        <button type="button" onClick={() => set('imagePosition', 'right')}
          className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${d.imagePosition === 'right' ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/30' : ''}`}
          style={d.imagePosition !== 'right' ? { borderColor: 'var(--border)', color: 'var(--text-muted)' } : {}}>
          Görsel Sağda →
        </button>
      </div>
      <Input label={`Başlık (${lang.toUpperCase()})`} value={d.title?.[lang] || ''} onChange={(e) => setLang('title', e.target.value)} placeholder="Bölüm başlığı..." />
      <Textarea rows={4} label={`Metin (${lang.toUpperCase()})`} value={d.text?.[lang] || ''} onChange={(e) => setLang('text', e.target.value)} placeholder="Açıklama paragrafı..." />
      <div className="rounded-lg border p-3 space-y-2" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
        <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Alt CTA Linki (opsiyonel)</p>
        <div className="grid grid-cols-2 gap-2">
          <Input value={d.cta?.text?.[lang] || ''} onChange={(e) => set('cta', { ...(d.cta || {}), text: { ...(d.cta?.text || {}), [lang]: e.target.value } })} placeholder="Link metni" />
          <Input value={d.cta?.url || ''} onChange={(e) => set('cta', { ...(d.cta || {}), url: e.target.value })} placeholder="/sayfa-url" />
        </div>
      </div>
    </div>
  );
}

function FaqBlockEditor({ data, onChange, lang }) {
  const d = data || {};
  const items = d.items || [];
  const update = (i, field, val) => {
    const arr = items.map((it, idx) => idx !== i ? it : { ...it, [field]: { ...(it[field] || {}), [lang]: val } });
    onChange({ ...d, items: arr });
  };
  const add = () => onChange({ ...d, items: [...items, { question: { tr: '', en: '' }, answer: { tr: '', en: '' } }] });
  const remove = (i) => onChange({ ...d, items: items.filter((_, idx) => idx !== i) });
  const move = (i, dir) => {
    const arr = [...items];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    onChange({ ...d, items: arr });
  };

  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i} className="rounded-lg border p-3 space-y-2" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Soru {i + 1} ({lang.toUpperCase()})</span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="w-6 h-6 rounded flex items-center justify-center hover:bg-[var(--bg-surface)] disabled:opacity-30"><ChevronUp size={13} style={{ color: 'var(--text-muted)' }} /></button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} className="w-6 h-6 rounded flex items-center justify-center hover:bg-[var(--bg-surface)] disabled:opacity-30"><ChevronDown size={13} style={{ color: 'var(--text-muted)' }} /></button>
              <button type="button" onClick={() => remove(i)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950/30"><Trash2 size={13} className="text-red-500" /></button>
            </div>
          </div>
          <Input value={it.question?.[lang] || ''} onChange={(e) => update(i, 'question', e.target.value)} placeholder="Soru metni..." />
          <Textarea rows={2} value={it.answer?.[lang] || ''} onChange={(e) => update(i, 'answer', e.target.value)} placeholder="Cevap metni..." />
        </div>
      ))}
      <button type="button" onClick={add} className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-dashed" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
        <PlusCircle size={15} /> Soru Ekle
      </button>
    </div>
  );
}

function TestimonialsBlockEditor({ data, onChange, lang }) {
  const d = data || {};
  const items = d.items || [];
  const set = (k, v) => onChange({ ...d, [k]: v });
  const setLang = (k, v) => onChange({ ...d, [k]: { ...(d[k] || {}), [lang]: v } });
  const add = () => set('items', [...items, { text: '', name: '', role: '', rating: 5 }]);
  const remove = (i) => set('items', items.filter((_, idx) => idx !== i));
  const update = (i, field, val) => {
    set('items', items.map((it, idx) => idx !== i ? it : { ...it, [field]: val }));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={i} className="rounded-lg border p-3 space-y-2" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Yorum {i + 1}</span>
              <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
            </div>
            <Textarea rows={3} label="Yorum Metni" value={it.text || ''} onChange={(e) => update(i, 'text', e.target.value)} placeholder="Harika bir deneyimdi..." />
            <div className="grid grid-cols-2 gap-2">
              <Input label="İsim" value={it.name || it.author || ''} onChange={(e) => update(i, 'name', e.target.value)} placeholder="Ayşe Yılmaz" />
              <Input label="Rol / Kaynak" value={it.role || ''} onChange={(e) => update(i, 'role', e.target.value)} placeholder="Google Yorumu" />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Yıldız Puanı</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => update(i, 'rating', star)}
                    className="text-lg transition-opacity hover:opacity-80"
                    style={{ color: star <= (it.rating || 5) ? '#ab9363' : 'var(--border)' }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      {items.length < 10 && (
        <button type="button" onClick={add} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-dashed" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
          <PlusCircle size={13} /> Yorum Ekle
        </button>
      )}
    </div>
  );
}

function CardsBlockEditor({ data, onChange, lang }) {
  const d = data || {};
  const items = d.items || [];
  const set = (k, v) => onChange({ ...d, [k]: v });
  const setLang = (k, v) => onChange({ ...d, [k]: { ...(d[k] || {}), [lang]: v } });
  const add = () => set('items', [...items, { image: '', title: '', description: '' }]);
  const remove = (i) => set('items', items.filter((_, idx) => idx !== i));
  const update = (i, field, val) => {
    set('items', items.map((it, idx) => idx !== i ? it : { ...it, [field]: val }));
  };

  return (
    <div className="space-y-4">
      <Input label="Üst Etiket (Eyebrow)" value={d.eyebrow || ''} onChange={(e) => set('eyebrow', e.target.value)} placeholder="Öne Çıkanlar" />
      <Input label={`Başlık (${lang.toUpperCase()})`} value={d.title?.[lang] || ''} onChange={(e) => setLang('title', e.target.value)} placeholder="Kartlar Bölümü" />
      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={i} className="rounded-lg border p-3 space-y-2" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Kart {i + 1}</span>
              <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
            </div>
            <ImageUrlInput label="Görsel URL" value={it.image || ''} onChange={(e) => update(i, 'image', e.target.value)} hint="600×400px" />
            <Input label="Başlık" value={it.title || ''} onChange={(e) => update(i, 'title', e.target.value)} placeholder="Kart başlığı..." />
            <Textarea rows={2} label="Açıklama" value={it.description || ''} onChange={(e) => update(i, 'description', e.target.value)} placeholder="Kısa açıklama..." />
          </div>
        ))}
      </div>
      {items.length < 12 && (
        <button type="button" onClick={add} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-dashed" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
          <PlusCircle size={13} /> Kart Ekle
        </button>
      )}
    </div>
  );
}

function ValuesBlockEditor({ data, onChange, lang }) {
  const d = data || {};
  const items = d.items || [];
  const set = (k, v) => onChange({ ...d, [k]: v });
  const setLang = (k, v) => onChange({ ...d, [k]: { ...(d[k] || {}), [lang]: v } });
  const add = () => set('items', [...items, { icon: '⭐', title: { tr: '', en: '' }, description: { tr: '', en: '' } }]);
  const remove = (i) => set('items', items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, val) => {
    set('items', items.map((it, idx) => idx !== i ? it : { ...it, [field]: val }));
  };
  const updateItemLang = (i, field, val) => {
    set('items', items.map((it, idx) => idx !== i ? it : { ...it, [field]: { ...(it[field] || {}), [lang]: val } }));
  };

  return (
    <div className="space-y-4">
      <Input label="Üst Etiket (Eyebrow)" value={d.eyebrow || ''} onChange={(e) => set('eyebrow', e.target.value)} placeholder="Değerlerimiz" />
      <Input label={`Başlık (${lang.toUpperCase()})`} value={d.title?.[lang] || ''} onChange={(e) => setLang('title', e.target.value)} placeholder="Bizim İçin Önemli Olan" />
      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={i} className="rounded-lg border p-3 space-y-2" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Madde {i + 1}</span>
              <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
            </div>
            <div className="grid grid-cols-[auto_1fr] gap-2 items-end">
              <input value={it.icon || ''} onChange={(e) => updateItem(i, 'icon', e.target.value)}
                placeholder="🌿" className="w-10 text-center rounded px-1 py-2 text-sm border"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }} />
              <Input label={`Başlık (${lang.toUpperCase()})`} value={it.title?.[lang] || ''} onChange={(e) => updateItemLang(i, 'title', e.target.value)} placeholder="Değer başlığı..." />
            </div>
            <Textarea rows={2} label={`Açıklama (${lang.toUpperCase()})`} value={it.description?.[lang] || ''} onChange={(e) => updateItemLang(i, 'description', e.target.value)} placeholder="Kısa açıklama..." />
          </div>
        ))}
      </div>
      {items.length < 8 && (
        <button type="button" onClick={add} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-dashed" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
          <PlusCircle size={13} /> Madde Ekle
        </button>
      )}
    </div>
  );
}

function BlockDataEditor({ block, onChange, lang }) {
  switch (block.type) {
    case 'hero':       return <HeroBlockEditor data={block.data} onChange={(d) => onChange({ ...block, data: d })} lang={lang} />;
    case 'richtext':   return <RichTextBlockEditor data={block.data} onChange={(d) => onChange({ ...block, data: d })} lang={lang} />;
    case 'gallery':    return <GalleryBlockEditor data={block.data} onChange={(d) => onChange({ ...block, data: d })} lang={lang} />;
    case 'cta':        return <CtaBlockEditor data={block.data} onChange={(d) => onChange({ ...block, data: d })} lang={lang} />;
    case 'stats':      return <StatsBlockEditor data={block.data} onChange={(d) => onChange({ ...block, data: d })} lang={lang} />;
    case 'image-text': return <ImageTextBlockEditor data={block.data} onChange={(d) => onChange({ ...block, data: d })} lang={lang} />;
    case 'faq':          return <FaqBlockEditor          data={block.data} onChange={(d) => onChange({ ...block, data: d })} lang={lang} />;
    case 'testimonials': return <TestimonialsBlockEditor data={block.data} onChange={(d) => onChange({ ...block, data: d })} lang={lang} />;
    case 'cards':        return <CardsBlockEditor        data={block.data} onChange={(d) => onChange({ ...block, data: d })} lang={lang} />;
    case 'values':       return <ValuesBlockEditor       data={block.data} onChange={(d) => onChange({ ...block, data: d })} lang={lang} />;
    default:             return <p className="text-sm text-[var(--text-muted)]">Bilinmeyen blok türü: {block.type}</p>;
  }
}

// ── Single block card ──────────────────────────────────────────────────────

function BlockCard({ block, index, total, onChange, onRemove, onMove, lang }) {
  const [expanded, setExpanded] = useState(false);
  const meta = BLOCK_TYPES.find((t) => t.type === block.type);
  const Icon = meta?.icon || Type;

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: 'var(--bg-muted)' }}>
        <GripVertical size={14} style={{ color: 'var(--text-muted)' }} className="shrink-0" />
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Icon size={14} style={{ color: 'var(--text-secondary)' }} />
          <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{meta?.label || block.type}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button type="button" onClick={() => onMove(index, -1)} disabled={index === 0} className="w-7 h-7 rounded flex items-center justify-center hover:bg-[var(--bg-surface)] disabled:opacity-30">
            <ChevronUp size={13} style={{ color: 'var(--text-muted)' }} />
          </button>
          <button type="button" onClick={() => onMove(index, 1)} disabled={index === total - 1} className="w-7 h-7 rounded flex items-center justify-center hover:bg-[var(--bg-surface)] disabled:opacity-30">
            <ChevronDown size={13} style={{ color: 'var(--text-muted)' }} />
          </button>
          <button type="button" onClick={() => onRemove(index)} className="w-7 h-7 rounded flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950/30">
            <Trash2 size={13} className="text-red-500" />
          </button>
          <button type="button" onClick={() => setExpanded((p) => !p)} className="w-7 h-7 rounded flex items-center justify-center hover:bg-[var(--bg-surface)]">
            <ChevronDown size={13} style={{ color: 'var(--text-muted)', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
          </button>
        </div>
      </div>
      {/* Editor body */}
      {expanded && (
        <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <BlockDataEditor block={block} onChange={onChange} lang={lang} />
        </div>
      )}
    </div>
  );
}

// ── Add block picker ───────────────────────────────────────────────────────

function BlockPicker({ onAdd }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed text-sm font-medium transition-colors hover:bg-[var(--bg-muted)]"
        style={{ borderColor: open ? '#2563EB' : 'var(--border)', color: open ? '#2563EB' : 'var(--text-muted)' }}
      >
        <PlusCircle size={16} /> {open ? 'Kapat' : 'Blok Ekle'}
      </button>
      {open && (
        <div className="mt-2 rounded-xl border p-3 grid grid-cols-2 gap-2"
          style={{ background: 'var(--bg-muted)', borderColor: 'var(--border)' }}>
          {BLOCK_TYPES.map((bt) => {
            const Icon = bt.icon;
            return (
              <button
                key={bt.type}
                type="button"
                onClick={() => { onAdd(bt.type); setOpen(false); }}
                className="flex items-start gap-3 p-3 rounded-lg text-left transition-colors hover:bg-[var(--bg-surface)]"
                style={{ background: 'transparent' }}
              >
                <Icon size={16} style={{ color: 'var(--text-secondary)', marginTop: 2, flexShrink: 0 }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{bt.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{bt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main BlockEditor component ─────────────────────────────────────────────

export default function BlockEditor({ blocks = [], onChange }) {
  const [lang, setLang] = useState('tr');

  const add = (type) => {
    const newBlock = { ...emptyBlock(type), order: blocks.length };
    onChange([...blocks, newBlock]);
  };

  const update = (index, updated) => {
    onChange(blocks.map((b, i) => i === index ? updated : b));
  };

  const remove = (index) => onChange(blocks.filter((_, i) => i !== index));

  const move = (index, dir) => {
    const arr = [...blocks];
    const j = index + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[index], arr[j]] = [arr[j], arr[index]];
    onChange(arr.map((b, i) => ({ ...b, order: i })));
  };

  return (
    <div className="space-y-3">
      {/* Language toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>İçerik dili:</span>
        <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
          {['tr', 'en'].map((l) => (
            <button key={l} type="button" onClick={() => setLang(l)}
              className="px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: lang === l ? '#2563EB' : 'var(--bg-muted)',
                color: lang === l ? '#fff' : 'var(--text-muted)',
              }}>
              {l === 'tr' ? '🇹🇷 TR' : '🇬🇧 EN'}
            </button>
          ))}
        </div>
        {blocks.length > 0 && (
          <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>{blocks.length} blok</span>
        )}
      </div>

      {/* Block list */}
      {blocks.length === 0 && (
        <div className="text-center py-10 rounded-xl border border-dashed" style={{ borderColor: 'var(--border)' }}>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Henüz blok yok. Aşağıdan ekleyin.</p>
        </div>
      )}
      {blocks.map((block, i) => (
        <BlockCard
          key={i}
          block={block}
          index={i}
          total={blocks.length}
          onChange={(updated) => update(i, updated)}
          onRemove={remove}
          onMove={move}
          lang={lang}
        />
      ))}

      {/* Add block picker */}
      <BlockPicker onAdd={add} />
    </div>
  );
}
