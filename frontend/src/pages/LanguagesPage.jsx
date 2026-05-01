import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';

const LANG_NAMES = { tr: 'Türkçe', en: 'İngilizce', de: 'Almanca', fr: 'Fransızca', ar: 'Arapça' };

export default function LanguagesPage() {
  const { toast } = useToast();
  const { activeTenantId } = useAuth();
  const qc = useQueryClient();

  const { data: langs = [], isLoading } = useQuery({
    queryKey: ['languages', activeTenantId],
    queryFn: () => api.get('/languages').then((r) => r.data),
    enabled: !!activeTenantId,
  });

  const addMutation = useMutation({
    mutationFn: (code) => api.post('/languages', { code, label: LANG_NAMES[code] || code }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['languages'] });
      toast.success('Dil eklendi');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Eklenemedi'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/languages/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['languages'] });
      toast.success('Dil silindi');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Silinemedi'),
  });

  const availableCodes = Object.keys(LANG_NAMES).filter(
    (code) => !langs.some((l) => l.code === code)
  );

  if (isLoading) {
    return <div className="py-12 text-center" style={{ color: 'var(--text-muted)' }}>Yükleniyor...</div>;
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Dil Ayarları</h1>

      <div className="rounded-xl border overflow-hidden mb-6" style={{ borderColor: 'var(--border)' }}>
        <div className="px-4 py-3" style={{ background: 'var(--bg-muted)' }}>
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>Aktif Diller</h2>
        </div>
        <div style={{ background: 'var(--bg-surface)' }}>
          {langs.map((lang) => (
            <div
              key={lang.code}
              className="flex items-center justify-between px-4 py-3 border-b last:border-0"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono uppercase font-semibold px-2 py-0.5 rounded" style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)' }}>
                  {lang.code}
                </span>
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{lang.label || LANG_NAMES[lang.code] || lang.code}</span>
                {lang.isDefault && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Varsayılan</span>
                )}
              </div>
              {!lang.isDefault && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => deleteMutation.mutate(lang._id)}
                  disabled={deleteMutation.isPending}
                >
                  Kaldır
                </Button>
              )}
            </div>
          ))}
          {!langs.length && (
            <p className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Dil tanımlanmamış</p>
          )}
        </div>
      </div>

      {availableCodes.length > 0 && (
        <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
          <h2 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>Dil Ekle</h2>
          <div className="flex flex-wrap gap-2">
            {availableCodes.map((code) => (
              <button
                key={code}
                onClick={() => addMutation.mutate(code)}
                disabled={addMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors hover:bg-[var(--bg-muted)]"
                style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              >
                <span className="font-mono uppercase text-xs font-semibold">{code}</span>
                <span>{LANG_NAMES[code]}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
