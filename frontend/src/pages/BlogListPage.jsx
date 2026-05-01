import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { Plus, Pencil, Trash2, Eye, EyeOff, Archive } from 'lucide-react';

const statusConfig = {
  draft:     { label: 'Taslak',    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400' },
  published: { label: 'Yayında',   className: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400' },
  archived:  { label: 'Arşivlendi', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
};

export default function BlogListPage() {
  const { toast } = useToast();
  const { activeTenantId } = useAuth();
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['blog', activeTenantId, filterStatus],
    queryFn: () => {
      const params = new URLSearchParams({ limit: 50 });
      if (filterStatus) params.append('status', filterStatus);
      return api.get(`/blog?${params}`).then((r) => r.data);
    },
    enabled: !!activeTenantId,
  });

  const posts = data?.data || [];

  const changeStatus = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/blog/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blog'] });
      toast.success('Durum güncellendi');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Hata oluştu'),
  });

  const del = useMutation({
    mutationFn: (id) => api.delete(`/blog/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blog'] });
      toast.success('Blog yazısı silindi');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Hata oluştu'),
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Blog Yazıları</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {data?.total ?? 0} yazı
          </p>
        </div>
        <Link to="/blog/new">
          <Button icon={<Plus size={14} />}>Yeni Yazı</Button>
        </Link>
      </div>

      {/* Filtre */}
      <div className="flex gap-2 mb-5">
        {['', 'draft', 'published', 'archived'].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: filterStatus === s ? '#6366f1' : 'var(--bg-surface)',
              color: filterStatus === s ? 'white' : 'var(--text-secondary)',
              border: `1px solid ${filterStatus === s ? '#6366f1' : 'var(--border)'}`,
            }}
          >
            {s === '' ? 'Tümü' : statusConfig[s]?.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Yükleniyor...</div>
      ) : posts.length === 0 ? (
        <EmptyState
          title="Henüz blog yazısı yok"
          description="İlk yazıyı oluşturarak başlayın."
          action={
            <Link to="/blog/new">
              <Button icon={<Plus size={14} />}>Yeni Yazı</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-2">
          {posts.map((post) => {
            const sc = statusConfig[post.status] || statusConfig.draft;
            return (
              <div
                key={post._id}
                className="flex items-center gap-4 p-4 rounded-xl border"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
              >
                {post.coverImage && (
                  <img
                    src={post.coverImage}
                    alt=""
                    className="w-14 h-14 rounded-lg object-cover shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${sc.className}`}>
                      {sc.label}
                    </span>
                    {post.tags?.slice(0, 2).map((t) => (
                      <span key={t} className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
                        {t}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                    {post.title?.tr || '—'}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {post.author && `${post.author} · `}
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString('tr-TR')
                      : new Date(post.updatedAt).toLocaleDateString('tr-TR')}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {post.status !== 'published' && (
                    <button
                      onClick={() => changeStatus.mutate({ id: post._id, status: 'published' })}
                      title="Yayınla"
                      className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors"
                    >
                      <Eye size={14} className="text-green-600" />
                    </button>
                  )}
                  {post.status === 'published' && (
                    <button
                      onClick={() => changeStatus.mutate({ id: post._id, status: 'draft' })}
                      title="Taslağa al"
                      className="p-1.5 rounded-lg hover:bg-[var(--bg-muted)] transition-colors"
                    >
                      <EyeOff size={14} style={{ color: 'var(--text-muted)' }} />
                    </button>
                  )}
                  {post.status !== 'archived' && (
                    <button
                      onClick={() => changeStatus.mutate({ id: post._id, status: 'archived' })}
                      title="Arşivle"
                      className="p-1.5 rounded-lg hover:bg-[var(--bg-muted)] transition-colors"
                    >
                      <Archive size={14} style={{ color: 'var(--text-muted)' }} />
                    </button>
                  )}
                  <Link to={`/blog/${post._id}/edit`}>
                    <button className="p-1.5 rounded-lg hover:bg-[var(--bg-muted)] transition-colors">
                      <Pencil size={14} style={{ color: 'var(--text-muted)' }} />
                    </button>
                  </Link>
                  <button
                    onClick={() => {
                      if (confirm('Bu yazı silinsin mi?')) del.mutate(post._id);
                    }}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
