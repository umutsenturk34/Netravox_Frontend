import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import {
  Truck, MessageSquare, Award, ShoppingBag, Gift,
  Plus, Trash2, CheckCircle2, ChevronRight,
} from 'lucide-react';

// ─── Defaults ────────────────────────────────────────────────────────────────
const DEFAULT_SMS      = { enabled: false, provider: 'netgsm', username: '', password: '', apiKey: '', sender: '', templates: { orderConfirmed: '', orderShipped: '' } };
const DEFAULT_WA       = { phoneNumberId: '', accessToken: '', orderTemplateId: '' };
const DEFAULT_SHIPPING = { enabled: false, defaultShippingFee: 0, freeShippingThreshold: '', cashOnDeliveryExtra: 0, zones: [] };
const DEFAULT_LOYALTY  = { enabled: false, pointsPerTRY: 1, pointValueInTRY: 0.01, minimumRedeem: 100, expiryDays: '' };
const DEFAULT_MP       = {
  trendyol:    { enabled: false, apiKey: '', apiSecret: '', accountCode: '', trendyolBrandId: '', trendyolCategoryId: '', cargoCompanyId: 17 },
  hepsiburada: { enabled: false, apiKey: '', apiSecret: '', accountCode: '', hbCategoryId: '' },
};
const CARRIER_NAMES  = ['aras', 'yurtici', 'mng', 'ptt', 'sendeo'];
const CARRIER_LABELS = { aras: 'Aras Kargo', yurtici: 'Yurtiçi Kargo', mng: 'MNG Kargo', ptt: 'PTT Kargo', sendeo: 'Sendeo' };

// ─── Nav items ────────────────────────────────────────────────────────────────
const NAV = [
  {
    id: 'kargo',
    label: 'Kargo',
    icon: Truck,
    desc: 'Ücreti, bölgeler ve kargo firması entegrasyonları',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.1)',
  },
  {
    id: 'sms',
    label: 'SMS',
    icon: MessageSquare,
    desc: 'Netgsm veya iletimerkezi ile sipariş bildirimleri',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.1)',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp API',
    icon: MessageSquare,
    desc: 'Meta Business Cloud API ile otomatik bildirim',
    color: '#25d366',
    bg: 'rgba(37,211,102,0.1)',
  },
  {
    id: 'sadakat',
    label: 'Sadakat',
    icon: Award,
    desc: 'Puan kazanma, kullanma ve geçerlilik ayarları',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    icon: ShoppingBag,
    desc: 'Trendyol ve Hepsiburada entegrasyon kimlik bilgileri',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.1)',
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ECommerceSettingsPage() {
  const { activeTenantId } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeSection, setActiveSection] = useState('kargo');

  const [smsForm,      setSmsForm]      = useState(DEFAULT_SMS);
  const [waForm,       setWaForm]       = useState(DEFAULT_WA);
  const [shippingForm, setShippingForm] = useState(DEFAULT_SHIPPING);
  const [loyaltyForm,  setLoyaltyForm]  = useState(DEFAULT_LOYALTY);
  const [carriers,     setCarriers]     = useState([]);
  const [mpForm,       setMpForm]       = useState(DEFAULT_MP);

  // ── Lazy queries — sadece aktif sekme açıkken yüklenir ───────────────────
  const { data: smsData } = useQuery({
    queryKey: ['company-sms', activeTenantId],
    queryFn: () => api.get(`/companies/${activeTenantId}/sms-settings`).then((r) => r.data),
    enabled: !!activeTenantId && activeSection === 'sms',
  });
  const { data: waData } = useQuery({
    queryKey: ['company-wa', activeTenantId],
    queryFn: () => api.get(`/companies/${activeTenantId}/whatsapp-settings`).then((r) => r.data),
    enabled: !!activeTenantId && activeSection === 'whatsapp',
  });
  const { data: shippingData } = useQuery({
    queryKey: ['company-shipping', activeTenantId],
    queryFn: () => api.get(`/companies/${activeTenantId}/shipping-settings`).then((r) => r.data),
    enabled: !!activeTenantId && activeSection === 'kargo',
  });
  const { data: loyaltyData } = useQuery({
    queryKey: ['company-loyalty', activeTenantId],
    queryFn: () => api.get(`/companies/${activeTenantId}/loyalty-settings`).then((r) => r.data),
    enabled: !!activeTenantId && activeSection === 'sadakat',
  });
  const { data: carrierData } = useQuery({
    queryKey: ['company-carriers', activeTenantId],
    queryFn: () => api.get(`/companies/${activeTenantId}/carrier-settings`).then((r) => r.data),
    enabled: !!activeTenantId && activeSection === 'kargo',
  });
  const { data: mpData } = useQuery({
    queryKey: ['company-marketplace', activeTenantId],
    queryFn: () => api.get(`/companies/${activeTenantId}/marketplace-settings`).then((r) => r.data),
    enabled: !!activeTenantId && activeSection === 'marketplace',
  });

  // ── Form populate effects ────────────────────────────────────────────────
  useEffect(() => {
    if (smsData) setSmsForm({ ...DEFAULT_SMS, ...smsData, templates: { ...DEFAULT_SMS.templates, ...(smsData.templates || {}) } });
  }, [smsData]);
  useEffect(() => { if (waData) setWaForm({ ...DEFAULT_WA, ...waData }); }, [waData]);
  useEffect(() => {
    if (shippingData) setShippingForm({ ...DEFAULT_SHIPPING, ...shippingData, freeShippingThreshold: shippingData.freeShippingThreshold ?? '' });
  }, [shippingData]);
  useEffect(() => {
    if (loyaltyData) setLoyaltyForm({ ...DEFAULT_LOYALTY, ...loyaltyData, expiryDays: loyaltyData.expiryDays ?? '' });
  }, [loyaltyData]);
  useEffect(() => {
    if (carrierData && Array.isArray(carrierData)) {
      const filled = CARRIER_NAMES.map((name) => {
        const existing = carrierData.find((c) => c.name === name);
        return existing || { name, enabled: false, apiKey: '', apiSecret: '', accountCode: '', testMode: true };
      });
      setCarriers(filled);
    } else if (!carrierData) {
      setCarriers(CARRIER_NAMES.map((name) => ({ name, enabled: false, apiKey: '', apiSecret: '', accountCode: '', testMode: true })));
    }
  }, [carrierData]);
  useEffect(() => {
    if (mpData) setMpForm({
      trendyol:    { ...DEFAULT_MP.trendyol,    ...(mpData.trendyol    || {}) },
      hepsiburada: { ...DEFAULT_MP.hepsiburada, ...(mpData.hepsiburada || {}) },
    });
  }, [mpData]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const smsMutation = useMutation({
    mutationFn: (d) => api.patch(`/companies/${activeTenantId}/sms-settings`, d).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['company-sms', activeTenantId] }); toast.success('SMS ayarları kaydedildi'); },
    onError: () => toast.error('Kaydedilemedi'),
  });
  const waMutation = useMutation({
    mutationFn: (d) => api.patch(`/companies/${activeTenantId}/whatsapp-settings`, d).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['company-wa', activeTenantId] }); toast.success('WhatsApp ayarları kaydedildi'); },
    onError: () => toast.error('Kaydedilemedi'),
  });
  const shippingMutation = useMutation({
    mutationFn: (d) => api.patch(`/companies/${activeTenantId}/shipping-settings`, d).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['company-shipping', activeTenantId] }); toast.success('Kargo ayarları kaydedildi'); },
    onError: () => toast.error('Kaydedilemedi'),
  });
  const loyaltyMutation = useMutation({
    mutationFn: (d) => api.patch(`/companies/${activeTenantId}/loyalty-settings`, d).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['company-loyalty', activeTenantId] }); toast.success('Sadakat ayarları kaydedildi'); },
    onError: () => toast.error('Kaydedilemedi'),
  });
  const carrierMutation = useMutation({
    mutationFn: (d) => api.patch(`/companies/${activeTenantId}/carrier-settings`, { carriers: d }).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['company-carriers', activeTenantId] }); toast.success('Kargo entegrasyonları kaydedildi'); },
    onError: () => toast.error('Kaydedilemedi'),
  });
  const mpMutation = useMutation({
    mutationFn: (d) => api.patch(`/companies/${activeTenantId}/marketplace-settings`, d).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['company-marketplace', activeTenantId] }); toast.success('Marketplace ayarları kaydedildi'); },
    onError: () => toast.error('Kaydedilemedi'),
  });

  const activeNav = NAV.find((n) => n.id === activeSection);

  return (
    <div className="max-w-5xl">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>E-Ticaret Ayarları</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Kargo, bildirimler, sadakat programı ve marketplace entegrasyonlarını yönetin
        </p>
      </div>

      <div className="flex gap-6 items-start">

        {/* ── Sol dikey navigasyon ────────────────────────────────────────── */}
        <aside className="w-56 shrink-0 sticky top-6">
          <nav className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
            {NAV.map((item, idx) => {
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all group ${
                    idx < NAV.length - 1 ? 'border-b' : ''
                  }`}
                  style={{
                    borderColor: 'var(--border)',
                    background: active ? item.bg : 'transparent',
                  }}
                >
                  {/* Icon badge */}
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all"
                    style={{
                      background: active ? item.color : 'var(--bg-muted)',
                      boxShadow: active ? `0 2px 8px ${item.color}40` : 'none',
                    }}
                  >
                    <item.icon
                      size={14}
                      style={{ color: active ? '#fff' : 'var(--text-muted)' }}
                      strokeWidth={active ? 2.5 : 1.8}
                    />
                  </div>

                  {/* Label + desc */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium leading-tight"
                      style={{ color: active ? item.color : 'var(--text-primary)' }}
                    >
                      {item.label}
                    </p>
                    <p className="text-xs mt-0.5 leading-tight truncate" style={{ color: 'var(--text-muted)' }}>
                      {item.desc}
                    </p>
                  </div>

                  <ChevronRight
                    size={13}
                    className="shrink-0 transition-opacity"
                    style={{ color: item.color, opacity: active ? 1 : 0 }}
                  />
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ── Sağ içerik ──────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Section header */}
          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${activeNav?.color}, ${activeNav?.color}cc)`,
                boxShadow: `0 4px 12px ${activeNav?.color}40`,
              }}
            >
              {activeNav && <activeNav.icon size={17} style={{ color: '#fff' }} strokeWidth={2} />}
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                {activeNav?.label}
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{activeNav?.desc}</p>
            </div>
          </div>

          {/* ── KARGO ───────────────────────────────────────────────────── */}
          {activeSection === 'kargo' && (
            <div className="space-y-5">
              <Card title="Kargo Ücreti Hesaplama">
                <FeatureToggle
                  icon="🚚"
                  label="Kargo Ücreti Aktif"
                  description="Sepette kargo ücreti hesaplanır. Kapalıysa kargo her zaman ücretsizdir."
                  enabled={shippingForm.enabled}
                  onToggle={() => setShippingForm((p) => ({ ...p, enabled: !p.enabled }))}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Varsayılan Kargo Ücreti (₺)"
                    type="number" min={0}
                    value={shippingForm.defaultShippingFee}
                    onChange={(e) => setShippingForm((p) => ({ ...p, defaultShippingFee: Number(e.target.value) }))}
                  />
                  <Input
                    label="Ücretsiz Kargo Eşiği (₺) — boş = asla"
                    type="number" min={0}
                    value={shippingForm.freeShippingThreshold}
                    onChange={(e) => setShippingForm((p) => ({ ...p, freeShippingThreshold: e.target.value === '' ? '' : Number(e.target.value) }))}
                    placeholder="1500"
                  />
                </div>
                <Input
                  label="Kapıda Ödeme Ek Ücreti (₺)"
                  type="number" min={0}
                  value={shippingForm.cashOnDeliveryExtra}
                  onChange={(e) => setShippingForm((p) => ({ ...p, cashOnDeliveryExtra: Number(e.target.value) }))}
                />
                <div className="pt-1">
                  <Button
                    onClick={() => shippingMutation.mutate({
                      ...shippingForm,
                      freeShippingThreshold: shippingForm.freeShippingThreshold === '' ? null : Number(shippingForm.freeShippingThreshold),
                    })}
                    loading={shippingMutation.isPending}
                  >
                    Kargo Ücret Ayarlarını Kaydet
                  </Button>
                </div>
              </Card>

              <Card title="Şehir Bazlı Kargo Bölgeleri">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Şehir adı yoksa varsayılan kargo ücreti uygulanır. Birden fazla şehir virgülle ayrılır.
                </p>
                <div className="space-y-2">
                  {(shippingForm.zones || []).map((zone, i) => (
                    <div
                      key={i}
                      className="flex gap-3 items-start rounded-xl p-3"
                      style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)' }}
                    >
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <Input
                          label="Bölge Adı"
                          value={zone.name || ''}
                          onChange={(e) => {
                            const z = [...shippingForm.zones]; z[i] = { ...z[i], name: e.target.value };
                            setShippingForm((p) => ({ ...p, zones: z }));
                          }}
                          placeholder="Ege Bölgesi"
                        />
                        <Input
                          label="Şehirler (virgülle)"
                          value={(zone.cities || []).join(', ')}
                          onChange={(e) => {
                            const z = [...shippingForm.zones];
                            z[i] = { ...z[i], cities: e.target.value.split(',').map((c) => c.trim()).filter(Boolean) };
                            setShippingForm((p) => ({ ...p, zones: z }));
                          }}
                          placeholder="İzmir, Muğla"
                        />
                        <Input
                          label="Kargo Ücreti (₺)"
                          type="number" min={0}
                          value={zone.shippingFee || 0}
                          onChange={(e) => {
                            const z = [...shippingForm.zones]; z[i] = { ...z[i], shippingFee: Number(e.target.value) };
                            setShippingForm((p) => ({ ...p, zones: z }));
                          }}
                        />
                      </div>
                      <button
                        onClick={() => setShippingForm((p) => ({ ...p, zones: p.zones.filter((_, j) => j !== i) }))}
                        className="mt-6 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setShippingForm((p) => ({ ...p, zones: [...p.zones, { name: '', cities: [], shippingFee: 0 }] }))}
                  className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg transition-colors"
                  style={{ color: '#3b82f6', background: 'rgba(59,130,246,0.07)' }}
                >
                  <Plus size={13} /> Bölge Ekle
                </button>
              </Card>

              <Card title="Kargo Firması API Entegrasyonları">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Aktif kargo firması için "Gönderi Oluştur" butonu siparişten otomatik sevkiyat açar. Test modunda gerçek API çağrısı yapılmaz.
                </p>
                <div className="space-y-2">
                  {(carriers.length ? carriers : CARRIER_NAMES.map((n) => ({ name: n, enabled: false, apiKey: '', apiSecret: '', accountCode: '', testMode: true }))).map((c, i) => (
                    <div key={c.name} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                      <div
                        className="flex items-center justify-between px-4 py-3"
                        style={{ background: 'var(--bg-muted)' }}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ background: c.enabled ? '#22c55e' : 'var(--border)' }}
                          />
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {CARRIER_LABELS[c.name]}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Test</span>
                            <Toggle
                              value={c.testMode}
                              color="#f59e0b"
                              onChange={() => { const arr = [...carriers]; arr[i] = { ...arr[i], testMode: !arr[i].testMode }; setCarriers(arr); }}
                              small
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Aktif</span>
                            <Toggle
                              value={c.enabled}
                              onChange={() => { const arr = [...carriers]; arr[i] = { ...arr[i], enabled: !arr[i].enabled }; setCarriers(arr); }}
                              small
                            />
                          </div>
                        </div>
                      </div>
                      {c.enabled && (
                        <div className="p-4 grid grid-cols-3 gap-3" style={{ borderTop: '1px solid var(--border)' }}>
                          <Input label="API Key / Kullanıcı Adı" value={c.apiKey || ''}
                            onChange={(e) => { const arr = [...carriers]; arr[i] = { ...arr[i], apiKey: e.target.value }; setCarriers(arr); }} />
                          <Input label="API Secret / Şifre" type="password" value={c.apiSecret || ''}
                            onChange={(e) => { const arr = [...carriers]; arr[i] = { ...arr[i], apiSecret: e.target.value }; setCarriers(arr); }} placeholder="••••••••" />
                          <Input label="Hesap Kodu" value={c.accountCode || ''}
                            onChange={(e) => { const arr = [...carriers]; arr[i] = { ...arr[i], accountCode: e.target.value }; setCarriers(arr); }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <Button onClick={() => carrierMutation.mutate(carriers)} loading={carrierMutation.isPending}>
                  Kargo Entegrasyonlarını Kaydet
                </Button>
              </Card>
            </div>
          )}

          {/* ── SMS ─────────────────────────────────────────────────────── */}
          {activeSection === 'sms' && (
            <div className="space-y-5">
              <Card title="SMS Bildirimleri">
                <FeatureToggle
                  icon="📱"
                  label="SMS Aktif"
                  description="Sipariş onayı ve kargo bildirimleri müşterilere SMS ile gönderilir."
                  enabled={smsForm.enabled}
                  onToggle={() => setSmsForm((p) => ({ ...p, enabled: !p.enabled }))}
                />
                <Select label="SMS Sağlayıcı" value={smsForm.provider || 'netgsm'} onChange={(e) => setSmsForm((p) => ({ ...p, provider: e.target.value }))}>
                  <option value="netgsm">Netgsm</option>
                  <option value="iletimerkezi">İletimerkezi</option>
                </Select>
                {(smsForm.provider || 'netgsm') === 'netgsm' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Kullanıcı Adı" value={smsForm.username || ''} onChange={(e) => setSmsForm((p) => ({ ...p, username: e.target.value }))} placeholder="netgsm kullanıcı adı" />
                    <Input label="Şifre" type="password" value={smsForm.password || ''} onChange={(e) => setSmsForm((p) => ({ ...p, password: e.target.value }))} placeholder="••••••••" />
                  </div>
                ) : (
                  <Input label="API Key" type="password" value={smsForm.apiKey || ''} onChange={(e) => setSmsForm((p) => ({ ...p, apiKey: e.target.value }))} placeholder="••••••••" />
                )}
                <Input
                  label="Gönderici Başlığı (max 11 karakter)"
                  value={smsForm.sender || ''}
                  onChange={(e) => setSmsForm((p) => ({ ...p, sender: e.target.value.slice(0, 11) }))}
                  placeholder="FIRMAADI"
                />
              </Card>

              <Card title="SMS Şablonları">
                <div className="rounded-lg px-4 py-3 text-xs" style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
                  Değişkenler: <code className="font-mono bg-black/10 px-1 rounded">{'{{orderNumber}}'}</code>, <code className="font-mono bg-black/10 px-1 rounded">{'{{total}}'}</code>, <code className="font-mono bg-black/10 px-1 rounded">{'{{currency}}'}</code>, <code className="font-mono bg-black/10 px-1 rounded">{'{{trackingNumber}}'}</code>
                </div>
                <Textarea
                  label="Sipariş Onayı Şablonu"
                  value={smsForm.templates?.orderConfirmed || ''}
                  onChange={(e) => setSmsForm((p) => ({ ...p, templates: { ...p.templates, orderConfirmed: e.target.value } }))}
                  placeholder="Merhaba, {{orderNumber}} no'lu siparişiniz alındı. Toplam: {{total}} {{currency}}"
                  rows={2}
                />
                <Textarea
                  label="Kargo Bildirimi Şablonu"
                  value={smsForm.templates?.orderShipped || ''}
                  onChange={(e) => setSmsForm((p) => ({ ...p, templates: { ...p.templates, orderShipped: e.target.value } }))}
                  placeholder="Siparişiniz kargoya verildi. Takip no: {{trackingNumber}}"
                  rows={2}
                />
                <Button onClick={() => smsMutation.mutate(smsForm)} loading={smsMutation.isPending}>
                  SMS Ayarlarını Kaydet
                </Button>
              </Card>
            </div>
          )}

          {/* ── WHATSAPP ─────────────────────────────────────────────────── */}
          {activeSection === 'whatsapp' && (
            <Card title="WhatsApp Business Cloud API">
              <InfoBox>
                <p className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Nasıl kurulur?</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Meta for Developers → WhatsApp → Getting Started bölümünden Business hesap açın</li>
                  <li>Phone Number ID ve kalıcı (Long-lived) Access Token alın</li>
                  <li>Meta Business Manager → Şablonlar bölümünde bir sipariş bildirimi şablonu oluşturun ve onaylatın</li>
                  <li>Onaylanan şablon adını aşağıya girin (örn: <code className="font-mono bg-black/10 px-1 rounded">order_confirmed</code>)</li>
                </ol>
                <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  Şablon değişkenleri sırayla: <code className="font-mono bg-black/10 px-1 rounded">{'{{1}}'}</code> = Sipariş No, <code className="font-mono bg-black/10 px-1 rounded">{'{{2}}'}</code> = Toplam, <code className="font-mono bg-black/10 px-1 rounded">{'{{3}}'}</code> = Para Birimi
                </p>
              </InfoBox>
              <Input label="Phone Number ID" value={waForm.phoneNumberId || ''} onChange={(e) => setWaForm((p) => ({ ...p, phoneNumberId: e.target.value }))} placeholder="123456789012345" />
              <Input label="Access Token" type="password" value={waForm.accessToken || ''} onChange={(e) => setWaForm((p) => ({ ...p, accessToken: e.target.value }))} placeholder="EAAxxxxx..." />
              <Input label="Sipariş Şablon Adı" value={waForm.orderTemplateId || ''} onChange={(e) => setWaForm((p) => ({ ...p, orderTemplateId: e.target.value }))} placeholder="order_confirmed" />
              <Button onClick={() => waMutation.mutate(waForm)} loading={waMutation.isPending}>
                WhatsApp Ayarlarını Kaydet
              </Button>
            </Card>
          )}

          {/* ── SADAKAT ──────────────────────────────────────────────────── */}
          {activeSection === 'sadakat' && (
            <div className="space-y-5">
              <Card title="Sadakat / Puan Sistemi">
                <FeatureToggle
                  icon="🏆"
                  label="Puan Sistemi Aktif"
                  description="Müşteriler her alışverişte puan kazanır ve sonraki siparişlerde kullanabilir."
                  enabled={loyaltyForm.enabled}
                  onToggle={() => setLoyaltyForm((p) => ({ ...p, enabled: !p.enabled }))}
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>1 TL = kaç puan?</label>
                    <input type="number" min={0.01} step={0.01} value={loyaltyForm.pointsPerTRY}
                      onChange={(e) => setLoyaltyForm((p) => ({ ...p, pointsPerTRY: e.target.value }))}
                      className="w-full rounded-lg px-3 py-2 text-sm border outline-none focus:ring-2 focus:ring-amber-500/20"
                      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: '16px' }} />
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Örn: 1 → 100 TL sipariş = 100 puan</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>1 puan = kaç TL?</label>
                    <input type="number" min={0.001} step={0.001} value={loyaltyForm.pointValueInTRY}
                      onChange={(e) => setLoyaltyForm((p) => ({ ...p, pointValueInTRY: e.target.value }))}
                      className="w-full rounded-lg px-3 py-2 text-sm border outline-none focus:ring-2 focus:ring-amber-500/20"
                      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: '16px' }} />
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Örn: 0.01 → 100 puan = 1 TL indirim</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Minimum kullanım (puan)</label>
                    <input type="number" min={1} value={loyaltyForm.minimumRedeem}
                      onChange={(e) => setLoyaltyForm((p) => ({ ...p, minimumRedeem: Number(e.target.value) }))}
                      className="w-full rounded-lg px-3 py-2 text-sm border outline-none focus:ring-2 focus:ring-amber-500/20"
                      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: '16px' }} />
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Bu puana ulaşmadan kullanılamaz</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Puan geçerlilik (gün) — boş = süresiz</label>
                    <input type="number" min={1} value={loyaltyForm.expiryDays}
                      onChange={(e) => setLoyaltyForm((p) => ({ ...p, expiryDays: e.target.value }))}
                      placeholder="365"
                      className="w-full rounded-lg px-3 py-2 text-sm border outline-none focus:ring-2 focus:ring-amber-500/20"
                      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: '16px' }} />
                  </div>
                </div>
                <Button
                  onClick={() => loyaltyMutation.mutate({
                    ...loyaltyForm,
                    pointsPerTRY:    Number(loyaltyForm.pointsPerTRY),
                    pointValueInTRY: Number(loyaltyForm.pointValueInTRY),
                    expiryDays:      loyaltyForm.expiryDays === '' ? null : Number(loyaltyForm.expiryDays),
                  })}
                  loading={loyaltyMutation.isPending}
                >
                  Sadakat Ayarlarını Kaydet
                </Button>
              </Card>

              <Card title="Hediye Kartı Yönetimi">
                <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>
                    <Gift size={18} style={{ color: '#fff' }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Hediye Kartları</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Hediye kartı oluşturma ve yönetimi Siparişler menüsündeki Hediye Kartları bölümünden yapılır.
                    </p>
                  </div>
                  <CheckCircle2 size={18} style={{ color: '#f59e0b' }} />
                </div>
              </Card>
            </div>
          )}

          {/* ── MARKETPLACE ──────────────────────────────────────────────── */}
          {activeSection === 'marketplace' && (
            <div className="space-y-5">
              <Card title="Trendyol Entegrasyonu">
                <FeatureToggle
                  icon="🛒"
                  label="Trendyol Aktif"
                  description="Ürünler Trendyol'a senkronize edilir, siparişler her 5 dakikada otomatik çekilir."
                  enabled={mpForm.trendyol?.enabled}
                  onToggle={() => setMpForm((p) => ({ ...p, trendyol: { ...p.trendyol, enabled: !p.trendyol.enabled } }))}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Seller API Key" value={mpForm.trendyol?.apiKey || ''}
                    onChange={(e) => setMpForm((p) => ({ ...p, trendyol: { ...p.trendyol, apiKey: e.target.value } }))}
                    placeholder="Trendyol seller API key" />
                  <Input label="API Secret" type="password" value={mpForm.trendyol?.apiSecret || ''}
                    onChange={(e) => setMpForm((p) => ({ ...p, trendyol: { ...p.trendyol, apiSecret: e.target.value } }))}
                    placeholder="••••••••" />
                </div>
                <Input label="Seller ID (accountCode)" value={mpForm.trendyol?.accountCode || ''}
                  onChange={(e) => setMpForm((p) => ({ ...p, trendyol: { ...p.trendyol, accountCode: e.target.value } }))}
                  placeholder="1234567" />
                <div className="grid grid-cols-3 gap-4">
                  <Input label="Marka ID" type="number" value={mpForm.trendyol?.trendyolBrandId || ''}
                    onChange={(e) => setMpForm((p) => ({ ...p, trendyol: { ...p.trendyol, trendyolBrandId: e.target.value } }))}
                    placeholder="12345" />
                  <Input label="Kategori ID" type="number" value={mpForm.trendyol?.trendyolCategoryId || ''}
                    onChange={(e) => setMpForm((p) => ({ ...p, trendyol: { ...p.trendyol, trendyolCategoryId: e.target.value } }))}
                    placeholder="411" />
                  <Input label="Kargo Firması ID" type="number" value={mpForm.trendyol?.cargoCompanyId || 17}
                    onChange={(e) => setMpForm((p) => ({ ...p, trendyol: { ...p.trendyol, cargoCompanyId: Number(e.target.value) } }))}
                    placeholder="17 (Aras)" />
                </div>
              </Card>

              <Card title="Hepsiburada Entegrasyonu">
                <FeatureToggle
                  icon="🛍️"
                  label="Hepsiburada Aktif"
                  description="Ürünler Hepsiburada'ya senkronize edilir, siparişler her 5 dakikada otomatik çekilir."
                  enabled={mpForm.hepsiburada?.enabled}
                  onToggle={() => setMpForm((p) => ({ ...p, hepsiburada: { ...p.hepsiburada, enabled: !p.hepsiburada.enabled } }))}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Kullanıcı Adı" value={mpForm.hepsiburada?.apiKey || ''}
                    onChange={(e) => setMpForm((p) => ({ ...p, hepsiburada: { ...p.hepsiburada, apiKey: e.target.value } }))}
                    placeholder="HB kullanıcı adı" />
                  <Input label="Şifre" type="password" value={mpForm.hepsiburada?.apiSecret || ''}
                    onChange={(e) => setMpForm((p) => ({ ...p, hepsiburada: { ...p.hepsiburada, apiSecret: e.target.value } }))}
                    placeholder="••••••••" />
                </div>
                <Input label="Merchant ID" value={mpForm.hepsiburada?.accountCode || ''}
                  onChange={(e) => setMpForm((p) => ({ ...p, hepsiburada: { ...p.hepsiburada, accountCode: e.target.value } }))}
                  placeholder="hepsiburada_merchant_id" />
                <Input label="Kategori ID" value={mpForm.hepsiburada?.hbCategoryId || ''}
                  onChange={(e) => setMpForm((p) => ({ ...p, hepsiburada: { ...p.hepsiburada, hbCategoryId: e.target.value } }))}
                  placeholder="HB kategori kodu" />
              </Card>

              <Button onClick={() => mpMutation.mutate(mpForm)} loading={mpMutation.isPending}>
                Marketplace Ayarlarını Kaydet
              </Button>
            </div>
          )}

        </div>{/* flex-1 content */}
      </div>{/* flex gap-6 */}
    </div>
  );
}

// ─── UI primitives ────────────────────────────────────────────────────────────
function Card({ title, children }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
      <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)', background: 'linear-gradient(to right, rgba(99,102,241,0.04), transparent)' }}>
        <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function InfoBox({ children }) {
  return (
    <div className="rounded-xl p-4 text-sm" style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
      {children}
    </div>
  );
}

function FeatureToggle({ icon, label, description, enabled, onToggle }) {
  return (
    <div className="flex items-start gap-4 py-3 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
      <div
        onClick={onToggle}
        className="relative w-11 h-6 rounded-full flex-shrink-0 cursor-pointer transition-colors mt-0.5"
        style={{ background: enabled ? 'var(--primary)' : 'var(--border)' }}
      >
        <span
          className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
          style={{ transform: enabled ? 'translateX(20px)' : 'translateX(0)' }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {icon} {label}
          <span
            className="ml-2 text-xs font-normal px-1.5 py-0.5 rounded"
            style={{ background: enabled ? 'var(--primary)' : 'var(--border)', color: enabled ? '#fff' : 'var(--text-secondary)' }}
          >
            {enabled ? 'Etkin' : 'Devre dışı'}
          </span>
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{description}</p>
      </div>
    </div>
  );
}

function Toggle({ value, onChange, color = '#6366f1', small = false }) {
  const w = small ? 'w-9' : 'w-11';
  const h = small ? 'h-5' : 'h-6';
  const thumb = small ? 'w-4 h-4' : 'w-5 h-5';
  const tx = small ? 'translateX(16px)' : 'translateX(20px)';
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative ${w} ${h} rounded-full transition-colors`}
      style={{ background: value ? color : 'var(--border)' }}
    >
      <span
        className={`absolute top-0.5 left-0.5 ${thumb} bg-white rounded-full shadow transition-transform`}
        style={{ transform: value ? tx : 'translateX(0)' }}
      />
    </button>
  );
}

function Textarea({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}</label>}
      <textarea
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-lg px-3.5 py-2.5 border outline-none resize-none text-sm"
        style={{ background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: '16px' }}
      />
    </div>
  );
}
