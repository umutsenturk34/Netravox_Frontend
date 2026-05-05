import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Input';
import { TableSkeleton } from '../components/ui/Skeleton';

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
  { id: 'users',           label: 'Kullanıcılar' },
  { id: 'audit',           label: 'Audit Log' },
];

const ADMIN_MODULES = [
  { id: 'admin:companies', label: 'Firma Yönetimi (aktif/pasif, özellikler)' },
  { id: 'admin:users',     label: 'Kullanıcı Yönetimi (oluştur, şifre sıfırla)' },
  { id: 'admin:smtp',      label: 'SMTP Ayarları' },
  { id: 'admin:security',  label: 'Güvenlik Ayarları (OTP zorunluluğu)' },
];

const EXCLUDED_ROLES = ['super_admin', 'agency_admin'];
const emptyTenantForm = { name: '', email: '', password: '', roleId: '' };
const emptyAgencyForm = { name: '', email: '', password: '', allModulesAccess: false, agencyModules: [] };

export default function UsersPage() {
  const { toast } = useToast();
  const { activeTenantId, user: authUser } = useAuth();
  const canManage = authUser?.isSuperAdmin || authUser?.isAgencyUser;
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState('tenant');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [tenantForm, setTenantForm] = useState(emptyTenantForm);
  const [agencyForm, setAgencyForm] = useState(emptyAgencyForm);

  const { data: tenantUsers = [], isLoading: loadingTenantUsers } = useQuery({
    queryKey: ['users', activeTenantId],
    queryFn: () => api.get('/users').then((r) => r.data),
    enabled: !!activeTenantId,
  });

  const { data: staffUsers = [], isLoading: loadingStaff } = useQuery({
    queryKey: ['users-staff'],
    queryFn: () => api.get('/users/staff').then((r) => r.data),
    enabled: authUser?.isSuperAdmin === true,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles', activeTenantId],
    queryFn: () => api.get('/roles').then((r) => r.data),
    enabled: !!activeTenantId,
  });

  const assignableRoles = roles.filter((r) => !EXCLUDED_ROLES.includes(r.name));

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/users', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['users-staff'] });
      toast.success('Kullanıcı oluşturuldu');
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Oluşturulamadı'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/users/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['users-staff'] });
      toast.success('Kullanıcı güncellendi');
      closeModal();
    },
    onError: () => toast.error('Güncellenemedi'),
  });

  const isAgencyTab = activeTab === 'netravox' && authUser?.isSuperAdmin;

  const openCreate = () => {
    setEditingUser(null);
    setTenantForm(emptyTenantForm);
    setAgencyForm(emptyAgencyForm);
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditingUser(u);
    if (u.isAgencyUser) {
      const allAccess = u.agencyModules?.includes('*') || false;
      setAgencyForm({
        name: u.name,
        email: u.email,
        password: '',
        allModulesAccess: allAccess,
        agencyModules: allAccess ? [] : (u.agencyModules || []),
      });
    } else {
      setTenantForm({
        name: u.name,
        email: u.email,
        password: '',
        roleId: u.companyRoles?.[0]?.roleId?._id || u.companyRoles?.[0]?.roleId || '',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setTenantForm(emptyTenantForm);
    setAgencyForm(emptyAgencyForm);
  };

  const toggleModule = (id) => {
    setAgencyForm((p) => ({
      ...p,
      agencyModules: p.agencyModules.includes(id)
        ? p.agencyModules.filter((m) => m !== id)
        : [...p.agencyModules, id],
    }));
  };

  const handleSubmit = () => {
    const isAgencyForm = isAgencyTab || editingUser?.isAgencyUser;

    if (isAgencyForm) {
      if (!editingUser && (!agencyForm.name || !agencyForm.email || !agencyForm.password)) {
        toast.error('Ad, e-posta ve şifre zorunlu');
        return;
      }
      const modules = agencyForm.allModulesAccess ? ['*'] : agencyForm.agencyModules;
      if (editingUser) {
        updateMutation.mutate({
          id: editingUser._id,
          data: { name: agencyForm.name, isAgencyUser: true, agencyModules: modules },
        });
      } else {
        createMutation.mutate({
          name: agencyForm.name,
          email: agencyForm.email,
          password: agencyForm.password,
          isAgencyUser: true,
          agencyModules: modules,
        });
      }
    } else {
      if (editingUser) {
        const data = { name: tenantForm.name };
        if (tenantForm.roleId) data.roleId = tenantForm.roleId;
        updateMutation.mutate({ id: editingUser._id, data });
      } else {
        if (!tenantForm.name || !tenantForm.email || !tenantForm.password || !tenantForm.roleId) {
          toast.error('Tüm alanlar zorunlu');
          return;
        }
        createMutation.mutate(tenantForm);
      }
    }
  };

  const toggleActive = (u) => {
    updateMutation.mutate({ id: u._id, data: { isActive: !u.isActive } });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const getUserRole = (u) => {
    if (u.isSuperAdmin) return 'Süper Admin';
    if (u.isAgencyUser) return 'Netravox Çalışanı';
    const roleId = u.companyRoles?.[0]?.roleId;
    if (!roleId) return '—';
    if (typeof roleId === 'object') return roleId.label?.tr || roleId.name;
    const found = roles.find((r) => r._id === roleId);
    return found?.label?.tr || found?.name || '—';
  };

  const displayUsers = isAgencyTab ? staffUsers : tenantUsers;
  const isLoading = isAgencyTab ? loadingStaff : loadingTenantUsers;

  const modalTitle = editingUser
    ? (editingUser.isAgencyUser ? 'Çalışan Düzenle' : 'Kullanıcı Düzenle')
    : (isAgencyTab ? 'Yeni Netravox Çalışanı' : 'Yeni Kullanıcı');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Kullanıcılar</h1>
        {canManage && <Button onClick={openCreate}>+ Kullanıcı Ekle</Button>}
      </div>

      {authUser?.isSuperAdmin && (
        <div className="flex gap-1 p-1 rounded-lg mb-5 w-fit" style={{ background: 'var(--bg-muted)' }}>
          {[
            { id: 'tenant', label: 'Firma Kullanıcıları' },
            { id: 'netravox', label: 'Netravox Çalışanları' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-zinc-800 shadow-sm'
                  : 'hover:bg-[var(--bg-surface)]'
              }`}
              style={{ color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)' }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <table className="w-full text-sm">
            <thead style={{ background: 'var(--bg-muted)' }}>
              <tr>
                {['Ad', 'E-posta', isAgencyTab ? 'Modüller' : 'Rol', 'Durum', ''].map((h, i) => (
                  <th key={i} className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody style={{ background: 'var(--bg-surface)' }}>
              {displayUsers.map((u) => (
                <tr key={u._id} className="border-t hover:bg-[var(--bg-muted)] transition-colors" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-medium shrink-0">
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                    {isAgencyTab ? (
                      u.agencyModules?.includes('*')
                        ? <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">Tüm Modüller</span>
                        : <span className="text-xs">{(u.agencyModules || []).length} modül</span>
                    ) : getUserRole(u)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {u.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {canManage && !u.isSuperAdmin && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(u)}
                          className="text-xs px-2 py-1 rounded hover:bg-[var(--bg-muted)]"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => toggleActive(u)}
                          className={`text-xs px-2 py-1 rounded ${
                            u.isActive ? 'hover:bg-red-50 text-red-500' : 'hover:bg-green-50 text-green-600'
                          }`}
                        >
                          {u.isActive ? 'Devre dışı bırak' : 'Aktifleştir'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!displayUsers.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center" style={{ color: 'var(--text-muted)' }}>
                    Henüz kullanıcı yok
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={modalTitle}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeModal}>İptal</Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        }
      >
        {(isAgencyTab || editingUser?.isAgencyUser) ? (
          <div className="space-y-4">
            <Input
              label="Ad Soyad"
              value={agencyForm.name}
              onChange={(e) => setAgencyForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Ad Soyad"
            />
            {!editingUser && (
              <>
                <Input
                  label="E-posta"
                  type="email"
                  value={agencyForm.email}
                  onChange={(e) => setAgencyForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="ornek@netravox.com"
                />
                <Input
                  label="Şifre"
                  type="password"
                  value={agencyForm.password}
                  onChange={(e) => setAgencyForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="En az 8 karakter"
                />
              </>
            )}
            <div>
              <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Modül Erişimi</p>
              <label className="flex items-center gap-2.5 cursor-pointer mb-3 px-3 py-2.5 rounded-lg border" style={{ borderColor: 'var(--border)' }}>
                <input
                  type="checkbox"
                  checked={agencyForm.allModulesAccess}
                  onChange={(e) => setAgencyForm((p) => ({ ...p, allModulesAccess: e.target.checked, agencyModules: [] }))}
                  className="w-4 h-4 rounded accent-indigo-600"
                />
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Tüm modüllere erişim</span>
              </label>
              {!agencyForm.allModulesAccess && (
                <div className="max-h-72 overflow-y-auto pr-1 space-y-3">
                  <div className="grid grid-cols-2 gap-1">
                    {ALL_MODULES.map((m) => (
                      <label key={m.id} className="flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded hover:bg-[var(--bg-muted)]">
                        <input
                          type="checkbox"
                          checked={agencyForm.agencyModules.includes(m.id)}
                          onChange={() => toggleModule(m.id)}
                          className="w-3.5 h-3.5 rounded accent-indigo-600"
                        />
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{m.label}</span>
                      </label>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1.5 px-2" style={{ color: 'var(--text-muted, rgba(255,255,255,0.35))' }}>Yönetici Yetkileri</p>
                    <div className="grid grid-cols-1 gap-1">
                      {ADMIN_MODULES.map((m) => (
                        <label key={m.id} className="flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded hover:bg-[var(--bg-muted)]">
                          <input
                            type="checkbox"
                            checked={agencyForm.agencyModules.includes(m.id)}
                            onChange={() => toggleModule(m.id)}
                            className="w-3.5 h-3.5 rounded accent-indigo-600"
                          />
                          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{m.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              label="Ad Soyad"
              value={tenantForm.name}
              onChange={(e) => setTenantForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Ad Soyad"
            />
            {!editingUser && (
              <>
                <Input
                  label="E-posta"
                  type="email"
                  value={tenantForm.email}
                  onChange={(e) => setTenantForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="ornek@firma.com"
                />
                <Input
                  label="Şifre"
                  type="password"
                  value={tenantForm.password}
                  onChange={(e) => setTenantForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="En az 8 karakter"
                />
              </>
            )}
            <Select
              label="Rol"
              value={tenantForm.roleId}
              onChange={(e) => setTenantForm((p) => ({ ...p, roleId: e.target.value }))}
            >
              <option value="">Rol seç</option>
              {assignableRoles.map((r) => (
                <option key={r._id} value={r._id}>{r.label?.tr || r.name}</option>
              ))}
            </Select>
          </div>
        )}
      </Modal>
    </div>
  );
}
