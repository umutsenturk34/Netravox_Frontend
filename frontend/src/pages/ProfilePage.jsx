import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [nameForm, setNameForm] = useState({ name: user?.name || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const updateProfile = useMutation({
    mutationFn: (data) => api.patch('/auth/profile', data).then((r) => r.data),
    onSuccess: () => toast.success('Profil güncellendi'),
    onError: (err) => toast.error(err.response?.data?.message || 'Güncellenemedi'),
  });

  const handleNameSave = () => {
    if (!nameForm.name.trim()) return;
    updateProfile.mutate({ name: nameForm.name });
  };

  const handlePasswordSave = () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      return toast.error('Yeni şifreler eşleşmiyor');
    }
    if (pwForm.newPassword.length < 8) {
      return toast.error('Şifre en az 8 karakter olmalı');
    }
    updateProfile.mutate(
      { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword },
      { onSuccess: () => setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' }) }
    );
  };

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Profilim</h1>

      {/* Hesap bilgileri */}
      <Section title="Hesap Bilgileri">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-semibold shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
            {user?.isSuperAdmin && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 mt-1 inline-block">Süper Admin</span>
            )}
          </div>
        </div>
        <Input
          label="Ad Soyad"
          value={nameForm.name}
          onChange={(e) => setNameForm({ name: e.target.value })}
        />
        <div className="mt-4">
          <Button onClick={handleNameSave} disabled={updateProfile.isPending || !nameForm.name.trim()}>
            {updateProfile.isPending ? 'Kaydediliyor...' : 'Adı Kaydet'}
          </Button>
        </div>
      </Section>

      {/* Şifre değiştirme */}
      <Section title="Şifre Değiştir">
        <div className="space-y-4">
          <Input
            label="Mevcut Şifre"
            type="password"
            value={pwForm.currentPassword}
            onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
            placeholder="Mevcut şifreniz"
          />
          <Input
            label="Yeni Şifre"
            type="password"
            value={pwForm.newPassword}
            onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
            placeholder="En az 8 karakter"
          />
          <Input
            label="Yeni Şifre Tekrar"
            type="password"
            value={pwForm.confirmPassword}
            onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))}
            placeholder="Yeni şifreyi tekrar girin"
            error={pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword ? 'Şifreler eşleşmiyor' : ''}
          />
          <Button
            onClick={handlePasswordSave}
            disabled={updateProfile.isPending || !pwForm.currentPassword || !pwForm.newPassword}
          >
            {updateProfile.isPending ? 'Kaydediliyor...' : 'Şifreyi Güncelle'}
          </Button>
        </div>
        <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
          Şifre değiştirildiğinde diğer tüm oturumlarınız sonlandırılır.
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-xl border p-5 mb-5 space-y-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
      <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      {children}
    </div>
  );
}
