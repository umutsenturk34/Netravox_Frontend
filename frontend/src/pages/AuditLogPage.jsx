import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ClipboardList } from 'lucide-react';
import Button from '../components/ui/Button';

const ACTION_COLORS = {
  create: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
  update: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
  delete: 'bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400',
};
const ACTION_LABELS = { create: 'Oluşturuldu', update: 'Güncellendi', delete: 'Silindi' };

const RESOURCES = ['blog', 'page', 'reservation', 'media', 'settings', 'user', 'popup', 'team', 'testimonial'];

function fmt(date) {
  return new Date(date).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AuditLogPage() {
  const { activeTenantId } = useAuth();
  const [page, setPage] = useState(1);
  const [resource, setResource] = useState('');
  const [action, setAction] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit', activeTenantId, page, resource, action],
    queryFn: () => {
      const params = new URLSearchParams({ page, limit: 50 });
      if (resource) params.set('resource', resource);
      if (action) params.set('action', action);
      return api.get(`/audit?${params}`).then((r) => r.data);
    },
    enabled: !!activeTenantId,
  });

  const logs = data?.logs || data?.data || [];
  const totalPages = data?.pages || 1;

  const selectStyle = {
    background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Audit Log</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Sistemdeki tüm değişikliklerin kaydı</p>
        </div>
      </div>

      {/* Filtreler */}
      <div className="flex gap-3 mb-4">
        <select value={resource} onChange={(e) => { setResource(e.target.value); setPage(1); }}
          className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          style={selectStyle}>
          <option value="">Tüm Kaynaklar</option>
          {RESOURCES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}
          className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          style={selectStyle}>
          <option value="">Tüm İşlemler</option>
          <option value="create">Oluşturuldu</option>
          <option value="update">Güncellendi</option>
          <option value="delete">Silindi</option>
        </select>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        {isLoading ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Yükleniyor...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 flex flex-col items-center gap-3">
            <ClipboardList size={32} style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Henüz log kaydı yok</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-muted)' }}>
                {['Tarih', 'Kullanıcı', 'İşlem', 'Kaynak', 'IP'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id} className="border-t hover:bg-[var(--bg-muted)] transition-colors" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{fmt(log.createdAt)}</td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{log.userName || '—'}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{log.userEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ACTION_COLORS[log.action] || ''}`}>
                      {ACTION_LABELS[log.action] || log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{log.resource}</span>
                    {log.resourceId && <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>#{log.resourceId.slice(-6)}</span>}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{log.ip || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Sayfalama */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Sayfa {page} / {totalPages}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Önceki</Button>
            <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Sonraki →</Button>
          </div>
        </div>
      )}
    </div>
  );
}
