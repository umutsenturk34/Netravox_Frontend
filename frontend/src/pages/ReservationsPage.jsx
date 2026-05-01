import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const STATUS = {
  new: { label: 'Yeni', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  seen: { label: 'Görüldü', cls: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Onaylandı', cls: 'bg-green-100 text-green-700' },
  rejected: { label: 'Reddedildi', cls: 'bg-red-100 text-red-700' },
  cancelled: { label: 'İptal', cls: 'bg-gray-100 text-gray-600' },
};

export default function ReservationsPage() {
  const qc = useQueryClient();
  const { activeTenantId } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['reservations', activeTenantId],
    queryFn: () => api.get('/reservations?limit=50').then((r) => r.data),
    enabled: !!activeTenantId,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/reservations/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reservations'] }),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Rezervasyonlar</h1>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full text-sm">
          <thead style={{ background: 'var(--bg-muted)' }}>
            <tr>
              {['Ad Soyad', 'Tarih / Saat', 'Kişi', 'Durum', 'İşlem'].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody style={{ background: 'var(--bg-surface)' }}>
            {isLoading && (
              <tr><td colSpan={5} className="px-4 py-8 text-center" style={{ color: 'var(--text-muted)' }}>Yükleniyor...</td></tr>
            )}
            {data?.data?.map((r) => (
              <tr key={r._id} className="border-t hover:bg-[var(--bg-muted)] transition-colors" style={{ borderColor: 'var(--border)' }}>
                <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                  <div>{r.fullName}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.phone}</div>
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                  {new Date(r.date).toLocaleDateString('tr-TR')} {r.time}
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{r.partySize} kişi</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS[r.status]?.cls}`}>
                    {STATUS[r.status]?.label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={r.status}
                    onChange={(e) => updateStatus.mutate({ id: r._id, status: e.target.value })}
                    className="text-xs rounded border px-2 py-1"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
                  >
                    {Object.entries(STATUS).map(([val, { label }]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {!isLoading && !data?.data?.length && (
              <tr><td colSpan={5} className="px-4 py-8 text-center" style={{ color: 'var(--text-muted)' }}>Henüz rezervasyon yok</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
