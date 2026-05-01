import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';

const PERMISSION_GROUPS = [
  { label: 'Sayfalar', resource: 'pages', actions: ['read', 'create', 'update', 'publish', 'delete'] },
  { label: 'Medya', resource: 'media', actions: ['read', 'upload', 'delete'] },
  { label: 'Navigasyon Menüleri', resource: 'menus', actions: ['read', 'create', 'update', 'delete'] },
  { label: 'SEO', resource: 'seo', actions: ['read', 'update'] },
  { label: 'Redirect', resource: 'redirects', actions: ['read', 'create', 'update', 'delete'] },
  { label: 'Restoran', resource: 'restaurant', actions: ['read', 'create', 'update', 'delete'] },
  { label: 'Rezervasyonlar', resource: 'reservations', actions: ['read', 'update'] },
  { label: 'Formlar', resource: 'forms', actions: ['read', 'update'] },
  { label: 'Kullanıcılar', resource: 'users', actions: ['read', 'create', 'update', 'delete'] },
  { label: 'Firmalar', resource: 'companies', actions: ['read', 'update'] },
  { label: 'Diller', resource: 'languages', actions: ['read', 'create', 'update', 'delete'] },
  { label: 'Ayarlar', resource: 'settings', actions: ['read', 'update'] },
];

const ACTION_LABELS = {
  read: 'Görüntüle',
  create: 'Oluştur',
  update: 'Düzenle',
  delete: 'Sil',
  upload: 'Yükle',
  publish: 'Yayınla',
};

const emptyForm = { name: '', labelTr: '', labelEn: '', permissions: [] };

export default function RolesPage() {
  const { toast } = useToast();
  const { activeTenantId } = useAuth();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const { data: roles = [] } = useQuery({
    queryKey: ['roles', activeTenantId],
    queryFn: () => api.get('/roles').then((r) => r.data),
    enabled: !!activeTenantId,
  });

  const saveMutation = useMutation({
    mutationFn: (data) =>
      editingRole
        ? api.patch(`/roles/${editingRole._id}`, data).then((r) => r.data)
        : api.post('/roles', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] });
      toast.success(editingRole ? 'Rol güncellendi' : 'Rol oluşturuldu');
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Kaydedilemedi'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/roles/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Rol silindi');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Silinemedi'),
  });

  const openCreate = () => {
    setEditingRole(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (role) => {
    setEditingRole(role);
    setForm({
      name: role.name,
      labelTr: role.label?.tr || '',
      labelEn: role.label?.en || '',
      permissions: role.permissions || [],
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRole(null);
    setForm(emptyForm);
  };

  const togglePermission = (perm) => {
    setForm((p) => ({
      ...p,
      permissions: p.permissions.includes(perm)
        ? p.permissions.filter((x) => x !== perm)
        : [...p.permissions, perm],
    }));
  };

  const toggleGroup = (resource, actions) => {
    const groupPerms = actions.map((a) => `${resource}.${a}`);
    const allSelected = groupPerms.every((p) => form.permissions.includes(p));
    setForm((prev) => ({
      ...prev,
      permissions: allSelected
        ? prev.permissions.filter((p) => !groupPerms.includes(p))
        : [...new Set([...prev.permissions, ...groupPerms])],
    }));
  };

  const handleSave = () => {
    if (!form.name) return toast.error('Rol adı gerekli');
    saveMutation.mutate({
      name: form.name,
      label: { tr: form.labelTr || form.name, en: form.labelEn || form.name },
      permissions: form.permissions,
    });
  };

  const systemRoles = roles.filter((r) => r.isSystem || !r.tenantId);
  const customRoles = roles.filter((r) => !r.isSystem && r.tenantId);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Roller ve Yetkiler</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Sistem rolleri salt okunur; özel roller oluşturabilirsiniz</p>
        </div>
        <Button onClick={openCreate}>+ Özel Rol Oluştur</Button>
      </div>

      {/* Sistem Rolleri */}
      <div className="mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>Sistem Rolleri</h2>
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          {systemRoles.map((role, i) => (
            <div
              key={role._id}
              className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t' : ''}`}
              style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}
            >
              <div>
                <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                  {role.label?.tr || role.name}
                </span>
                <span className="ml-2 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{role.name}</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">Sistem</span>
            </div>
          ))}
        </div>
      </div>

      {/* Özel Roller */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>Özel Roller</h2>
        {customRoles.length === 0 ? (
          <EmptyState
            title="Özel rol yok"
            description="Firmaya özel yetki kombinasyonları oluşturun"
            action={<Button onClick={openCreate}>+ Özel Rol Oluştur</Button>}
          />
        ) : (
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            {customRoles.map((role, i) => (
              <div
                key={role._id}
                className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t' : ''}`}
                style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}
              >
                <div>
                  <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                    {role.label?.tr || role.name}
                  </span>
                  <span className="ml-2 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{role.name}</span>
                  <span className="ml-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {role.permissions?.length || 0} yetki
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(role)} className="text-xs px-2 py-1 rounded hover:bg-[var(--bg-muted)]" style={{ color: 'var(--text-muted)' }}>Düzenle</button>
                  <button onClick={() => deleteMutation.mutate(role._id)} className="text-xs px-2 py-1 rounded hover:bg-red-50 text-red-500">Sil</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rol Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingRole ? 'Rol Düzenle' : 'Özel Rol Oluştur'}
        size="xl"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeModal}>İptal</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Rol Adı (slug)"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
              placeholder="icerik_moderatoru"
              disabled={!!editingRole}
            />
            <Input
              label="Görünen Ad (TR)"
              value={form.labelTr}
              onChange={(e) => setForm((p) => ({ ...p, labelTr: e.target.value }))}
              placeholder="İçerik Moderatörü"
            />
            <Input
              label="Görünen Ad (EN)"
              value={form.labelEn}
              onChange={(e) => setForm((p) => ({ ...p, labelEn: e.target.value }))}
              placeholder="Content Moderator"
            />
          </div>

          <div>
            <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Yetkiler</p>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {PERMISSION_GROUPS.map(({ label, resource, actions }) => {
                const groupPerms = actions.map((a) => `${resource}.${a}`);
                const allSelected = groupPerms.every((p) => form.permissions.includes(p));
                const someSelected = groupPerms.some((p) => form.permissions.includes(p));

                return (
                  <div key={resource} className="rounded-lg border p-3" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                          onChange={() => toggleGroup(resource, actions)}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</span>
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-2 pl-6">
                      {actions.map((action) => {
                        const perm = `${resource}.${action}`;
                        return (
                          <label key={action} className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.permissions.includes(perm)}
                              onChange={() => togglePermission(perm)}
                              className="w-3.5 h-3.5 rounded"
                            />
                            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                              {ACTION_LABELS[action] || action}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
