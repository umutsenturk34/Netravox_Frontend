import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const DAYS   = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];
const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
                'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

function firstDayOfMonth(y, m) { return (new Date(y, m, 1).getDay() + 6) % 7; }
function daysInMonth(y, m)     { return new Date(y, m + 1, 0).getDate(); }

function toISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
function formatDisplay(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

export default function DatePicker({
  value,
  onChange,
  label,
  placeholder = 'gg.aa.yyyy',
  align = 'left',
  clearable = true,
  className = '',
}) {
  const today = new Date();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => {
    const d = value ? new Date(value) : today;
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      setView({ year: d.getFullYear(), month: d.getMonth() });
    }
  }, [value]);

  const prevMonth = () => setView(v => { const d = new Date(v.year, v.month - 1); return { year: d.getFullYear(), month: d.getMonth() }; });
  const nextMonth = () => setView(v => { const d = new Date(v.year, v.month + 1); return { year: d.getFullYear(), month: d.getMonth() }; });

  const selectDay = (day) => { onChange(toISO(new Date(view.year, view.month, day))); setOpen(false); };
  const goToday   = ()    => { const iso = toISO(today); setView({ year: today.getFullYear(), month: today.getMonth() }); onChange(iso); setOpen(false); };
  const clear     = (e)   => { e.stopPropagation(); onChange(''); };

  const offset    = firstDayOfMonth(view.year, view.month);
  const total     = daysInMonth(view.year, view.month);
  const cells     = Array.from({ length: offset + total });

  const selectedDay = value ? (() => {
    const d = new Date(value);
    return d.getFullYear() === view.year && d.getMonth() === view.month ? d.getDate() : null;
  })() : null;
  const todayDay = today.getFullYear() === view.year && today.getMonth() === view.month ? today.getDate() : null;

  return (
    <div ref={ref} className={`relative ${className}`} style={{ userSelect: 'none' }}>

      {label && (
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}

      {/* ── Trigger ── */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 text-sm transition-all"
        style={{
          padding:      '10px 14px',
          borderRadius: '12px',
          border:       `1.5px solid ${open ? '#6366f1' : 'var(--border)'}`,
          background:   'var(--bg-base)',
          color:        value ? 'var(--text-primary)' : 'var(--text-muted)',
          boxShadow:    open ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none',
          outline:      'none',
          textAlign:    'left',
          cursor:       'pointer',
        }}
      >
        <Calendar size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <span style={{ flex: 1, fontWeight: value ? 500 : 400 }}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        {value && clearable && (
          <span
            onClick={clear}
            className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-[var(--bg-muted)] transition-colors"
            style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, flexShrink: 0 }}
          >
            ✕
          </span>
        )}
      </button>

      {/* ── Calendar dropdown ── */}
      {open && (
        <div
          style={{
            position:    'absolute',
            top:         'calc(100% + 8px)',
            [align === 'right' ? 'right' : 'left']: 0,
            zIndex:      200,
            width:       '264px',
            background:  'var(--bg-surface)',
            border:      '1.5px solid var(--border)',
            borderRadius: '16px',
            boxShadow:   '0 12px 40px rgba(0,0,0,0.18)',
            overflow:    'hidden',
          }}
        >
          {/* Month header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 14px', borderBottom: '1px solid var(--border)',
          }}>
            <button type="button" onClick={prevMonth} style={navBtn}>
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              {MONTHS[view.month]} {view.year}
            </span>
            <button type="button" onClick={nextMonth} style={navBtn}>
              <ChevronRight size={14} />
            </button>
          </div>

          <div style={{ padding: '10px 12px 4px' }}>
            {/* Day names */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 6 }}>
              {DAYS.map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700,
                  color: 'var(--text-muted)', padding: '2px 0' }}>{d}</div>
              ))}
            </div>

            {/* Cells */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
              {cells.map((_, i) => {
                const day = i - offset + 1;
                if (i < offset) return <div key={i} />;
                const isSel   = day === selectedDay;
                const isTday  = day === todayDay;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectDay(day)}
                    style={{
                      width: '100%', aspectRatio: '1',
                      borderRadius: 8, border: 'none', cursor: 'pointer',
                      fontSize: 12, fontWeight: isSel ? 700 : 400,
                      background: isSel
                        ? '#6366f1'
                        : isTday
                        ? 'rgba(99,102,241,0.1)'
                        : 'transparent',
                      color: isSel ? '#fff' : isTday ? '#6366f1' : 'var(--text-primary)',
                      outline: isTday && !isSel ? '1.5px solid #6366f1' : 'none',
                      outlineOffset: '-1px',
                      transition: 'all 0.1s',
                    }}
                    onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'var(--bg-muted)'; }}
                    onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = isTday ? 'rgba(99,102,241,0.1)' : 'transparent'; }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex', justifyContent: clearable ? 'space-between' : 'flex-end', alignItems: 'center',
            padding: '8px 14px 12px', borderTop: '1px solid var(--border)', marginTop: 8,
          }}>
            {clearable && (
              <button type="button" onClick={clear}
                style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                Temizle
              </button>
            )}
            <button type="button" onClick={goToday}
              style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              Bugün
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const navBtn = {
  background: 'none', border: 'none', cursor: 'pointer',
  padding: '5px 7px', borderRadius: 8,
  color: 'var(--text-secondary)', display: 'flex', alignItems: 'center',
};
