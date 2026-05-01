import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, FileText, Image, Menu, UtensilsCrossed,
  HeartPulse, Building2, Calendar, Mail, Bell, Search,
  ArrowRightLeft, Globe, Users, ShieldCheck, Settings, Building,
  BookOpen, HelpCircle, Package, Tag, Star, UserCircle,
  Megaphone, ClipboardList,
} from 'lucide-react';

// module: modül adı — Company.modules listesinde yoksa gizlenir (boş liste = hepsi açık)
// agencyOnly: true ise sadece superAdmin veya isAgencyUser görür
const navItems = [
  { label: 'Dashboard',              to: '/dashboard',              icon: LayoutDashboard,  module: 'dashboard' },
  { label: 'Sayfalar',               to: '/pages',                  icon: FileText,          module: 'pages' },
  { label: 'Medya',                  to: '/media',                  icon: Image,             module: 'media' },
  { label: 'Navigasyon',             to: '/menus',                  icon: Menu,              module: 'menus' },
  { label: 'Restoran Menüsü',        to: '/restaurant/menu',        icon: UtensilsCrossed,   module: 'restaurant',   sectors: ['restaurant'] },
  { label: 'Diş Hekimi Hizmetleri', to: '/dental/services',        icon: HeartPulse,         module: 'dental',       sectors: ['dental'] },
  { label: 'Ürünler & Hizmetler',   to: '/services',               icon: Package,            module: 'services',     sectors: ['other', 'beauty', 'service', 'hotel'] },
  { label: 'Emlak İlanları',         to: '/real-estate/properties', icon: Building2,          module: 'real-estate',  sectors: ['real_estate'] },
  { label: 'Rezervasyonlar',         to: '/reservations',           icon: Calendar,           module: 'reservations', sectors: ['restaurant', 'dental', 'beauty', 'hotel', 'service'] },
  { label: 'Form Gönderileri',       to: '/forms',                  icon: Mail,               module: 'forms' },
  { label: 'Bildirimler',            to: '/notifications',          icon: Bell,               module: 'notifications' },
  { label: 'Blog Yazıları',          to: '/blog',                   icon: BookOpen,            module: 'blog' },
  { label: 'Blog Kategorileri',      to: '/blog-categories',        icon: Tag,                module: 'blog-categories' },
  { label: 'SSS Yönetimi',          to: '/faqs',                   icon: HelpCircle,          module: 'faqs' },
  { label: 'Referanslar',            to: '/testimonials',           icon: Star,               module: 'testimonials' },
  { label: 'Ekip',                   to: '/team',                   icon: UserCircle,         module: 'team' },
  { label: 'Popup & Duyurular',      to: '/popups',                 icon: Megaphone,          module: 'popups' },
  { label: 'SEO',                    to: '/seo',                    icon: Search,              module: 'seo' },
  { label: 'Redirect',               to: '/redirects',              icon: ArrowRightLeft,     module: 'redirects' },
  { label: 'Diller',                 to: '/languages',              icon: Globe,               module: 'languages' },
  { label: 'Kullanıcılar',           to: '/users',                  icon: Users,               module: 'users',        agencyOnly: true },
  { label: 'Roller',                 to: '/roles',                  icon: ShieldCheck,         module: 'roles',        superAdminOnly: true },
  { label: 'Firma Ayarları',         to: '/settings',               icon: Settings,            module: 'settings' },
  { label: 'Audit Log',              to: '/audit',                  icon: ClipboardList,       module: 'audit',        agencyOnly: true },
];

const adminItems = [
  { label: 'Firmalar', to: '/companies', icon: Building },
];

export default function Sidebar() {
  const { user, activeCompany, companyLoading } = useAuth();

  const isPrivileged = user?.isSuperAdmin || user?.isAgencyUser;

  const visibleItems = navItems.filter((item) => {
    // Sadece super admin görebilir
    if (item.superAdminOnly && !user?.isSuperAdmin) return false;
    // Sadece ajans/super admin görebilir
    if (item.agencyOnly && !isPrivileged) return false;
    // Sektör kısıtı
    if (item.sectors) {
      if (!isPrivileged) {
        if (companyLoading || !activeCompany) return false;
        if (!item.sectors.includes(activeCompany.sector)) return false;
      }
    }
    // Modül kısıtı — Company.modules boşsa hepsi açık, doluysa sadece listede olanlar
    if (!isPrivileged && item.module && item.module !== 'dashboard') {
      const modules = activeCompany?.modules;
      if (modules && modules.length > 0 && !modules.includes(item.module)) return false;
    }
    // Ajans kullanıcısı modül filtresi (superAdmin hariç) — agencyModules'e göre
    if (user?.isAgencyUser && !user?.isSuperAdmin && item.module && item.module !== 'dashboard') {
      if (!item.agencyOnly) {
        const aModules = user.agencyModules || [];
        if (!aModules.includes('*') && !aModules.includes(item.module)) return false;
      }
    }
    return true;
  });

  return (
    <aside
      className="w-58 shrink-0 border-r flex flex-col"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', width: '232px' }}
    >
      {/* Marka alanı */}
      <div
        className="h-14 flex items-center px-5 border-b gap-2.5"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-bold">N</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Netravox
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400 leading-none">
            CMS
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
        {visibleItems.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/pages'}
            className={({ isActive }) =>
              `group flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 font-medium'
                  : 'hover:bg-[var(--bg-muted)]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={15}
                  className="shrink-0 transition-colors"
                  style={{ color: isActive ? '#6366f1' : 'var(--text-muted)' }}
                />
                <span style={{ color: isActive ? '#6366f1' : 'var(--text-secondary)' }}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}

        {user?.isSuperAdmin && (
          <>
            <div className="pt-5 pb-1.5 px-3">
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Sistem
              </span>
            </div>
            {adminItems.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `group flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 font-medium'
                      : 'hover:bg-[var(--bg-muted)]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={15}
                      className="shrink-0"
                      style={{ color: isActive ? '#6366f1' : 'var(--text-muted)' }}
                    />
                    <span style={{ color: isActive ? '#6366f1' : 'var(--text-secondary)' }}>
                      {label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Alt bilgi */}
      <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
          v1.0 · Netravox CMS
        </p>
      </div>
    </aside>
  );
}
