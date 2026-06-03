import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { CheckCircle, XCircle, Trash2, Star } from 'lucide-react';

function StarRow({ rating }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={13}
          className={n <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 fill-gray-300'}
        />
      ))}
    </span>
  );
}

const FILTER_STATUS = [
  { label: 'Tümü', value: '' },
  { label: 'Bekleyenler', value: 'false' },
  { label: 'Onaylılar', value: 'true' },
];

const FILTER_RATING = [
  { label: 'Tüm Puanlar', value: '' },
  { label: '⭐ 1', value: '1' },
  { label: '⭐ 2', value: '2' },
  { label: '⭐ 3', value: '3' },
  { label: '⭐ 4', value: '4' },
  { label: '⭐ 5', value: '5' },
];

export default function ReviewsPage() {
  const { toast } = useToast();
  const { activeTenantId } = useAuth();
  const qc = useQueryClient();

  const [filterApproved, setFilterApproved] = useState('false'); // varsayılan: bekleyenler
  const [filterRating, setFilterRating] = useState('');
  const [page, setPage] = useState(1);

  const params = new URLSearchParams({ page, limit: 20 });
  if (filterApproved !== '') params.set('isApproved', filterApproved);

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', activeTenantId, filterApproved, filterRating, page],
    queryFn: () => api.get(`/reviews?${params}`).then((r) => r.data),
    enabled: !!activeTenantId,
  });

  const reviews = (data?.reviews || []).filter((r) =>
    filterRating ? String(r.rating) === filterRating : true
  );
  const total = data?.total || 0;
  const pages = data?.pages || 1;

  const approve = useMutation({
    mutationFn: ({ id, isApproved }) =>
      api.patch(`/reviews/${id}/approve`, { isApproved }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Yorum güncellendi');
    },
    onError: () => toast.error('İşlem başarısız'),
  });

  const del = useMutation({
    mutationFn: (id) => api.delete(`/reviews/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Yorum silindi');
    },
  });

  function formatDate(d) {
    return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Yorumlar
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Müşteri yorumlarını onaylayın veya reddedin
          </p>
        </div>
        {total > 0 && (
          <span className="text-sm px-3 py-1 rounded-full" style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
            {total} yorum
          </span>
        )}
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          {FILTER_STATUS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setFilterApproved(f.value); setPage(1); }}
              className="px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: filterApproved === f.value ? 'var(--color-primary, #6366f1)' : 'var(--bg-surface)',
                color: filterApproved === f.value ? '#fff' : 'var(--text-primary)',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          {FILTER_RATING.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilterRating(f.value)}
              className="px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: filterRating === f.value ? 'var(--color-primary, #6366f1)' : 'var(--bg-surface)',
                color: filterRating === f.value ? '#fff' : 'var(--text-primary)',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: 'var(--bg-muted)' }} />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          title="Yorum bulunamadı"
          description={filterApproved === 'false' ? 'Onay bekleyen yorum yok.' : 'Bu filtreye uygun yorum yok.'}
        />
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => {
            const customerName = r.customerId
              ? `${r.customerId.firstName || ''} ${r.customerId.lastName || ''}`.trim() || r.customerId.email
              : 'Anonim';
            const productName = r.serviceId?.name?.tr || 'Ürün';

            return (
              <div
                key={r._id}
                className="rounded-xl border p-4 transition-shadow hover:shadow-sm"
                style={{
                  background: 'var(--bg-surface)',
                  borderColor: r.isApproved ? 'var(--border)' : 'rgba(234,179,8,0.3)',
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Sol: müşteri avatar */}
                  <div
                    className="shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}
                  >
                    {customerName.charAt(0).toUpperCase()}
                  </div>

                  {/* Orta: içerik */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                        {customerName}
                      </span>
                      <StarRow rating={r.rating} />
                      <span
                        className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background: r.isApproved ? 'rgba(16,185,129,0.1)' : 'rgba(234,179,8,0.15)',
                          color: r.isApproved ? '#059669' : '#b45309',
                        }}
                      >
                        {r.isApproved ? 'Onaylı' : 'Bekliyor'}
                      </span>
                      {r.isVerified && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600">
                          ✓ Doğrulanmış alım
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] mt-0.5 mb-2" style={{ color: 'var(--text-muted)' }}>
                      {productName} · {formatDate(r.createdAt)}
                    </p>

                    {r.title && (
                      <p className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                        {r.title}
                      </p>
                    )}
                    {r.body && (
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary, var(--text-muted))' }}>
                        {r.body}
                      </p>
                    )}
                  </div>

                  {/* Sağ: aksiyon butonları */}
                  <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                    {r.isApproved ? (
                      <button
                        onClick={() => approve.mutate({ id: r._id, isApproved: false })}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                        style={{ color: '#b45309' }}
                        title="Onayı geri al"
                      >
                        <XCircle size={14} />
                        Geri Al
                      </button>
                    ) : (
                      <button
                        onClick={() => approve.mutate({ id: r._id, isApproved: true })}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors hover:bg-green-50 dark:hover:bg-green-900/20"
                        style={{ color: '#059669' }}
                        title="Onayla"
                      >
                        <CheckCircle size={14} />
                        Onayla
                      </button>
                    )}
                    <button
                      onClick={() => { if (confirm('Yorumu silmek istiyor musunuz?')) del.mutate(r._id); }}
                      className="p-1.5 rounded-lg transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
                      title="Sil"
                    >
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sayfalama */}
      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button variant="ghost" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            ← Önceki
          </Button>
          <span className="px-3 py-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
            {page} / {pages}
          </span>
          <Button variant="ghost" disabled={page === pages} onClick={() => setPage((p) => p + 1)}>
            Sonraki →
          </Button>
        </div>
      )}
    </div>
  );
}
