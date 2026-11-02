import { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Package } from 'lucide-react';

// ── Mock data ─────────────────────────────────────────────────────────────────
const MONTHLY = [
  { month:'Jun', rev:18200, orders:198, customers:34 },
  { month:'Jul', rev:22400, orders:241, customers:51 },
  { month:'Aug', rev:19800, orders:216, customers:39 },
  { month:'Sep', rev:28600, orders:312, customers:68 },
  { month:'Oct', rev:34100, orders:381, customers:82 },
  { month:'Nov', rev:48293, orders:524, customers:103 },
];

const CATEGORY_SPLIT = [
  { name:'Phones',              pct:38, color:'#2563eb', rev:18351 },
  { name:'Laptop Accessories',  pct:28, color:'#7c3aed', rev:13522 },
  { name:'Audio',               pct:22, color:'#0891b2', rev:10624 },
  { name:'Electrical',          pct:12, color:'#f59e0b', rev:5796  },
];

const TOP_COUNTRIES = [
  { country:'United States', flag:'🇺🇸', orders:241, pct:46 },
  { country:'United Kingdom', flag:'🇬🇧', orders:98,  pct:19 },
  { country:'Canada',         flag:'🇨🇦', orders:62,  pct:12 },
  { country:'Australia',      flag:'🇦🇺', orders:47,  pct:9  },
  { country:'Germany',        flag:'🇩🇪', orders:36,  pct:7  },
  { country:'Other',          flag:'🌍', orders:40,  pct:7  },
];

const SUPPLIER_PERF = [
  { name:'AliExpress',     orders:182, onTime:87, returns:3.2, margin:42 },
  { name:'CJ Dropshipping',orders:134, onTime:91, returns:2.1, margin:38 },
  { name:'Spocket',        orders:89,  onTime:96, returns:1.4, margin:51 },
  { name:'Zendrop',        orders:67,  onTime:82, returns:4.8, margin:35 },
];

const PERIOD_OPTIONS = ['Last 7 Days', 'Last 30 Days', 'Last 6 Months', 'This Year'];

const Bar = ({ pct, color, height = 120 }) => (
  <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4, height, justifyContent:'flex-end' }}>
    <div style={{ width:'100%', borderRadius:'5px 5px 0 0', background:`linear-gradient(180deg,${color},${color}88)`, height:`${pct}%`, minHeight:4 }} />
  </div>
);

export default function AdminAnalytics() {
  const [period, setPeriod] = useState('Last 6 Months');
  const maxRev = Math.max(...MONTHLY.map(m => m.rev));

  const currentMonth = MONTHLY[MONTHLY.length - 1];
  const prevMonth    = MONTHLY[MONTHLY.length - 2];
  const revGrowth    = (((currentMonth.rev - prevMonth.rev) / prevMonth.rev) * 100).toFixed(1);
  const ordGrowth    = (((currentMonth.orders - prevMonth.orders) / prevMonth.orders) * 100).toFixed(1);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontWeight:800, fontSize:18, color:'#0f172a', margin:0 }}>Analytics</h2>
          <p style={{ color:'#64748b', fontSize:12, margin:'2px 0 0' }}>Store performance overview</p>
        </div>
        <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
          {PERIOD_OPTIONS.map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{ padding:'6px 12px', borderRadius:20, fontSize:11, fontWeight:600, cursor:'pointer',
                background: period===p ? '#2563eb':'#fff', color: period===p ? '#fff':'#374151',
                border:`1px solid ${period===p ? '#2563eb':'#e2e8f0'}` }}>{p}</button>
          ))}
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12 }}>
        {[
          { label:'Total Revenue',   value:'$48,293', growth:revGrowth,   icon: DollarSign, color:'#eff6ff', ic:'#2563eb' },
          { label:'Total Orders',    value:'524',      growth:ordGrowth,   icon: ShoppingBag, color:'#f0fdf4', ic:'#16a34a' },
          { label:'New Customers',   value:'103',      growth:'+25.6',     icon: Users,       color:'#faf5ff', ic:'#7c3aed' },
          { label:'Products Active', value:'34',       growth:null,        icon: Package,     color:'#fff7ed', ic:'#f59e0b' },
          { label:'Avg Order Value', value:'$92.20',   growth:'+9.4',      icon: TrendingUp,  color:'#f0fdfa', ic:'#0891b2' },
          { label:'Return Rate',     value:'2.8%',     growth:'-0.4',      icon: TrendingDown,color:'#fef2f2', ic:'#ef4444' },
        ].map((s, i) => {
          const up = s.growth === null ? null : parseFloat(s.growth) >= 0;
          return (
            <div key={i} style={{ background:'#fff', borderRadius:13, border:'1px solid #e8edf3', padding:'15px 16px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                <div style={{ width:35, height:35, borderRadius:9, background:s.color, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <s.icon size={16} color={s.ic} />
                </div>
                {s.growth !== null && (
                  <span style={{ fontSize:10, fontWeight:700, color: up ? '#16a34a':'#ef4444', background: up ? '#f0fdf4':'#fef2f2', padding:'2px 7px', borderRadius:20 }}>
                    {up ? '▲':'▼'} {Math.abs(parseFloat(s.growth))}%
                  </span>
                )}
              </div>
              <div style={{ fontSize:20, fontWeight:800, color:'#0f172a', letterSpacing:'-0.03em' }}>{s.value}</div>
              <div style={{ fontSize:10, color:'#64748b', marginTop:3 }}>{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Revenue Chart */}
      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e8edf3', padding:'20px 22px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div>
            <div style={{ fontWeight:700, fontSize:14, color:'#0f172a' }}>Revenue & Orders</div>
            <div style={{ fontSize:11, color:'#94a3b8' }}>6-month trend</div>
          </div>
          <div style={{ display:'flex', gap:16 }}>
            <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#64748b' }}>
              <span style={{ width:10, height:10, borderRadius:2, background:'#2563eb', display:'inline-block' }} /> Revenue
            </span>
            <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#64748b' }}>
              <span style={{ width:10, height:10, borderRadius:2, background:'#c7d2fe', display:'inline-block' }} /> Orders
            </span>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'flex-end', gap:12, height:150 }}>
          {MONTHLY.map((m, i) => (
            <div key={i} style={{ flex:1, display:'flex', gap:3, alignItems:'flex-end', height:'100%', justifyContent:'center' }}>
              <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', height:'100%', justifyContent:'flex-end', gap:4 }}>
                <span style={{ fontSize:9, fontWeight:700, color:'#2563eb' }}>${(m.rev/1000).toFixed(0)}k</span>
                <div style={{ width:'100%', borderRadius:'4px 4px 0 0', background:'linear-gradient(180deg,#2563eb,#93c5fd)', height:`${(m.rev/maxRev)*100}%`, minHeight:4 }} />
              </div>
              <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', height:'100%', justifyContent:'flex-end', gap:4 }}>
                <span style={{ fontSize:9, color:'#94a3b8' }}>{m.orders}</span>
                <div style={{ width:'100%', borderRadius:'4px 4px 0 0', background:'#c7d2fe', height:`${(m.orders/524)*100}%`, minHeight:4 }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ display:'flex', justifyContent:'space-around', marginTop:8, borderTop:'1px solid #f1f5f9', paddingTop:8 }}>
          {MONTHLY.map((m, i) => (
            <span key={i} style={{ fontSize:10, color:'#94a3b8', textAlign:'center', flex:1 }}>{m.month}</span>
          ))}
        </div>
      </div>

      {/* Category Split + Geo */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

        {/* Category revenue */}
        <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e8edf3', padding:'18px 20px' }}>
          <div style={{ fontWeight:700, fontSize:14, color:'#0f172a', marginBottom:16 }}>Revenue by Category</div>

          {/* Stacked bar */}
          <div style={{ display:'flex', height:14, borderRadius:99, overflow:'hidden', marginBottom:16 }}>
            {CATEGORY_SPLIT.map((c, i) => (
              <div key={i} style={{ width:`${c.pct}%`, background:c.color }} title={c.name} />
            ))}
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {CATEGORY_SPLIT.map((c, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:10, height:10, borderRadius:3, background:c.color, flexShrink:0 }} />
                <span style={{ fontSize:12, color:'#374151', flex:1 }}>{c.name}</span>
                <div style={{ flex:2, height:6, background:'#f1f5f9', borderRadius:99 }}>
                  <div style={{ height:'100%', borderRadius:99, background:c.color, width:`${c.pct}%` }} />
                </div>
                <span style={{ fontSize:11, fontWeight:700, color:'#0f172a', minWidth:30, textAlign:'right' }}>{c.pct}%</span>
                <span style={{ fontSize:11, color:'#64748b', minWidth:55, textAlign:'right' }}>${c.rev.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top countries */}
        <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e8edf3', padding:'18px 20px' }}>
          <div style={{ fontWeight:700, fontSize:14, color:'#0f172a', marginBottom:16 }}>Orders by Country</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {TOP_COUNTRIES.map((c, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:18, flexShrink:0 }}>{c.flag}</span>
                <span style={{ fontSize:12, color:'#374151', flex:1 }}>{c.country}</span>
                <div style={{ flex:2, height:6, background:'#f1f5f9', borderRadius:99 }}>
                  <div style={{ height:'100%', borderRadius:99, background:'#2563eb', width:`${c.pct}%` }} />
                </div>
                <span style={{ fontSize:11, fontWeight:700, color:'#0f172a', minWidth:28, textAlign:'right' }}>{c.orders}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Supplier Performance */}
      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e8edf3', overflow:'hidden' }}>
        <div style={{ padding:'14px 20px', borderBottom:'1px solid #f1f5f9' }}>
          <div style={{ fontWeight:700, fontSize:14, color:'#0f172a' }}>Supplier Performance</div>
          <div style={{ fontSize:11, color:'#94a3b8' }}>On-time delivery, return rate, profit margin</div>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', fontSize:12, borderCollapse:'collapse', minWidth:500 }}>
            <thead>
              <tr style={{ background:'#f8fafc' }}>
                {['Supplier','Orders Placed','On-Time %','Return Rate','Avg Margin','Score'].map(h => (
                  <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:10, fontWeight:700, color:'#64748b', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SUPPLIER_PERF.map((s, i) => {
                const score = Math.round((s.onTime * 0.4) + ((100 - s.returns * 5) * 0.3) + (s.margin * 0.3));
                const scoreColor = score > 85 ? '#16a34a' : score > 70 ? '#d97706' : '#ef4444';
                return (
                  <tr key={i} style={{ borderTop:'1px solid #f8fafc' }}>
                    <td style={{ padding:'12px 16px', fontWeight:700, color:'#0f172a' }}>{s.name}</td>
                    <td style={{ padding:'12px 16px', color:'#374151' }}>{s.orders}</td>
                    <td style={{ padding:'12px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ flex:1, height:5, background:'#f1f5f9', borderRadius:99, maxWidth:70 }}>
                          <div style={{ height:'100%', borderRadius:99, background: s.onTime > 90 ? '#22c55e' : s.onTime > 80 ? '#f59e0b' : '#ef4444', width:`${s.onTime}%` }} />
                        </div>
                        <span style={{ fontWeight:700, color: s.onTime > 90 ? '#16a34a' : s.onTime > 80 ? '#d97706' : '#ef4444' }}>{s.onTime}%</span>
                      </div>
                    </td>
                    <td style={{ padding:'12px 16px' }}>
                      <span style={{ color: s.returns < 2 ? '#16a34a' : s.returns < 4 ? '#d97706' : '#ef4444', fontWeight:700 }}>{s.returns}%</span>
                    </td>
                    <td style={{ padding:'12px 16px' }}>
                      <span style={{ background:'#f0fdf4', color:'#16a34a', borderRadius:6, padding:'2px 8px', fontWeight:700, fontSize:11 }}>{s.margin}%</span>
                    </td>
                    <td style={{ padding:'12px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <div style={{ width:32, height:32, borderRadius:'50%', background: scoreColor+'18', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:12, color:scoreColor }}>
                          {score}
                        </div>
                        <span style={{ fontSize:10, color: scoreColor, fontWeight:700 }}>{score > 85 ? 'Excellent' : score > 70 ? 'Good' : 'Poor'}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
