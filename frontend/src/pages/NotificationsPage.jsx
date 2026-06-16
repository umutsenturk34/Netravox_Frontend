import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Skeleton } from '../components/ui/Skeleton';

const LIMIT = 10;

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
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

function Pagination({ page, total, limit, onChange }) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-2 border-t" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {(page - 1) * limit + 1}–{Math.min(page * limit, total)} / {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="p-1 rounded hover:bg-[var(--bg-surface)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-xs font-medium px-1" style={{ color: 'var(--text-primary)' }}>
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="p-1 rounded hover:bg-[var(--bg-surface)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const { toast } = useToast();
  const { activeTenantId } = useAuth();
  const qc = useQueryClient();

  const [resPage, setResPage]     = useState(1);
  const [formsPage, setFormsPage] = useState(1);

  const { data: resData, isLoading: resLoading } = useQuery({
    queryKey: ['reservations', activeTenantId, 'notifications', resPage],
    queryFn: () => api.get(`/reservations?limit=${LIMIT}&page=${resPage}&sort=desc`).then((r) => r.data),
    enabled: !!activeTenantId,
  });

  const { data: formsData, isLoading: formsLoading } = useQuery({
    queryKey: ['forms', activeTenantId, 'notifications', formsPage],
    queryFn: () => api.get(`/forms?limit=${LIMIT}&page=${formsPage}&sort=desc`).then((r) => r.data),
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

  const newResCount   = resData?.data?.filter((r) => r.status === 'new').length || 0;
  const newFormCount  = formsData?.data?.filter((f) => f.status === 'new').length || 0;
  const resTotal      = resData?.total || 0;
  const formsTotal    = formsData?.total || 0;

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
              {resTotal > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-xs font-semibold bg-blue-600 text-white">{resTotal}</span>
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
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{r.fullName}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {fmtDate(r.date)} · {r.partySize} kişi · {r.phone}
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
          <Pagination page={resPage} total={resTotal} limit={LIMIT} onChange={(p) => { setResPage(p); }} />
        </div>

        {/* Form Gönderileri */}
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Form Gönderileri</h2>
              {formsTotal > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-xs font-semibold bg-blue-600 text-white">{formsTotal}</span>
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
          <Pagination page={formsPage} total={formsTotal} limit={LIMIT} onChange={(p) => { setFormsPage(p); }} />
        </div>
      </div>
    </div>
  );
}
