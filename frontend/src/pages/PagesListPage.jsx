import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import { TableSkeleton } from '../components/ui/Skeleton';

const statusLabel = { draft: 'Taslak', published: 'Yayında', archived: 'Arşiv' };
const statusColor = {
  draft: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  published: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  archived: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export default function PagesListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { activeTenantId } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['pages', activeTenantId],
    queryFn: () => api.get('/pages?limit=50').then((r) => r.data),
    enabled: !!activeTenantId,
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/pages/${id}/publish`, { status }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pages'] });
      toast.success('Durum güncellendi');
    },
    onError: () => toast.error('Güncellenemedi'),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Sayfalar</h1>
        <Button onClick={() => navigate('/pages/new')}>+ Yeni Sayfa</Button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <table className="w-full text-sm">
            <thead style={{ background: 'var(--bg-muted)' }}>
              <tr>
                {['Başlık', 'Şablon', 'Durum', 'Güncellenme', ''].map((h, i) => (
                  <th key={i} className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody style={{ background: 'var(--bg-surface)' }}>
              {data?.data?.map((page) => (
                <tr key={page._id} className="border-t hover:bg-[var(--bg-muted)] transition-colors" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-4 py-3">
                    <Link
                      to={`/pages/${page._id}/edit`}
                      className="font-medium hover:underline"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {page.title?.tr || page.title?.en || '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{page.template}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[page.status]}`}>
                      {statusLabel[page.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>
                    {new Date(page.updatedAt).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 items-center">
                      <Link
                        to={`/pages/${page._id}/edit`}
                        className="text-xs px-2 py-1 rounded hover:bg-[var(--bg-muted)]"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Düzenle
                      </Link>
                      {page.status !== 'published' && (
                        <button
                          onClick={() => publishMutation.mutate({ id: page._id, status: 'published' })}
                          className="text-xs px-2 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100"
                        >
                          Yayınla
                        </button>
                      )}
                      {page.status === 'published' && (
                        <button
                          onClick={() => publishMutation.mutate({ id: page._id, status: 'draft' })}
                          className="text-xs px-2 py-1 rounded bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                        >
                          Taslağa al
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!data?.data?.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center" style={{ color: 'var(--text-muted)' }}>
                    Henüz sayfa yok —{' '}
                    <button onClick={() => navigate('/pages/new')} className="text-blue-600 hover:underline">
                      ilk sayfayı oluşturun
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
