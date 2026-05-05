import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/client';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Input';
import { TableSkeleton } from '../components/ui/Skeleton';
import { Building2, ChevronRight, Users, Package, Plus, Copy, Check, ShieldCheck } from 'lucide-react';

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
];

const SECTORS = [
  { value: 'restaurant', label: 'Restoran' },
  { value: 'dental', label: 'Diş Kliniği' },
  { value: 'hotel', label: 'Otel' },
  { value: 'beauty', label: 'Güzellik Merkezi' },
  { value: 'real_estate', label: 'Emlak' },
  { value: 'other', label: 'Diğer' },
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
  const { toast } = useToast();
  const qc = useQueryClient();
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
                {['Ad', 'E-posta', 'Rol', 'Durum', ''].map((h, i) => (
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
                      <button
                        onClick={() => toggleActive.mutate({ id: u._id, isActive: !u.isActive })}
                        className={`text-xs px-2 py-1 rounded ${u.isActive ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                      >
                        {u.isActive ? 'Devre dışı' : 'Aktifleştir'}
                      </button>
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

      {showCreate ? (
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
      )}
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
  const [form, setForm] = useState({ name: '', slug: '', sector: 'other' });

  if (!user?.isSuperAdmin) {
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
      setForm({ name: '', slug: '', sector: 'other' });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Oluşturulamadı'),
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
        <Button onClick={() => setShowCreateModal(true)}>+ Firma Ekle</Button>
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
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => openManage(c)}
                  className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg hover:bg-[var(--bg-muted)] transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Yönet <ChevronRight size={14} />
                </button>
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
          <Select label="Sektör" value={form.sector} onChange={(e) => setForm((p) => ({ ...p, sector: e.target.value }))}>
            {SECTORS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
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
                { id: 'modules', label: 'Modüller', icon: Package },
                { id: 'users', label: 'Kullanıcılar', icon: Users },
                { id: 'security', label: 'Güvenlik', icon: ShieldCheck },
              ].map(({ id, label, icon: Icon }) => (
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
