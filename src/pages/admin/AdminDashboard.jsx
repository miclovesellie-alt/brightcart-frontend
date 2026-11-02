import { useStore } from '../../context/StoreContext';
import { useCurrency } from '../../context/CurrencyContext';
import {
  DollarSign, ShoppingBag, Package, Users, Truck, TrendingUp,
  Clock, CheckCircle, AlertCircle, RefreshCw, ExternalLink
} from 'lucide-react';

const REVENUE_DATA = [
  { day:'Mon', rev:1240, orders:14 },
  { day:'Tue', rev:980,  orders:11 },
  { day:'Wed', rev:1580, orders:18 },
  { day:'Thu', rev:2100, orders:24 },
  { day:'Fri', rev:1760, orders:20 },
  { day:'Sat', rev:2450, orders:28 },
  { day:'Sun', rev:1320, orders:15 },
];

const TOP_PRODUCTS = [
  { name:'ProBuds X3 Wireless Earbuds',  sold:127, rev:16383, margin:42, trend:+18 },
  { name:'TurboCharge 65W GaN Charger',  sold:98,  rev:4802,  margin:55, trend:+9  },
  { name:'UltraHub Pro 12-in-1',         sold:76,  rev:6764,  margin:38, trend:-4  },
  { name:'BrightPhone Pro 15',           sold:52,  rev:46748, margin:22, trend:+31 },
  { name:'LapBag Pro Backpack',          sold:89,  rev:7031,  margin:48, trend:+6  },
];

const SUPPLIER_ALERTS = [
  { supplier:'AliExpress', msg:'5 items need reorder', level:'warn' },
  { supplier:'CJ Dropshipping', msg:'Tracking updated for 8 orders', level:'info' },
  { supplier:'Spocket', msg:'New product catalog available', level:'info' },
  { supplier:'Zendrop', msg:'Shipping delay: 2-3 extra days', level:'error' },
];

const RECENT_ACTIVITY = [
  { icon:'🛒', text:'New order ORD-8821 — Alice Johnson', amt:129, time:'2m ago' },
  { icon:'🚚', text:'ORD-8810 shipped via DHL — tracking added', amt:null, time:'18m ago' },
  { icon:'💰', text:'Payout processed to your account', amt:4820, time:'1h ago' },
  { icon:'⚠️', text:'Low stock alert: TurboCharge 65W (3 units)', amt:null, time:'2h ago' },
  { icon:'🔄', text:'Refund approved for ORD-8799', amt:-49, time:'3h ago' },
  { icon:'📦', text:'Supplier shipped 34 units from CJ Dropshipping', amt:null, time:'5h ago' },
];

const StatusDot = ({ color }) => (
  <span style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', background:color, marginRight:6 }} />
);

export default function AdminDashboard() {
  const { orders, products } = useStore();
  const { format } = useCurrency();
  const maxRev = Math.max(...REVENUE_DATA.map(d => d.rev));
  const recentOrders = orders.slice(0, 6);

  const STATS = [
    {
      label:'Total Revenue', value: format(48293), sub:'+12.4% vs last month',
      icon: DollarSign, color:'#eff6ff', iconColor:'#2563eb', up:true,
    },
    {
      label:'Orders This Month', value: String(orders.length + 247), sub:'12 awaiting fulfillment',
      icon: ShoppingBag, color:'#f0fdf4', iconColor:'#16a34a', up:true,
    },
    {
      label:'Avg Order Value', value: format(96.20), sub:'+8 vs last month',
      icon: TrendingUp, color:'#faf5ff', iconColor:'#7c3aed', up:true,
    },
    {
      label:'Total Customers', value:'583', sub:'+34 new this week',
      icon: Users, color:'#fff7ed', iconColor:'#f59e0b', up:true,
    },
    {
      label:'Products Listed', value: String(products.length), sub:'4 categories',
      icon: Package, color:'#f0fdfa', iconColor:'#0891b2', up:null,
    },
    {
      label:'Supplier Orders', value:'28', sub:'14 in transit today',
      icon: Truck, color:'#fef2f2', iconColor:'#ef4444', up:null,
    },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* Welcome Bar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontWeight:800, fontSize:20, color:'#0f172a', margin:0 }}>Good day, Admin 👋</h2>
          <p style={{ color:'#64748b', fontSize:13, margin:'2px 0 0' }}>Here's what's happening with your store today.</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', color:'#374151', fontSize:12, fontWeight:600, cursor:'pointer' }}>
            <RefreshCw size={13} /> Sync Suppliers
          </button>
          <button style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:8, border:'none', background:'#2563eb', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}>
            + Add Product
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14 }}>
        {STATS.map((s, i) => (
          <div key={i} style={{ background:'#fff', borderRadius:14, border:'1px solid #e8edf3', padding:'16px 18px' }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
              <div style={{ width:38, height:38, borderRadius:10, background:s.color, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <s.icon size={18} color={s.iconColor} />
              </div>
              {s.up !== null && (
                <span style={{ fontSize:10, fontWeight:700, color: s.up ? '#16a34a' : '#ef4444', background: s.up ? '#f0fdf4' : '#fef2f2', padding:'2px 7px', borderRadius:20 }}>
                  {s.up ? 'up' : 'dn'} {s.sub.split('%')[0].replace('+','').replace('-','')}%
                </span>
              )}
            </div>
            <div style={{ fontSize:22, fontWeight:800, color:'#0f172a', letterSpacing:'-0.03em' }}>{s.value}</div>
            <div style={{ fontSize:11, color:'#64748b', marginTop:3 }}>{s.label}</div>
            <div style={{ fontSize:10, color:'#94a3b8', marginTop:1 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Revenue Chart + Supplier Alerts */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:16 }}>
        {/* Chart */}
        <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e8edf3', padding:'18px 20px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <div>
              <div style={{ fontWeight:700, fontSize:14, color:'#0f172a' }}>Revenue Overview</div>
              <div style={{ fontSize:11, color:'#94a3b8' }}>Last 7 days</div>
            </div>
            <div style={{ display:'flex', gap:14 }}>
              <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#64748b' }}>
                <span style={{ width:10, height:10, borderRadius:2, background:'#2563eb', display:'inline-block' }} />Revenue
              </span>
              <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#64748b' }}>
                <span style={{ width:10, height:10, borderRadius:2, background:'#e0e7ff', display:'inline-block' }} />Orders
              </span>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:140 }}>
            {REVENUE_DATA.map((d, i) => (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4, height:'100%', justifyContent:'flex-end' }}>
                <span style={{ fontSize:9, fontWeight:700, color:'#2563eb' }}>{format(d.rev / 1000)}k</span>
                <div style={{ width:'100%', borderRadius:'4px 4px 0 0', background:'linear-gradient(180deg,#2563eb,#93c5fd)', height:`${(d.rev/maxRev)*100}%`, minHeight:4, position:'relative' }}>
                  <div style={{ position:'absolute', bottom:0, left:0, right:0, borderRadius:'4px 4px 0 0', background:'rgba(224,231,255,0.5)', height:`${(d.orders/28)*100}%` }} />
                </div>
                <span style={{ fontSize:9, color:'#94a3b8' }}>{d.day}</span>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:14, paddingTop:14, borderTop:'1px solid #f1f5f9' }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:16, fontWeight:800, color:'#2563eb' }}>{format(11430)}</div>
              <div style={{ fontSize:10, color:'#94a3b8' }}>Week Total</div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:16, fontWeight:800, color:'#0f172a' }}>130</div>
              <div style={{ fontSize:10, color:'#94a3b8' }}>Total Orders</div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:16, fontWeight:800, color:'#16a34a' }}>{format(87.92)}</div>
              <div style={{ fontSize:10, color:'#94a3b8' }}>Avg Order</div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:16, fontWeight:800, color:'#7c3aed' }}>38%</div>
              <div style={{ fontSize:10, color:'#94a3b8' }}>Avg Margin</div>
            </div>
          </div>
        </div>

        {/* Supplier Alerts */}
        <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e8edf3', padding:'18px 20px' }}>
          <div style={{ fontWeight:700, fontSize:14, color:'#0f172a', marginBottom:14 }}>Supplier Alerts</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {SUPPLIER_ALERTS.map((a, i) => {
              const colors = { warn:'#f59e0b', info:'#3b82f6', error:'#ef4444' };
              const bgs    = { warn:'#fffbeb', info:'#eff6ff', error:'#fef2f2' };
              return (
                <div key={i} style={{ padding:'10px 12px', borderRadius:10, background:bgs[a.level], display:'flex', gap:10, alignItems:'flex-start' }}>
                  <div style={{ marginTop:2 }}>
                    {a.level === 'warn'  && <AlertCircle size={14} color={colors[a.level]} />}
                    {a.level === 'info'  && <CheckCircle size={14} color={colors[a.level]} />}
                    {a.level === 'error' && <AlertCircle size={14} color={colors[a.level]} />}
                  </div>
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, color:'#0f172a' }}>{a.supplier}</div>
                    <div style={{ fontSize:11, color:'#64748b', marginTop:1 }}>{a.msg}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Fulfillment Pipeline */}
          <div style={{ marginTop:16, paddingTop:14, borderTop:'1px solid #f1f5f9' }}>
            <div style={{ fontWeight:600, fontSize:12, color:'#0f172a', marginBottom:10 }}>Fulfillment Pipeline</div>
            {[
              { label:'Pending',    count:12, color:'#f59e0b' },
              { label:'Processing', count:8,  color:'#3b82f6' },
              { label:'Shipped',    count:31, color:'#7c3aed' },
              { label:'Delivered',  count:189,color:'#16a34a' },
            ].map((s, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7 }}>
                <StatusDot color={s.color} />
                <span style={{ fontSize:11, color:'#374151', flex:1 }}>{s.label}</span>
                <div style={{ flex:2, height:5, background:'#f1f5f9', borderRadius:99 }}>
                  <div style={{ height:'100%', borderRadius:99, background:s.color, width:`${(s.count/240)*100}%` }} />
                </div>
                <span style={{ fontSize:11, fontWeight:700, color:'#0f172a', minWidth:24 }}>{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products + Activity */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:16 }}>

        {/* Top Products */}
        <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e8edf3', overflow:'hidden' }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontWeight:700, fontSize:14, color:'#0f172a' }}>Top Performing Products</div>
            <span style={{ fontSize:11, color:'#3b82f6', cursor:'pointer', display:'flex', alignItems:'center', gap:3 }}>
              View all <ExternalLink size={10} />
            </span>
          </div>
          <table style={{ width:'100%', fontSize:12, borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#f8fafc' }}>
                {['#','Product','Units Sold','Revenue','Margin','Trend'].map(h => (
                  <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:10, fontWeight:700, color:'#64748b', letterSpacing:'0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TOP_PRODUCTS.map((p, i) => (
                <tr key={i} style={{ borderTop:'1px solid #f8fafc' }}>
                  <td style={{ padding:'10px 14px', fontWeight:700, color:'#94a3b8' }}>{i+1}</td>
                  <td style={{ padding:'10px 14px', fontWeight:600, color:'#0f172a', maxWidth:180 }}>
                    <div style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:180 }}>{p.name}</div>
                  </td>
                  <td style={{ padding:'10px 14px', color:'#374151' }}>{p.sold}</td>
                  <td style={{ padding:'10px 14px', fontWeight:700, color:'#2563eb' }}>{format(p.rev)}</td>
                  <td style={{ padding:'10px 14px' }}>
                    <span style={{ background:'#f0fdf4', color:'#16a34a', borderRadius:6, padding:'2px 8px', fontSize:10, fontWeight:700 }}>{p.margin}%</span>
                  </td>
                  <td style={{ padding:'10px 14px' }}>
                    <span style={{ fontSize:11, fontWeight:700, color: p.trend > 0 ? '#16a34a' : '#ef4444' }}>
                      {p.trend > 0 ? '+' : ''}{p.trend}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Activity Feed */}
        <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e8edf3', padding:'18px 20px' }}>
          <div style={{ fontWeight:700, fontSize:14, color:'#0f172a', marginBottom:14 }}>Recent Activity</div>
          <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
            {RECENT_ACTIVITY.map((a, i) => (
              <div key={i} style={{ display:'flex', gap:10, padding:'9px 0', borderBottom: i < RECENT_ACTIVITY.length-1 ? '1px solid #f8fafc' : 'none' }}>
                <span style={{ fontSize:16, flexShrink:0 }}>{a.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, color:'#374151', lineHeight:1.4 }}>
                    {a.text}{a.amt !== null ? ` — ${format(Math.abs(a.amt))}` : ''}
                  </div>
                  <div style={{ fontSize:10, color:'#94a3b8', marginTop:2, display:'flex', alignItems:'center', gap:4 }}>
                    <Clock size={9} /> {a.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e8edf3', overflow:'hidden' }}>
        <div style={{ padding:'14px 18px', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontWeight:700, fontSize:14, color:'#0f172a' }}>Recent Orders</div>
          <span style={{ fontSize:11, color:'#3b82f6', cursor:'pointer' }}>View all orders</span>
        </div>
        {recentOrders.length === 0 ? (
          <div style={{ padding:40, textAlign:'center', color:'#94a3b8', fontSize:13 }}>No orders yet. Demo data: 247 historical orders.</div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', fontSize:12, borderCollapse:'collapse', minWidth:600 }}>
              <thead>
                <tr style={{ background:'#f8fafc' }}>
                  {['Order ID','Customer','Items','Total','Status','Action'].map(h => (
                    <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:10, fontWeight:700, color:'#64748b', letterSpacing:'0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(o => {
                  const SC = { Pending:'#f59e0b', Processing:'#3b82f6', Shipped:'#7c3aed', Delivered:'#16a34a' };
                  return (
                    <tr key={o.id} style={{ borderTop:'1px solid #f8fafc' }}>
                      <td style={{ padding:'10px 14px', fontFamily:'monospace', fontSize:11, color:'#0f172a' }}>{o.id}</td>
                      <td style={{ padding:'10px 14px', fontWeight:600, color:'#374151' }}>{o.customer}</td>
                      <td style={{ padding:'10px 14px', color:'#64748b' }}>{o.items.reduce((s,i)=>s+i.qty,0)} items</td>
                      <td style={{ padding:'10px 14px', fontWeight:700, color:'#2563eb' }}>{format(o.total)}</td>
                      <td style={{ padding:'10px 14px' }}>
                        <span style={{ background:(SC[o.status]||'#94a3b8')+'18', color:SC[o.status]||'#64748b', borderRadius:20, padding:'2px 10px', fontWeight:700, fontSize:10 }}>{o.status}</span>
                      </td>
                      <td style={{ padding:'10px 14px' }}>
                        <button style={{ fontSize:11, color:'#2563eb', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>View</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
