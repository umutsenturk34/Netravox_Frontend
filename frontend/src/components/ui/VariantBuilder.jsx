import { useState, useEffect, useRef } from 'react';

function cartesian(arrays) {
  if (!arrays.length) return [[]];
  return arrays.reduce(
    (acc, curr) => acc.flatMap((a) => curr.map((c) => [...a, c])),
    [[]]
  );
}

export default function VariantBuilder({ attributeGroups = [], variants = [], onChange }) {
  const [activeGroupIds, setActiveGroupIds] = useState(() => new Set());
  const [selectedValues, setSelectedValues] = useState({});
  const initialized = useRef(false);

  // When groups load and we have existing variants, pre-select the used groups/values
  useEffect(() => {
    if (initialized.current || attributeGroups.length === 0 || variants.length === 0) return;
    initialized.current = true;
    const ids = new Set();
    const vals = {};
    for (const variant of variants) {
      const attrs = variant.attributes || {};
      for (const [key, val] of Object.entries(attrs)) {
        const g = attributeGroups.find((g) => (g.name?.tr || g.name?.en) === key);
        if (g) {
          ids.add(g._id);
          if (!vals[g._id]) vals[g._id] = new Set();
          vals[g._id].add(val);
        }
      }
    }
    setActiveGroupIds(ids);
    setSelectedValues(vals);
  }, [attributeGroups]); // eslint-disable-line

  function toggleGroup(id) {
    setActiveGroupIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleValue(groupId, val) {
    setSelectedValues((prev) => {
      const cur = new Set(prev[groupId] || []);
      cur.has(val) ? cur.delete(val) : cur.add(val);
      return { ...prev, [groupId]: cur };
    });
  }

  function generate() {
    const active = attributeGroups.filter((g) => activeGroupIds.has(g._id));
    const arrays = active
      .map((g) =>
        [...(selectedValues[g._id] || [])].map((val) => ({
          key: g.name?.tr || g.name?.en,
          val,
        }))
      )
      .filter((a) => a.length > 0);
    if (!arrays.length) return;

    const combos = cartesian(arrays);
    const next = combos.map((combo) => {
      const attributes = Object.fromEntries(combo.map(({ key, val }) => [key, val]));
      const existing = variants.find((v) => {
        const a = v.attributes || {};
        const keys = Object.keys(attributes);
        return (
          keys.length === Object.keys(a).length &&
          keys.every((k) => a[k] === attributes[k])
        );
      });
      return existing
        ? { ...existing, attributes }
        : { sku: '', attributes, price: '', stock: '', trackStock: true, isActive: true };
    });
    onChange(next);
  }

  function updateRow(i, field, val) {
    const next = [...variants];
    next[i] = { ...next[i], [field]: val };
    onChange(next);
  }

  const active = attributeGroups.filter((g) => activeGroupIds.has(g._id));
  const comboCount = active
    .map((g) => selectedValues[g._id]?.size || 0)
    .filter((n) => n > 0)
    .reduce((a, b) => a * b, 1);
  const canGenerate = active.length > 0 && comboCount > 0;

  return (
    <div className="space-y-4">
      {attributeGroups.length === 0 ? (
        <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>
          Henüz özellik grubu yok.{' '}
          <a href="/attribute-groups" className="text-indigo-500 hover:underline">
            Özellik Grupları
          </a>{' '}
          sayfasından önce grupları tanımlayın (Renk, Beden, Depolama vb.).
        </p>
      ) : (
        <>
          {/* Group toggle chips */}
          <div>
            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
              Bu ürün için kullanılacak özellik gruplarını seçin:
            </p>
            <div className="flex flex-wrap gap-2">
              {attributeGroups.map((g) => {
                const on = activeGroupIds.has(g._id);
                return (
                  <button
                    key={g._id}
                    type="button"
                    onClick={() => toggleGroup(g._id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      on
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'hover:border-indigo-400'
                    }`}
                    style={
                      on ? {} : { borderColor: 'var(--border)', color: 'var(--text-secondary)' }
                    }
                  >
                    {g.name?.tr || g.name?.en}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Value selection per active group */}
          {active.map((g) => (
            <div key={g._id} className="space-y-1.5">
              <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                {g.name?.tr || g.name?.en}:
              </p>
              <div className="flex flex-wrap gap-2">
                {(g.values || []).map((v, idx) => {
                  const str = typeof v === 'string' ? v : v.tr || v.en || '';
                  if (!str) return null;
                  const on = selectedValues[g._id]?.has(str);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleValue(g._id, str)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        on
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-400 text-indigo-700 dark:text-indigo-300'
                          : 'hover:border-indigo-300'
                      }`}
                      style={
                        on ? {} : { borderColor: 'var(--border)', color: 'var(--text-secondary)' }
                      }
                    >
                      {str}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Generate button */}
          {activeGroupIds.size > 0 && (
            <button
              type="button"
              onClick={generate}
              disabled={!canGenerate}
              className="text-sm px-4 py-2 rounded-lg font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {canGenerate
                ? `Varyantları Oluştur (${comboCount} kombinasyon)`
                : 'Değer seçin'}
            </button>
          )}
        </>
      )}

      {/* Variant table */}
      {variants.length > 0 && (
        <div className="space-y-2 pt-1">
          <p
            className="text-[11px] font-bold uppercase tracking-wider pb-1 border-b"
            style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}
          >
            Varyant Tablosu — {variants.length} kombinasyon
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-separate border-spacing-y-1">
              <thead>
                <tr>
                  <th
                    className="text-left pr-3 pb-1 font-medium"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Varyant
                  </th>
                  <th
                    className="text-left pr-3 pb-1 font-medium"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Fiyat (₺)
                  </th>
                  <th
                    className="text-left pr-3 pb-1 font-medium"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Stok
                  </th>
                  <th
                    className="text-left pr-3 pb-1 font-medium"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    SKU
                  </th>
                  <th
                    className="pb-1 font-medium text-center"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Aktif
                  </th>
                  <th className="pb-1" />
                </tr>
              </thead>
              <tbody>
                {variants.map((v, i) => {
                  const label = Object.values(v.attributes || {}).join(' / ');
                  return (
                    <tr key={i}>
                      <td
                        className="px-2 py-2 rounded-l-lg font-medium"
                        style={{
                          background: 'var(--bg-muted)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {label || '—'}
                      </td>
                      <td className="pr-2 py-2" style={{ background: 'var(--bg-muted)' }}>
                        <input
                          type="number"
                          value={v.price ?? ''}
                          onChange={(e) =>
                            updateRow(
                              i,
                              'price',
                              e.target.value === '' ? '' : Number(e.target.value)
                            )
                          }
                          placeholder="Ana fiyat"
                          className="w-24 text-xs border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                          style={{
                            background: 'var(--bg-input)',
                            borderColor: 'var(--border)',
                            color: 'var(--text-primary)',
                          }}
                        />
                      </td>
                      <td className="pr-2 py-2" style={{ background: 'var(--bg-muted)' }}>
                        <input
                          type="number"
                          value={v.stock ?? ''}
                          onChange={(e) =>
                            updateRow(
                              i,
                              'stock',
                              e.target.value === '' ? '' : Number(e.target.value)
                            )
                          }
                          placeholder="∞"
                          min="0"
                          className="w-20 text-xs border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                          style={{
                            background: 'var(--bg-input)',
                            borderColor: 'var(--border)',
                            color: 'var(--text-primary)',
                          }}
                        />
                      </td>
                      <td className="pr-2 py-2" style={{ background: 'var(--bg-muted)' }}>
                        <input
                          type="text"
                          value={v.sku || ''}
                          onChange={(e) => updateRow(i, 'sku', e.target.value)}
                          placeholder="VS-001"
                          className="w-28 text-xs border rounded px-2 py-1.5 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-400"
                          style={{
                            background: 'var(--bg-input)',
                            borderColor: 'var(--border)',
                            color: 'var(--text-primary)',
                          }}
                        />
                      </td>
                      <td
                        className="pr-2 py-2 text-center"
                        style={{ background: 'var(--bg-muted)' }}
                      >
                        <input
                          type="checkbox"
                          checked={v.isActive ?? true}
                          onChange={(e) => updateRow(i, 'isActive', e.target.checked)}
                          className="accent-indigo-600 w-4 h-4"
                        />
                      </td>
                      <td className="pr-2 py-2 rounded-r-lg" style={{ background: 'var(--bg-muted)' }}>
                        <button
                          type="button"
                          onClick={() => onChange(variants.filter((_, j) => j !== i))}
                          className="w-6 h-6 rounded flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Boş fiyat → ürün ana fiyatı kullanılır · Boş stok → sınırsız kabul edilir
          </p>
        </div>
      )}
    </div>
  );
}
