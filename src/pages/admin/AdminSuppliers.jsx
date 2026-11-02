import { useState } from 'react';
import { Plus, ExternalLink, RefreshCw, Trash2, CheckCircle, AlertCircle, Clock, Package, Truck } from 'lucide-react';

const INITIAL_SUPPLIERS = [
  {
    id:'S1', name:'AliExpress', logo:'🛒', status:'Connected', products:18, pendingOrders:7,
    apiKey:'AE-*****-8821', shippingDays:'7–20', countries:'Worldwide', markup:40, autoFulfill:true,
    lastSync:'2 min ago', tier:'Premium',
  },
  {
    id:'S2', name:'CJ Dropshipping', logo:'📦', status:'Connected', products:9, pendingOrders:4,
    apiKey:'CJ-*****-5544', shippingDays:'5–15', countries:'Worldwide', markup:45, autoFulfill:true,
    lastSync:'12 min ago', tier:'Standard',
  },
  {
    id:'S3', name:'Spocket', logo:'⚡', status:'Connected', products:4, pendingOrders:1,
    apiKey:'SP-*****-3312', shippingDays:'3–7',  countries:'US/EU',    markup:55, autoFulfill:false,
    lastSync:'1 hr ago', tier:'Premium',
  },
  {
    id:'S4', name:'Zendrop', logo:'🌀', status:'Issue', products:3, pendingOrders:2,
    apiKey:'ZD-*****-1190', shippingDays:'4–12', countries:'Worldwide', markup:38, autoFulfill:true,
    lastSync:'3 hr ago', tier:'Standard',
  },
];

const STATUS_STYLE = {
  Connected:{ bg:'#f0fdf4', text:'#16a34a', dot:'#22c55e' },
  Issue:    { bg:'#fef2f2', text:'#dc2626', dot:'#ef4444' },
  Paused:   { bg:'#fffbeb', text:'#d97706', dot:'#f59e0b' },
};

export default function AdminSuppliers() {
  const [suppliers, setSuppliers] = useState(INITIAL_SUPPLIERS);
  const [selected, setSelected]   = useState(null);
  const [showAdd, setShowAdd]      = useState(false);
  const [newForm, setNewForm]      = useState({ name:'', apiKey:'', markup:40, autoFulfill:true });

  const toggleAutoFulfill = (id) =>
    setSuppliers(s => s.map(sup => sup.id===id ? { ...sup, autoFulfill:!sup.autoFulfill } : sup));

  const syncSupplier = (id) => {
    setSuppliers(s => s.map(sup => sup.id===id ? { ...sup, lastSync:'Just now', status:'Connected' } : sup));
  };

  const totalProducts = suppliers.reduce((a,s) => a+s.products, 0);
  const totalPending  = suppliers.reduce((a,s) => a+s.pendingOrders, 0);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontWeight:800, fontSize:18, color:'#0f172a', margin:0 }}>Suppliers</h2>
          <p style={{ color:'#64748b', fontSize:12, margin:'2px 0 0' }}>
            {suppliers.filter(s=>s.status==='Connected').length} connected · {totalProducts} products · {totalPending} orders pending fulfillment
          </p>
        </div>
        <button onClick={() => setShowAdd(true)}
          style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 16px', background:'#2563eb', color:'#fff', border:'none', borderRadius:9, fontWeight:700, fontSize:13, cursor:'pointer' }}>
          <Plus size={14} /> Connect Supplier
        </button>
      </div>

      {/* Quick stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12 }}>
        {[
          { label:'Connected',       value: suppliers.filter(s=>s.status==='Connected').length, icon:'✅', color:'#f0fdf4' },
          { label:'Products Sourced',value: totalProducts,  icon:'📦', color:'#eff6ff' },
          { label:'Pending Orders',  value: totalPending,   icon:'⏳', color:'#fffbeb' },
          { label:'Auto-Fulfill',    value: suppliers.filter(s=>s.autoFulfill).length, icon:'⚡', color:'#faf5ff' },
        ].map((s,i) => (
          <div key={i} style={{ background:'#fff', borderRadius:12, border:'1px solid #e8edf3', padding:'14px 16px' }}>
            <div style={{ fontSize:22, marginBottom:6 }}>{s.icon}</div>
            <div style={{ fontWeight:800, fontSize:20, color:'#0f172a' }}>{s.value}</div>
            <div style={{ fontSize:10, color:'#64748b', marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Supplier Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
        {suppliers.map(sup => {
          const sc = STATUS_STYLE[sup.status] || STATUS_STYLE.Paused;
          return (
            <div key={sup.id} style={{ background:'#fff', borderRadius:14, border:'1px solid #e8edf3', padding:'18px 20px', display:'flex', flexDirection:'column', gap:14 }}>
              {/* Top row */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                  <div style={{ width:42, height:42, borderRadius:11, background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>
                    {sup.logo}
                  </div>
                  <div>
                    <div style={{ fontWeight:800, fontSize:14, color:'#0f172a' }}>{sup.name}</div>
                    <div style={{ fontSize:10, color:'#94a3b8' }}>{sup.tier} · {sup.countries}</div>
                  </div>
                </div>
                <span style={{ background:sc.bg, color:sc.text, borderRadius:20, padding:'3px 10px', fontSize:10, fontWeight:700, display:'flex', alignItems:'center', gap:4 }}>
                  <span style={{ width:5, height:5, borderRadius:'50%', background:sc.dot, display:'inline-block' }} />
                  {sup.status}
                </span>
              </div>

              {/* Stats row */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                {[
                  { label:'Products', value:sup.products,     icon: Package },
                  { label:'Pending',  value:sup.pendingOrders, icon: Clock },
                  { label:'Ship Est', value:sup.shippingDays, icon: Truck },
                ].map((s, i) => (
                  <div key={i} style={{ background:'#f8fafc', borderRadius:8, padding:'8px 10px', textAlign:'center' }}>
                    <div style={{ fontSize:13, fontWeight:800, color:'#0f172a' }}>{s.value}</div>
                    <div style={{ fontSize:9, color:'#94a3b8', marginTop:2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Markup + auto-fulfill */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:10, color:'#94a3b8' }}>Default Markup</div>
                  <div style={{ fontWeight:800, fontSize:15, color:'#16a34a' }}>{sup.markup}%</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:11, color:'#64748b' }}>Auto-Fulfill</span>
                  <div
                    onClick={() => toggleAutoFulfill(sup.id)}
                    style={{
                      width:38, height:20, borderRadius:10, cursor:'pointer',
                      background: sup.autoFulfill ? '#2563eb' : '#e2e8f0',
                      position:'relative', transition:'background 0.2s',
                    }}
                  >
                    <div style={{
                      width:16, height:16, borderRadius:'50%', background:'#fff',
                      position:'absolute', top:2, transition:'left 0.2s',
                      left: sup.autoFulfill ? 20 : 2,
                      boxShadow:'0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  </div>
                </div>
              </div>

              {/* Last sync */}
              <div style={{ fontSize:10, color:'#94a3b8', display:'flex', alignItems:'center', gap:4 }}>
                <Clock size={10} /> Last synced: {sup.lastSync}
              </div>

              {/* Actions */}
              <div style={{ display:'flex', gap:8, paddingTop:4, borderTop:'1px solid #f1f5f9' }}>
                <button onClick={() => syncSupplier(sup.id)}
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:'7px', borderRadius:8, background:'#f1f5f9', border:'none', color:'#374151', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                  <RefreshCw size={11} /> Sync
                </button>
                <button onClick={() => setSelected(sup)}
                  style={{ flex:2, padding:'7px', borderRadius:8, background:'#eff6ff', border:'none', color:'#2563eb', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                  Manage
                </button>
                <button
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:'7px', borderRadius:8, background:'#f8fafc', border:'none', color:'#64748b', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                  <ExternalLink size={11} /> Visit
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Manage Drawer */}
      {selected && (
        <div style={{ position:'fixed', inset:0, zIndex:100, display:'flex', justifyContent:'flex-end' }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)' }} onClick={() => setSelected(null)} />
          <div style={{ position:'relative', width:400, background:'#fff', height:'100%', overflowY:'auto', boxShadow:'-8px 0 40px rgba(0,0,0,0.12)' }}>
            <div style={{ padding:'20px 22px', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                <span style={{ fontSize:24 }}>{selected.logo}</span>
                <div>
                  <div style={{ fontWeight:800, fontSize:15, color:'#0f172a' }}>{selected.name}</div>
                  <div style={{ fontSize:11, color:'#94a3b8' }}>{selected.tier} Plan</div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background:'#f1f5f9', border:'none', borderRadius:8, padding:8, cursor:'pointer' }}>✕</button>
            </div>

            <div style={{ padding:'18px 22px', display:'flex', flexDirection:'column', gap:16 }}>
              {/* API Key */}
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:'#94a3b8', marginBottom:6, display:'block' }}>API KEY</label>
                <div style={{ display:'flex', gap:8 }}>
                  <input defaultValue={selected.apiKey} style={{ flex:1, padding:'8px 12px', borderRadius:8, border:'1px solid #e2e8f0', fontSize:12, fontFamily:'monospace', outline:'none' }} />
                  <button style={{ padding:'8px 12px', borderRadius:8, background:'#2563eb', border:'none', color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer' }}>Save</button>
                </div>
              </div>

              {/* Default Markup */}
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:'#94a3b8', marginBottom:6, display:'block' }}>DEFAULT MARKUP %</label>
                <input type="number" defaultValue={selected.markup} style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'1px solid #e2e8f0', fontSize:13, outline:'none', boxSizing:'border-box' }} />
                <div style={{ fontSize:10, color:'#94a3b8', marginTop:4 }}>Applied automatically to all products from this supplier</div>
              </div>

              {/* Shipping */}
              <div style={{ background:'#f8fafc', borderRadius:10, padding:'12px 14px' }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', marginBottom:8 }}>SHIPPING INFO</div>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                    <span style={{ color:'#64748b' }}>Estimated delivery</span>
                    <span style={{ fontWeight:700, color:'#0f172a' }}>{selected.shippingDays} days</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                    <span style={{ color:'#64748b' }}>Ships to</span>
                    <span style={{ fontWeight:700, color:'#0f172a' }}>{selected.countries}</span>
                  </div>
                </div>
              </div>

              {/* Auto-Fulfill Toggle */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'#f8fafc', borderRadius:10, padding:'12px 14px' }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>Auto-Fulfillment</div>
                  <div style={{ fontSize:10, color:'#94a3b8' }}>Automatically forward orders to supplier</div>
                </div>
                <div onClick={() => { toggleAutoFulfill(selected.id); setSelected(s => ({...s, autoFulfill:!s.autoFulfill})); }}
                  style={{ width:42, height:22, borderRadius:11, cursor:'pointer', background: selected.autoFulfill ? '#2563eb':'#e2e8f0', position:'relative', transition:'background 0.2s' }}>
                  <div style={{ width:18, height:18, borderRadius:'50%', background:'#fff', position:'absolute', top:2, left: selected.autoFulfill ? 22:2, transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
              </div>

              {/* Danger Zone */}
              <div style={{ borderTop:'1px solid #f1f5f9', paddingTop:14 }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#ef4444', marginBottom:8 }}>DANGER ZONE</div>
                <button
                  onClick={() => { setSuppliers(s => s.filter(sup => sup.id !== selected.id)); setSelected(null); }}
                  style={{ width:'100%', padding:'9px', borderRadius:9, background:'#fef2f2', border:'1px solid #fecaca', color:'#ef4444', fontWeight:700, fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                  <Trash2 size={13} /> Disconnect Supplier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {showAdd && (
        <div style={{ position:'fixed', inset:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.45)' }} onClick={() => setShowAdd(false)} />
          <div style={{ position:'relative', background:'#fff', borderRadius:16, width:'100%', maxWidth:440, padding:24, boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h3 style={{ fontWeight:800, fontSize:16, color:'#0f172a', margin:0 }}>Connect New Supplier</h3>
              <button onClick={() => setShowAdd(false)} style={{ background:'#f1f5f9', border:'none', borderRadius:8, padding:8, cursor:'pointer' }}>✕</button>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:'#374151', marginBottom:5, display:'block' }}>SUPPLIER NAME</label>
                <input value={newForm.name} onChange={e => setNewForm(f => ({...f, name:e.target.value}))} placeholder="e.g. Oberlo, DSers…"
                  style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #e2e8f0', fontSize:13, outline:'none', boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:'#374151', marginBottom:5, display:'block' }}>API KEY / STORE URL</label>
                <input value={newForm.apiKey} onChange={e => setNewForm(f => ({...f, apiKey:e.target.value}))} placeholder="Paste your API key…"
                  style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #e2e8f0', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'monospace' }} />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:'#374151', marginBottom:5, display:'block' }}>DEFAULT MARKUP %</label>
                <input type="number" value={newForm.markup} onChange={e => setNewForm(f => ({...f, markup:e.target.value}))}
                  style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #e2e8f0', fontSize:13, outline:'none', boxSizing:'border-box' }} />
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'#f8fafc', borderRadius:9, padding:'10px 14px' }}>
                <span style={{ fontSize:13, fontWeight:600, color:'#374151' }}>Enable Auto-Fulfillment</span>
                <div onClick={() => setNewForm(f => ({...f, autoFulfill:!f.autoFulfill}))}
                  style={{ width:40, height:21, borderRadius:11, cursor:'pointer', background: newForm.autoFulfill ? '#2563eb':'#e2e8f0', position:'relative' }}>
                  <div style={{ width:17, height:17, borderRadius:'50%', background:'#fff', position:'absolute', top:2, left: newForm.autoFulfill ? 21:2, transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
            </div>

            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button onClick={() => setShowAdd(false)} style={{ flex:1, padding:10, borderRadius:9, border:'1px solid #e2e8f0', background:'#fff', color:'#374151', fontWeight:600, fontSize:13, cursor:'pointer' }}>Cancel</button>
              <button onClick={() => {
                if (!newForm.name) return;
                setSuppliers(s => [...s, { id:`S${Date.now()}`, logo:'🏭', status:'Connected', products:0, pendingOrders:0, shippingDays:'7–20', countries:'Worldwide', lastSync:'Just now', tier:'Standard', ...newForm }]);
                setShowAdd(false);
                setNewForm({ name:'', apiKey:'', markup:40, autoFulfill:true });
              }} style={{ flex:2, padding:10, borderRadius:9, border:'none', background:'#2563eb', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer' }}>
                Connect Supplier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
