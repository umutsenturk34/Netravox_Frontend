import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  LayoutDashboard, FileText, Image, Menu, UtensilsCrossed,
  HeartPulse, Building2, Calendar, Mail, Bell, Search,
  ArrowRightLeft, Globe, Users, ShieldCheck, Settings, Building,
  BookOpen, HelpCircle, Package, Tag, Star, UserCircle,
  Megaphone, ClipboardList, ShoppingBag, Settings2, Target, UserCheck,
  Store, Car, FolderOpen, MessageSquare, Boxes, Gift, RefreshCw, BarChart2,
} from 'lucide-react';

// ─── Kurumsal Menü ────────────────────────────────────────────────────────────
const kurumsalItems = [
  { section: 'İçerik' },
  { label: 'Dashboard',          to: '/dashboard',          icon: LayoutDashboard, module: 'dashboard' },
  { label: 'Sayfalar',           to: '/pages',              icon: FileText,         module: 'pages' },
  { label: 'Medya',              to: '/media',              icon: Image,            module: 'media' },
  { label: 'Navigasyon',         to: '/menus',              icon: Menu,             module: 'menus' },
  { label: 'Blog Yazıları',      to: '/blog',               icon: BookOpen,         module: 'blog' },
  { label: 'Blog Kategorileri',  to: '/blog-categories',    icon: Tag,              module: 'blog-categories' },
  { label: 'SSS Yönetimi',       to: '/faqs',               icon: HelpCircle,       module: 'faqs' },
  { label: 'Referanslar',        to: '/testimonials',       icon: Star,             module: 'testimonials' },
  { label: 'Ekip',               to: '/team',               icon: UserCircle,       module: 'team' },
  { label: 'Popup & Duyurular',  to: '/popups',             icon: Megaphone,        module: 'popups' },
  { label: 'Form Gönderileri',   to: '/forms',              icon: Mail,             module: 'forms' },
  { label: 'Meta Lead Ads',      to: '/meta-leads',         icon: Target,           module: 'meta-leads' },
  { label: 'Bildirimler',        to: '/notifications',      icon: Bell,             module: 'notifications' },
  { label: 'Analitik',           to: '/analytics',          icon: BarChart2,        module: 'analytics' },

  { section: 'Sektöre Özel' },
  { label: 'Restoran Menüsü',    to: '/restaurant/menu',        icon: UtensilsCrossed, module: 'restaurant',   sectors: ['restaurant'] },
  { label: 'Rezervasyonlar',     to: '/reservations',           icon: Calendar,         module: 'reservations', sectors: ['restaurant', 'dental', 'beauty', 'hotel', 'clinic', 'fitness'] },
  { label: 'Hizmetler',          to: '/services',               icon: Package,          module: 'services',     sectors: ['dental', 'beauty', 'clinic', 'law', 'accounting', 'architecture', 'agency', 'education', 'fitness', 'service', 'other'] },
  { label: 'Kategoriler',        to: '/categories',             icon: FolderOpen,       module: 'services',     sectors: ['law', 'accounting', 'architecture', 'agency', 'education', 'fitness', 'service', 'other'] },
  { label: 'Diş Hekimi Hizmetleri', to: '/dental/services',    icon: HeartPulse,       module: 'dental',       sectors: ['dental'] },
  { label: 'Emlak İlanları',     to: '/real-estate/properties', icon: Building2,        module: 'real-estate',  sectors: ['real_estate'] },

  { section: 'Ayarlar' },
  { label: 'SEO',                to: '/seo',       icon: Search,        module: 'seo' },
  { label: 'Redirect',           to: '/redirects', icon: ArrowRightLeft, module: 'redirects' },
  { label: 'Diller',             to: '/languages', icon: Globe,          module: 'languages' },
  { label: 'Siteyi Güncelle',    to: '/cache',     icon: RefreshCw,      module: 'cache' },
  { label: 'Kullanıcılar',       to: '/users',     icon: Users,          module: 'users',   agencyOnly: true },
  { label: 'Roller',             to: '/roles',     icon: ShieldCheck,    module: 'roles',   superAdminOnly: true },
  { label: 'Firma Ayarları',     to: '/settings',  icon: Settings,       module: 'settings' },
  { label: 'Audit Log',          to: '/audit',     icon: ClipboardList,  module: 'audit',   agencyOnly: true },
];

// ─── E-Ticaret Menü ───────────────────────────────────────────────────────────
const eticaretItems = [
  { section: 'Mağaza' },
  { label: 'Dashboard',            to: '/dashboard',          icon: LayoutDashboard, module: 'dashboard' },
  { label: 'Ürünler & Hizmetler', to: '/services',            icon: Package,         module: 'services' },
  { label: 'Kategoriler',          to: '/categories',         icon: FolderOpen,      module: 'services' },
  { label: 'Yorumlar',             to: '/reviews',            icon: MessageSquare,   module: 'services' },
  { label: 'Stok Yönetimi',        to: '/stock',              icon: Boxes,           module: 'services' },
  { label: 'Siparişler',           to: '/orders',             icon: ShoppingBag,     module: 'orders',   paymentRequired: true },
  { label: 'Müşteriler',           to: '/customers',          icon: UserCheck,       module: 'customers' },
  { label: 'Kuponlar',             to: '/coupons',            icon: Tag,             module: 'orders',   paymentRequired: true },
  { label: 'Hediye Kartları',      to: '/gift-cards',         icon: Gift,            module: 'orders',   paymentRequired: true },

  { section: 'İçerik' },
  { label: 'Medya',                to: '/media',              icon: Image,           module: 'media' },
  { label: 'Blog Yazıları',        to: '/blog',               icon: BookOpen,        module: 'blog' },
  { label: 'Meta Lead Ads',        to: '/meta-leads',         icon: Target,          module: 'meta-leads' },
  { label: 'Bildirimler',          to: '/notifications',      icon: Bell,            module: 'notifications' },
  { label: 'Analitik',             to: '/analytics',          icon: BarChart2,       module: 'analytics' },

  { section: 'Sektöre Özel' },
  { label: 'Araç Yönetimi',        to: '/services',           icon: Car,             module: 'services',     sectors: ['rent'] },
  { label: 'Restoran Menüsü',      to: '/restaurant/menu',    icon: UtensilsCrossed, module: 'restaurant',   sectors: ['restaurant_order'] },

  { section: 'Ayarlar' },
  { label: 'E-Ticaret Ayarları',   to: '/ecommerce-settings', icon: Store,           module: 'orders' },
  { label: 'SEO',                  to: '/seo',                icon: Search,          module: 'seo' },
  { label: 'Redirect',             to: '/redirects',          icon: ArrowRightLeft,  module: 'redirects' },
  { label: 'Diller',               to: '/languages',          icon: Globe,           module: 'languages' },
  { label: 'Siteyi Güncelle',      to: '/cache',              icon: RefreshCw,       module: 'cache' },
  { label: 'Kullanıcılar',         to: '/users',              icon: Users,           module: 'users',        agencyOnly: true },
  { label: 'Roller',               to: '/roles',              icon: ShieldCheck,     module: 'roles',        superAdminOnly: true },
  { label: 'Firma Ayarları',       to: '/settings',           icon: Settings,        module: 'settings' },
  { label: 'Audit Log',            to: '/audit',              icon: ClipboardList,   module: 'audit',        agencyOnly: true },
];

const adminItems = [
  { label: 'Firmalar',         to: '/companies',       icon: Building },
  { label: 'E-posta Ayarları', to: '/system-settings', icon: Settings2 },
];

function filterItems(items, { user, activeCompany, isPrivileged }) {
  // Sektöre özel bölüm: eğer bölümdeki tüm öğeler gizlenecekse bölüm başlığını da gizle
  const result = [];
  let lastSection = null;
  let lastSectionIndex = -1;
  let sectionHasVisibleItem = false;

  for (const item of items) {
    if (item.section) {
      // Önceki bölümde görünür öğe yoksa bölüm başlığını geri al
      if (lastSectionIndex >= 0 && !sectionHasVisibleItem) {
        result.splice(lastSectionIndex, 1);
      }
      lastSection = item;
      lastSectionIndex = result.length;
      sectionHasVisibleItem = false;
      result.push(item);
      continue;
    }

    if (item.superAdminOnly && !user?.isSuperAdmin) continue;
    if (item.agencyOnly && !isPrivileged) continue;

    if (item.sectors) {
      if (activeCompany?.sector) {
        if (!item.sectors.includes(activeCompany.sector)) continue;
      } else if (!isPrivileged) {
        continue;
      }
    }

    if (item.paymentRequired) {
      if (!activeCompany?.paymentSettings?.iyzico?.enabled) continue;
    }

    if (!isPrivileged && item.module && item.module !== 'dashboard') {
      const modules = activeCompany?.modules;
      if (!modules || modules.length === 0) continue;
      if (!modules.includes('*') && !modules.includes(item.module)) continue;
    }

    if (user?.isAgencyUser && !user?.isSuperAdmin && item.module && item.module !== 'dashboard') {
      if (!item.agencyOnly) {
        const aModules = user.agencyModules || [];
        if (!aModules.includes('*') && !aModules.includes(item.module)) continue;
      }
    }

    sectionHasVisibleItem = true;
    result.push(item);
  }

  // Son bölümde görünür öğe yoksa onu da temizle
  if (lastSectionIndex >= 0 && !sectionHasVisibleItem) {
    result.splice(lastSectionIndex, 1);
  }

  return result;
}

export default function Sidebar() {
  const { user, activeCompany, companyLoading } = useAuth();
  const { theme } = useTheme();

  const isPrivileged = user?.isSuperAdmin || user?.isAgencyUser;
  const companyType = activeCompany?.companyType || 'kurumsal';
  const baseItems = companyType === 'eticaret' ? eticaretItems : kurumsalItems;

  const visibleItems = filterItems(baseItems, { user, activeCompany, isPrivileged });
  const showAdmin = user?.isSuperAdmin || (user?.isAgencyUser && user?.agencyModules?.some((m) => m === '*' || m.startsWith('admin:')));

  return (
    <aside
      className="w-58 shrink-0 border-r flex flex-col"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', width: '232px' }}
    >
      {/* Marka alanı */}
      <div
        className="h-14 flex items-center px-4 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <img
          src={theme === 'dark' ? '/logo-dark.svg' : '/logo-light.svg'}
          alt="Netravox"
          className="h-7 w-auto object-contain"
        />
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
        {visibleItems.map((item, i) => {
          if (item.section) {
            return (
              <div key={`section-${i}`} className="pt-4 pb-1.5 px-3">
                <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  {item.section}
                </span>
              </div>
            );
          }
          const { label, to, icon: Icon } = item;
          return (
            <NavLink
              key={to + label}
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
          );
        })}

        {showAdmin && (
          <>
            <div className="pt-4 pb-1.5 px-3">
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
