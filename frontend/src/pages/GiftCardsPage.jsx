import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import { Plus, Gift, Copy, Ban, ChevronDown, ChevronUp } from 'lucide-react';

const emptyForm = {
  amount: '',
  currency: 'TRY',
  issuedToEmail: '',
  expiresAt: '',
  customCode: '',
};

export default function GiftCardsPage() {
  const { toast } = useToast();
  const { activeTenantId } = useAuth();
  const qc = useQueryClient();

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ['gift-cards', activeTenantId, page],
    queryFn: () => api.get(`/gift-cards?page=${page}&limit=20`).then((r) => r.data),
    enabled: !!activeTenantId,
  });

  const cards = data?.cards || [];
  const pages = data?.pages || 1;

  const create = useMutation({
    mutationFn: (body) => api.post('/gift-cards', body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gift-cards'] });
      toast.success('Hediye kartı oluşturuldu');
      setModal(false);
      setForm(emptyForm);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Hata oluştu'),
  });

  const toggle = useMutation({
    mutationFn: ({ id, isActive }) =>
      api.patch(`/gift-cards/${id}`, { isActive }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gift-cards'] });
      toast.success('Kart güncellendi');
    },
  });

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error('Geçerli bir tutar girin');
      return;
    }
    create.mutate({
      amount: Number(form.amount),
      currency: form.currency,
      issuedToEmail: form.issuedToEmail || undefined,
      expiresAt: form.expiresAt || undefined,
      customCode: form.customCode || undefined,
    });
  }

  function copyCode(code) {
    navigator.clipboard.writeText(code).then(() => toast.success('Kod kopyalandı'));
  }

  function formatDate(d) {
    if (!d) return null;
    return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function balancePct(card) {
    return card.initialAmount ? Math.round((card.balance / card.initialAmount) * 100) : 0;
  }

  function isExpired(card) {
    return card.expiresAt && new Date(card.expiresAt) < new Date();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Hediye Kartları
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Hediye kartı oluştur, yönet ve iptal et
          </p>
        </div>
        <Button onClick={() => setModal(true)} icon={<Plus size={14} />}>
          Yeni Kart
        </Button>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 rounded-xl animate-pulse" style={{ background: 'var(--bg-muted)' }} />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <EmptyState
          title="Hediye kartı yok"
          description="İlk hediye kartını oluşturun."
          action={<Button onClick={() => setModal(true)} icon={<Plus size={14} />}>Yeni Kart</Button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => {
            const expired = isExpired(card);
            const pct = balancePct(card);
            const inactive = !card.isActive || expired;

            return (
              <div
                key={card._id}
                className="rounded-xl border overflow-hidden transition-shadow hover:shadow-md"
                style={{
                  background: 'var(--bg-surface)',
                  borderColor: inactive ? 'var(--border)' : 'rgba(99,102,241,0.25)',
                  opacity: inactive ? 0.65 : 1,
                }}
              >
                {/* Renk şerit */}
                <div
                  className="h-1.5"
                  style={{
                    background: inactive
                      ? 'var(--bg-muted)'
                      : `linear-gradient(to right, #6366f1 ${pct}%, var(--bg-muted) ${pct}%)`,
                  }}
                />

                <div className="p-4 space-y-3">
                  {/* Kod */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Gift size={16} style={{ color: inactive ? 'var(--text-muted)' : '#6366f1' }} />
                      <span className="font-mono font-bold text-sm tracking-wide" style={{ color: 'var(--text-primary)' }}>
                        {card.code}
                      </span>
                    </div>
                    <button
                      onClick={() => copyCode(card.code)}
                      className="p-1 rounded transition-colors hover:bg-[var(--bg-muted)]"
                      title="Kodu kopyala"
                    >
                      <Copy size={13} style={{ color: 'var(--text-muted)' }} />
                    </button>
                  </div>

                  {/* Bakiye */}
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Kalan Bakiye</p>
                      <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        {card.balance.toLocaleString('tr-TR')} {card.currency === 'TRY' ? '₺' : card.currency}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Başlangıç</p>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
                        {card.initialAmount.toLocaleString('tr-TR')} {card.currency === 'TRY' ? '₺' : card.currency}
                      </p>
                    </div>
                  </div>

                  {/* Meta bilgiler */}
                  <div className="flex flex-wrap gap-1.5">
                    {card.issuedToEmail && (
                      <span className="text-[11px] px-2 py-0.5 rounded-md" style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
                        ✉ {card.issuedToEmail}
                      </span>
                    )}
                    {card.expiresAt && (
                      <span
                        className="text-[11px] px-2 py-0.5 rounded-md"
                        style={{
                          background: expired ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                          color: expired ? '#dc2626' : '#059669',
                        }}
                      >
                        {expired ? '✗ Süresi doldu' : `📅 ${formatDate(card.expiresAt)}'e kadar`}
                      </span>
                    )}
                    {!card.isActive && (
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950/30 text-red-500">
                        İptal edildi
                      </span>
                    )}
                  </div>

                  {/* Hareketler accordion */}
                  {card.transactions?.length > 0 && (
                    <div>
                      <button
                        onClick={() => setExpanded((p) => ({ ...p, [card._id]: !p[card._id] }))}
                        className="flex items-center gap-1 text-[11px] transition-colors hover:opacity-70"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {expanded[card._id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        {card.transactions.length} hareket
                      </button>
                      {expanded[card._id] && (
                        <div className="mt-2 space-y-1 border-t pt-2" style={{ borderColor: 'var(--border)' }}>
                          {card.transactions.map((tx, i) => (
                            <div key={i} className="flex justify-between text-[11px]" style={{ color: 'var(--text-muted)' }}>
                              <span>{tx.note || (tx.amount < 0 ? 'Harcama' : 'Yükleme')}</span>
                              <span style={{ color: tx.amount < 0 ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                                {tx.amount > 0 ? `+${tx.amount}` : tx.amount} ₺
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Aksiyon */}
                  <div className="border-t pt-3" style={{ borderColor: 'var(--border)' }}>
                    {card.isActive && !expired ? (
                      <button
                        onClick={() => { if (confirm(`"${card.code}" kartını iptal etmek istiyor musunuz?`)) toggle.mutate({ id: card._id, isActive: false }); }}
                        className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-red-600"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <Ban size={13} />
                        İptal Et
                      </button>
                    ) : (
                      <button
                        onClick={() => toggle.mutate({ id: card._id, isActive: true })}
                        className="text-xs font-medium transition-colors"
                        style={{ color: 'var(--color-primary, #6366f1)' }}
                      >
                        Yeniden Aktif Et
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button variant="ghost" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Önceki</Button>
          <span className="px-3 py-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>{page} / {pages}</span>
          <Button variant="ghost" disabled={page === pages} onClick={() => setPage((p) => p + 1)}>Sonraki →</Button>
        </div>
      )}

      {/* Yeni Kart Modalı */}
      <Modal open={modal} onClose={() => { setModal(false); setForm(emptyForm); }} title="Yeni Hediye Kartı">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Tutar *"
              type="number"
              min="1"
              required
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder="500"
            />
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Para Birimi
              </label>
              <select
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                className="w-full rounded-lg px-3.5 py-2.5 border outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                style={{ background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: '16px' }}
              >
                <option value="TRY">₺ TRY</option>
                <option value="USD">$ USD</option>
                <option value="EUR">€ EUR</option>
              </select>
            </div>
          </div>

          <Input
            label="E-posta Adresi (isteğe bağlı)"
            type="email"
            value={form.issuedToEmail}
            onChange={(e) => setForm((f) => ({ ...f, issuedToEmail: e.target.value }))}
            placeholder="musteri@example.com"
            hint="Kartın kime ait olduğunu takip etmek için"
          />

          <Input
            label="Son Kullanma Tarihi (isteğe bağlı)"
            type="date"
            value={form.expiresAt}
            onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
          />

          <Input
            label="Özel Kod (isteğe bağlı)"
            value={form.customCode}
            onChange={(e) => setForm((f) => ({ ...f, customCode: e.target.value.toUpperCase() }))}
            placeholder="DOUM-GUNU-25"
            hint="Boş bırakılırsa otomatik oluşturulur"
          />

          <div className="flex gap-3 pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
            <Button type="submit" disabled={create.isPending} className="flex-1">
              {create.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => { setModal(false); setForm(emptyForm); }}>
              İptal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
