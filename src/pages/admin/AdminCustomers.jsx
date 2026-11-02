import { useState } from 'react';
import { Search, Mail, Phone, MapPin, ShoppingBag, DollarSign, ChevronDown } from 'lucide-react';

const MOCK_CUSTOMERS = [
  { id:'C001', name:'Alice Johnson',  email:'alice@mail.com',  phone:'+1 555-0101', location:'New York, US',    orders:7,  spent:2840, joined:'Jan 2026', tier:'Gold',   lastOrder:'Nov 1, 2026' },
  { id:'C002', name:'Bob Smith',      email:'bob@mail.com',    phone:'+1 555-0102', location:'Los Angeles, US', orders:3,  spent:698,  joined:'Mar 2026', tier:'Silver', lastOrder:'Nov 1, 2026' },
  { id:'C003', name:'Carol Davis',    email:'carol@mail.com',  phone:'+44 7700 9000',location:'London, UK',    orders:12, spent:5420, joined:'Dec 2025', tier:'Gold',   lastOrder:'Oct 31, 2026' },
  { id:'C004', name:'Dan Brown',      email:'dan@mail.com',    phone:'+1 555-0104', location:'Chicago, US',    orders:1,  spent:147,  joined:'Oct 2026', tier:'Bronze', lastOrder:'Oct 31, 2026' },
  { id:'C005', name:'Eva Martinez',   email:'eva@mail.com',    phone:'+34 612 345', location:'Madrid, ES',     orders:5,  spent:3210, joined:'Feb 2026', tier:'Gold',   lastOrder:'Oct 30, 2026' },
  { id:'C006', name:'Frank Lee',      email:'frank@mail.com',  phone:'+1 555-0106', location:'Toronto, CA',    orders:9,  spent:1890, joined:'May 2026', tier:'Silver', lastOrder:'Oct 30, 2026' },
  { id:'C007', name:'Grace Chen',     email:'grace@mail.com',  phone:'+86 138 0000',location:'Shanghai, CN',   orders:22, spent:8960, joined:'Sep 2025', tier:'Platinum',lastOrder:'Oct 29, 2026'},
  { id:'C008', name:'Hank Wilson',    email:'hank@mail.com',   phone:'+1 555-0108', location:'Houston, US',    orders:2,  spent:328,  joined:'Sep 2026', tier:'Bronze', lastOrder:'Oct 28, 2026' },
  { id:'C009', name:'Iris Park',      email:'iris@mail.com',   phone:'+82 10 1234', location:'Seoul, KR',      orders:15, spent:6720, joined:'Nov 2025', tier:'Gold',   lastOrder:'Oct 28, 2026' },
  { id:'C010', name:'Jake Turner',    email:'jake@mail.com',   phone:'+1 555-0110', location:'Miami, US',      orders:4,  spent:1240, joined:'Jun 2026', tier:'Silver', lastOrder:'Oct 27, 2026' },
];

const TIER_COLORS = {
  Platinum:{ bg:'#f0f9ff', text:'#0369a1', border:'#bae6fd' },
  Gold:    { bg:'#fffbeb', text:'#b45309', border:'#fde68a' },
  Silver:  { bg:'#f8fafc', text:'#475569', border:'#e2e8f0' },
  Bronze:  { bg:'#fff7ed', text:'#c2410c', border:'#fed7aa' },
};

export default function AdminCustomers() {
  const [search, setSearch] = useState('');
  const [tier, setTier]     = useState('All');
  const [selected, setSelected] = useState(null);
  const [sortBy, setSortBy] = useState('spent');

  const tiers = ['All', 'Platinum', 'Gold', 'Silver', 'Bronze'];

  const filtered = MOCK_CUSTOMERS
    .filter(c =>
      (tier === 'All' || c.tier === tier) &&
      (c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => sortBy === 'spent' ? b.spent - a.spent : sortBy === 'orders' ? b.orders - a.orders : a.name.localeCompare(b.name));

  const totalRevenue = MOCK_CUSTOMERS.reduce((s,c) => s+c.spent, 0);
  const avgSpend     = Math.round(totalRevenue / MOCK_CUSTOMERS.length);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontWeight:800, fontSize:18, color:'#0f172a', margin:0 }}>Customers</h2>
          <p style={{ color:'#64748b', fontSize:12, margin:'2px 0 0' }}>{MOCK_CUSTOMERS.length} customers · ${totalRevenue.toLocaleString()} total lifetime value</p>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12 }}>
        {[
          { label:'Total Customers', value: MOCK_CUSTOMERS.length, icon:'👥', color:'#eff6ff' },
          { label:'Total Revenue',   value:`$${totalRevenue.toLocaleString()}`, icon:'💰', color:'#f0fdf4' },
          { label:'Avg Spend',       value:`$${avgSpend}`, icon:'📊', color:'#faf5ff' },
          { label:'Platinum',        value: MOCK_CUSTOMERS.filter(c=>c.tier==='Platinum').length, icon:'💎', color:'#f0f9ff' },
          { label:'Gold Members',    value: MOCK_CUSTOMERS.filter(c=>c.tier==='Gold').length,     icon:'🥇', color:'#fffbeb' },
        ].map((s,i) => (
          <div key={i} style={{ background:'#fff', borderRadius:12, border:'1px solid #e8edf3', padding:'14px 16px' }}>
            <div style={{ fontSize:22, marginBottom:6 }}>{s.icon}</div>
            <div style={{ fontWeight:800, fontSize:18, color:'#0f172a' }}>{s.value}</div>
            <div style={{ fontSize:10, color:'#64748b', marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={13} color="#94a3b8" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)' }} />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or email…"
            style={{ width:'100%', padding:'7px 12px 7px 30px', borderRadius:8, border:'1px solid #e2e8f0', fontSize:12, outline:'none', boxSizing:'border-box' }} />
        </div>
        <div style={{ display:'flex', gap:5 }}>
          {tiers.map(t => (
            <button key={t} onClick={()=>setTier(t)}
              style={{ padding:'5px 12px', borderRadius:20, fontSize:11, fontWeight:600, cursor:'pointer',
                background: tier===t ? '#2563eb':'#fff', color: tier===t ? '#fff':'#374151',
                border:`1px solid ${tier===t ? '#2563eb':'#e2e8f0'}` }}>{t}</button>
          ))}
        </div>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
          style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #e2e8f0', fontSize:11, color:'#374151', background:'#fff', cursor:'pointer' }}>
          <option value="spent">Sort: Top Spenders</option>
          <option value="orders">Sort: Most Orders</option>
          <option value="name">Sort: Name A–Z</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e8edf3', overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', fontSize:12, borderCollapse:'collapse', minWidth:700 }}>
            <thead>
              <tr style={{ background:'#f8fafc' }}>
                {['Customer','Contact','Location','Orders','Lifetime Value','Tier','Last Order','Action'].map(h => (
                  <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:10, fontWeight:700, color:'#64748b', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const tc = TIER_COLORS[c.tier] || TIER_COLORS.Bronze;
                return (
                  <tr key={c.id} style={{ borderTop:'1px solid #f8fafc' }}>
                    <td style={{ padding:'11px 14px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                        <div style={{ width:32, height:32, borderRadius:'50%', background:`hsl(${c.id.charCodeAt(1)*37},60%,70%)`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, color:'#fff', fontSize:12, flexShrink:0 }}>
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight:700, color:'#0f172a' }}>{c.name}</div>
                          <div style={{ fontSize:10, color:'#94a3b8' }}>Since {c.joined}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:'11px 14px' }}>
                      <div style={{ fontSize:11, color:'#374151' }}>{c.email}</div>
                      <div style={{ fontSize:10, color:'#94a3b8' }}>{c.phone}</div>
                    </td>
                    <td style={{ padding:'11px 14px', color:'#64748b', fontSize:11 }}>{c.location}</td>
                    <td style={{ padding:'11px 14px', fontWeight:700, color:'#0f172a', textAlign:'center' }}>{c.orders}</td>
                    <td style={{ padding:'11px 14px', fontWeight:800, color:'#2563eb' }}>${c.spent.toLocaleString()}</td>
                    <td style={{ padding:'11px 14px' }}>
                      <span style={{ background:tc.bg, color:tc.text, border:`1px solid ${tc.border}`, borderRadius:20, padding:'2px 10px', fontWeight:700, fontSize:10 }}>{c.tier}</span>
                    </td>
                    <td style={{ padding:'11px 14px', color:'#64748b', whiteSpace:'nowrap', fontSize:11 }}>{c.lastOrder}</td>
                    <td style={{ padding:'11px 14px' }}>
                      <button onClick={()=>setSelected(c)} style={{ padding:'4px 10px', borderRadius:6, background:'#eff6ff', border:'none', color:'#2563eb', fontSize:11, fontWeight:600, cursor:'pointer' }}>View</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Drawer */}
      {selected && (
        <div style={{ position:'fixed', inset:0, zIndex:100, display:'flex', justifyContent:'flex-end' }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)' }} onClick={()=>setSelected(null)} />
          <div style={{ position:'relative', width:380, background:'#fff', height:'100%', overflowY:'auto', boxShadow:'-8px 0 40px rgba(0,0,0,0.12)' }}>
            <div style={{ padding:'20px 22px', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                <div style={{ width:44, height:44, borderRadius:'50%', background:`hsl(${selected.id.charCodeAt(1)*37},60%,70%)`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, color:'#fff', fontSize:18 }}>
                  {selected.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight:800, fontSize:15, color:'#0f172a' }}>{selected.name}</div>
                  <span style={{ background: TIER_COLORS[selected.tier]?.bg, color: TIER_COLORS[selected.tier]?.text, fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20 }}>{selected.tier}</span>
                </div>
              </div>
              <button onClick={()=>setSelected(null)} style={{ background:'#f1f5f9', border:'none', borderRadius:8, padding:8, cursor:'pointer', display:'flex' }}>
                <span style={{ fontSize:14, color:'#64748b' }}>✕</span>
              </button>
            </div>

            <div style={{ padding:'18px 22px', display:'flex', flexDirection:'column', gap:16 }}>
              {/* Stats */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[
                  { label:'Total Orders',  value: selected.orders, icon:'🛍️' },
                  { label:'Total Spent',   value:`$${selected.spent.toLocaleString()}`, icon:'💰' },
                  { label:'Avg Order',     value:`$${Math.round(selected.spent/selected.orders)}`, icon:'📊' },
                  { label:'Customer Since',value: selected.joined, icon:'📅' },
                ].map((s,i) => (
                  <div key={i} style={{ background:'#f8fafc', borderRadius:10, padding:'12px 14px' }}>
                    <div style={{ fontSize:18, marginBottom:4 }}>{s.icon}</div>
                    <div style={{ fontWeight:800, fontSize:15, color:'#0f172a' }}>{s.value}</div>
                    <div style={{ fontSize:10, color:'#64748b' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Contact */}
              <div>
                <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', marginBottom:8 }}>CONTACT INFO</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {[
                    { icon: Mail, label: selected.email },
                    { icon: Phone, label: selected.phone },
                    { icon: MapPin, label: selected.location },
                  ].map((row, i) => (
                    <div key={i} style={{ display:'flex', gap:10, alignItems:'center', background:'#f8fafc', padding:'10px 12px', borderRadius:9 }}>
                      <row.icon size={13} color="#64748b" />
                      <span style={{ fontSize:12, color:'#374151' }}>{row.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Orders */}
              <div>
                <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', marginBottom:8 }}>RECENT ORDERS</div>
                <div style={{ background:'#f8fafc', borderRadius:10, padding:'12px 14px' }}>
                  <div style={{ fontSize:12, color:'#374151' }}>Last order: <strong>{selected.lastOrder}</strong></div>
                  <div style={{ fontSize:11, color:'#94a3b8', marginTop:4 }}>{selected.orders} orders total from this customer</div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <button style={{ padding:'10px', borderRadius:9, background:'#2563eb', border:'none', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                  <Mail size={14} /> Send Email
                </button>
                <button style={{ padding:'10px', borderRadius:9, background:'#fff', border:'1px solid #e2e8f0', color:'#374151', fontWeight:600, fontSize:13, cursor:'pointer' }}>
                  View Order History
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
