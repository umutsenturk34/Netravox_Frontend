import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Users, Eye, MonitorSmartphone, Clock,
  UserPlus, AlertCircle, BarChart2, Globe,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Skeleton } from '../components/ui/Skeleton';

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
      newUsers: n(1840, 600),
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
      className="rounded-2xl border p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
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
          <p className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{value ?? '—'}</p>
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

export default function AnalyticsPage() {
  const { activeTenantId, activeCompany } = useAuth();

  const { data: raw, isLoading } = useQuery({
    queryKey: ['analytics', 'summary', activeTenantId],
    queryFn: () => api.get('/analytics/summary').then((r) => r.data),
    enabled: !!activeTenantId,
    staleTime: 5 * 60 * 1000,
  });

  const isMock = !raw?.configured;
  const data = raw?.configured ? raw : mockAnalytics(activeCompany?.name || '');

  return (
    <div className="space-y-6 pb-10">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Google Analytics 4</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Son 7 günlük trafik raporu</p>
        </div>
        {isMock && !isLoading && (
          <div
            className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border"
            style={{ background: 'var(--bg-muted)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            <AlertCircle size={13} />
            {raw?.reason === 'no_property_id' ? 'GA4 henüz bağlanmadı — örnek veri' : 'GA4 bağlanıyor — örnek veri'}
          </div>
        )}
      </div>

      {/* Stat kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={Users}            iconColor="#6366f1" label="Ziyaretçi"          value={data.stats?.visitors?.toLocaleString('tr')}  trend={data.stats?.visitorTrend}  isLoading={isLoading} />
        <StatCard icon={Eye}              iconColor="#8b5cf6" label="Sayfa Görüntülenme" value={data.stats?.pageViews?.toLocaleString('tr')}  trend={data.stats?.pageViewTrend} isLoading={isLoading} />
        <StatCard icon={MonitorSmartphone} iconColor="#06b6d4" label="Oturum"             value={data.stats?.sessions?.toLocaleString('tr')}   trend={data.stats?.sessionTrend}  isLoading={isLoading} />
        <StatCard icon={UserPlus}         iconColor="#10b981" label="Yeni Kullanıcı"     value={data.stats?.newUsers?.toLocaleString('tr')}   trend={null}                      isLoading={isLoading} />
        <StatCard icon={Clock}            iconColor="#f59e0b" label="Ort. Oturum Süresi" value={data.stats?.avgDuration}                      trend={null}                      isLoading={isLoading} />
      </div>

      {/* Trafik grafiği + Kaynaklar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Alan grafiği */}
        <div
          className="lg:col-span-2 rounded-2xl border p-5"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={15} style={{ color: '#6366f1' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Günlük Trafik</h2>
          </div>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data.traffic} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gVisitor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gView" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="ziyaretçi" name="Ziyaretçi"         stroke="#6366f1" strokeWidth={2} fill="url(#gVisitor)" dot={false} />
                <Area type="monotone" dataKey="görüntülenme" name="Görüntülenme" stroke="#8b5cf6" strokeWidth={2} fill="url(#gView)"    dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Trafik kaynakları */}
        <div
          className="rounded-2xl border p-5"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Globe size={15} style={{ color: '#8b5cf6' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Trafik Kaynakları</h2>
          </div>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="flex flex-col gap-3">
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={data.sources} cx="50%" cy="50%" innerRadius={38} outerRadius={58} paddingAngle={3} dataKey="value" stroke="none">
                    {data.sources?.map((s, i) => <Cell key={i} fill={s.color} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v?.toLocaleString('tr'), n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5">
                {data.sources?.map((s) => (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{s.name}</span>
                    </div>
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{s.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* En çok görüntülenen sayfalar */}
      <div
        className="rounded-2xl border"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2 px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <Eye size={15} style={{ color: '#06b6d4' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>En Çok Görüntülenen Sayfalar</h2>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>— son 7 gün</span>
        </div>
        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Sayfa</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Görüntülenme</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Oturum</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Hemen Çıkma</th>
                </tr>
              </thead>
              <tbody>
                {data.topPages?.map((page, i) => (
                  <tr
                    key={i}
                    style={{ borderBottom: i < data.topPages.length - 1 ? '1px solid var(--border)' : 'none' }}
                  >
                    <td className="px-5 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs w-5 text-center rounded font-bold" style={{ color: 'var(--text-muted)', background: 'var(--bg-muted)', padding: '1px 4px' }}>{i + 1}</span>
                        {page.title}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {page.views?.toLocaleString('tr')}
                    </td>
                    <td className="px-5 py-3 text-right" style={{ color: 'var(--text-secondary)' }}>
                      {page.sessions?.toLocaleString('tr')}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        page.bounce < 40
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : page.bounce < 60
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                          : 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                      }`}>
                        %{page.bounce}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* GA4 bağlantı notu */}
      {isMock && raw?.reason === 'no_property_id' && (
        <div
          className="rounded-2xl border px-5 py-4 flex items-start gap-3"
          style={{ background: 'var(--bg-muted)', borderColor: 'var(--border)' }}
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" style={{ color: '#f59e0b' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>GA4 Henüz Bağlanmadı</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Gerçek veri görmek için <strong>SEO Ayarları → GA4 Property ID</strong> alanını doldurun. Yukarıdaki veriler örnek gösterimdir.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
