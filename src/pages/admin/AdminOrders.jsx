import { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Search, X, Truck, Copy, CheckCheck, ChevronDown } from 'lucide-react';

const STATUSES = ['All','Pending','Processing','Shipped','Delivered','Cancelled'];
const STATUS_COLORS = {
  Pending:   { bg:'#fffbeb', text:'#d97706', dot:'#f59e0b' },
  Processing:{ bg:'#eff6ff', text:'#2563eb', dot:'#3b82f6' },
  Shipped:   { bg:'#f5f3ff', text:'#7c3aed', dot:'#8b5cf6' },
  Delivered: { bg:'#f0fdf4', text:'#16a34a', dot:'#22c55e' },
  Cancelled: { bg:'#fef2f2', text:'#dc2626', dot:'#ef4444' },
};

const MOCK_ORDERS = [
  { id:'ORD-8821', customer:'Alice Johnson', email:'alice@mail.com', date:'Nov 1, 2026', items:[{product:{name:'BrightPhone Pro 15',image:'📱'},qty:1,price:899}], total:899,  status:'Delivered', supplier:'AliExpress',   tracking:'DHL-928374652' },
  { id:'ORD-8820', customer:'Bob Smith',     email:'bob@mail.com',   date:'Nov 1, 2026', items:[{product:{name:'ProBuds X3',image:'🎧'},qty:2,price:129}],     total:258,  status:'Shipped',   supplier:'CJ Dropshipping', tracking:'USPS-87263541' },
  { id:'ORD-8819', customer:'Carol Davis',   email:'carol@mail.com', date:'Oct 31, 2026',items:[{product:{name:'UltraHub Pro',image:'💻'},qty:1,price:89}],     total:89,   status:'Processing', supplier:'Spocket',       tracking:'' },
  { id:'ORD-8818', customer:'Dan Brown',     email:'dan@mail.com',   date:'Oct 31, 2026',items:[{product:{name:'TurboCharge 65W',image:'🔋'},qty:3,price:49}],  total:147,  status:'Pending',   supplier:'AliExpress',   tracking:'' },
  { id:'ORD-8817', customer:'Eva Martinez',  email:'eva@mail.com',   date:'Oct 30, 2026',items:[{product:{name:'LunaX Flip',image:'📱'},qty:1,price:1099}],     total:1099, status:'Delivered', supplier:'Zendrop',       tracking:'FX-2736451' },
  { id:'ORD-8816', customer:'Frank Lee',     email:'frank@mail.com', date:'Oct 30, 2026',items:[{product:{name:'Studio Pro Max',image:'🎧'},qty:1,price:349}],  total:349,  status:'Shipped',   supplier:'CJ Dropshipping', tracking:'USPS-77261340' },
  { id:'ORD-8815', customer:'Grace Chen',    email:'grace@mail.com', date:'Oct 29, 2026',items:[{product:{name:'MechKey Pro',image:'⌨️'},qty:1,price:159}],     total:159,  status:'Cancelled', supplier:'AliExpress',   tracking:'' },
];

const NEXT_STATUS = { Pending:'Processing', Processing:'Shipped', Shipped:'Delivered' };

export default function AdminOrders() {
  const { orders } = useStore();
  const [filter, setFilter]   = useState('All');
  const [search, setSearch]   = useState('');
  const [selected, setSelected] = useState(null);
  const [mockOrders, setMockOrders] = useState(MOCK_ORDERS);
  const [copied, setCopied]   = useState('');

  const allOrders = [...orders, ...mockOrders];
  const filtered  = allOrders.filter(o =>
    (filter === 'All' || o.status === filter) &&
    (o.customer?.toLowerCase().includes(search.toLowerCase()) || o.id?.toLowerCase().includes(search.toLowerCase()))
  );

  const advanceStatus = (id) => {
    setMockOrders(prev => prev.map(o => o.id === id ? { ...o, status: NEXT_STATUS[o.status] || o.status } : o));
    if (selected?.id === id) setSelected(s => ({ ...s, status: NEXT_STATUS[s.status] || s.status }));
  };

  const copyTracking = (txt) => {
    navigator.clipboard?.writeText(txt).catch(()=>{});
    setCopied(txt);
    setTimeout(() => setCopied(''), 2000);
  };

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = s === 'All' ? allOrders.length : allOrders.filter(o => o.status === s).length;
    return acc;
  }, {});

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontWeight:800, fontSize:18, color:'#0f172a', margin:0 }}>Orders</h2>
          <p style={{ color:'#64748b', fontSize:12, margin:'2px 0 0' }}>{allOrders.length} total orders · {counts['Pending']} pending fulfillment</p>
        </div>
        <button style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 14px', background:'#fff', color:'#374151', border:'1px solid #e2e8f0', borderRadius:9, fontWeight:600, fontSize:12, cursor:'pointer' }}>
          <Truck size={14} /> Sync with Suppliers
        </button>
      </div>

      {/* Status Tabs + Search */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
          {STATUSES.map(s => {
            const col = STATUS_COLORS[s];
            return (
              <button key={s} onClick={() => setFilter(s)}
                style={{ padding:'6px 13px', borderRadius:20, fontSize:11, fontWeight:700, cursor:'pointer',
                  background: filter===s ? (col?.bg || '#eff6ff') : '#fff',
                  color: filter===s ? (col?.text || '#2563eb') : '#64748b',
                  border: `1px solid ${filter===s ? (col?.dot || '#3b82f6')+'60' : '#e2e8f0'}` }}
              >
                {s} <span style={{ opacity:0.7 }}>({counts[s]})</span>
              </button>
            );
          })}
        </div>
        <div style={{ position:'relative', marginLeft:'auto' }}>
          <Search size={13} color="#94a3b8" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)' }} />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search orders…"
            style={{ padding:'7px 12px 7px 30px', borderRadius:8, border:'1px solid #e2e8f0', fontSize:12, outline:'none', width:200 }} />
        </div>
      </div>

      {/* Table */}
      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e8edf3', overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', fontSize:12, borderCollapse:'collapse', minWidth:750 }}>
            <thead>
              <tr style={{ background:'#f8fafc' }}>
                {['Order ID','Customer','Date','Items','Total','Supplier','Status','Action'].map(h => (
                  <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:10, fontWeight:700, color:'#64748b', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ padding:40, textAlign:'center', color:'#94a3b8' }}>No orders found</td></tr>
              ) : filtered.map(o => {
                const sc = STATUS_COLORS[o.status] || { bg:'#f8fafc', text:'#64748b', dot:'#94a3b8' };
                return (
                  <tr key={o.id} style={{ borderTop:'1px solid #f8fafc' }}>
                    <td style={{ padding:'11px 14px', fontFamily:'monospace', fontSize:11, fontWeight:700, color:'#0f172a' }}>{o.id}</td>
                    <td style={{ padding:'11px 14px' }}>
                      <div style={{ fontWeight:600, color:'#0f172a' }}>{o.customer}</div>
                      <div style={{ fontSize:10, color:'#94a3b8' }}>{o.email || ''}</div>
                    </td>
                    <td style={{ padding:'11px 14px', color:'#64748b', whiteSpace:'nowrap' }}>{o.date}</td>
                    <td style={{ padding:'11px 14px' }}>
                      <div style={{ display:'flex', gap:4 }}>
                        {o.items.slice(0,3).map((it,i) => <span key={i} style={{ fontSize:15 }}>{it.product?.image}</span>)}
                        {o.items.length>3 && <span style={{ fontSize:10, color:'#94a3b8' }}>+{o.items.length-3}</span>}
                      </div>
                      <div style={{ fontSize:10, color:'#94a3b8' }}>{o.items.reduce((s,i)=>s+i.qty,0)} units</div>
                    </td>
                    <td style={{ padding:'11px 14px', fontWeight:800, color:'#0f172a' }}>${o.total?.toFixed(2)}</td>
                    <td style={{ padding:'11px 14px', color:'#64748b' }}>{o.supplier || '—'}</td>
                    <td style={{ padding:'11px 14px' }}>
                      <span style={{ background:sc.bg, color:sc.text, borderRadius:20, padding:'3px 10px', fontWeight:700, fontSize:10, display:'flex', alignItems:'center', gap:4, width:'fit-content' }}>
                        <span style={{ width:5, height:5, borderRadius:'50%', background:sc.dot, display:'inline-block' }} />
                        {o.status}
                      </span>
                    </td>
                    <td style={{ padding:'11px 14px' }}>
                      <div style={{ display:'flex', gap:6 }}>
                        <button onClick={() => setSelected(o)} style={{ padding:'4px 10px', borderRadius:6, background:'#eff6ff', border:'none', color:'#2563eb', fontSize:11, fontWeight:600, cursor:'pointer' }}>View</button>
                        {NEXT_STATUS[o.status] && (
                          <button onClick={() => advanceStatus(o.id)} style={{ padding:'4px 10px', borderRadius:6, background:'#f0fdf4', border:'none', color:'#16a34a', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                            → {NEXT_STATUS[o.status]}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Panel */}
      {selected && (
        <div style={{ position:'fixed', inset:0, zIndex:100, display:'flex', justifyContent:'flex-end' }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)' }} onClick={()=>setSelected(null)} />
          <div style={{ position:'relative', width:'100%', maxWidth:440, background:'#fff', height:'100%', overflowY:'auto', boxShadow:'-8px 0 40px rgba(0,0,0,0.15)' }}>
            <div style={{ padding:'20px 22px', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontWeight:800, fontSize:15, color:'#0f172a' }}>{selected.id}</div>
                <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{selected.date}</div>
              </div>
              <button onClick={()=>setSelected(null)} style={{ background:'#f1f5f9', border:'none', borderRadius:8, padding:8, cursor:'pointer', display:'flex' }}><X size={16} color="#64748b" /></button>
            </div>

            <div style={{ padding:'18px 22px', display:'flex', flexDirection:'column', gap:18 }}>
              {/* Status & advance */}
              <div style={{ background:'#f8fafc', borderRadius:10, padding:'14px 16px' }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', marginBottom:6 }}>ORDER STATUS</div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  {(() => { const sc = STATUS_COLORS[selected.status] || {}; return (
                    <span style={{ background:sc.bg, color:sc.text, borderRadius:20, padding:'4px 14px', fontWeight:700, fontSize:12 }}>{selected.status}</span>
                  ); })()}
                  {NEXT_STATUS[selected.status] && (
                    <button onClick={() => advanceStatus(selected.id)}
                      style={{ padding:'6px 14px', borderRadius:8, background:'#2563eb', border:'none', color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                      <Truck size={12} /> Mark as {NEXT_STATUS[selected.status]}
                    </button>
                  )}
                </div>

                {/* Status timeline */}
                <div style={{ display:'flex', alignItems:'center', gap:0, marginTop:14 }}>
                  {['Pending','Processing','Shipped','Delivered'].map((s, i) => {
                    const STEPS = ['Pending','Processing','Shipped','Delivered'];
                    const curIdx = STEPS.indexOf(selected.status);
                    const done = i <= curIdx;
                    return (
                      <div key={s} style={{ display:'flex', alignItems:'center', flex:1 }}>
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                          <div style={{ width:20, height:20, borderRadius:'50%', background: done ? '#2563eb' : '#e2e8f0', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            {done && <span style={{ color:'#fff', fontSize:10 }}>✓</span>}
                          </div>
                          <span style={{ fontSize:8, color: done ? '#2563eb' : '#94a3b8', fontWeight:600, whiteSpace:'nowrap' }}>{s}</span>
                        </div>
                        {i < 3 && <div style={{ flex:1, height:2, background: i < curIdx ? '#2563eb' : '#e2e8f0', margin:'0 4px', marginBottom:14 }} />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Customer */}
              <div>
                <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', marginBottom:8 }}>CUSTOMER</div>
                <div style={{ background:'#f8fafc', borderRadius:10, padding:'12px 14px' }}>
                  <div style={{ fontWeight:700, color:'#0f172a' }}>{selected.customer}</div>
                  <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{selected.email || 'No email on file'}</div>
                </div>
              </div>

              {/* Tracking */}
              {selected.tracking && (
                <div>
                  <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', marginBottom:8 }}>TRACKING NUMBER</div>
                  <div style={{ background:'#f0fdf4', borderRadius:10, padding:'12px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontFamily:'monospace', fontSize:12, color:'#16a34a', fontWeight:700 }}>{selected.tracking}</span>
                    <button onClick={() => copyTracking(selected.tracking)}
                      style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:4, color: copied===selected.tracking ? '#16a34a' : '#64748b', fontSize:11 }}>
                      {copied===selected.tracking ? <CheckCheck size={13} /> : <Copy size={13} />}
                      {copied===selected.tracking ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}

              {/* Items */}
              <div>
                <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', marginBottom:8 }}>ORDER ITEMS</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {selected.items.map((item, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10, background:'#f8fafc', borderRadius:10, padding:'10px 12px' }}>
                      <span style={{ fontSize:22 }}>{item.product?.image}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:600, color:'#0f172a', fontSize:12 }}>{item.product?.name}</div>
                        <div style={{ fontSize:10, color:'#64748b' }}>Qty: {item.qty}</div>
                      </div>
                      <div style={{ fontWeight:700, color:'#2563eb', fontSize:13 }}>${((item.price||0)*item.qty).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div style={{ background:'#f8fafc', borderRadius:10, padding:'14px 16px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:12, color:'#64748b' }}>
                  <span>Subtotal</span><span>${selected.total?.toFixed(2)}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:12, color:'#64748b' }}>
                  <span>Shipping</span><span style={{ color:'#16a34a' }}>FREE</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', paddingTop:8, borderTop:'1px solid #e2e8f0', fontSize:14, fontWeight:800, color:'#0f172a' }}>
                  <span>Total</span><span>${selected.total?.toFixed(2)}</span>
                </div>
              </div>

              {/* Supplier */}
              <div>
                <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', marginBottom:8 }}>SUPPLIER</div>
                <div style={{ background:'#f8fafc', borderRadius:10, padding:'12px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontWeight:700, color:'#0f172a', fontSize:12 }}>{selected.supplier || 'AliExpress'}</div>
                    <div style={{ fontSize:10, color:'#94a3b8' }}>Auto-fulfill on order</div>
                  </div>
                  <button style={{ padding:'5px 12px', borderRadius:7, background:'#2563eb', color:'#fff', border:'none', fontSize:11, fontWeight:700, cursor:'pointer' }}>
                    Order from Supplier
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
