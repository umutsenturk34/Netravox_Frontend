import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/client';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Input';
import { TableSkeleton } from '../components/ui/Skeleton';
import { Building2, ChevronRight, Users, Package, Plus, Copy, Check, ShieldCheck, CreditCard, FileText, Banknote, Truck } from 'lucide-react';

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
  { id: 'analytics',       label: 'Analitik (Dashboard)' },
  { id: 'orders',          label: 'Siparişler & Ödemeler' },
];

const KURUMSAL_SECTORS = [
  { value: 'restaurant',   label: 'Restoran / Kafe' },
  { value: 'dental',       label: 'Diş Kliniği' },
  { value: 'beauty',       label: 'Güzellik Salonu' },
  { value: 'hotel',        label: 'Otel / Pansiyon' },
  { value: 'clinic',       label: 'Klinik (Genel)' },
  { value: 'law',          label: 'Hukuk Bürosu' },
  { value: 'accounting',   label: 'Muhasebe' },
  { value: 'architecture', label: 'Mimarlık' },
  { value: 'agency',       label: 'Dijital Ajans' },
  { value: 'education',    label: 'Eğitim / Kurs' },
  { value: 'fitness',      label: 'Spor Salonu' },
  { value: 'real_estate',  label: 'Gayrimenkul' },
  { value: 'service',      label: 'Genel Hizmet' },
  { value: 'other',        label: 'Diğer' },
];

const ETICARET_SECTORS = [
  { value: 'retail',           label: 'Genel Perakende / Giyim' },
  { value: 'fashion',          label: 'Premium Moda' },
  { value: 'food',             label: 'Gıda (Paketli Ürün)' },
  { value: 'cosmetics',        label: 'Kozmetik' },
  { value: 'sports',           label: 'Spor Malzemeleri' },
  { value: 'home_living',      label: 'Ev & Yaşam' },
  { value: 'jewelry',          label: 'Takı & Aksesuar' },
  { value: 'rent',             label: 'Araç / Ekipman Kiralama' },
  { value: 'restaurant_order', label: 'Restoran (Online Sipariş)' },
];

const toSlug = (str) =>
  str.toLowerCase().replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="p-1 rounded hover:bg-[var(--bg-muted)] transition-colors" title="Kopyala">
      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} style={{ color: 'var(--text-muted)' }} />}
    </button>
  );
}

function ModulesTab({ company, onSaved }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const allOpen = company.modules?.includes('*') || false;
  const [allModulesAccess, setAllModulesAccess] = useState(allOpen);
  const [selected, setSelected] = useState(allOpen ? [] : (company.modules || []));

  const mutation = useMutation({
    mutationFn: (modules) => api.patch(`/companies/${company._id}/modules`, { modules }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Modüller kaydedildi');
      onSaved?.();
    },
    onError: () => toast.error('Kaydedilemedi'),
  });

  const toggle = (id) => setSelected((p) => p.includes(id) ? p.filter((m) => m !== id) : [...p, id]);

  const save = () => {
    mutation.mutate(allModulesAccess ? ['*'] : selected);
  };

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2.5 cursor-pointer px-3 py-2.5 rounded-lg border" style={{ borderColor: 'var(--border)' }}>
        <input
          type="checkbox"
          checked={allModulesAccess}
          onChange={(e) => { setAllModulesAccess(e.target.checked); setSelected([]); }}
          className="w-4 h-4 accent-indigo-600"
        />
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Tüm modüller açık</span>
      </label>

      {!allModulesAccess && (
        <div className="grid grid-cols-2 gap-1.5">
          {ALL_MODULES.map((m) => (
            <label key={m.id} className="flex items-center gap-2 cursor-pointer px-2.5 py-2 rounded-lg hover:bg-[var(--bg-muted)] border" style={{ borderColor: selected.includes(m.id) ? '#6366f1' : 'var(--border)', background: selected.includes(m.id) ? 'rgba(99,102,241,0.05)' : undefined }}>
              <input
                type="checkbox"
                checked={selected.includes(m.id)}
                onChange={() => toggle(m.id)}
                className="w-3.5 h-3.5 accent-indigo-600"
              />
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{m.label}</span>
            </label>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center pt-2">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {allModulesAccess ? 'Tüm modüller açık' : `${selected.length} modül seçili`}
        </span>
        <Button onClick={save} disabled={mutation.isPending} size="sm">
          {mutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </div>
    </div>
  );
}

function UsersTab({ company }) {
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const canManageUsers =
    authUser?.isSuperAdmin ||
    (authUser?.isAgencyUser &&
      (authUser?.agencyModules?.includes('*') || authUser?.agencyModules?.includes('admin:users')));
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', roleId: '' });
  const [generatedPwd, setGeneratedPwd] = useState(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['company-users', company._id],
    queryFn: () => api.get(`/companies/${company._id}/users`).then((r) => r.data),
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles-system'],
    queryFn: () => api.get('/roles', { headers: { 'x-tenant-id': company._id } }).then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post(`/companies/${company._id}/users`, data).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['company-users', company._id] });
      setGeneratedPwd({ email: data.email, password: data.temporaryPassword });
      setNewUser({ name: '', email: '', roleId: '' });
      setShowCreate(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Oluşturulamadı'),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }) => api.patch(`/users/${id}`, { isActive }, { headers: { 'x-tenant-id': company._id } }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['company-users', company._id] }),
    onError: () => toast.error('Güncellenemedi'),
  });

  const resetPassword = useMutation({
    mutationFn: (userId) => api.post(`/companies/${company._id}/users/${userId}/reset-password`).then((r) => r.data),
    onSuccess: (data) => setGeneratedPwd({ email: data.email, password: data.temporaryPassword }),
    onError: () => toast.error('Şifre sıfırlanamadı'),
  });

  const assignableRoles = roles.filter((r) => !['super_admin', 'agency_admin'].includes(r.name));

  return (
    <div className="space-y-4">
      {generatedPwd && (
        <div className="p-4 rounded-xl border-2 border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">⚠️ Geçici şifre — yalnızca bir kez gösterilir!</p>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>E-posta: {generatedPwd.email}</span>
            <CopyButton text={generatedPwd.email} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono font-bold" style={{ color: 'var(--text-primary)' }}>{generatedPwd.password}</span>
            <CopyButton text={generatedPwd.password} />
          </div>
          <button
            onClick={() => setGeneratedPwd(null)}
            className="mt-2 text-xs text-amber-700 dark:text-amber-400 underline"
          >
            Anladım, kapat
          </button>
        </div>
      )}

      {isLoading ? (
        <TableSkeleton rows={3} cols={3} />
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <table className="w-full text-sm">
            <thead style={{ background: 'var(--bg-muted)' }}>
              <tr>
                {['Ad', 'E-posta', 'Rol', 'Durum', 'İşlemler'].map((h, i) => (
                  <th key={i} className="text-left px-3 py-2.5 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody style={{ background: 'var(--bg-surface)' }}>
              {users.map((u) => {
                const roleEntry = u.companyRoles?.find((cr) => cr.tenantId?.toString() === company._id);
                const roleName = roleEntry?.roleId?.label?.tr || roleEntry?.roleId?.name || '—';
                return (
                  <tr key={u._id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-3 py-2.5 font-medium text-xs" style={{ color: 'var(--text-primary)' }}>{u.name}</td>
                    <td className="px-3 py-2.5 text-xs" style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td className="px-3 py-2.5 text-xs" style={{ color: 'var(--text-secondary)' }}>{roleName}</td>
                    <td className="px-3 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {u.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleActive.mutate({ id: u._id, isActive: !u.isActive })}
                          className={`text-xs px-2 py-1 rounded ${u.isActive ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20' : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20'}`}
                        >
                          {u.isActive ? 'Pasife al' : 'Aktifleştir'}
                        </button>
                        {canManageUsers && (
                          <button
                            onClick={() => resetPassword.mutate(u._id)}
                            disabled={resetPassword.isPending}
                            className="text-xs px-2 py-1 rounded text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                          >
                            Şifre sıfırla
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!users.length && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                    Henüz kullanıcı yok
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {canManageUsers && (showCreate ? (
        <div className="p-4 rounded-xl border space-y-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Yeni Kullanıcı</p>
          <Input label="Ad Soyad" value={newUser.name} onChange={(e) => setNewUser((p) => ({ ...p, name: e.target.value }))} placeholder="Ad Soyad" />
          <Input label="E-posta" type="email" value={newUser.email} onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))} placeholder="kullanici@firma.com" />
          <Select label="Rol" value={newUser.roleId} onChange={(e) => setNewUser((p) => ({ ...p, roleId: e.target.value }))}>
            <option value="">Rol seç</option>
            {assignableRoles.map((r) => <option key={r._id} value={r._id}>{r.label?.tr || r.name}</option>)}
          </Select>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" size="sm" onClick={() => setShowCreate(false)}>İptal</Button>
            <Button size="sm" onClick={() => createMutation.mutate(newUser)} disabled={createMutation.isPending || !newUser.name || !newUser.email || !newUser.roleId}>
              {createMutation.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="secondary" size="sm" onClick={() => setShowCreate(true)}>
          <Plus size={14} className="mr-1" /> Kullanıcı Ekle
        </Button>
      ))}
    </div>
  );
}

export default function CompaniesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [managingCompany, setManagingCompany] = useState(null);
  const [manageTab, setManageTab] = useState('modules');
  const [form, setForm] = useState({ name: '', slug: '', companyType: 'kurumsal', sector: 'other' });

  const hasAdminModule = (mod) =>
    user?.isSuperAdmin ||
    (user?.isAgencyUser &&
      (user?.agencyModules?.includes('*') || user?.agencyModules?.includes(mod)));

  const canAccessPage =
    user?.isSuperAdmin ||
    (user?.isAgencyUser && user?.agencyModules?.some((m) => m === '*' || m.startsWith('admin:')));

  if (!canAccessPage) {
    return <p style={{ color: 'var(--text-muted)' }}>Bu sayfaya erişim yetkiniz yok.</p>;
  }

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => api.get('/companies').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/companies', { ...data, modules: [] }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Firma oluşturuldu');
      setShowCreateModal(false);
      setForm({ name: '', slug: '', companyType: 'kurumsal', sector: 'other' });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Oluşturulamadı'),
  });

  const toggleCompanyActive = useMutation({
    mutationFn: ({ id, isActive }) => api.patch(`/companies/${id}`, { isActive }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
    onError: () => toast.error('Güncellenemedi'),
  });

  const openManage = (company) => {
    setManagingCompany(company);
    setManageTab('modules');
  };

  const getModuleLabel = (company) => {
    const m = company.modules || [];
    if (m.includes('*')) return { text: 'Tüm modüller açık', color: 'bg-green-100 text-green-700' };
    if (m.length === 0) return { text: 'Kapalı', color: 'bg-gray-100 text-gray-500' };
    return { text: `${m.length} modül`, color: 'bg-indigo-100 text-indigo-700' };
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Firma Yönetimi</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Firmalar, modüller ve kullanıcılar</p>
        </div>
        {user?.isSuperAdmin && (
          <Button onClick={() => setShowCreateModal(true)}>+ Firma Ekle</Button>
        )}
      </div>

      {isLoading ? (
        <TableSkeleton rows={3} cols={4} />
      ) : (
        <div className="space-y-3">
          {companies.map((c) => {
            const ml = getModuleLabel(c);
            return (
              <div
                key={c._id}
                className="rounded-xl border p-4 flex items-center justify-between hover:bg-[var(--bg-muted)] transition-colors"
                style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0">
                    <Building2 size={18} className="text-indigo-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{c.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {c.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{c.slug}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>·</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${ml.color}`}>{ml.text}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${c.companyType === 'eticaret' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400'}`}>
                        {c.companyType === 'eticaret' ? '🛒 E-Ticaret' : '🏢 Kurumsal'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {hasAdminModule('admin:companies') && (
                    <button
                      onClick={() => toggleCompanyActive.mutate({ id: c._id, isActive: !c.isActive })}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                        c.isActive
                          ? 'border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
                          : 'border-green-200 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30'
                      }`}
                    >
                      {c.isActive ? 'Pasife Al' : 'Aktifleştir'}
                    </button>
                  )}
                  <button
                    onClick={() => openManage(c)}
                    className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg hover:bg-[var(--bg-muted)] transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Yönet <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Firma Oluştur Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Yeni Firma"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>İptal</Button>
            <Button
              onClick={() => createMutation.mutate(form)}
              disabled={!form.name || !form.slug || createMutation.isPending}
            >
              {createMutation.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Firma Adı"
            value={form.name}
            onChange={(e) => {
              const name = e.target.value;
              setForm((p) => ({ ...p, name, slug: toSlug(name) }));
            }}
            placeholder="Taku Streetwear"
          />
          <Input
            label="Slug"
            value={form.slug}
            onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
            placeholder="taku-streetwear"
          />
          <Select
            label="Firma Tipi"
            value={form.companyType}
            onChange={(e) => {
              const t = e.target.value;
              setForm((p) => ({ ...p, companyType: t, sector: t === 'eticaret' ? 'retail' : 'other' }));
            }}
          >
            <option value="kurumsal">🏢 Kurumsal</option>
            <option value="eticaret">🛒 E-Ticaret</option>
          </Select>
          <Select label="Sektör" value={form.sector} onChange={(e) => setForm((p) => ({ ...p, sector: e.target.value }))}>
            {(form.companyType === 'eticaret' ? ETICARET_SECTORS : KURUMSAL_SECTORS).map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </Select>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Firma oluşturulduktan sonra modüller ve kullanıcılar Yönet panelinden ayarlanır.
          </p>
        </div>
      </Modal>

      {/* Firma Yönet Modal */}
      {managingCompany && (
        <Modal
          isOpen={!!managingCompany}
          onClose={() => setManagingCompany(null)}
          title={managingCompany.name}
          size="lg"
        >
          <div>
            <div className="flex gap-1 p-1 rounded-lg mb-5 w-fit" style={{ background: 'var(--bg-muted)' }}>
              {[
                { id: 'modules',  label: 'Modüller',    icon: Package,    always: true },
                { id: 'users',    label: 'Kullanıcılar',icon: Users,      adminMod: 'admin:users' },
                { id: 'security', label: 'Güvenlik',    icon: ShieldCheck,adminMod: 'admin:security' },
                { id: 'payment',   label: 'İyzico',      icon: CreditCard, adminMod: 'admin:companies' },
                { id: 'paytr',    label: 'PayTR',       icon: CreditCard, adminMod: 'admin:companies' },
                { id: 'bank',     label: 'Havale/EFT',  icon: Banknote,   adminMod: 'admin:companies' },
                { id: 'cod',      label: 'Kapıda',      icon: Truck,      adminMod: 'admin:companies' },
                { id: 'parasut',  label: 'e-Fatura',    icon: FileText,   adminMod: 'admin:companies' },
              ].filter((t) => t.always || hasAdminModule(t.adminMod)).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setManageTab(id)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    manageTab === id ? 'bg-white dark:bg-zinc-800 shadow-sm' : 'hover:bg-[var(--bg-surface)]'
                  }`}
                  style={{ color: manageTab === id ? 'var(--text-primary)' : 'var(--text-muted)' }}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>

            {manageTab === 'modules' && (
              <ModulesTab company={managingCompany} onSaved={() => {}} />
            )}
            {manageTab === 'users' && (
              <UsersTab company={managingCompany} />
            )}
            {manageTab === 'security' && (
              <SecurityTab company={managingCompany} />
            )}
            {manageTab === 'payment' && (
              <PaymentTab company={managingCompany} />
            )}
            {manageTab === 'paytr' && (
              <PaytrTab company={managingCompany} />
            )}
            {manageTab === 'bank' && (
              <BankTransferTab company={managingCompany} />
            )}
            {manageTab === 'cod' && (
              <CashOnDeliveryTab company={managingCompany} />
            )}
            {manageTab === 'parasut' && (
              <ParasutTab company={managingCompany} />
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

function SecurityTab({ company }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [otpRequired, setOtpRequired] = useState(company.security?.otpRequired ?? false);

  const mutation = useMutation({
    mutationFn: (val) => api.patch(`/companies/${company._id}/security`, { otpRequired: val }).then((r) => r.data),
    onSuccess: (data) => {
      setOtpRequired(data.security.otpRequired);
      qc.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Güvenlik ayarları kaydedildi');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Kaydedilemedi'),
  });

  return (
    <div className="space-y-4">
      <div
        className="flex items-center justify-between rounded-xl p-4"
        style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: otpRequired ? 'rgba(99,102,241,0.12)' : 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <ShieldCheck size={16} className={otpRequired ? 'text-indigo-500' : ''} style={{ color: otpRequired ? undefined : 'var(--text-muted)' }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              İki Faktörlü Doğrulama (2FA)
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Açık olduğunda bu firmanın tüm kullanıcıları Google Authenticator ile giriş yapmak zorunda kalır.
            </p>
          </div>
        </div>
        <button
          onClick={() => mutation.mutate(!otpRequired)}
          disabled={mutation.isPending}
          className="relative shrink-0 w-11 h-6 rounded-full transition-colors ml-4"
          style={{ background: otpRequired ? '#6366f1' : 'var(--border)' }}
        >
          <span
            className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
            style={{ transform: otpRequired ? 'translateX(20px)' : 'translateX(0)' }}
          />
        </button>
      </div>

      {otpRequired && (
        <div className="rounded-xl px-4 py-3 text-xs"
          style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: 'var(--text-muted)' }}>
          2FA aktif — Bu firmanın kullanıcıları her girişte e-postalarına gelen 6 haneli kodu girmek zorunda kalacak.
        </div>
      )}
    </div>
  );
}

const MASKED    = '••••••••';
const KEY_RE    = /^[a-zA-Z0-9\-]{20,}$/;
const PREFIX_RE = /^[A-Z]{2,6}$/;

function paymentErrors(form) {
  const e = {};
  if (form.apiKey && form.apiKey !== MASKED && !KEY_RE.test(form.apiKey))
    e.apiKey = 'En az 20 karakter, yalnızca harf · rakam · tire (-)';
  if (form.secretKey && form.secretKey !== MASKED && !KEY_RE.test(form.secretKey))
    e.secretKey = 'En az 20 karakter, yalnızca harf · rakam · tire (-)';
  const tax = Number(form.taxRate);
  if (isNaN(tax) || tax < 0 || tax > 100 || !Number.isInteger(tax))
    e.taxRate = '0–100 arasında tam sayı (örn: 20)';
  if (!PREFIX_RE.test(form.invoicePrefix))
    e.invoicePrefix = '2–6 büyük İngilizce harf (örn: INV, FAT, ORD)';
  return e;
}

function PaymentTab({ company }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    enabled:       company.paymentSettings?.iyzico?.enabled   ?? false,
    apiKey:        '',
    secretKey:     '',
    sandbox:       company.paymentSettings?.iyzico?.sandbox   ?? true,
    testMode:      company.paymentSettings?.iyzico?.testMode  ?? false,
    taxRate:       company.paymentSettings?.taxRate           ?? 20,
    currency:      company.paymentSettings?.currency          || 'TRY',
    invoicePrefix: company.paymentSettings?.invoicePrefix     || 'INV',
  });
  const [testing, setTesting]         = useState(false);
  const [editApiKey, setEditApiKey]   = useState(false);
  const [editSecretKey, setEditSecretKey] = useState(false);
  const [hasApiKey, setHasApiKey]     = useState(false);
  const [hasSecretKey, setHasSecretKey] = useState(false);

  const { data: paymentData } = useQuery({
    queryKey: ['company-payment', company._id],
    queryFn: () => api.get(`/companies/${company._id}/payment`).then((r) => r.data),
  });

  useEffect(() => {
    if (!paymentData) return;
    const apiKey    = paymentData.iyzico?.apiKey    || '';
    const secretKey = paymentData.iyzico?.secretKey || '';
    setHasApiKey(!!apiKey);
    setHasSecretKey(!!secretKey);
    setForm((p) => ({
      ...p,
      enabled:       paymentData.iyzico?.enabled   ?? false,
      apiKey,
      secretKey,
      sandbox:       paymentData.iyzico?.sandbox   ?? true,
      testMode:      paymentData.iyzico?.testMode  ?? false,
      taxRate:       paymentData.taxRate            ?? 20,
      currency:      paymentData.currency           || 'TRY',
      invoicePrefix: paymentData.invoicePrefix      || 'INV',
    }));
  }, [paymentData]);

  const errs      = paymentErrors(form);
  const hasErrors = Object.values(errs).some(Boolean);
  const canSave   = !hasErrors && (!form.enabled || (
    (hasApiKey || form.apiKey) && (hasSecretKey || form.secretKey)
  ));
  const canTest   = !errs.apiKey && form.apiKey && form.apiKey !== MASKED;

  const save = useMutation({
    mutationFn: () => api.patch(`/companies/${company._id}/payment`, {
      iyzico: {
        enabled:  form.enabled,
        apiKey:   (hasApiKey && !editApiKey) ? MASKED : form.apiKey,
        secretKey:(hasSecretKey && !editSecretKey) ? MASKED : form.secretKey,
        sandbox:  form.sandbox,
        testMode: form.testMode,
      },
      taxRate: Number(form.taxRate),
      currency: form.currency,
      invoicePrefix: form.invoicePrefix,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company-payment', company._id] });
      toast.success('Ödeme ayarları kaydedildi');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Kaydedilemedi'),
  });

  const testConnection = async () => {
    setTesting(true);
    try {
      await api.post(`/companies/${company._id}/payment/test`);
      toast.success('İyzico bağlantısı başarılı');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Bağlantı başarısız — API Key / Secret Key doğrulayın');
    } finally {
      setTesting(false);
    }
  };

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="space-y-5">
      {/* İyzico toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl border"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>İyzico Ödeme Sistemi</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Aktif edilince müşteri sitesinde ödeme alınabilir.</p>
        </div>
        <button type="button" onClick={() => set('enabled', !form.enabled)}
          className="relative shrink-0 w-11 h-6 rounded-full transition-colors ml-4"
          style={{ background: form.enabled ? '#6366f1' : 'var(--border)' }}>
          <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
            style={{ transform: form.enabled ? 'translateX(20px)' : 'translateX(0)' }} />
        </button>
      </div>

      {/* API Credentials */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            İyzico API Key
          </label>
          <div className="flex gap-2">
            <input
              className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none transition-colors"
              style={{
                borderColor: errs.apiKey ? '#ef4444' : 'var(--border)',
                background: (hasApiKey && !editApiKey) ? 'var(--bg-muted)' : 'var(--bg-surface)',
                color: 'var(--text-primary)',
                opacity: (hasApiKey && !editApiKey) ? 0.7 : 1,
              }}
              value={editApiKey ? form.apiKey : (hasApiKey ? form.apiKey : form.apiKey)}
              onChange={(e) => set('apiKey', e.target.value.trim())}
              placeholder="sandbox-AbCdEfGhIjKlMnOpQrSt"
              disabled={hasApiKey && !editApiKey}
            />
            {hasApiKey && (
              <button
                type="button"
                onClick={() => { setEditApiKey(!editApiKey); if (editApiKey) set('apiKey', ''); }}
                className="px-3 py-2 rounded-lg text-xs font-semibold border transition-colors shrink-0"
                style={{
                  borderColor: editApiKey ? '#ef4444' : 'var(--border)',
                  color: editApiKey ? '#ef4444' : 'var(--text-secondary)',
                  background: 'var(--bg-surface)',
                }}
              >
                {editApiKey ? 'İptal' : 'Değiştir'}
              </button>
            )}
          </div>
          {errs.apiKey && <p className="text-xs mt-1 text-red-500">{errs.apiKey}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            İyzico Secret Key
          </label>
          <div className="flex gap-2">
            <input
              className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none transition-colors"
              style={{
                borderColor: errs.secretKey ? '#ef4444' : 'var(--border)',
                background: (hasSecretKey && !editSecretKey) ? 'var(--bg-muted)' : 'var(--bg-surface)',
                color: 'var(--text-primary)',
                opacity: (hasSecretKey && !editSecretKey) ? 0.7 : 1,
              }}
              type="password"
              value={editSecretKey ? form.secretKey : (hasSecretKey ? form.secretKey : form.secretKey)}
              onChange={(e) => set('secretKey', e.target.value.trim())}
              placeholder="••••••••"
              disabled={hasSecretKey && !editSecretKey}
            />
            {hasSecretKey && (
              <button
                type="button"
                onClick={() => { setEditSecretKey(!editSecretKey); if (editSecretKey) set('secretKey', ''); }}
                className="px-3 py-2 rounded-lg text-xs font-semibold border transition-colors shrink-0"
                style={{
                  borderColor: editSecretKey ? '#ef4444' : 'var(--border)',
                  color: editSecretKey ? '#ef4444' : 'var(--text-secondary)',
                  background: 'var(--bg-surface)',
                }}
              >
                {editSecretKey ? 'İptal' : 'Değiştir'}
              </button>
            )}
          </div>
          {errs.secretKey && <p className="text-xs mt-1 text-red-500">{errs.secretKey}</p>}
        </div>
      </div>

      {/* Sandbox API toggle */}
      <div className="flex items-center justify-between p-3 rounded-xl border"
        style={{ borderColor: 'var(--border)' }}>
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Sandbox API</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Açık: sandbox.iyzipay.com — test credentials kullanılır. Kapalı: canlı üretim API.</p>
        </div>
        <button type="button" onClick={() => set('sandbox', !form.sandbox)}
          className="relative shrink-0 w-11 h-6 rounded-full transition-colors"
          style={{ background: form.sandbox ? '#6366f1' : 'var(--border)' }}>
          <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
            style={{ transform: form.sandbox ? 'translateX(20px)' : 'translateX(0)' }} />
        </button>
      </div>

      {/* Test Mode toggle */}
      <div className="flex items-center justify-between p-3 rounded-xl border"
        style={{ borderColor: 'var(--border)' }}>
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Simülasyon Modu</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Açık: iyzico'ya bağlanmadan sahte form gösterilir (geliştirme). Kapalı: gerçek iyzico formu.</p>
        </div>
        <button type="button" onClick={() => set('testMode', !form.testMode)}
          className="relative shrink-0 w-11 h-6 rounded-full transition-colors"
          style={{ background: form.testMode ? '#f59e0b' : 'var(--border)' }}>
          <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
            style={{ transform: form.testMode ? 'translateX(20px)' : 'translateX(0)' }} />
        </button>
      </div>

      {/* Fatura ayarları */}
      <div className="grid grid-cols-3 gap-3">
        <Input
          label="KDV Oranı (%)"
          type="number"
          min={0} max={100}
          value={form.taxRate}
          onChange={(e) => set('taxRate', e.target.value === '' ? '' : Number(e.target.value))}
          error={errs.taxRate}
        />
        <Select
          label="Para Birimi"
          value={form.currency}
          onChange={(e) => set('currency', e.target.value)}
        >
          <option value="TRY">TRY — Türk Lirası</option>
          <option value="USD">USD — Dolar</option>
          <option value="EUR">EUR — Euro</option>
        </Select>
        <Input
          label="Fatura Prefix"
          value={form.invoicePrefix}
          onChange={(e) => set('invoicePrefix', e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6))}
          placeholder="INV"
          error={errs.invoicePrefix}
        />
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={testConnection} disabled={testing || !canTest}>
          {testing ? 'Test ediliyor...' : 'Bağlantıyı Test Et'}
        </Button>
        <Button onClick={() => save.mutate()} disabled={save.isPending || !canSave}>
          {save.isPending ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </div>
    </div>
  );
}

const MASKED_P = '••••••••';

function ParasutTab({ company }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    enabled:      false,
    companyId:    '',
    clientId:     '',
    clientSecret: '',
    username:     '',
    password:     '',
  });
  const [editSecret, setEditSecret] = useState(false);
  const [editPass,   setEditPass]   = useState(false);
  const [hasSecret,  setHasSecret]  = useState(false);
  const [hasPass,    setHasPass]    = useState(false);

  const { data } = useQuery({
    queryKey: ['company-parasut', company._id],
    queryFn:  () => api.get(`/companies/${company._id}/parasut`).then((r) => r.data),
  });

  useEffect(() => {
    if (!data) return;
    setHasSecret(!!data.clientSecret);
    setHasPass(!!data.password);
    setForm({
      enabled:      data.enabled      ?? false,
      companyId:    data.companyId    || '',
      clientId:     data.clientId     || '',
      clientSecret: data.clientSecret || '',
      username:     data.username     || '',
      password:     data.password     || '',
    });
  }, [data]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const save = useMutation({
    mutationFn: () => api.patch(`/companies/${company._id}/parasut`, {
      enabled:      form.enabled,
      companyId:    form.companyId  || null,
      clientId:     form.clientId   || null,
      username:     form.username   || null,
      clientSecret: (hasSecret && !editSecret) ? MASKED_P : form.clientSecret,
      password:     (hasPass   && !editPass)   ? MASKED_P : form.password,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company-parasut', company._id] });
      toast.success('Paraşüt ayarları kaydedildi');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Kaydedilemedi'),
  });

  return (
    <div className="space-y-5">
      <div className="p-3 rounded-xl border text-xs" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
        Paraşüt entegrasyonu aktifken, iyzico üzerinden ödeme alınan her sipariş için otomatik olarak <strong>e-Arşiv Fatura</strong> oluşturulur.
        Paraşüt hesabınızdan <strong>API Uygulaması</strong> oluşturup aşağıdaki alanları doldurun.
      </div>

      <div className="flex items-center justify-between p-4 rounded-xl border"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Otomatik e-Arşiv Fatura</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Ödeme tamamlandığında Paraşüt üzerinden fatura oluşturulur.</p>
        </div>
        <button type="button" onClick={() => set('enabled', !form.enabled)}
          className="relative shrink-0 w-11 h-6 rounded-full transition-colors ml-4"
          style={{ background: form.enabled ? '#6366f1' : 'var(--border)' }}>
          <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
            style={{ transform: form.enabled ? 'translateX(20px)' : 'translateX(0)' }} />
        </button>
      </div>

      <div className="space-y-3">
        <Input label="Paraşüt Firma ID" value={form.companyId}
          onChange={(e) => set('companyId', e.target.value.trim())} placeholder="123456" />
        <Input label="Client ID (Uygulama Kimliği)" value={form.clientId}
          onChange={(e) => set('clientId', e.target.value.trim())} placeholder="parasut-uygulama-id" />

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Client Secret</label>
          <div className="flex gap-2">
            <input type="password"
              className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
              style={{ borderColor: 'var(--border)', background: (hasSecret && !editSecret) ? 'var(--bg-muted)' : 'var(--bg-surface)', color: 'var(--text-primary)', opacity: (hasSecret && !editSecret) ? 0.7 : 1 }}
              value={form.clientSecret} onChange={(e) => set('clientSecret', e.target.value)}
              placeholder="••••••••" disabled={hasSecret && !editSecret} />
            {hasSecret && (
              <button type="button" onClick={() => { setEditSecret(!editSecret); if (editSecret) set('clientSecret', ''); }}
                className="px-3 py-2 rounded-lg text-xs font-semibold border shrink-0"
                style={{ borderColor: editSecret ? '#ef4444' : 'var(--border)', color: editSecret ? '#ef4444' : 'var(--text-secondary)', background: 'var(--bg-surface)' }}>
                {editSecret ? 'İptal' : 'Değiştir'}
              </button>
            )}
          </div>
        </div>

        <Input label="Paraşüt Kullanıcı Adı (E-posta)" value={form.username}
          onChange={(e) => set('username', e.target.value.trim())} placeholder="siz@email.com" />

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Paraşüt Şifresi</label>
          <div className="flex gap-2">
            <input type="password"
              className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
              style={{ borderColor: 'var(--border)', background: (hasPass && !editPass) ? 'var(--bg-muted)' : 'var(--bg-surface)', color: 'var(--text-primary)', opacity: (hasPass && !editPass) ? 0.7 : 1 }}
              value={form.password} onChange={(e) => set('password', e.target.value)}
              placeholder="••••••••" disabled={hasPass && !editPass} />
            {hasPass && (
              <button type="button" onClick={() => { setEditPass(!editPass); if (editPass) set('password', ''); }}
                className="px-3 py-2 rounded-lg text-xs font-semibold border shrink-0"
                style={{ borderColor: editPass ? '#ef4444' : 'var(--border)', color: editPass ? '#ef4444' : 'var(--text-secondary)', background: 'var(--bg-surface)' }}>
                {editPass ? 'İptal' : 'Değiştir'}
              </button>
            )}
          </div>
        </div>
      </div>

      <Button onClick={() => save.mutate()} disabled={save.isPending}>
        {save.isPending ? 'Kaydediliyor...' : 'Kaydet'}
      </Button>
    </div>
  );
}

// ── PayTR ─────────────────────────────────────────────────────────────────────
const MK = '••••••••';

function PaytrTab({ company }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({ enabled: false, merchantId: '', merchantKey: '', merchantSalt: '', testMode: true });
  const [editKey,  setEditKey]  = useState(false);
  const [editSalt, setEditSalt] = useState(false);
  const [hasKey,   setHasKey]   = useState(false);
  const [hasSalt,  setHasSalt]  = useState(false);

  const { data } = useQuery({
    queryKey: ['company-paytr', company._id],
    queryFn: () => api.get(`/companies/${company._id}/paytr`).then((r) => r.data),
  });

  useEffect(() => {
    if (!data) return;
    setHasKey(!!data.merchantKey); setHasSalt(!!data.merchantSalt);
    setForm({ enabled: data.enabled ?? false, merchantId: data.merchantId || '', merchantKey: data.merchantKey || '', merchantSalt: data.merchantSalt || '', testMode: data.testMode ?? true });
  }, [data]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const save = useMutation({
    mutationFn: () => api.patch(`/companies/${company._id}/paytr`, {
      enabled: form.enabled, merchantId: form.merchantId, testMode: form.testMode,
      merchantKey:  (hasKey  && !editKey)  ? MK : form.merchantKey,
      merchantSalt: (hasSalt && !editSalt) ? MK : form.merchantSalt,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['company-paytr', company._id] }); toast.success('PayTR ayarları kaydedildi'); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Kaydedilemedi'),
  });

  return (
    <div className="space-y-5">
      <div className="p-3 rounded-xl border text-xs" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
        PayTR entegrasyonu aktifken müşteriler iFrame ödeme formuyla ödeme yapabilir. Bilgileri PayTR Merchant panelinden alabilirsiniz.
      </div>

      {/* Etkinleştir */}
      <div className="flex items-center justify-between p-4 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>PayTR Ödeme</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Aktif edilince checkout'ta PayTR seçeneği görünür.</p>
        </div>
        <button type="button" onClick={() => set('enabled', !form.enabled)} className="relative shrink-0 w-11 h-6 rounded-full transition-colors ml-4" style={{ background: form.enabled ? '#6366f1' : 'var(--border)' }}>
          <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform" style={{ transform: form.enabled ? 'translateX(20px)' : 'translateX(0)' }} />
        </button>
      </div>

      {/* Test modu */}
      <div className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Test Modu</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Gerçek para çekilmez; PayTR test ortamı kullanılır.</p>
        </div>
        <button type="button" onClick={() => set('testMode', !form.testMode)} className="relative shrink-0 w-11 h-6 rounded-full transition-colors" style={{ background: form.testMode ? '#f59e0b' : 'var(--border)' }}>
          <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform" style={{ transform: form.testMode ? 'translateX(20px)' : 'translateX(0)' }} />
        </button>
      </div>

      <div className="space-y-3">
        <Input label="Merchant ID" value={form.merchantId} onChange={(e) => set('merchantId', e.target.value.trim())} placeholder="123456" />

        {/* Merchant Key */}
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Merchant Key</label>
          <div className="flex gap-2">
            <input type="password" className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
              style={{ borderColor: 'var(--border)', background: (hasKey && !editKey) ? 'var(--bg-muted)' : 'var(--bg-surface)', color: 'var(--text-primary)', opacity: (hasKey && !editKey) ? 0.7 : 1 }}
              value={form.merchantKey} onChange={(e) => set('merchantKey', e.target.value)} placeholder="••••••••" disabled={hasKey && !editKey} />
            {hasKey && <button type="button" onClick={() => { setEditKey(!editKey); if (editKey) set('merchantKey', ''); }}
              className="px-3 py-2 rounded-lg text-xs font-semibold border shrink-0"
              style={{ borderColor: editKey ? '#ef4444' : 'var(--border)', color: editKey ? '#ef4444' : 'var(--text-secondary)', background: 'var(--bg-surface)' }}>
              {editKey ? 'İptal' : 'Değiştir'}
            </button>}
          </div>
        </div>

        {/* Merchant Salt */}
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Merchant Salt</label>
          <div className="flex gap-2">
            <input type="password" className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
              style={{ borderColor: 'var(--border)', background: (hasSalt && !editSalt) ? 'var(--bg-muted)' : 'var(--bg-surface)', color: 'var(--text-primary)', opacity: (hasSalt && !editSalt) ? 0.7 : 1 }}
              value={form.merchantSalt} onChange={(e) => set('merchantSalt', e.target.value)} placeholder="••••••••" disabled={hasSalt && !editSalt} />
            {hasSalt && <button type="button" onClick={() => { setEditSalt(!editSalt); if (editSalt) set('merchantSalt', ''); }}
              className="px-3 py-2 rounded-lg text-xs font-semibold border shrink-0"
              style={{ borderColor: editSalt ? '#ef4444' : 'var(--border)', color: editSalt ? '#ef4444' : 'var(--text-secondary)', background: 'var(--bg-surface)' }}>
              {editSalt ? 'İptal' : 'Değiştir'}
            </button>}
          </div>
        </div>
      </div>

      <Button onClick={() => save.mutate()} disabled={save.isPending}>
        {save.isPending ? 'Kaydediliyor...' : 'Kaydet'}
      </Button>
    </div>
  );
}

// ── Havale / EFT ──────────────────────────────────────────────────────────────
function BankTransferTab({ company }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({ enabled: false, bankName: '', iban: '', accountHolder: '', instructions: '' });

  const { data } = useQuery({
    queryKey: ['company-bank-transfer', company._id],
    queryFn: () => api.get(`/companies/${company._id}/bank-transfer`).then((r) => r.data),
  });
  useEffect(() => { if (data) setForm({ enabled: data.enabled ?? false, bankName: data.bankName || '', iban: data.iban || '', accountHolder: data.accountHolder || '', instructions: data.instructions || '' }); }, [data]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const save = useMutation({
    mutationFn: () => api.patch(`/companies/${company._id}/bank-transfer`, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['company-bank-transfer', company._id] }); toast.success('Havale/EFT ayarları kaydedildi'); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Kaydedilemedi'),
  });

  return (
    <div className="space-y-5">
      <div className="p-3 rounded-xl border text-xs" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
        Müşteri siparişi verince banka bilgileri gösterilir. Ödeme gelince panelden <strong>"Ödendi"</strong> olarak onaylarsınız.
      </div>

      <div className="flex items-center justify-between p-4 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Havale / EFT</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Aktif edilince checkout'ta Havale/EFT seçeneği görünür.</p>
        </div>
        <button type="button" onClick={() => set('enabled', !form.enabled)} className="relative shrink-0 w-11 h-6 rounded-full transition-colors ml-4" style={{ background: form.enabled ? '#6366f1' : 'var(--border)' }}>
          <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform" style={{ transform: form.enabled ? 'translateX(20px)' : 'translateX(0)' }} />
        </button>
      </div>

      <div className="space-y-3">
        <Input label="Banka Adı" value={form.bankName} onChange={(e) => set('bankName', e.target.value)} placeholder="Garanti Bankası" />
        <Input label="IBAN" value={form.iban} onChange={(e) => set('iban', e.target.value.toUpperCase())} placeholder="TR00 0000 0000 0000 0000 0000 00" />
        <Input label="Hesap Sahibi" value={form.accountHolder} onChange={(e) => set('accountHolder', e.target.value)} placeholder="Firma Adı" />
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Müşteriye Gösterilecek Açıklama</label>
          <textarea rows={3} className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
            value={form.instructions} onChange={(e) => set('instructions', e.target.value)}
            placeholder="Havale açıklamasına sipariş numaranızı yazmayı unutmayın." />
        </div>
      </div>

      <Button onClick={() => save.mutate()} disabled={save.isPending}>
        {save.isPending ? 'Kaydediliyor...' : 'Kaydet'}
      </Button>
    </div>
  );
}

// ── Kapıda Ödeme ──────────────────────────────────────────────────────────────
function CashOnDeliveryTab({ company }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({ enabled: false, fee: 0, instructions: '' });

  const { data } = useQuery({
    queryKey: ['company-cod', company._id],
    queryFn: () => api.get(`/companies/${company._id}/cash-on-delivery`).then((r) => r.data),
  });
  useEffect(() => { if (data) setForm({ enabled: data.enabled ?? false, fee: data.fee ?? 0, instructions: data.instructions || '' }); }, [data]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const save = useMutation({
    mutationFn: () => api.patch(`/companies/${company._id}/cash-on-delivery`, { ...form, fee: Number(form.fee) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['company-cod', company._id] }); toast.success('Kapıda ödeme ayarları kaydedildi'); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Kaydedilemedi'),
  });

  return (
    <div className="space-y-5">
      <div className="p-3 rounded-xl border text-xs" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
        Kurye teslimatta nakit veya kart ile ödeme alır. Panelden siparişi <strong>"Ödendi"</strong> olarak onaylarsınız.
      </div>

      <div className="flex items-center justify-between p-4 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Kapıda Ödeme</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Aktif edilince checkout'ta kapıda ödeme seçeneği görünür.</p>
        </div>
        <button type="button" onClick={() => set('enabled', !form.enabled)} className="relative shrink-0 w-11 h-6 rounded-full transition-colors ml-4" style={{ background: form.enabled ? '#6366f1' : 'var(--border)' }}>
          <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform" style={{ transform: form.enabled ? 'translateX(20px)' : 'translateX(0)' }} />
        </button>
      </div>

      <div className="space-y-3">
        <Input label="Kapıda Ödeme Bedeli (0 = ücretsiz)" type="number" min={0} value={form.fee}
          onChange={(e) => set('fee', e.target.value === '' ? 0 : Number(e.target.value))} placeholder="0" />
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Müşteriye Gösterilecek Açıklama</label>
          <textarea rows={3} className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
            value={form.instructions} onChange={(e) => set('instructions', e.target.value)}
            placeholder="Kurye nakit veya kart ile ödeme alır." />
        </div>
      </div>

      <Button onClick={() => save.mutate()} disabled={save.isPending}>
        {save.isPending ? 'Kaydediliyor...' : 'Kaydet'}
      </Button>
    </div>
  );
}
