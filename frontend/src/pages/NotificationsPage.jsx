import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Skeleton } from '../components/ui/Skeleton';

const resStatusLabel = { new: 'Yeni', seen: 'Görüldü', confirmed: 'Onaylandı', rejected: 'Reddedildi', cancelled: 'İptal' };
const resStatusColor = {
  new: 'bg-blue-100 text-blue-700',
  seen: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
  cancelled: 'bg-gray-100 text-gray-500',
};
const formStatusColor = { new: 'bg-blue-100 text-blue-700', seen: 'bg-yellow-100 text-yellow-700', replied: 'bg-green-100 text-green-700' };
const formStatusLabel = { new: 'Yeni', seen: 'Görüldü', replied: 'Yanıtlandı' };
const formTypeLabel = { contact: 'İletişim', reservation: 'Rezervasyon', other: 'Diğer' };

export default function NotificationsPage() {
  const { toast } = useToast();
  const { activeTenantId } = useAuth();
  const qc = useQueryClient();

  const { data: resData, isLoading: resLoading } = useQuery({
    queryKey: ['reservations', activeTenantId, 'all'],
    queryFn: () => api.get('/reservations?limit=20').then((r) => r.data),
    enabled: !!activeTenantId,
  });

  const { data: formsData, isLoading: formsLoading } = useQuery({
    queryKey: ['forms', activeTenantId, 'all'],
    queryFn: () => api.get('/forms?limit=20').then((r) => r.data),
    enabled: !!activeTenantId,
  });

  const updateRes = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/reservations/${id}/status`, { status }).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reservations'] }); toast.success('Durum güncellendi'); },
    onError: () => toast.error('Güncellenemedi'),
  });

  const updateForm = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/forms/${id}/status`, { status }).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['forms'] }); toast.success('Durum güncellendi'); },
    onError: () => toast.error('Güncellenemedi'),
  });

  const newResCount = resData?.data?.filter((r) => r.status === 'new').length || 0;
  const newFormCount = formsData?.data?.filter((f) => f.status === 'new').length || 0;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Bildirimler</h1>
        {(newResCount + newFormCount) > 0 && (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-600 text-white">
            {newResCount + newFormCount} yeni
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rezervasyonlar */}
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Rezervasyonlar</h2>
              {newResCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-xs font-semibold bg-blue-600 text-white">{newResCount}</span>
              )}
            </div>
            <Link to="/reservations" className="text-xs text-blue-600 hover:underline">Tümünü gör</Link>
          </div>
          <div style={{ background: 'var(--bg-surface)' }}>
            {resLoading && <div className="p-4 space-y-2">{[1,2,3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>}
            {resData?.data?.map((r) => (
              <div key={r._id} className="px-4 py-3 border-b last:border-0 hover:bg-[var(--bg-muted)] transition-colors" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{r.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {r.date} · {r.guestCount} kişi · {r.phone}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${resStatusColor[r.status] || ''}`}>
                      {resStatusLabel[r.status] || r.status}
                    </span>
                    {r.status === 'new' && (
                      <button
                        onClick={() => updateRes.mutate({ id: r._id, status: 'seen' })}
                        className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
                      >
                        Görüldü
                      </button>
                    )}
                  </div>
                </div>
                {r.note && <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-muted)' }}>"{r.note}"</p>}
              </div>
            ))}
            {!resLoading && !resData?.data?.length && (
              <p className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Henüz rezervasyon yok</p>
            )}
          </div>
        </div>

        {/* Form Gönderileri */}
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Form Gönderileri</h2>
              {newFormCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-xs font-semibold bg-blue-600 text-white">{newFormCount}</span>
              )}
            </div>
            <Link to="/forms" className="text-xs text-blue-600 hover:underline">Tümünü gör</Link>
          </div>
          <div style={{ background: 'var(--bg-surface)' }}>
            {formsLoading && <div className="p-4 space-y-2">{[1,2,3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>}
            {formsData?.data?.map((f) => (
              <div key={f._id} className="px-4 py-3 border-b last:border-0 hover:bg-[var(--bg-muted)] transition-colors" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {f.fields?.name || f.fields?.email || '—'}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {formTypeLabel[f.formType] || f.formType} · {new Date(f.submittedAt).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${formStatusColor[f.status] || ''}`}>
                      {formStatusLabel[f.status] || f.status}
                    </span>
                    {f.status === 'new' && (
                      <button
                        onClick={() => updateForm.mutate({ id: f._id, status: 'seen' })}
                        className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
                      >
                        Görüldü
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {!formsLoading && !formsData?.data?.length && (
              <p className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Henüz form gönderisi yok</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
