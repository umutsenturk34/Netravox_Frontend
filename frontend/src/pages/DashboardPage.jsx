import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, Users, Eye, MonitorSmartphone, Clock, ArrowUpRight, AlertCircle } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Skeleton } from '../components/ui/Skeleton';

// Tutarlı mock veri — GA4 bağlanana kadar gösterilir
function mockAnalytics(seed = '') {
  const h = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 1337) % 1000;
  const n = (base, spread) => Math.max(1, base + ((h * 17 + base) % spread) - Math.floor(spread / 2));
  const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  return {
    configured: false,
    stats: {
      visitors: n(2640, 900),
      pageViews: n(6180, 1600),
      sessions: n(3120, 950),
      avgDuration: `${n(2, 2)}:${String(n(38, 40)).padStart(2, '0')}`,
      visitorTrend: n(14, 22) - 7,
      pageViewTrend: n(10, 20) - 5,
      sessionTrend: n(18, 24) - 8,
    },
    traffic: days.map((day, i) => ({
      day,
      ziyaretçi: n(110 + i * 18, 90),
      görüntülenme: n(260 + i * 25, 140),
    })),
    sources: [
      { name: 'Organik', value: n(44, 20), pct: 44, color: '#6366f1' },
      { name: 'Direkt', value: n(27, 14), pct: 27, color: '#8b5cf6' },
      { name: 'Referans', value: n(17, 10), pct: 17, color: '#a78bfa' },
      { name: 'Sosyal', value: n(12, 8), pct: 12, color: '#c4b5fd' },
    ],
    topPages: [
      { title: 'Ana Sayfa', views: n(1280, 320), sessions: n(1010, 220), bounce: n(33, 14) },
      { title: 'Menü', views: n(840, 210), sessions: n(660, 160), bounce: n(29, 12) },
      { title: 'Rezervasyon', views: n(560, 160), sessions: n(440, 110), bounce: n(43, 16) },
      { title: 'Hakkımızda', views: n(330, 100), sessions: n(285, 85), bounce: n(57, 18) },
      { title: 'İletişim', views: n(250, 85), sessions: n(215, 65), bounce: n(50, 14) },
    ],
  };
}

const resStatusColor = {
  new: 'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300',
  seen: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  rejected: 'bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400',
  cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
};
const resStatusLabel = { new: 'Yeni', seen: 'Görüldü', confirmed: 'Onaylandı', rejected: 'Reddedildi', cancelled: 'İptal' };

function TrendBadge({ value }) {
  if (value == null) return null;
  const pos = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full ${
      pos
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
        : 'bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400'
    }`}>
      {pos ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {pos ? '+' : ''}{value}%
    </span>
  );
}

function StatCard({ icon: Icon, iconColor, label, value, trend, isLoading }) {
  return (
    <div
      className="rounded-2xl border p-5 flex flex-col gap-3 hover:shadow-md transition-shadow duration-200"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: iconColor + '18' }}>
          <Icon size={17} style={{ color: iconColor }} />
        </div>
        <TrendBadge value={trend} />
      </div>
      {isLoading ? (
        <Skeleton className="h-8 w-24" />
      ) : (
        <div>
          <p className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{value}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
        </div>
      )}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border px-3 py-2 text-xs shadow-lg" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
      <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <span className="font-semibold">{p.value?.toLocaleString('tr')}</span>
        </p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const { user, activeTenantId, activeCompany } = useAuth();

  const hasModule = (mod) => {
    const m = activeCompany?.modules || [];
    return m.includes('*') || m.includes(mod);
  };

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics', 'summary', activeTenantId],
    queryFn: () => api.get('/analytics/summary').then((r) => r.data),
    enabled: !!activeTenantId && (user?.isSuperAdmin || user?.isAgencyUser || hasModule('analytics')),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const { data: resData, isLoading: resLoading } = useQuery({
    queryKey: ['reservations', 'dashboard', activeTenantId],
    queryFn: () => api.get('/reservations?limit=5').then((r) => r.data),
    enabled: !!activeTenantId,
  });

  const { data: pagesData } = useQuery({
    queryKey: ['pages', 'dashboard', activeTenantId],
    queryFn: () => api.get('/pages?limit=1').then((r) => r.data),
    enabled: !!activeTenantId,
  });

  const { data: cmsStats } = useQuery({
    queryKey: ['dashboard-stats', activeTenantId],
    queryFn: () => api.get('/dashboard/stats').then((r) => r.data),
    enabled: !!activeTenantId,
    staleTime: 60 * 1000,
  });

  // Gerçek veri yoksa mock kullan
  const analytics = (analyticsData?.configured === true)
    ? analyticsData
    : mockAnalytics(activeTenantId || '');

  // Uyarıyı sadece GA4 ID hiç girilmemişse göster
  const isMock = !analyticsData?.configured;
  const showDemoWarning = isMock && analyticsData?.reason === 'no_property_id';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi günler' : 'İyi akşamlar';

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {greeting}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Son 7 günün site istatistikleri
          </p>
        </div>
        <div
          className="text-xs font-medium px-3 py-1.5 rounded-lg border"
          style={{ color: 'var(--text-muted)', borderColor: 'var(--border)', background: 'var(--bg-muted)' }}
        >
          Son 7 gün
        </div>
      </div>

      {/* GA4 bağlı değil uyarısı */}
      {showDemoWarning && !analyticsLoading && (
        <div
          className="flex items-start gap-3 rounded-xl border px-4 py-3"
          style={{ borderColor: '#fbbf24', background: '#fffbeb' }}
        >
          <AlertCircle size={16} className="shrink-0 mt-0.5" style={{ color: '#d97706' }} />
          <div className="text-sm">
            <span className="font-semibold" style={{ color: '#92400e' }}>Demo verisi gösteriliyor.</span>
            <span style={{ color: '#78350f' }}> Gerçek analitik için{' '}
              <Link to="/seo" className="underline font-medium">SEO → Google Analytics ID</Link>{' '}
              alanına GA4 ölçüm kimliğinizi girin.
            </span>
          </div>
        </div>
      )}

      {/* Stat kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} iconColor="#6366f1" label="Ziyaretçi" value={analytics.stats?.visitors?.toLocaleString('tr')} trend={analytics.stats?.visitorTrend} isLoading={analyticsLoading} />
        <StatCard icon={Eye} iconColor="#8b5cf6" label="Sayfa Görüntülenme" value={analytics.stats?.pageViews?.toLocaleString('tr')} trend={analytics.stats?.pageViewTrend} isLoading={analyticsLoading} />
        <StatCard icon={MonitorSmartphone} iconColor="#06b6d4" label="Oturum" value={analytics.stats?.sessions?.toLocaleString('tr')} trend={analytics.stats?.sessionTrend} isLoading={analyticsLoading} />
        <StatCard icon={Clock} iconColor="#f59e0b" label="Ort. Oturum Süresi" value={analytics.stats?.avgDuration} isLoading={analyticsLoading} />
      </div>

      {/* Trafik Grafiği + Kaynaklar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Alan grafiği */}
        <div className="lg:col-span-2 rounded-2xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Haftalık Trafik</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Ziyaretçi ve sayfa görüntülenme</p>
            </div>
          </div>
          {analyticsLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={analytics.traffic} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gVisitor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gView" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.14} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="ziyaretçi" name="Ziyaretçi" stroke="#6366f1" strokeWidth={2} fill="url(#gVisitor)" dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
                <Area type="monotone" dataKey="görüntülenme" name="Görüntülenme" stroke="#8b5cf6" strokeWidth={2} fill="url(#gView)" dot={false} activeDot={{ r: 4, fill: '#8b5cf6' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
          <div className="flex items-center gap-4 mt-2 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
            {[{ color: '#6366f1', label: 'Ziyaretçi' }, { color: '#8b5cf6', label: 'Görüntülenme' }].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trafik kaynakları */}
        <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Trafik Kaynakları</p>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Bu haftanın dağılımı</p>
          {analyticsLoading ? (
            <Skeleton className="h-36 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={analytics.sources} cx="50%" cy="50%" innerRadius={42} outerRadius={64} paddingAngle={3} dataKey="value" stroke="none">
                  {analytics.sources?.map((_s, i) => (
                    <Cell key={i} fill={_s.color || '#6366f1'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, n) => [v, n]}
                  contentStyle={{ fontSize: 11, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="space-y-2 mt-2">
            {analytics.sources?.map((s) => (
              <div key={s.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{s.name}</span>
                </div>
                <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{s.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* En çok ziyaret edilen sayfalar */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Sayfa İstatistikleri</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>En çok ziyaret edilen sayfalar</p>
          </div>
          <Link to="/pages" className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
            Tümü <ArrowUpRight size={12} />
          </Link>
        </div>
        {analyticsLoading ? (
          <div className="p-4 space-y-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-muted)' }}>
                {['Sayfa', 'Görüntülenme', 'Oturum', 'Hemen Çıkma'].map((h) => (
                  <th key={h} className="text-left px-5 py-2.5 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {analytics.topPages?.map((p, i) => (
                <tr key={i} className="border-t hover:bg-[var(--bg-muted)] transition-colors" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                      <span className="font-medium truncate max-w-xs" style={{ color: 'var(--text-primary)' }}>{p.title}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{p.views?.toLocaleString('tr')}</span>
                      <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
                        <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.round((p.views / analytics.topPages[0].views) * 100)}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {p.sessions?.toLocaleString('tr')}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      p.bounce < 40 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                      : p.bounce < 55 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                      : 'bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400'
                    }`}>
                      %{p.bounce}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* CMS Özet Kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Yeni Rezervasyon', value: cmsStats?.newReservations ?? '—', to: '/reservations', color: '#6366f1' },
          { label: 'Form Gönderimi',   value: cmsStats?.newForms ?? '—',         to: '/forms',        color: '#f59e0b' },
          { label: 'Yayın Blog',       value: cmsStats?.publishedBlogs ?? '—',   to: '/blog',         color: '#10b981' },
          { label: 'Medya',            value: cmsStats?.totalMedia ?? '—',        to: '/media',        color: '#06b6d4' },
          { label: 'Aktif Popup',      value: cmsStats?.activePopups ?? '—',     to: '/popups',       color: '#8b5cf6' },
        ].map((item) => (
          <Link key={item.to} to={item.to}
            className="rounded-xl border p-4 flex flex-col gap-1 hover:shadow-md transition-shadow"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <span className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Alt satır: Rezervasyonlar + Hızlı Erişim */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Son Rezervasyonlar */}
        <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Son Rezervasyonlar</p>
            <Link to="/reservations" className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
              Tümü <ArrowUpRight size={12} />
            </Link>
          </div>
          <div>
            {resLoading && (
              <div className="p-4 space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            )}
            {resData?.data?.map((r) => (
              <div key={r._id} className="flex items-center justify-between px-5 py-3.5 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{r.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{r.date} · {r.guestCount} kişi</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${resStatusColor[r.status] || ''}`}>
                  {resStatusLabel[r.status] || r.status}
                </span>
              </div>
            ))}
            {!resLoading && !resData?.data?.length && (
              <p className="px-5 py-8 text-sm text-center" style={{ color: 'var(--text-muted)' }}>Henüz rezervasyon yok</p>
            )}
          </div>
        </div>

        {/* Hızlı Erişim */}
        <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Hızlı Erişim</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '+ Yeni Sayfa', to: '/pages/new', color: '#6366f1' },
              { label: 'Medya Yükle', to: '/media', color: '#8b5cf6' },
              { label: 'SEO Ayarları', to: '/seo', color: '#06b6d4' },
              { label: 'Kullanıcı Ekle', to: '/users', color: '#f59e0b' },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl border transition-all hover:shadow-sm hover:-translate-y-px"
                style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', background: 'var(--bg-muted)' }}
              >
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
                {item.label}
              </Link>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
              <span>Toplam Sayfa</span>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{pagesData?.total ?? '—'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
