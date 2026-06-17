import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Calendar, List, X, Phone, Mail, Users, Clock, MessageSquare, Check, XCircle, Settings2, Plus, Trash2, UserPlus, MapPin, CalendarDays } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import DatePicker from '../components/ui/DatePicker';

const AREA_LABELS = { ust_kat: 'Üst Kat', orta_kat: 'Orta Kat', bahce: 'Bahçe' };

const STATUS = {
  new:       { label: 'Yeni',       color: 'bg-blue-500',  light: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',   dot: 'bg-blue-500'  },
  seen:      { label: 'Görüldü',    color: 'bg-yellow-500',light: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', dot: 'bg-yellow-500' },
  confirmed: { label: 'Onaylandı',  color: 'bg-green-500', light: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',  dot: 'bg-green-500'  },
  rejected:  { label: 'Reddedildi', color: 'bg-red-500',   light: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',         dot: 'bg-red-500'    },
  cancelled: { label: 'İptal',      color: 'bg-gray-400',  light: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',       dot: 'bg-gray-400'   },
};

const HOURS = Array.from({ length: 24 }, (_, h) =>
  [`${String(h).padStart(2, '0')}:00`, `${String(h).padStart(2, '0')}:30`]
).flat();

function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateLong(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return { day: d.toLocaleDateString('tr-TR', { weekday: 'short' }), date: d.getDate(), month: d.toLocaleDateString('tr-TR', { month: 'short' }) };
}

function isToday(dateStr) {
  return dateStr === toDateStr(new Date());
}

function getWeekStart(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const dow = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow; // Pazartesi başlangıç
  d.setDate(d.getDate() + diff);
  return toDateStr(d);
}

function getWeekDays(weekStart) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart + 'T00:00:00');
    d.setDate(d.getDate() + i);
    return toDateStr(d);
  });
}

export default function ReservationsPage() {
  const qc = useQueryClient();
  const { activeTenantId, activeCompany, refreshCompany } = useAuth();

  const [selectedDate, setSelectedDate] = useState(toDateStr(new Date()));
  const [view, setView]                 = useState('timeline'); // 'timeline' | 'list' | 'week'
  const [statusTab, setStatusTab]       = useState('active');   // 'active' | 'rejected'
  const [selected, setSelected]         = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newResOpen, setNewResOpen]     = useState(false);
  const [newResForm, setNewResForm]     = useState({ fullName: '', phone: '', email: '', date: '', time: '', endTime: '', partySize: 2, tableNumber: '', note: '' });

  // Masa Düzeni paneli yerel state
  const [tables, setTables]           = useState([]);
  const [tableCount, setTableCnt]     = useState(0);
  const [tableSlotInputs, setTableSlotInputs] = useState({});

  // Panel kapalıyken activeCompany değişince (ilk yükleme + refreshCompany sonrası) senkronize et
  useEffect(() => {
    if (!settingsOpen && activeCompany) {
      setTables(activeCompany.content?.tables || []);
      setTableCnt(activeCompany.features?.tableCount || 0);
    }
  }, [activeCompany, settingsOpen]);

  // Tüm tablolardan unique slot listesi (occupancy grid için)
  const slots = useMemo(() => {
    if (tables.length === 0) return activeCompany?.content?.reservationSlots || [];
    return [...new Set(tables.flatMap((t) => t.slots || []))].sort();
  }, [tables, activeCompany]);

  const saveSettings = useMutation({
    mutationFn: () => {
      const allSlots = [...new Set(tables.flatMap((t) => t.slots || []))].sort();
      const toAreaKey = (s) => (s || '').toLowerCase()
        .replace(/ş/g,'s').replace(/ı/g,'i').replace(/ğ/g,'g')
        .replace(/ü/g,'u').replace(/ö/g,'o').replace(/ç/g,'c')
        .replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'');
      const processedTables = tables.map((t) => ({
        ...t,
        area: toAreaKey(t.label) || `masa_${t.number}`,
        areaLabel: t.label || `Alan ${t.number}`,
      }));
      return Promise.all([
        api.patch(`/companies/${activeTenantId}`, {
          content: { ...activeCompany?.content, reservationSlots: allSlots, tables: processedTables },
        }),
        api.patch(`/companies/${activeTenantId}/features`, { tableCount }),
      ]);
    },
    onSuccess: () => {
      refreshCompany();
      setSettingsOpen(false);
    },
  });

  function addTable() { setTables((t) => [...t, { number: t.length + 1, seats: 2, label: '', slots: [] }]); }
  function updateTable(i, key, val) { setTables((t) => t.map((r, j) => j === i ? { ...r, [key]: val } : r)); }
  function removeTable(i) { setTables((t) => t.filter((_, j) => j !== i)); }

  function getTableSlotInput(i) { return tableSlotInputs[i] || { hour: '12', min: '00' }; }
  function setTableSlotField(i, key, val) {
    setTableSlotInputs((p) => ({ ...p, [i]: { ...getTableSlotInput(i), [key]: val } }));
  }
  function addTableSlot(i) {
    const { hour, min } = getTableSlotInput(i);
    const val = `${hour}:${min}`;
    const existing = tables[i]?.slots || [];
    if (existing.includes(val)) return;
    updateTable(i, 'slots', [...existing, val].sort());
  }
  function removeTableSlot(i, slot) {
    updateTable(i, 'slots', (tables[i]?.slots || []).filter((s) => s !== slot));
  }

  const { data, isLoading } = useQuery({
    queryKey: ['reservations', activeTenantId, selectedDate],
    queryFn: () => api.get(`/reservations?date=${selectedDate}&limit=200`).then((r) => r.data),
    enabled: !!activeTenantId,
  });

  const weekStart = getWeekStart(selectedDate);
  const weekDays  = getWeekDays(weekStart);
  const weekEnd   = weekDays[6];

  const { data: weekData, isLoading: weekLoading } = useQuery({
    queryKey: ['reservations-week', activeTenantId, weekStart],
    queryFn: () => api.get(`/reservations?startDate=${weekStart}&endDate=${weekEnd}&limit=500`).then((r) => r.data),
    enabled: !!activeTenantId && view === 'week',
  });

  const reservations = data?.data || [];
  const displayReservations = statusTab === 'rejected'
    ? reservations.filter((r) => r.status === 'rejected')
    : reservations.filter((r) => r.status !== 'rejected');
  const rejectedCount = reservations.filter((r) => r.status === 'rejected').length;

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/reservations/${id}/status`, { status }).then((r) => r.data),
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ['reservations'] });
      setSelected(saved);
    },
  });

  const createReservation = useMutation({
    mutationFn: (body) => api.post('/reservations', body).then((r) => r.data),
    onSuccess: (saved) => {
      // Rezervasyonun kaydedildiği UTC tarihe navigate et
      const savedDate = saved.date ? saved.date.split('T')[0] : newResForm.date;
      setSelectedDate(savedDate);
      qc.invalidateQueries({ queryKey: ['reservations'] });
      setNewResOpen(false);
      setNewResForm({ fullName: '', phone: '', email: '', date: '', time: '', endTime: '', partySize: 2, tableNumber: '', note: '' });
    },
  });

  const assignTable = useMutation({
    mutationFn: ({ id, tableArea, tableNumber }) => api.patch(`/reservations/${id}/table`, { tableArea, tableNumber }).then((r) => r.data),
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ['reservations'] });
      setSelected(saved);
    },
  });

  const updateTime = useMutation({
    mutationFn: ({ id, endTime }) => api.patch(`/reservations/${id}/time`, { endTime }).then((r) => r.data),
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ['reservations'] });
      setSelected(saved);
    },
  });

  // İstatistikler
  const stats = useMemo(() => {
    const src = view === 'week' ? (weekData?.data || []) : reservations;
    return {
      total:     src.length,
      guests:    src.reduce((s, r) => s + (r.partySize || 0), 0),
      confirmed: src.filter((r) => r.status === 'confirmed').length,
      pending:   src.filter((r) => r.status === 'new' || r.status === 'seen').length,
    };
  }, [view, reservations, weekData]);

  // Timeline için kullanılan saatler (veri varsa genişlet)
  const usedSlots = useMemo(() => {
    if (!displayReservations.length) return HOURS.slice(24, 46); // 12:00–22:30 default
    const times = displayReservations.map((r) => r.time).sort();
    const first = times[0];
    const last  = times[times.length - 1];
    const firstIdx = Math.max(0, HOURS.indexOf(first) - 2);
    const lastIdx  = Math.min(HOURS.length - 1, HOURS.indexOf(last) + 3);
    return HOURS.slice(firstIdx, lastIdx + 1);
  }, [displayReservations]);

  // Saat → rezervasyonlar map
  const byTime = useMemo(() => {
    const map = {};
    for (const r of displayReservations) {
      if (!map[r.time]) map[r.time] = [];
      map[r.time].push(r);
    }
    return map;
  }, [displayReservations]);

  // Slot doluluk: per-table-slot — sadece o saatte tanımlı masalar gösterilir
  const slotOccupancy = useMemo(() => {
    return slots.map((slot) => {
      const items = byTime[slot] || [];
      const active = items.filter((r) => r.status !== 'rejected' && r.status !== 'cancelled');
      if (tables.length > 0) {
        // Composite key area:number — farklı katlarda aynı masa numarası olabilir
        const occupiedKeys = new Set(
          active.filter((r) => r.tableNumber != null).map((r) => `${r.tableArea || ''}:${r.tableNumber}`)
        );
        // Sadece bu saatte tanımlı masaları göster
        const slotTables = tables.filter((t) => (t.slots || []).includes(slot));
        const tableStatus = slotTables.map((t) => {
          const key = `${t.area || ''}:${t.number}`;
          return {
            ...t,
            occupied: occupiedKeys.has(key),
            reservation: active.find((r) => r.tableNumber === t.number && (r.tableArea || '') === (t.area || '')) || null,
          };
        });
        const unassigned = active.filter((r) => !r.tableNumber).length;
        return { slot, tableStatus, unassigned, booked: active.length, cap: slotTables.length };
      }
      const cap = tableCount;
      return { slot, tableStatus: null, unassigned: 0, booked: active.length, available: Math.max(0, cap - active.length), cap };
    });
  }, [slots, byTime, tables, tableCount]);

  function prevDay() {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    setSelectedDate(toDateStr(d));
  }
  function nextDay() {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    setSelectedDate(toDateStr(d));
  }

  return (
    <div className="flex gap-5 h-full min-h-0">

      {/* ── Ana içerik ── */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* Başlık + tarih nav */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Rezervasyonlar</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {isToday(selectedDate) ? 'Bugün — ' : ''}{formatDateLong(selectedDate)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Tarih nav */}
            <div className="flex items-center gap-1">
              <button onClick={prevDay} className="p-2 rounded-xl border hover:bg-[var(--bg-muted)] transition-colors" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
                <ChevronLeft size={16} style={{ color: 'var(--text-secondary)' }} />
              </button>
              <DatePicker value={selectedDate} onChange={setSelectedDate} align="right" clearable={false} />
              <button onClick={nextDay} className="p-2 rounded-xl border hover:bg-[var(--bg-muted)] transition-colors" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
                <ChevronRight size={16} style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>

            {/* Bugün butonu */}
            {!isToday(selectedDate) && (
              <button
                onClick={() => setSelectedDate(toDateStr(new Date()))}
                className="text-xs px-3 py-2 rounded-xl border font-medium transition-colors hover:bg-[var(--bg-muted)]"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                Bugün
              </button>
            )}

            {/* View toggle */}
            <div className="flex rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
              <button
                onClick={() => setView('timeline')}
                className={`p-2 transition-colors ${view === 'timeline' ? 'bg-blue-600 text-white' : 'hover:bg-[var(--bg-muted)]'}`}
                title="Günlük timeline"
              >
                <Clock size={15} style={view !== 'timeline' ? { color: 'var(--text-secondary)' } : {}} />
              </button>
              <button
                onClick={() => setView('week')}
                className={`p-2 transition-colors ${view === 'week' ? 'bg-blue-600 text-white' : 'hover:bg-[var(--bg-muted)]'}`}
                title="Haftalık görünüm"
              >
                <CalendarDays size={15} style={view !== 'week' ? { color: 'var(--text-secondary)' } : {}} />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-2 transition-colors ${view === 'list' ? 'bg-blue-600 text-white' : 'hover:bg-[var(--bg-muted)]'}`}
                title="Liste görünümü"
              >
                <List size={15} style={view !== 'list' ? { color: 'var(--text-secondary)' } : {}} />
              </button>
            </div>

            {/* Yeni Rezervasyon */}
            <button
              onClick={() => { setNewResForm({ fullName: '', phone: '', email: '', date: selectedDate, time: slots[0] || '', partySize: 2, tableNumber: '', note: '' }); setNewResOpen(true); }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
              style={{ background: '#6366f1', color: '#fff' }}
            >
              <UserPlus size={14} />
              <span className="hidden sm:inline">Yeni Rezervasyon</span>
            </button>

            {/* Masa Düzeni */}
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors hover:bg-[var(--bg-muted)]"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
              title="Masa ve saat düzeni"
            >
              <Settings2 size={14} />
              <span className="hidden sm:inline">Masa Düzeni</span>
            </button>
          </div>
        </div>

        {/* Stat kartları */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Toplam Rezervasyon', value: stats.total,     icon: Calendar, color: '#3b82f6' },
            { label: 'Toplam Misafir',     value: `${stats.guests} kişi`, icon: Users, color: '#8b5cf6' },
            { label: 'Onaylanan',          value: stats.confirmed, icon: Check,    color: '#10b981' },
            { label: 'Bekleyen',           value: stats.pending,   icon: Clock,    color: '#f59e0b' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl border p-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
                  <Icon size={14} style={{ color }} />
                </div>
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Durum sekmeleri */}
        <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)' }}>
          <button
            onClick={() => setStatusTab('active')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${statusTab === 'active' ? 'shadow-sm' : 'hover:bg-[var(--bg-surface)]'}`}
            style={statusTab === 'active'
              ? { background: 'var(--bg-surface)', color: 'var(--text-primary)' }
              : { color: 'var(--text-muted)' }}
          >
            Rezervasyonlar
          </button>
          <button
            onClick={() => setStatusTab('rejected')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${statusTab === 'rejected' ? 'shadow-sm' : 'hover:bg-[var(--bg-surface)]'}`}
            style={statusTab === 'rejected'
              ? { background: 'var(--bg-surface)', color: 'var(--text-primary)' }
              : { color: 'var(--text-muted)' }}
          >
            Reddedilenler
            {rejectedCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-600">{rejectedCount}</span>
            )}
          </button>
        </div>

        {/* Timeline görünümü */}
        {view === 'timeline' && (
          <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            {isLoading ? (
              <div className="p-12 text-center" style={{ color: 'var(--text-muted)' }}>Yükleniyor...</div>
            ) : displayReservations.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-3xl mb-3">{statusTab === 'rejected' ? '🚫' : '📅'}</p>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {statusTab === 'rejected' ? 'Bu gün için reddedilen rezervasyon yok' : 'Bu gün için rezervasyon yok'}
                </p>
                {statusTab === 'active' && <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Müşteriler rezervasyon yaptığında burada görünür</p>}
              </div>
            ) : (
              <div>
                {usedSlots.map((slot) => {
                  const items = byTime[slot] || [];
                  const isEmpty = items.length === 0;
                  return (
                    <div
                      key={slot}
                      className={`flex min-h-[52px] border-b last:border-b-0 ${isEmpty ? 'opacity-40' : ''}`}
                      style={{ borderColor: 'var(--border)' }}
                    >
                      {/* Saat sütunu */}
                      <div
                        className="w-16 flex-shrink-0 flex items-start pt-3.5 justify-center text-xs font-mono font-semibold border-r"
                        style={{ color: 'var(--text-muted)', borderColor: 'var(--border)', background: 'var(--bg-muted)' }}
                      >
                        {slot}
                      </div>

                      {/* Rezervasyonlar */}
                      <div className="flex-1 p-2 flex flex-wrap gap-2 items-start">
                        {items.map((r) => (
                          <button
                            key={r._id}
                            onClick={() => setSelected(r)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all hover:scale-[1.02] hover:shadow-md"
                            style={{
                              background: 'var(--bg-base)',
                              border: `1.5px solid var(--border)`,
                              minWidth: '180px',
                            }}
                          >
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS[r.status]?.dot}`} />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                {r.fullName}
                              </p>
                              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {r.partySize} kişi
                                {r.endTime && ` · – ${r.endTime}`}
                                {r.note && ' · Not var'}
                              </p>
                            </div>
                            <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS[r.status]?.light}`}>
                              {STATUS[r.status]?.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Haftalık görünüm — Google Calendar tarzı */}
        {view === 'week' && (
          <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            {weekLoading ? (
              <div className="p-12 text-center" style={{ color: 'var(--text-muted)' }}>Yükleniyor...</div>
            ) : (() => {
              const allWeekResRaw = weekData?.data || [];
              const allWeekRes = statusTab === 'rejected'
                ? allWeekResRaw.filter((r) => r.status === 'rejected')
                : allWeekResRaw.filter((r) => r.status !== 'rejected');
              // Bu haftada kullanılan saatleri bul
              const weekSlotSet = new Set(allWeekRes.map((r) => r.time).filter(Boolean));
              const weekSlots = HOURS.filter((h) => weekSlotSet.has(h));
              const displaySlots = weekSlots.length > 0 ? weekSlots : [];

              return (
                <div className="overflow-x-auto">
                  {/* Gün başlıkları */}
                  <div className="flex border-b" style={{ borderColor: 'var(--border)', minWidth: 600 }}>
                    {/* Sol boşluk (saat sütunu için) */}
                    <div className="w-16 flex-shrink-0" style={{ background: 'var(--bg-muted)' }} />
                    {weekDays.map((day) => {
                      const { day: dayName, date: dayNum } = formatDateShort(day);
                      const isTodayDay = isToday(day);
                      const isSelected = day === selectedDate;
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => { setSelectedDate(day); setView('timeline'); }}
                          className="flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors hover:bg-[var(--bg-muted)] border-l"
                          style={{
                            borderColor: 'var(--border)',
                            borderBottom: isSelected ? '2px solid #6366f1' : undefined,
                            background: 'var(--bg-muted)',
                          }}
                        >
                          <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{dayName}</span>
                          <span
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${isTodayDay ? 'bg-blue-600 text-white' : ''}`}
                            style={!isTodayDay ? { color: 'var(--text-primary)' } : {}}
                          >
                            {dayNum}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Saat satırları */}
                  {displaySlots.length === 0 ? (
                    <div className="p-12 text-center">
                      <p className="text-3xl mb-3">📅</p>
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Bu hafta için rezervasyon yok</p>
                    </div>
                  ) : (
                    <div style={{ minWidth: 600 }}>
                      {displaySlots.map((slot) => (
                        <div key={slot} className="flex border-b last:border-0" style={{ borderColor: 'var(--border)', minHeight: 52 }}>
                          {/* Saat sütunu */}
                          <div
                            className="w-16 flex-shrink-0 flex items-start pt-3 justify-center text-xs font-mono font-semibold border-r"
                            style={{ color: 'var(--text-muted)', borderColor: 'var(--border)', background: 'var(--bg-muted)' }}
                          >
                            {slot}
                          </div>
                          {/* 7 gün sütunu */}
                          {weekDays.map((day) => {
                            const cellRes = allWeekRes.filter((r) => {
                              const rDate = r.date ? r.date.split('T')[0] : '';
                              return rDate === day && r.time === slot;
                            });
                            return (
                              <div
                                key={day}
                                className="flex-1 border-l p-1 flex flex-col gap-1"
                                style={{ borderColor: 'var(--border)', background: isToday(day) ? 'rgba(99,102,241,0.03)' : undefined }}
                              >
                                {cellRes.map((r) => {
                                  const borderColor =
                                    r.status === 'confirmed' ? '#10b981' :
                                    r.status === 'new'       ? '#3b82f6' :
                                    r.status === 'seen'      ? '#f59e0b' :
                                    r.status === 'rejected'  ? '#ef4444' : '#9ca3af';
                                  return (
                                    <button
                                      key={r._id}
                                      onClick={() => { setSelectedDate(day); setSelected(r); }}
                                      className={`w-full text-left px-2 py-1 rounded-lg text-[11px] font-medium transition-all hover:opacity-80 ${STATUS[r.status]?.light || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}
                                      style={{ borderLeft: `3px solid ${borderColor}` }}
                                    >
                                      <p className="truncate font-semibold">{r.fullName}</p>
                                      <p className="truncate opacity-70" style={{ fontSize: 10 }}>{r.partySize} kişi</p>
                                    </button>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Liste görünümü */}
        {view === 'list' && (
          <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <table className="w-full text-sm">
              <thead style={{ background: 'var(--bg-muted)' }}>
                <tr>
                  {['Durum', 'Ad Soyad', 'Saat', 'Kişi', 'Masa', 'Telefon', 'Not', 'İşlem'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr><td colSpan={8} className="px-4 py-10 text-center" style={{ color: 'var(--text-muted)' }}>Yükleniyor...</td></tr>
                )}
                {!isLoading && displayReservations.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-10 text-center" style={{ color: 'var(--text-muted)' }}>
                    {statusTab === 'rejected' ? 'Bu gün için reddedilen rezervasyon yok' : 'Bu gün için rezervasyon yok'}
                  </td></tr>
                )}
                {[...displayReservations].sort((a, b) => a.time.localeCompare(b.time)).map((r) => (
                  <tr
                    key={r._id}
                    onClick={() => setSelected(r)}
                    className="border-t cursor-pointer hover:bg-[var(--bg-muted)] transition-colors"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS[r.status]?.light}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS[r.status]?.dot}`} />
                        {STATUS[r.status]?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{r.fullName}</td>
                    <td className="px-4 py-3 font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>{r.time}{r.endTime ? ` – ${r.endTime}` : ''}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{r.partySize} kişi</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {[r.tableArea ? (AREA_LABELS[r.tableArea] || r.tableArea) : null, r.tableNumber ? `#${r.tableNumber}` : null].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{r.phone}</td>
                    <td className="px-4 py-3 max-w-[160px]">
                      {r.note ? (
                        <span className="text-xs truncate block" style={{ color: 'var(--text-muted)' }} title={r.note}>{r.note}</span>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={r.status}
                        onChange={(e) => updateStatus.mutate({ id: r._id, status: e.target.value })}
                        className="text-xs rounded-lg border px-2 py-1"
                        style={{ borderColor: 'var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
                      >
                        {Object.entries(STATUS).map(([val, { label }]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Slot doluluk tablosu */}
        {slots.length > 0 && (
          <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Masa & Saat Doluluk</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {tables.length > 0 ? `${tables.length} masa` : tableCount > 0 ? `${tableCount} masa` : 'kapasite tanımsız'}
              </p>
            </div>
            <div className="p-3 space-y-1.5">
              {slotOccupancy.map(({ slot, tableStatus, unassigned, booked, available, cap }) => {
                const hasPerTable = tableStatus !== null;
                const occupiedTables = hasPerTable ? tableStatus.filter((t) => t.occupied) : [];
                const isEmpty = booked === 0;
                const pct = cap > 0 ? booked / cap : 0;
                const barColor = pct >= 1 ? '#ef4444' : pct >= 0.7 ? '#f59e0b' : '#10b981';

                return (
                  <div
                    key={slot}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl"
                    style={{ background: 'var(--bg-base)', border: `1px solid var(--border)` }}
                  >
                    <span className="text-sm font-bold font-mono w-12 flex-shrink-0" style={{ color: 'var(--text-primary)' }}>{slot}</span>

                    {hasPerTable ? (
                      <div className="flex flex-wrap gap-1.5 flex-1 items-center">
                        {occupiedTables.map((t) => (
                          <button
                            key={t.number}
                            title={`${t.reservation?.fullName || 'Rezerveli'} — ${t.reservation?.partySize || '?'} kişi`}
                            onClick={() => t.reservation && setSelected(t.reservation)}
                            className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg font-medium transition-all hover:scale-105 cursor-pointer"
                            style={{ background: '#ef444415', color: '#ef4444', border: '1px solid #ef444428' }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                            Masa {t.number}{t.label ? ` · ${t.label}` : ''}
                            {t.reservation?.fullName && <span className="ml-1 opacity-70 truncate max-w-[80px]">{t.reservation.fullName.split(' ')[0]}</span>}
                          </button>
                        ))}
                        {unassigned > 0 && (
                          <span className="text-[11px] px-2 py-0.5 rounded-lg" style={{ background: '#f59e0b15', color: '#f59e0b', border: '1px solid #f59e0b28' }}>
                            +{unassigned} atanmadı
                          </span>
                        )}
                        {isEmpty ? (
                          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Rezervasyon yok · {tableStatus.length} masa boş</span>
                        ) : tableStatus.length - occupiedTables.length > 0 ? (
                          <span className="text-[11px] px-2 py-0.5 rounded-lg" style={{ background: '#10b98115', color: '#10b981', border: '1px solid #10b98128' }}>
                            {tableStatus.length - occupiedTables.length} boş
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 flex-1">
                        {isEmpty ? (
                          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Rezervasyon yok</span>
                        ) : (
                          <>
                            <div className="flex-1 rounded-full h-1.5 overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
                              <div className="h-full rounded-full transition-all" style={{ width: cap > 0 ? `${Math.min(100, pct * 100)}%` : '0%', background: barColor }} />
                            </div>
                            <span className="text-xs flex-shrink-0" style={{ color: barColor }}>
                              {cap > 0 ? `${booked}/${cap} dolu` : `${booked} rezervasyon`}
                            </span>
                            {cap > 0 && available > 0 && (
                              <span className="text-[11px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{available} boş</span>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Detay paneli ── */}
      {selected && (
        <div
          className="w-80 flex-shrink-0 rounded-2xl border overflow-hidden flex flex-col"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', alignSelf: 'flex-start', position: 'sticky', top: '0' }}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <div>
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{selected.fullName}</p>
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium mt-1 ${STATUS[selected.status]?.light}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS[selected.status]?.dot}`} />
                {STATUS[selected.status]?.label}
              </span>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--bg-muted)] transition-colors"
            >
              <X size={14} style={{ color: 'var(--text-muted)' }} />
            </button>
          </div>

          {/* Bilgiler */}
          <div className="px-5 py-4 space-y-3 flex-1">
            {/* Tarih & Saat satırı — başlangıç + bitiş */}
            {(() => {
              const [editEnd, setEditEnd] = (() => { const [s, set] = [selected.__editEnd, (v) => setSelected((p) => ({ ...p, __editEnd: v }))]; return [s, set]; })();
              const endSlots = slots.filter((s) => s > selected.time);
              return (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bg-muted)' }}>
                    <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Tarih & Saat</p>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-primary)' }}>
                      {new Date(selected.date).toLocaleDateString('tr-TR')} — {selected.time}
                      {selected.endTime && !editEnd && (
                        <span style={{ color: 'var(--text-muted)' }}> → {selected.endTime}</span>
                      )}
                    </p>
                    {editEnd ? (
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <select
                          defaultValue={selected.endTime || ''}
                          onChange={(e) => {
                            updateTime.mutate({ id: selected._id, endTime: e.target.value || null });
                            setEditEnd(false);
                          }}
                          disabled={updateTime.isPending}
                          autoFocus
                          className="rounded-lg border px-2 py-1 text-xs outline-none"
                          style={{ background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                        >
                          <option value="">— Kaldır —</option>
                          {endSlots.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <button type="button" onClick={() => setEditEnd(false)} className="text-[10px] px-2 py-1 rounded-lg hover:bg-[var(--bg-muted)] transition-colors" style={{ color: 'var(--text-muted)' }}>
                          İptal
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditEnd(true)}
                        className="mt-1 text-[10px] px-2 py-0.5 rounded-md hover:bg-[var(--bg-muted)] transition-colors"
                        style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                      >
                        {selected.endTime ? 'Güncelle' : '+ Bitiş saati ata'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {[
              { icon: Users,          label: 'Kişi Sayısı',  value: `${selected.partySize} kişi` },
              { icon: MapPin,         label: 'Alan / Kat',    value: (() => {
                const areaObj = tables.find((t) => t.area === selected.tableArea);
                const areaLabel = areaObj?.areaLabel || (selected.tableArea ? (AREA_LABELS[selected.tableArea] || selected.tableArea) : null);
                const tableObj = selected.tableNumber != null ? tables.find((t) => t.area === selected.tableArea && t.number === selected.tableNumber) : null;
                const tableLabel = tableObj ? (tableObj.label ? `${tableObj.label} (Masa ${selected.tableNumber})` : `Masa ${selected.tableNumber}`) : (selected.tableNumber != null ? `Masa ${selected.tableNumber}` : null);
                return [areaLabel, tableLabel].filter(Boolean).join(' · ') || '—';
              })() },
              { icon: Phone,          label: 'Telefon',       value: selected.phone },
              { icon: Mail,           label: 'E-posta',       value: selected.email || '—' },
              { icon: MessageSquare,  label: 'Not',           value: selected.note || '—' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bg-muted)' }}>
                  <Icon size={13} style={{ color: 'var(--text-muted)' }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p>
                  <p className="text-sm mt-0.5 break-words" style={{ color: 'var(--text-primary)' }}>{value}</p>
                </div>
              </div>
            ))}

            {/* Alan / Kat atama */}
            {tables.length > 0 && (() => {
              const uniqueAreas = [...new Map(
                tables.filter((t) => t.area).map((t) => [t.area, { area: t.area, label: t.areaLabel || t.area }])
              ).values()];
              const busyKeys = new Set(
                (byTime[selected.time] || [])
                  .filter((r) => r._id !== selected._id && r.status !== 'rejected' && r.status !== 'cancelled' && r.tableNumber != null)
                  .map((r) => `${r.tableArea || ''}:${r.tableNumber}`)
              );
              const areaTablesForSelected = tables.filter((t) => t.area === selected.tableArea);
              return (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bg-muted)' }}>
                    <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Alan / Kat Ata</p>
                    {/* Alan seçici */}
                    <select
                      value={selected.tableArea || ''}
                      onChange={(e) => assignTable.mutate({ id: selected._id, tableArea: e.target.value || null, tableNumber: null })}
                      disabled={assignTable.isPending}
                      className="w-full rounded-lg border px-2 py-1.5 text-sm outline-none"
                      style={{ background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    >
                      <option value="">— Alan seçin —</option>
                      {uniqueAreas.map((a) => (
                        <option key={a.area} value={a.area}>{a.label}</option>
                      ))}
                    </select>
                    {/* Masa no seçici — alan seçildiyse */}
                    {selected.tableArea && areaTablesForSelected.length > 0 && (
                      <select
                        value={selected.tableNumber || ''}
                        onChange={(e) => assignTable.mutate({ id: selected._id, tableArea: selected.tableArea, tableNumber: e.target.value ? parseInt(e.target.value) : null })}
                        disabled={assignTable.isPending}
                        className="w-full rounded-lg border px-2 py-1.5 text-sm outline-none"
                        style={{ background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                      >
                        <option value="">— Masa seçin (isteğe bağlı) —</option>
                        {areaTablesForSelected.map((t) => {
                          const busy = busyKeys.has(`${t.area || ''}:${t.number}`);
                          return (
                            <option key={`${t.area}:${t.number}`} value={t.number} disabled={busy}>
                              {busy ? '🔴' : '🟢'} {t.label || `Alan ${t.number}`} ({t.seats} kişilik)
                            </option>
                          );
                        })}
                      </select>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Aksiyon butonları */}
          <div className="px-5 pb-5 space-y-2 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Durum Güncelle</p>

            {selected.status !== 'confirmed' && (
              <button
                onClick={() => updateStatus.mutate({ id: selected._id, status: 'confirmed' })}
                disabled={updateStatus.isPending}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
              >
                <Check size={14} /> Onayla
              </button>
            )}
            {selected.status !== 'rejected' && selected.status !== 'cancelled' && (
              <button
                onClick={() => updateStatus.mutate({ id: selected._id, status: 'rejected' })}
                disabled={updateStatus.isPending}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors border hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 disabled:opacity-50"
                style={{ borderColor: 'var(--border)' }}
              >
                <XCircle size={14} /> Reddet
              </button>
            )}
            {selected.status !== 'cancelled' && (
              <button
                onClick={() => updateStatus.mutate({ id: selected._id, status: 'cancelled' })}
                disabled={updateStatus.isPending}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors hover:bg-[var(--bg-muted)] disabled:opacity-50"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={14} /> İptal Et
              </button>
            )}

            {/* Telefon linki */}
            <a
              href={`tel:${selected.phone}`}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors hover:bg-[var(--bg-muted)]"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Phone size={14} /> Ara
            </a>
          </div>
        </div>
      )}

      {/* ── Yeni Rezervasyon Modalı ── */}
      {newResOpen && (
        <>
          <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setNewResOpen(false)} />
          <div className="fixed z-50 flex flex-col"
            style={{
              top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
              width: '440px',
              background: 'var(--bg-surface)', border: '1.5px solid var(--border)',
              borderRadius: '20px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2.5">
                <UserPlus size={15} style={{ color: '#6366f1' }} />
                <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Yeni Rezervasyon</p>
              </div>
              <button onClick={() => setNewResOpen(false)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--bg-muted)] transition-colors">
                <X size={14} style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            {/* Form — overflow visible so DatePicker calendar can escape */}
            <div className="px-5 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Ad Soyad *</label>
                  <input value={newResForm.fullName} onChange={(e) => setNewResForm((f) => ({ ...f, fullName: e.target.value }))}
                    className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    placeholder="Ali Yılmaz" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Telefon *</label>
                  <input
                    value={newResForm.phone}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^\d\s+\-().]/g, '');
                      setNewResForm((f) => ({ ...f, phone: v }));
                    }}
                    className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                    style={{
                      background: 'var(--bg-base)',
                      borderColor: newResForm.phone && !/^[+\d][\d\s\-().]{6,19}$/.test(newResForm.phone) ? '#ef4444' : 'var(--border)',
                      color: 'var(--text-primary)',
                    }}
                    placeholder="+90 532 123 45 67"
                    maxLength={20}
                  />
                  {newResForm.phone && !/^[+\d][\d\s\-().]{6,19}$/.test(newResForm.phone) && (
                    <p className="text-[11px] mt-0.5" style={{ color: '#ef4444' }}>Geçerli bir telefon girin</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>E-posta</label>
                <input
                  value={newResForm.email}
                  onChange={(e) => setNewResForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                  style={{
                    background: 'var(--bg-base)',
                    borderColor: newResForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newResForm.email) ? '#ef4444' : 'var(--border)',
                    color: 'var(--text-primary)',
                  }}
                  placeholder="ali@mail.com"
                />
                {newResForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newResForm.email) && (
                  <p className="text-[11px] mt-0.5" style={{ color: '#ef4444' }}>Geçerli bir e-posta girin</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div style={{ position: 'relative', zIndex: 10 }}>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Tarih *</label>
                  <DatePicker value={newResForm.date} onChange={(v) => setNewResForm((f) => ({ ...f, date: v }))} clearable={false} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Kişi Sayısı *</label>
                  <input type="number" min="1" max="50" value={newResForm.partySize}
                    onChange={(e) => setNewResForm((f) => ({ ...f, partySize: parseInt(e.target.value) || 1 }))}
                    className="w-full rounded-xl border px-3 py-2 text-sm outline-none text-center"
                    style={{ background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Başlangıç Saati *</label>
                  <select value={newResForm.time} onChange={(e) => {
                    const t = e.target.value;
                    const [h, m] = t.split(':').map(Number);
                    const start = h * 60 + m;
                    const def60 = start + 60;
                    const defEnd = def60 < 1440 ? `${String(Math.floor(def60/60)).padStart(2,'0')}:${String(def60%60).padStart(2,'0')}` : '';
                    setNewResForm((f) => ({ ...f, time: t, endTime: defEnd }));
                  }}
                    className="w-full rounded-xl border px-2 py-2 text-sm outline-none font-mono"
                    style={{ background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                    {slots.length > 0 ? slots.map((s) => <option key={s} value={s}>{s}</option>)
                      : <option value={newResForm.time}>{newResForm.time || '—'}</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Bitiş Saati (maks. 2s)</label>
                  <select value={newResForm.endTime} onChange={(e) => setNewResForm((f) => ({ ...f, endTime: e.target.value }))}
                    disabled={!newResForm.time}
                    className="w-full rounded-xl border px-2 py-2 text-sm outline-none font-mono"
                    style={{ background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                    <option value="">— Seçin —</option>
                    {newResForm.time && [30,60,90,120].map((add) => {
                      const [h, m] = newResForm.time.split(':').map(Number);
                      const total = h * 60 + m + add;
                      if (total >= 1440) return null;
                      const opt = `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;
                      const lbl = add === 60 ? '1 saat' : add === 120 ? '2 saat' : `${add} dk`;
                      return <option key={opt} value={opt}>{opt} ({lbl})</option>;
                    })}
                  </select>
                </div>
              </div>
              {tables.length > 0 && (() => {
                const newBusyKeys = new Set(
                  (newResForm.date === selectedDate ? (byTime[newResForm.time] || []) : [])
                    .filter((r) => r.status !== 'rejected' && r.status !== 'cancelled' && r.tableNumber != null)
                    .map((r) => `${r.tableArea || ''}:${r.tableNumber}`)
                );
                // Bu saatte tanımlı masalar vs tüm masalar
                const availableTables = tables.filter((t) => !newResForm.time || (t.slots || []).includes(newResForm.time));
                const unavailableTables = tables.filter((t) => newResForm.time && !(t.slots || []).includes(newResForm.time));
                return (
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Alan / Kat
                      {newResForm.time && <span className="ml-1 font-normal" style={{ color: 'var(--text-muted)' }}>({newResForm.time} için)</span>}
                    </label>
                    <select value={newResForm.tableNumber} onChange={(e) => setNewResForm((f) => ({ ...f, tableNumber: e.target.value }))}
                      className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                      style={{ background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                      <option value="">— Atanmadı —</option>
                      {Object.entries(
                        availableTables.reduce((acc, t) => {
                          const key = t.areaLabel || 'Diğer';
                          if (!acc[key]) acc[key] = [];
                          acc[key].push(t);
                          return acc;
                        }, {})
                      ).map(([areaLabel, areaTables]) => (
                        <optgroup key={areaLabel} label={areaLabel}>
                          {areaTables.map((t) => {
                            const busy = newBusyKeys.has(`${t.area || ''}:${t.number}`);
                            return (
                              <option key={`${t.area}:${t.number}`} value={t.number} disabled={busy}>
                                {busy ? '🔴' : '🟢'} {t.label || `Alan ${t.number}`} ({t.seats} kişilik)
                              </option>
                            );
                          })}
                        </optgroup>
                      ))}
                      {unavailableTables.length > 0 && unavailableTables.map((t) => (
                        <option key={`${t.area}:${t.number}`} value={t.number} disabled>
                          ⛔ {t.label || `Alan ${t.number}`} — bu saatte tanımlı değil
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })()}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Not</label>
                <textarea value={newResForm.note} onChange={(e) => setNewResForm((f) => ({ ...f, note: e.target.value }))}
                  rows={2} placeholder="Özel istek, allerji bilgisi..."
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none resize-none"
                  style={{ background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
              </div>
              {createReservation.isError && (
                <p className="text-xs px-3 py-2 rounded-xl" style={{ background: '#ef444415', color: '#ef4444' }}>
                  {createReservation.error?.response?.data?.message || 'Hata oluştu'}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-5 py-4 border-t flex gap-3" style={{ borderColor: 'var(--border)' }}>
              <button onClick={() => setNewResOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-[var(--bg-muted)]"
                style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                İptal
              </button>
              <button
                onClick={() => {
                  if (!newResForm.fullName || !newResForm.phone || !newResForm.date || !newResForm.time) return;
                  createReservation.mutate({
                    ...newResForm,
                    endTime: newResForm.endTime || null,
                    tableNumber: newResForm.tableNumber ? parseInt(newResForm.tableNumber) : null,
                  });
                }}
                disabled={createReservation.isPending || !newResForm.fullName || !newResForm.phone}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                style={{ background: '#6366f1', color: '#fff' }}>
                {createReservation.isPending ? 'Kaydediliyor...' : 'Rezervasyonu Oluştur'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Masa Düzeni Paneli ── */}
      {settingsOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.3)' }}
            onClick={() => setSettingsOpen(false)}
          />

          {/* Panel */}
          <div
            className="fixed right-0 top-0 h-full z-50 flex flex-col"
            style={{
              width: '380px',
              background: 'var(--bg-surface)',
              borderLeft: '1.5px solid var(--border)',
              boxShadow: '-12px 0 40px rgba(0,0,0,0.15)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2.5">
                <Settings2 size={16} style={{ color: '#6366f1' }} />
                <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Masa Düzeni</p>
              </div>
              <button onClick={() => setSettingsOpen(false)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--bg-muted)] transition-colors">
                <X size={14} style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            {/* İçerik — kaydırılabilir */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

              {/* Açıklama */}
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Her masa için ayrı rezervasyon saatleri belirleyin. Bahçe 12:00–18:00, Dışarısı 14:00–20:00 gibi.
              </p>

              {/* Masa Listesi */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Masalar</p>
                  <button
                    onClick={addTable}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium transition-colors"
                    style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                  >
                    <Plus size={12} /> Masa Ekle
                  </button>
                </div>

                {tables.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed p-5 text-center" style={{ borderColor: 'var(--border)' }}>
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Henüz masa eklenmedi</p>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Her masa için ad, kapasite ve açık saatler belirleyebilirsiniz</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tables.map((t, i) => {
                      const inp = getTableSlotInput(i);
                      const slotVal = `${inp.hour}:${inp.min}`;
                      const tSlots = t.slots || [];
                      return (
                        <div key={i} className="rounded-xl border p-3 space-y-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-base)' }}>
                          {/* Masa üst satırı */}
                          <div className="grid gap-2 items-center" style={{ gridTemplateColumns: '44px 1fr 72px 32px' }}>
                            <div>
                              <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>NO</p>
                              <input
                                type="number" min="1" value={t.number}
                                onChange={(e) => updateTable(i, 'number', parseInt(e.target.value) || i + 1)}
                                className="w-full rounded-lg border px-1.5 py-1.5 text-sm text-center outline-none"
                                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                              />
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>ETİKET</p>
                              <input
                                type="text" value={t.label}
                                onChange={(e) => updateTable(i, 'label', e.target.value)}
                                placeholder="Bahçe, Teras..."
                                maxLength={24}
                                className="w-full rounded-lg border px-2 py-1.5 text-sm outline-none"
                                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                              />
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>KİŞİ</p>
                              <input
                                type="number" min="1" max="20" value={t.seats}
                                onChange={(e) => updateTable(i, 'seats', parseInt(e.target.value) || 2)}
                                className="w-full rounded-lg border px-1.5 py-1.5 text-sm text-center outline-none"
                                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                              />
                            </div>
                            <button onClick={() => removeTable(i)} className="mt-5 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex-shrink-0">
                              <Trash2 size={13} className="text-red-400" />
                            </button>
                          </div>

                          {/* Per-table saatler */}
                          <div>
                            <p className="text-[10px] font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>REZERVASYON SAATLERİ</p>
                            {tSlots.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {tSlots.map((slot) => (
                                  <span key={slot} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg font-mono font-semibold"
                                    style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}>
                                    {slot}
                                    <button onClick={() => removeTableSlot(i, slot)}
                                      className="w-3.5 h-3.5 rounded-full flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-colors text-[10px] ml-0.5"
                                      style={{ color: '#6366f1' }}>✕</button>
                                  </span>
                                ))}
                              </div>
                            )}
                            {/* Tek saat ekle */}
                            <div className="flex items-center gap-1.5 mb-2">
                              <div className="flex items-center rounded-lg border flex-1 overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
                                <select value={inp.hour} onChange={(e) => setTableSlotField(i, 'hour', e.target.value)}
                                  className="flex-1 px-2 py-1.5 text-sm font-mono font-semibold outline-none bg-transparent text-center"
                                  style={{ color: 'var(--text-primary)', borderRight: '1px solid var(--border)' }}>
                                  {Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0')).map((h) => (
                                    <option key={h} value={h}>{h}</option>
                                  ))}
                                </select>
                                <span className="text-sm font-bold px-0.5" style={{ color: 'var(--text-muted)' }}>:</span>
                                <select value={inp.min} onChange={(e) => setTableSlotField(i, 'min', e.target.value)}
                                  className="flex-1 px-2 py-1.5 text-sm font-mono font-semibold outline-none bg-transparent text-center"
                                  style={{ color: 'var(--text-primary)' }}>
                                  {['00', '30'].map((m) => <option key={m} value={m}>{m}</option>)}
                                </select>
                              </div>
                              <button onClick={() => addTableSlot(i)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex-shrink-0"
                                style={{ background: tSlots.includes(slotVal) ? 'var(--bg-muted)' : '#6366f1', color: tSlots.includes(slotVal) ? 'var(--text-muted)' : '#fff' }}>
                                <Plus size={11} /> Ekle
                              </button>
                            </div>
                            {/* Saat aralığıyla toplu doldur */}
                            <div className="flex items-center gap-1 rounded-lg p-1.5" style={{ background: 'var(--bg-muted)' }}>
                              <span className="text-[10px] font-semibold shrink-0" style={{ color: 'var(--text-muted)' }}>Aralık:</span>
                              <select value={tableSlotInputs[`${i}_rangeStart`] || '09'}
                                onChange={(e) => setTableSlotInputs((p) => ({ ...p, [`${i}_rangeStart`]: e.target.value }))}
                                className="flex-1 rounded-md border px-1 py-1 text-xs font-mono outline-none text-center"
                                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                                {Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0')).map((h) => <option key={h} value={h}>{h}:00</option>)}
                              </select>
                              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>–</span>
                              <select value={tableSlotInputs[`${i}_rangeEnd`] || '21'}
                                onChange={(e) => setTableSlotInputs((p) => ({ ...p, [`${i}_rangeEnd`]: e.target.value }))}
                                className="flex-1 rounded-md border px-1 py-1 text-xs font-mono outline-none text-center"
                                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                                {Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0')).map((h) => <option key={h} value={h}>{h}:00</option>)}
                              </select>
                              <button
                                onClick={() => {
                                  const start = parseInt(tableSlotInputs[`${i}_rangeStart`] || '9');
                                  const end   = parseInt(tableSlotInputs[`${i}_rangeEnd`]   || '21');
                                  if (start >= end) return;
                                  const newSlots = [];
                                  for (let h = start; h <= end; h++) {
                                    newSlots.push(`${String(h).padStart(2,'0')}:00`);
                                  }
                                  const merged = [...new Set([...(tables[i]?.slots || []), ...newSlots])].sort();
                                  updateTable(i, 'slots', merged);
                                }}
                                className="px-2 py-1 rounded-md text-[10px] font-semibold shrink-0 transition-colors"
                                style={{ background: '#6366f1', color: '#fff' }}>
                                Doldur
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      Toplam {tables.length} masa · {tables.reduce((s, t) => s + (t.seats || 0), 0)} kişilik kapasite
                    </p>
                  </div>
                )}

                {/* Masa yoksa genel kapasite fallback */}
                {tables.length === 0 && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Ya da genel masa sayısı gir
                    </label>
                    <input
                      type="number" min="0" value={tableCount || ''}
                      onChange={(e) => setTableCnt(parseInt(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                      style={{ background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-5 py-4 border-t flex gap-3" style={{ borderColor: 'var(--border)' }}>
              <button
                onClick={() => setSettingsOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-[var(--bg-muted)]"
                style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              >
                İptal
              </button>
              <button
                onClick={() => saveSettings.mutate()}
                disabled={saveSettings.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                style={{ background: '#6366f1', color: '#fff' }}
              >
                {saveSettings.isPending ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
