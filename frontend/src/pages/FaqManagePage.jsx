import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Input, Textarea } from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import { GripVertical, Pencil, Trash2, Plus, ToggleLeft, ToggleRight } from 'lucide-react';

const emptyFaq = {
  question: { tr: '', en: '' },
  answer: { tr: '', en: '' },
  order: 0,
  isActive: true,
};

export default function FaqManagePage() {
  const { toast } = useToast();
  const { activeTenantId } = useAuth();
  const qc = useQueryClient();

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyFaq);
  const [tab, setTab] = useState('tr');

  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ['faqs', activeTenantId],
    queryFn: () => api.get('/faqs').then((r) => r.data),
    enabled: !!activeTenantId,
  });

  const save = useMutation({
    mutationFn: (data) =>
      editing
        ? api.patch(`/faqs/${editing._id}`, data).then((r) => r.data)
        : api.post('/faqs', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['faqs'] });
      toast.success(editing ? 'SSS güncellendi' : 'SSS oluşturuldu');
      closeModal();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Hata oluştu'),
  });

  const del = useMutation({
    mutationFn: (id) => api.delete(`/faqs/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['faqs'] });
      toast.success('SSS silindi');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Hata oluştu'),
  });

  const toggle = useMutation({
    mutationFn: ({ id, isActive }) => api.patch(`/faqs/${id}`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['faqs'] }),
  });

  function openNew() {
    setEditing(null);
    setForm({ ...emptyFaq, order: faqs.length });
    setTab('tr');
    setModal(true);
  }

  function openEdit(faq) {
    setEditing(faq);
    setForm({
      question: { tr: faq.question?.tr || '', en: faq.question?.en || '' },
      answer: { tr: faq.answer?.tr || '', en: faq.answer?.en || '' },
      order: faq.order ?? 0,
      isActive: faq.isActive,
    });
    setTab('tr');
    setModal(true);
  }

  function closeModal() {
    setModal(false);
    setEditing(null);
    setForm(emptyFaq);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.question.tr.trim() || !form.answer.tr.trim()) {
      toast.error('Türkçe soru ve cevap zorunlu');
      return;
    }
    save.mutate(form);
  }

  function setLang(field, lang, value) {
    setForm((f) => ({ ...f, [field]: { ...f[field], [lang]: value } }));
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>SSS Yönetimi</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Sıkça sorulan soruları yönetin</p>
        </div>
        <Button onClick={openNew} icon={<Plus size={14} />}>Yeni SSS</Button>
      </div>

      {isLoading ? (
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Yükleniyor...</div>
      ) : faqs.length === 0 ? (
        <EmptyState
          title="Henüz SSS yok"
          description="İlk soruyu ekleyerek başlayın."
          action={<Button onClick={openNew} icon={<Plus size={14} />}>Yeni SSS</Button>}
        />
      ) : (
        <div className="space-y-2">
          {faqs.map((faq) => (
            <div
              key={faq._id}
              className="flex items-start gap-3 p-4 rounded-xl border"
              style={{
                background: 'var(--bg-surface)',
                borderColor: 'var(--border)',
                opacity: faq.isActive ? 1 : 0.5,
              }}
            >
              <GripVertical size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {faq.question?.tr || '—'}
                </p>
                <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                  {faq.answer?.tr || '—'}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => toggle.mutate({ id: faq._id, isActive: !faq.isActive })}
                  title={faq.isActive ? 'Pasif yap' : 'Aktif yap'}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-muted)] transition-colors"
                >
                  {faq.isActive
                    ? <ToggleRight size={16} style={{ color: '#6366f1' }} />
                    : <ToggleLeft size={16} style={{ color: 'var(--text-muted)' }} />
                  }
                </button>
                <button
                  onClick={() => openEdit(faq)}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-muted)] transition-colors"
                >
                  <Pencil size={14} style={{ color: 'var(--text-muted)' }} />
                </button>
                <button
                  onClick={() => {
                    if (confirm('Bu SSS silinsin mi?')) del.mutate(faq._id);
                  }}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <Trash2 size={14} className="text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modal}
        onClose={closeModal}
        title={editing ? 'SSS Düzenle' : 'Yeni SSS'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dil sekmeleri */}
          <div className="flex gap-1 border-b" style={{ borderColor: 'var(--border)' }}>
            {['tr', 'en'].map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setTab(l)}
                className="px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  color: tab === l ? '#6366f1' : 'var(--text-muted)',
                  borderBottom: tab === l ? '2px solid #6366f1' : '2px solid transparent',
                }}
              >
                {l === 'tr' ? 'Türkçe' : 'İngilizce'}
              </button>
            ))}
          </div>

          <Input
            label={`Soru (${tab.toUpperCase()})`}
            value={form.question[tab]}
            onChange={(e) => setLang('question', tab, e.target.value)}
            required={tab === 'tr'}
          />

          <Textarea
            label={`Cevap (${tab.toUpperCase()})`}
            value={form.answer[tab]}
            onChange={(e) => setLang('answer', tab, e.target.value)}
            rows={4}
            required={tab === 'tr'}
          />

          <Input
            label="Sıralama"
            type="number"
            value={form.order}
            onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={closeModal}>İptal</Button>
            <Button type="submit" loading={save.isPending}>
              {editing ? 'Güncelle' : 'Oluştur'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
