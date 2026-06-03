import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import { Percent, DollarSign, Trash2, ToggleLeft, ToggleRight, Copy } from 'lucide-react';

const emptyForm = {
  code: '',
  type: 'percent',
  value: '',
  minOrder: '',
  maxUses: '',
  expiresAt: '',
};

export default function CouponsPage() {
  const { toast } = useToast();
  const { activeTenantId } = useAuth();
  const qc = useQueryClient();

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['coupons', activeTenantId],
    queryFn: () => api.get('/coupons').then((r) => r.data),
    enabled: !!activeTenantId,
  });

  const createCoupon = useMutation({
    mutationFn: (data) => api.post('/coupons', data).then((r) => r.data),
    onSuccess: (saved) => {
      qc.setQueryData(['coupons', activeTenantId], (old = []) => [...old, saved]);
      toast.success('Kupon oluşturuldu');
      setModal(false);
      setForm(emptyForm);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Hata oluştu'),
  });

  const toggleCoupon = useMutation({
    mutationFn: ({ id, isActive }) => api.patch(`/coupons/${id}`, { isActive }).then((r) => r.data),
    onSuccess: (saved) => {
      qc.setQueryData(['coupons', activeTenantId], (old = []) =>
        old.map((c) => (c._id === saved._id ? saved : c))
      );
    },
  });

  const deleteCoupon = useMutation({
    mutationFn: (id) => api.delete(`/coupons/${id}`),
    onSuccess: (_, id) => {
      qc.setQueryData(['coupons', activeTenantId], (old = []) => old.filter((c) => c._id !== id));
      toast.success('Kupon silindi');
    },
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  function handleSubmit(e) {
    e.preventDefault();
    createCoupon.mutate({
      code: form.code,
      type: form.type,
      value: Number(form.value),
      ...(form.minOrder ? { minOrder: Number(form.minOrder) } : {}),
      ...(form.maxUses  ? { maxUses:  Number(form.maxUses)  } : {}),
      ...(form.expiresAt ? { expiresAt: form.expiresAt }       : {}),
    });
  }

  function closeModal() {
    setModal(false);
    setForm(emptyForm);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Kupon Yönetimi</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            İndirim kuponları oluşturun ve yönetin
          </p>
        </div>
        <Button onClick={() => setModal(true)}>+ Yeni Kupon</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'var(--bg-muted)' }} />
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <EmptyState
          title="Henüz kupon yok"
          description="İlk indirim kuponu oluşturun."
          action={<Button onClick={() => setModal(true)}>+ Yeni Kupon</Button>}
        />
      ) : (
        <div className="space-y-3">
          {coupons.map((coupon) => (
            <CouponCard
              key={coupon._id}
              coupon={coupon}
              onToggle={toggleCoupon}
              onDelete={deleteCoupon}
              onCopy={(code) => {
                navigator.clipboard.writeText(code);
                toast.success('Kupon kodu kopyalandı');
              }}
            />
          ))}
        </div>
      )}

      <Modal open={modal} onClose={closeModal} title="Yeni Kupon Oluştur">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Kupon Kodu *"
            required
            value={form.code}
            onChange={(e) => set('code', e.target.value.toUpperCase().replace(/\s/g, ''))}
            placeholder="YILBASI20"
          />
          <div className="grid grid-cols-2 gap-4">
            <Select label="İndirim Türü *" value={form.type} onChange={(e) => set('type', e.target.value)}>
              <option value="percent">Yüzde (%)</option>
              <option value="fixed">Sabit Tutar (₺)</option>
            </Select>
            <Input
              label={form.type === 'percent' ? 'Yüzde Değeri *' : 'Tutar (₺) *'}
              required
              type="number"
              min="0"
              max={form.type === 'percent' ? 100 : undefined}
              value={form.value}
              onChange={(e) => set('value', e.target.value)}
              placeholder={form.type === 'percent' ? '20' : '50'}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Min. Sipariş Tutarı (₺)"
              type="number"
              min="0"
              value={form.minOrder}
              onChange={(e) => set('minOrder', e.target.value)}
              placeholder="Yok"
            />
            <Input
              label="Maks. Kullanım Sayısı"
              type="number"
              min="1"
              value={form.maxUses}
              onChange={(e) => set('maxUses', e.target.value)}
              placeholder="Sınırsız"
            />
          </div>
          <Input
            label="Son Kullanma Tarihi"
            type="datetime-local"
            value={form.expiresAt}
            onChange={(e) => set('expiresAt', e.target.value)}
          />
          <div className="flex gap-3 pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
            <Button type="submit" disabled={createCoupon.isPending} className="flex-1">
              {createCoupon.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
            </Button>
            <Button type="button" variant="ghost" onClick={closeModal}>İptal</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function CouponCard({ coupon, onToggle, onDelete, onCopy }) {
  const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
  const usagePercent = coupon.maxUses
    ? Math.min(Math.round((coupon.usedCount / coupon.maxUses) * 100), 100)
    : null;

  return (
    <div
      className="rounded-2xl border p-4 flex items-center gap-4 transition-all hover:shadow-sm"
      style={{
        background: 'var(--bg-surface)',
        borderColor: 'var(--border)',
        opacity: coupon.isActive && !isExpired ? 1 : 0.6,
      }}
    >
      {/* Icon */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: coupon.type === 'percent' ? 'rgba(99,102,241,0.1)' : 'rgba(16,185,129,0.1)' }}
      >
        {coupon.type === 'percent'
          ? <Percent size={20} style={{ color: '#6366f1' }} />
          : <DollarSign size={20} style={{ color: '#10b981' }} />
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold font-mono text-sm tracking-wider" style={{ color: 'var(--text-primary)' }}>
            {coupon.code}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{
              background: coupon.type === 'percent' ? 'rgba(99,102,241,0.1)' : 'rgba(16,185,129,0.1)',
              color: coupon.type === 'percent' ? '#6366f1' : '#10b981',
            }}
          >
            {coupon.type === 'percent' ? `%${coupon.value} indirim` : `₺${coupon.value} indirim`}
          </span>
          {!coupon.isActive && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}
            >
              Pasif
            </span>
          )}
          {isExpired && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626' }}
            >
              Süresi Doldu
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {coupon.minOrder > 0 && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Min: ₺{coupon.minOrder.toLocaleString('tr-TR')}
            </span>
          )}
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {coupon.usedCount} kullanım{coupon.maxUses ? ` / ${coupon.maxUses}` : ''}
          </span>
          {coupon.expiresAt && (
            <span className="text-xs" style={{ color: isExpired ? '#dc2626' : 'var(--text-muted)' }}>
              SKT: {new Date(coupon.expiresAt).toLocaleDateString('tr-TR')}
            </span>
          )}
        </div>

        {usagePercent !== null && (
          <div
            className="mt-2 h-1.5 rounded-full overflow-hidden"
            style={{ background: 'var(--bg-muted)', maxWidth: '180px' }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${usagePercent}%`,
                background: usagePercent >= 90 ? '#ef4444' : '#6366f1',
              }}
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => onCopy(coupon.code)}
          className="p-2 rounded-lg hover:bg-[var(--bg-muted)] transition-colors"
          title="Kodu kopyala"
        >
          <Copy size={14} style={{ color: 'var(--text-muted)' }} />
        </button>
        <button
          onClick={() => onToggle.mutate({ id: coupon._id, isActive: !coupon.isActive })}
          className="p-2 rounded-lg hover:bg-[var(--bg-muted)] transition-colors"
          title={coupon.isActive ? 'Pasifleştir' : 'Aktifleştir'}
        >
          {coupon.isActive
            ? <ToggleRight size={18} style={{ color: '#10b981' }} />
            : <ToggleLeft size={18} style={{ color: 'var(--text-muted)' }} />
          }
        </button>
        <button
          onClick={() => {
            if (confirm('Kuponu silmek istediğinize emin misiniz?')) onDelete.mutate(coupon._id);
          }}
          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="Sil"
        >
          <Trash2 size={14} style={{ color: '#ef4444' }} />
        </button>
      </div>
    </div>
  );
}
