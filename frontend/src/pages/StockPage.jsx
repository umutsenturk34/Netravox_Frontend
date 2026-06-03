import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import { Package, TrendingUp, TrendingDown, RotateCcw, SlidersHorizontal } from 'lucide-react';

const TYPE_META = {
  sale:        { label: 'Satış',       icon: TrendingDown, color: '#ef4444' },
  manual_in:   { label: 'Manuel Giriş', icon: TrendingUp,  color: '#10b981' },
  manual_out:  { label: 'Manuel Çıkış', icon: TrendingDown, color: '#f59e0b' },
  return:      { label: 'İade',        icon: RotateCcw,    color: '#6366f1' },
  adjustment:  { label: 'Düzeltme',    icon: SlidersHorizontal, color: '#8b5cf6' },
};

export default function StockPage() {
  const { toast } = useToast();
  const { activeTenantId } = useAuth();
  const qc = useQueryClient();

  const [selectedService, setSelectedService] = useState('');
  const [modal, setModal] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ quantity: '', type: 'manual_in', note: '' });

  // Stok takipli ürünler listesi
  const { data: services = [], isLoading: loadingServices } = useQuery({
    queryKey: ['services', activeTenantId],
    queryFn: () => api.get('/services').then((r) => r.data),
    enabled: !!activeTenantId,
  });

  const trackedServices = services.filter((s) => s.trackStock);

  // Seçili ürünün hareket geçmişi
  const { data: logData, isLoading: loadingLog } = useQuery({
    queryKey: ['inventory-log', activeTenantId, selectedService],
    queryFn: () =>
      api.get(`/services/${selectedService}/inventory-log`).then((r) => r.data),
    enabled: !!activeTenantId && !!selectedService,
  });

  const logs = logData?.logs || [];

  const adjust = useMutation({
    mutationFn: (body) =>
      api.patch(`/services/${selectedService}/stock`, body).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['inventory-log', activeTenantId, selectedService] });
      qc.invalidateQueries({ queryKey: ['services', activeTenantId] });
      toast.success(`Stok güncellendi — yeni stok: ${data.stock}`);
      setModal(false);
      setAdjustForm({ quantity: '', type: 'manual_in', note: '' });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Hata oluştu'),
  });

  function handleAdjust(e) {
    e.preventDefault();
    const qty = Number(adjustForm.quantity);
    if (!qty) { toast.error('Miktar girin'); return; }
    adjust.mutate({
      quantity: adjustForm.type === 'manual_out' ? -Math.abs(qty) : Math.abs(qty),
      type: adjustForm.type,
      note: adjustForm.note || undefined,
    });
  }

  function formatDate(d) {
    return new Date(d).toLocaleString('tr-TR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  const activeSvc = trackedServices.find((s) => s._id === selectedService);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Stok Yönetimi
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Stok hareketlerini görüntüle ve manuel stok düzenlemesi yap
          </p>
        </div>
        {selectedService && (
          <Button onClick={() => setModal(true)} icon={<SlidersHorizontal size={14} />}>
            Stok Düzenle
          </Button>
        )}
      </div>

      {loadingServices ? (
        <div className="h-12 rounded-xl animate-pulse" style={{ background: 'var(--bg-muted)' }} />
      ) : trackedServices.length === 0 ? (
        <EmptyState
          title="Stok takipli ürün yok"
          description="Ürün yönetiminden bir ürünün stok takibini aktif edin."
        />
      ) : (
        <>
          {/* Ürün Seçimi */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
            {trackedServices.map((svc) => {
              const isLow = svc.lowStockThreshold && svc.stock <= svc.lowStockThreshold;
              const isOut = svc.stock === 0 || svc.stock === null;
              return (
                <button
                  key={svc._id}
                  onClick={() => setSelectedService(svc._id)}
                  className="text-left p-4 rounded-xl border transition-all hover:shadow-md"
                  style={{
                    background: selectedService === svc._id ? 'var(--color-primary, #6366f1)' : 'var(--bg-surface)',
                    borderColor: selectedService === svc._id
                      ? 'var(--color-primary, #6366f1)'
                      : isOut ? 'rgba(239,68,68,0.4)' : isLow ? 'rgba(245,158,11,0.4)' : 'var(--border)',
                    color: selectedService === svc._id ? '#fff' : 'var(--text-primary)',
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <Package size={16} style={{ opacity: 0.7, marginTop: 2 }} className="shrink-0" />
                    <span
                      className="text-lg font-bold"
                      style={{ color: selectedService === svc._id ? '#fff' : isOut ? '#ef4444' : isLow ? '#f59e0b' : '#10b981' }}
                    >
                      {svc.stock ?? '∞'}
                    </span>
                  </div>
                  <p className="text-xs font-medium mt-2 leading-tight" style={{ opacity: selectedService === svc._id ? 0.9 : 1 }}>
                    {svc.name?.tr}
                  </p>
                  <p
                    className="text-[11px] mt-1"
                    style={{ opacity: selectedService === svc._id ? 0.7 : undefined, color: selectedService === svc._id ? '#fff' : 'var(--text-muted)' }}
                  >
                    {isOut ? '⚠ Tükendi' : isLow ? '⚠ Az stok' : 'adet'}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Hareket Geçmişi */}
          {selectedService && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                  {activeSvc?.name?.tr} — Hareket Geçmişi
                </h2>
                {activeSvc && (
                  <span
                    className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                    style={{
                      background: activeSvc.stock === 0 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                      color: activeSvc.stock === 0 ? '#dc2626' : '#059669',
                    }}
                  >
                    {activeSvc.stock ?? 0} adet stokta
                  </span>
                )}
              </div>

              {loadingLog ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: 'var(--bg-muted)' }} />
                  ))}
                </div>
              ) : logs.length === 0 ? (
                <div
                  className="text-center py-12 rounded-xl border text-sm"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                >
                  Bu ürün için henüz stok hareketi yok.
                </div>
              ) : (
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)', fontSize: '11px' }}>
                        <th className="text-left px-4 py-2.5 font-medium uppercase tracking-wide">Tür</th>
                        <th className="text-right px-4 py-2.5 font-medium uppercase tracking-wide">Miktar</th>
                        <th className="text-right px-4 py-2.5 font-medium uppercase tracking-wide">Sonraki Stok</th>
                        <th className="text-left px-4 py-2.5 font-medium uppercase tracking-wide hidden sm:table-cell">Not</th>
                        <th className="text-right px-4 py-2.5 font-medium uppercase tracking-wide">Tarih</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log, i) => {
                        const meta = TYPE_META[log.type] || { label: log.type, color: 'var(--text-muted)' };
                        const Icon = meta.icon;
                        return (
                          <tr
                            key={log._id}
                            className="border-t"
                            style={{ borderColor: 'var(--border)', background: i % 2 === 0 ? 'var(--bg-surface)' : 'transparent' }}
                          >
                            <td className="px-4 py-3">
                              <span className="flex items-center gap-1.5">
                                {Icon && <Icon size={13} style={{ color: meta.color }} />}
                                <span className="text-xs font-medium" style={{ color: meta.color }}>
                                  {meta.label}
                                </span>
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-sm font-semibold" style={{ color: log.quantity > 0 ? '#10b981' : '#ef4444' }}>
                              {log.quantity > 0 ? `+${log.quantity}` : log.quantity}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-sm" style={{ color: 'var(--text-primary)' }}>
                              {log.stockAfter}
                            </td>
                            <td className="px-4 py-3 text-xs hidden sm:table-cell" style={{ color: 'var(--text-muted)' }}>
                              {log.note || '—'}
                            </td>
                            <td className="px-4 py-3 text-right text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                              {formatDate(log.createdAt)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Manuel Stok Düzenleme Modalı */}
      <Modal open={modal} onClose={() => setModal(false)} title="Stok Düzenle">
        <form onSubmit={handleAdjust} className="space-y-4">
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {activeSvc?.name?.tr} — Mevcut stok: <strong>{activeSvc?.stock ?? 0}</strong>
          </p>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              İşlem Türü
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'manual_in',  label: '+ Stok Girişi',  color: '#10b981' },
                { value: 'manual_out', label: '− Stok Çıkışı',  color: '#f59e0b' },
                { value: 'return',     label: '↩ İade',         color: '#6366f1' },
                { value: 'adjustment', label: '⚖ Düzeltme',    color: '#8b5cf6' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAdjustForm((f) => ({ ...f, type: opt.value }))}
                  className="px-3 py-2 text-sm rounded-lg border font-medium transition-all"
                  style={{
                    borderColor: adjustForm.type === opt.value ? opt.color : 'var(--border)',
                    background: adjustForm.type === opt.value ? `${opt.color}18` : 'var(--bg-surface)',
                    color: adjustForm.type === opt.value ? opt.color : 'var(--text-primary)',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Miktar"
            type="number"
            min="1"
            required
            value={adjustForm.quantity}
            onChange={(e) => setAdjustForm((f) => ({ ...f, quantity: e.target.value }))}
            placeholder="10"
            hint={adjustForm.type === 'manual_out' ? 'Negatif otomatik uygulanır' : ''}
          />

          <Input
            label="Not (isteğe bağlı)"
            value={adjustForm.note}
            onChange={(e) => setAdjustForm((f) => ({ ...f, note: e.target.value }))}
            placeholder="Sayım düzeltmesi, hasar vb."
          />

          <div className="flex gap-3 pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
            <Button type="submit" disabled={adjust.isPending} className="flex-1">
              {adjust.isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setModal(false)}>
              İptal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
