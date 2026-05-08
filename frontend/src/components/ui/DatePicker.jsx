import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

const DAYS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];
const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function firstDayOfMonth(year, month) {
  // 0=Sun → convert to Mon-based (0=Mon … 6=Sun)
  return (new Date(year, month, 1).getDay() + 6) % 7;
}
function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
function formatDisplay(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

export default function DatePicker({ value, onChange, placeholder = 'gg.aa.yyyy' }) {
  const [open, setOpen]           = useState(false);
  const [view, setView]           = useState(() => {
    const d = value ? new Date(value) : new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const prevMonth = () => setView(v => {
    const d = new Date(v.year, v.month - 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const nextMonth = () => setView(v => {
    const d = new Date(v.year, v.month + 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const selectDay = (day) => {
    const iso = toISO(new Date(view.year, view.month, day));
    onChange(iso);
    setOpen(false);
  };

  const clear = (e) => { e.stopPropagation(); onChange(''); };

  const totalDays   = daysInMonth(view.year, view.month);
  const startOffset = firstDayOfMonth(view.year, view.month);
  const cells       = Array.from({ length: startOffset + totalDays });

  const selectedDay = value
    ? (() => { const d = new Date(value); return d.getFullYear() === view.year && d.getMonth() === view.month ? d.getDate() : null; })()
    : null;

  const today = new Date();
  const todayDay = today.getFullYear() === view.year && today.getMonth() === view.month ? today.getDate() : null;

  return (
    <div ref={ref} style={{ position: 'relative', userSelect: 'none' }}>
      {/* Input trigger */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', borderRadius: 12, cursor: 'pointer',
          border: '1px solid var(--border)', background: 'var(--bg-surface)',
          minWidth: 140, fontSize: 13,
          color: value ? 'var(--text-primary)' : 'var(--text-muted)',
        }}
      >
        <Calendar size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <span style={{ flex: 1 }}>{value ? formatDisplay(value) : placeholder}</span>
        {value && (
          <X size={12} style={{ color: 'var(--text-muted)' }} onClick={clear} />
        )}
      </div>

      {/* Calendar popover */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 100,
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 14, padding: '14px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          width: 240,
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <button onClick={prevMonth} style={{ ...btnStyle }}>
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              {MONTHS[view.month]} {view.year}
            </span>
            <button onClick={nextMonth} style={{ ...btnStyle }}>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600,
                color: 'var(--text-muted)', padding: '2px 0' }}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {cells.map((_, i) => {
              const day = i - startOffset + 1;
              if (i < startOffset) return <div key={i} />;
              const isSelected = day === selectedDay;
              const isToday    = day === todayDay;
              return (
                <button
                  key={i}
                  onClick={() => selectDay(day)}
                  style={{
                    width: '100%', aspectRatio: '1', borderRadius: 8,
                    fontSize: 12, fontWeight: isSelected ? 700 : 400,
                    cursor: 'pointer', border: 'none',
                    background: isSelected ? '#6366f1' : isToday ? 'rgba(99,102,241,0.12)' : 'transparent',
                    color: isSelected ? '#fff' : isToday ? '#6366f1' : 'var(--text-primary)',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-muted)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isToday ? 'rgba(99,102,241,0.12)' : 'transparent'; }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 10,
            borderTop: '1px solid var(--border)' }}>
            <button onClick={clear} style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none',
              border: 'none', cursor: 'pointer', padding: 0 }}>Temizle</button>
            <button onClick={() => {
              const iso = toISO(new Date());
              setView({ year: today.getFullYear(), month: today.getMonth() });
              onChange(iso); setOpen(false);
            }} style={{ fontSize: 12, color: '#6366f1', background: 'none',
              border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}>Bugün</button>
          </div>
        </div>
      )}
    </div>
  );
}

const btnStyle = {
  background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px',
  borderRadius: 6, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center',
};
