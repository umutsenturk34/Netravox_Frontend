const CURRENCY_SYMBOL = { TRY: '₺', USD: '$', EUR: '€', GBP: '£' };

function fmt(price, currency) {
  if (!price && price !== 0) return null;
  const sym = CURRENCY_SYMBOL[currency] || currency;
  const num = Number(price).toLocaleString('tr-TR');
  return `${num} ${sym}`;
}

function ImagePlaceholder({ theme }) {
  const colors = {
    minimal:    'bg-gray-100 dark:bg-gray-800',
    fashion:    'bg-gray-900',
    bold:       'bg-indigo-900',
    restaurant: 'bg-amber-100',
  };
  return (
    <div className={`w-full h-full flex items-center justify-center ${colors[theme] || colors.minimal}`}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
        className="opacity-30" style={{ color: theme === 'fashion' || theme === 'bold' ? '#fff' : '#999' }}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </svg>
    </div>
  );
}

// ── Minimal ──────────────────────────────────────────────────────────────────
function MinimalCard({ name, price, badge, variantCount, imageUrl }) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
      <div className="relative" style={{ paddingBottom: '75%' }}>
        <div className="absolute inset-0">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          ) : <ImagePlaceholder theme="minimal" />}
        </div>
        {badge && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white">
            {badge}
          </span>
        )}
      </div>
      <div className="p-3 space-y-1">
        <p className="text-sm font-semibold leading-tight line-clamp-2" style={{ color: 'var(--text-primary)' }}>{name}</p>
        <div className="flex items-center justify-between">
          {price ? (
            <p className="text-sm font-bold text-indigo-600">{price}</p>
          ) : (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Fiyat girilmedi</p>
          )}
          {variantCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full border" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
              {variantCount} varyant
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Fashion ───────────────────────────────────────────────────────────────────
function FashionCard({ name, price, badge, variantCount, imageUrl }) {
  return (
    <div className="rounded-2xl overflow-hidden relative" style={{ paddingBottom: '130%' }}>
      <div className="absolute inset-0">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        ) : <ImagePlaceholder theme="fashion" />}
      </div>
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
      {badge && (
        <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-gray-900">
          {badge}
        </span>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1">
        <p className="text-sm font-semibold leading-tight text-white line-clamp-2">{name}</p>
        <div className="flex items-center justify-between">
          {price ? (
            <p className="text-sm font-bold text-white">{price}</p>
          ) : (
            <p className="text-xs text-white/60">Fiyat girilmedi</p>
          )}
          {variantCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-white">
              {variantCount} varyant
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Bold ──────────────────────────────────────────────────────────────────────
function BoldCard({ name, price, badge, variantCount, imageUrl }) {
  return (
    <div className="rounded-2xl overflow-hidden bg-gray-950 flex flex-col">
      <div className="relative" style={{ paddingBottom: '65%' }}>
        <div className="absolute inset-0">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="w-full h-full object-cover opacity-90"
              onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          ) : <ImagePlaceholder theme="bold" />}
        </div>
        {badge && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-black bg-yellow-400 text-gray-900 uppercase tracking-wide">
            {badge}
          </span>
        )}
      </div>
      <div className="p-3 space-y-2">
        <p className="text-sm font-black leading-tight text-white line-clamp-2 uppercase tracking-tight">{name}</p>
        <div className="flex items-center justify-between">
          {price ? (
            <p className="text-base font-black text-yellow-400">{price}</p>
          ) : (
            <p className="text-xs text-white/40">Fiyat girilmedi</p>
          )}
          {variantCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/70">
              {variantCount} varyant
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Restaurant ────────────────────────────────────────────────────────────────
function RestaurantCard({ name, price, badge, variantCount, imageUrl }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-amber-200 bg-amber-50">
      <div className="relative" style={{ paddingBottom: '60%' }}>
        <div className="absolute inset-0">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          ) : <ImagePlaceholder theme="restaurant" />}
        </div>
        {badge && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
            {badge}
          </span>
        )}
      </div>
      <div className="p-3 space-y-1">
        <p className="text-sm font-bold leading-tight text-amber-900 line-clamp-2">{name}</p>
        <div className="flex items-center justify-between">
          {price ? (
            <p className="text-sm font-bold text-amber-700">{price}</p>
          ) : (
            <p className="text-xs text-amber-400">Fiyat girilmedi</p>
          )}
          {variantCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-700">
              {variantCount} varyant
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

const THEME_LABELS = {
  minimal:    'Minimal Tema',
  fashion:    'Fashion Tema',
  bold:       'Bold Tema',
  restaurant: 'Restaurant Tema',
};

export default function ProductCardPreview({ form, themeSettings }) {
  const theme = themeSettings?.theme || 'minimal';
  const name = form.name?.tr || form.name?.en || 'Ürün Adı';
  const price = fmt(form.price, form.currency || 'TRY');
  const badge = form.badge?.trim() || '';
  const variantCount = form.variants?.length || 0;
  const imageUrl = form.image;

  const cardProps = { name, price, badge, variantCount, imageUrl };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          Kart Önizleme
        </p>
        <span className="text-[10px] px-2 py-0.5 rounded-full border font-medium"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
          {THEME_LABELS[theme] || theme}
        </span>
      </div>
      <div className="max-w-[200px]">
        {theme === 'fashion'    && <FashionCard    {...cardProps} />}
        {theme === 'bold'       && <BoldCard       {...cardProps} />}
        {theme === 'restaurant' && <RestaurantCard {...cardProps} />}
        {(theme === 'minimal' || !['fashion','bold','restaurant'].includes(theme)) && (
          <MinimalCard {...cardProps} />
        )}
      </div>
      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
        Görsel eklenince burada güncellenir
      </p>
    </div>
  );
}
