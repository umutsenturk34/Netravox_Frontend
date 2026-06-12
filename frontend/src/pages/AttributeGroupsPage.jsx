import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import { X, Plus, GripVertical } from 'lucide-react';

const INPUT_TYPES = [
  { value: 'select',      label: 'Tek Seçim (Dropdown)' },
  { value: 'multiselect', label: 'Çoklu Seçim' },
  { value: 'text',        label: 'Metin' },
  { value: 'number',      label: 'Sayı' },
  { value: 'boolean',     label: 'Evet / Hayır' },
];

const empty = {
  name: { tr: '', en: '' },
  inputType: 'select',
  values: [],
  unit: '',
  order: 0,
};

export default function AttributeGroupsPage() {
  const { toast } = useToast();
  const { activeTenantId } = useAuth();
  const qc = useQueryClient();

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [valueInput, setValueInput] = useState('');

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['attribute-groups', activeTenantId],
    queryFn: () => api.get('/attribute-groups').then(r => r.data),
    enabled: !!activeTenantId,
  });

  const save = useMutation({
    mutationFn: (data) => editing
      ? api.patch(`/attribute-groups/${editing._id}`, data).then(r => r.data)
      : api.post('/attribute-groups', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries(['attribute-groups', activeTenantId]);
      toast.success(editing ? 'Güncellendi' : 'Özellik grubu oluşturuldu');
      close();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Hata'),
  });

  const del = useMutation({
    mutationFn: (id) => api.delete(`/attribute-groups/${id}`),
    onSuccess: () => {
      qc.invalidateQueries(['attribute-groups', activeTenantId]);
      toast.success('Silindi');
    },
  });

  function open(group = null) {
    setEditing(group);
    setForm(group ? {
      name: { tr: group.name?.tr || '', en: group.name?.en || '' },
      inputType: group.inputType || 'select',
      values: group.values || [],
      unit: group.unit || '',
      order: group.order || 0,
    } : empty);
    setValueInput('');
    setModal(true);
  }

  function close() {
    setModal(false);
    setEditing(null);
    setValueInput('');
  }

  function addValue() {
    const val = valueInput.trim();
    if (!val) return;
    if (form.values.find(v => v.tr === val)) return;
    setForm(p => ({ ...p, values: [...p.values, { tr: val, en: '' }] }));
    setValueInput('');
  }

  function removeValue(i) {
    setForm(p => ({ ...p, values: p.values.filter((_, idx) => idx !== i) }));
  }

  function updateValueEn(i, en) {
    setForm(p => ({
      ...p,
      values: p.values.map((v, idx) => idx === i ? { ...v, en } : v),
    }));
  }

  const needsValues = ['select', 'multiselect'].includes(form.inputType);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Özellik Grupları</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Ürün özelliklerini tanımla — kategorilere atandığında ürün formunda otomatik çıkar
          </p>
        </div>
        <Button onClick={() => open()}>+ Yeni Özellik Grubu</Button>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl animate-pulse" style={{ background: 'var(--bg-muted)' }} />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          title="Henüz özellik grubu yok"
          description="Beden, Renk, Malzeme gibi özellik grupları ekleyerek ürün formlarını zenginleştir."
          action={<Button onClick={() => open()}>+ Yeni Özellik Grubu</Button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map(g => (
            <div
              key={g._id}
              className="rounded-xl border p-4 flex flex-col gap-3"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{g.name?.tr}</p>
                  {g.name?.en && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{g.name.en}</p>}
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0"
                  style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
                  {INPUT_TYPES.find(t => t.value === g.inputType)?.label || g.inputType}
                </span>
              </div>

              {g.values?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {g.values.slice(0, 8).map((v, i) => (
                    <span key={i} className="text-[11px] px-2 py-0.5 rounded-md"
                      style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
                      {v.tr}
                    </span>
                  ))}
                  {g.values.length > 8 && (
                    <span className="text-[11px] px-2 py-0.5 rounded-md" style={{ color: 'var(--text-muted)' }}>
                      +{g.values.length - 8} daha
                    </span>
                  )}
                </div>
              )}

              {g.unit && (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Birim: {g.unit}</p>
              )}

              <div className="flex gap-1.5 pt-2 border-t mt-auto" style={{ borderColor: 'var(--border)' }}>
                <button onClick={() => open(g)}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  style={{ color: 'var(--color-primary)' }}>
                  Düzenle
                </button>
                <button
                  onClick={() => { if (confirm('Silmek istediğine emin misin?')) del.mutate(g._id); }}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 ml-auto transition-colors">
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={close} size="md"
        title={editing ? 'Özellik Grubunu Düzenle' : 'Yeni Özellik Grubu'}>
        <form onSubmit={(e) => { e.preventDefault(); save.mutate(form); }} className="space-y-4">

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Ad (Türkçe) *"
              required
              value={form.name.tr}
              onChange={e => setForm(p => ({ ...p, name: { ...p.name, tr: e.target.value } }))}
              placeholder="Beden, Renk, Malzeme..."
            />
            <Input
              label="Ad (İngilizce)"
              value={form.name.en}
              onChange={e => setForm(p => ({ ...p, name: { ...p.name, en: e.target.value } }))}
              placeholder="Size, Color, Material..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Giriş Tipi
            </label>
            <div className="grid grid-cols-1 gap-2">
              {INPUT_TYPES.map(t => (
                <label key={t.value}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors"
                  style={{
                    borderColor: form.inputType === t.value ? '#6366f1' : 'var(--border)',
                    background: form.inputType === t.value ? 'rgba(99,102,241,0.05)' : 'var(--bg-base)',
                  }}>
                  <input type="radio" name="inputType" value={t.value}
                    checked={form.inputType === t.value}
                    onChange={() => setForm(p => ({ ...p, inputType: t.value }))}
                    className="accent-indigo-600" />
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{t.label}</span>
                </label>
              ))}
            </div>
          </div>

          {needsValues && (
            <div className="space-y-2">
              <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Değerler
              </label>
              {form.values.length > 0 && (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {form.values.map((v, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <GripVertical size={14} className="shrink-0 opacity-30" />
                      <span className="text-sm font-medium w-24 shrink-0" style={{ color: 'var(--text-primary)' }}>{v.tr}</span>
                      <input
                        type="text"
                        value={v.en}
                        onChange={e => updateValueEn(i, e.target.value)}
                        placeholder="English..."
                        className="flex-1 text-sm border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        style={{ background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                      />
                      <button type="button" onClick={() => removeValue(i)}
                        className="text-red-400 hover:text-red-600 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={valueInput}
                  onChange={e => setValueInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addValue(); } }}
                  placeholder="Değer ekle (örn: XS, Kırmızı, Deri...)"
                  className="flex-1 text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
                <button type="button" onClick={addValue}
                  className="flex items-center gap-1 text-sm px-3 py-2 rounded-lg font-medium bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 hover:bg-indigo-100 transition-colors">
                  <Plus size={14} /> Ekle
                </button>
              </div>
            </div>
          )}

          {form.inputType === 'number' && (
            <Input
              label="Birim (isteğe bağlı)"
              value={form.unit}
              onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
              placeholder="cm, kg, GB, lt..."
            />
          )}

          <Input
            label="Sıra"
            type="number"
            value={form.order}
            onChange={e => setForm(p => ({ ...p, order: Number(e.target.value) }))}
          />

          <div className="flex gap-3 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
            <Button type="submit" disabled={save.isPending} className="flex-1">
              {save.isPending ? 'Kaydediliyor...' : editing ? 'Güncelle' : 'Kaydet'}
            </Button>
            <Button type="button" variant="ghost" onClick={close}>İptal</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
