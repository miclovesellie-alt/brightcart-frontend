import { useState, useRef, useEffect } from 'react';
import { ChevronDown, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useCurrency, CURRENCIES } from '../context/CurrencyContext';

// theme: 'dark' (for navbar) or 'light' (for admin)
export default function CurrencySelector({ theme = 'dark' }) {
  const { currency, setCurrency, rateLabel, loading, error, lastUpdated, currentMeta } = useCurrency();
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const filtered = CURRENCIES.filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const isDark = theme === 'dark';

  const btnStyle = {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 10px', borderRadius: 8, cursor: 'pointer', border: 'none',
    background: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9',
    color: isDark ? '#fff' : '#374151',
    fontSize: 12, fontWeight: 600,
    transition: 'background 0.15s',
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={btnStyle}
        title={rateLabel(currency)}
      >
        <span style={{ fontSize: 14 }}>{currentMeta.flag}</span>
        <span>{currentMeta.code}</span>
        <span style={{ opacity: 0.5, fontSize: 11 }}>{currentMeta.symbol}</span>
        {loading
          ? <RefreshCw size={10} style={{ opacity: 0.5, animation: 'spin 1s linear infinite' }} />
          : error
          ? <WifiOff size={10} style={{ color: '#f59e0b' }} title="Using offline rates" />
          : <Wifi size={10} style={{ color: isDark ? 'rgba(255,255,255,0.3)' : '#94a3b8' }} />
        }
        <ChevronDown size={11} style={{ opacity: 0.6, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 9999,
          background: isDark ? '#111118' : '#fff',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
          borderRadius: 12, width: 260,
          boxShadow: '0 16px 48px rgba(0,0,0,0.25)',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '10px 12px 8px', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : '#f1f5f9'}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b', marginBottom: 6, letterSpacing: '0.06em' }}>
              CURRENCY
            </div>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search currency..."
              style={{
                width: '100%', padding: '6px 10px', borderRadius: 7, boxSizing: 'border-box',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
                background: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                color: isDark ? '#fff' : '#0f172a', fontSize: 12, outline: 'none',
              }}
            />
          </div>

          {/* Currency list */}
          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
            {filtered.map(c => {
              const active = c.code === currency;
              return (
                <button
                  key={c.code}
                  onClick={() => { setCurrency(c.code); setOpen(false); setSearch(''); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 14px', border: 'none', cursor: 'pointer', textAlign: 'left',
                    background: active
                      ? (isDark ? 'rgba(249,115,22,0.15)' : '#eff6ff')
                      : 'transparent',
                    borderLeft: active ? `3px solid ${isDark ? '#f97316' : '#4f8ef7'}` : '3px solid transparent',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ fontSize: 16 }}>{c.flag}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? '#4f8ef7' : (isDark ? '#e2e8f0' : '#374151') }}>
                      {c.code} <span style={{ fontWeight: 400, opacity: 0.6, fontSize: 11 }}>– {c.symbol}</span>
                    </div>
                    <div style={{ fontSize: 10, color: isDark ? '#64748b' : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.name}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: isDark ? '#475569' : '#94a3b8', whiteSpace: 'nowrap' }}>
                    {rateLabel(c.code).split('= ')[1]}
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ padding: '16px', textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>No results</div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '8px 12px', borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : '#f1f5f9'}`, fontSize: 10, color: '#64748b', display: 'flex', alignItems: 'center', gap: 5 }}>
            {error
              ? <><WifiOff size={10} color="#f59e0b" /> Using offline rates</>
              : lastUpdated
              ? <><Wifi size={10} color="#22c55e" /> Live rates &middot; {lastUpdated.toLocaleDateString()}</>
              : <><RefreshCw size={10} /> Fetching live rates…</>
            }
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
