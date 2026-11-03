import { useState } from 'react';
import {
  LayoutDashboard, Package, ShoppingBag, Users, BarChart2,
  Settings, LogOut, Zap, Menu, X, Truck, Bell, Search, Sparkles,
  ChevronRight, Store, UserCheck, ShieldCheck, Shield, Eye,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import CurrencySelector from '../../components/CurrencySelector';
import { isSampleProduct } from '../../utils/catalog';

const ALL_NAV = [
  { label: 'Dashboard',  icon: LayoutDashboard, page: 'admin-dashboard',  badge: null,  roles: ['super_admin','admin','moderator'] },
  { label: 'Orders',     icon: ShoppingBag,     page: 'admin-orders',     badge: null,  roles: ['super_admin','admin','moderator'] },
  { label: 'Products',   icon: Package,         page: 'admin-products',   badge: null,  roles: ['super_admin','admin'] },
  { label: 'AI Dropshipping', icon: Sparkles,    page: 'admin-dropshipping', badge: null, roles: ['super_admin','admin'] },
  { label: 'Suppliers',  icon: Truck,           page: 'admin-suppliers',  badge: null,  roles: ['super_admin'] },
  { label: 'Customers',  icon: Users,           page: 'admin-customers',  badge: null,  roles: ['super_admin','admin','moderator'] },
  { label: 'Analytics',  icon: BarChart2,       page: 'admin-analytics',  badge: null,  roles: ['super_admin','admin'] },
  { label: 'Settings',   icon: Settings,        page: 'admin-settings',   badge: null,  roles: ['super_admin'] },
  { label: 'Team',       icon: UserCheck,       page: 'admin-users',      badge: null,  roles: ['super_admin'] },
];

const ROLE_BADGE = {
  super_admin: { label: 'Super Admin', color: '#a78bfa', bg: '#7c3aed22', icon: ShieldCheck },
  admin:       { label: 'Admin',       color: '#60a5fa', bg: '#2563eb22', icon: Shield },
  moderator:   { label: 'Moderator',   color: '#34d399', bg: '#05966922', icon: Eye },
};

export default function AdminLayout({ children, activePage }) {
  const { navigate, logout, user, orders = [], adminProducts = [] } = useStore();
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const userRole = user?.role || 'moderator';
  const NAV = ALL_NAV.filter(item => item.roles.includes(userRole));
  const roleMeta = ROLE_BADGE[userRole] || ROLE_BADGE.moderator;
  const awaitingPayment = orders.filter(order => order.paymentStatus === 'pending_verification').length;
  const awaitingFulfillment = orders.filter(order => ['pending', 'processing'].includes(String(order.status || '').toLowerCase())).length;
  const lowStock = adminProducts.filter(product => !isSampleProduct(product) && product.status !== 'Draft' && Number(product.stock ?? 0) < 5).length;
  const notifications = [
    ...(awaitingPayment ? [{ text: `${awaitingPayment} order${awaitingPayment === 1 ? '' : 's'} need payment verification`, dot: '#f59e0b' }] : []),
    ...(awaitingFulfillment ? [{ text: `${awaitingFulfillment} order${awaitingFulfillment === 1 ? '' : 's'} awaiting fulfillment`, dot: '#3b82f6' }] : []),
    ...(lowStock ? [{ text: `${lowStock} product${lowStock === 1 ? '' : 's'} below 5 units of stock`, dot: '#ef4444' }] : []),
  ];
  const orderBadge = awaitingPayment + awaitingFulfillment;

  const Sidebar = () => (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#0b1222' }}>
      {/* Logo */}
      <div style={{ padding:'20px 20px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:10, background:'linear-gradient(135deg,#2563eb,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Zap size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight:800, color:'#fff', fontSize:14, letterSpacing:'-0.02em' }}>SHOPPERCART</div>
            <div style={{ fontSize:10, color:'#475569', letterSpacing:'0.06em' }}>ADMIN PANEL</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:'12px 10px', overflowY:'auto' }}>
        <div style={{ fontSize:9, fontWeight:700, color:'#334155', letterSpacing:'0.12em', padding:'0 10px', marginBottom:8 }}>MAIN MENU</div>
        {NAV.map(item => {
          const active = activePage === item.page;
          return (
            <button
              key={item.page}
              onClick={() => { navigate(item.page); setOpen(false); }}
              style={{
                width:'100%', display:'flex', alignItems:'center', gap:10,
                padding:'9px 12px', borderRadius:10, marginBottom:2,
                background: active ? 'rgba(37,99,235,0.18)' : 'transparent',
                color: active ? '#60a5fa' : '#64748b',
                border: active ? '1px solid rgba(37,99,235,0.25)' : '1px solid transparent',
                cursor:'pointer', fontSize:13, fontWeight: active ? 600 : 500,
                transition:'all 0.15s',
              }}
            >
              <item.icon size={16} />
              <span style={{ flex:1, textAlign:'left' }}>{item.label}</span>
              {(item.page === 'admin-orders' ? orderBadge : item.badge) > 0 && (
                <span style={{ fontSize:10, fontWeight:700, background:'#ef4444', color:'#fff', borderRadius:20, padding:'1px 6px' }}>
                  {item.page === 'admin-orders' ? orderBadge : item.badge}
                </span>
              )}
              {active && <ChevronRight size={12} />}
            </button>
          );
        })}
      </nav>

      {/* Store Link + Logout */}
      <div style={{ padding:'10px 10px 16px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
        <button
          onClick={() => navigate('home')}
          style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:10, color:'#94a3b8', background:'transparent', border:'none', cursor:'pointer', fontSize:13, marginBottom:4 }}
        >
          <Store size={16} /> View Store
        </button>
        <button
          style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:10, color:'#f87171', background:'transparent', border:'none', cursor:'pointer', fontSize:13 }}
          onClick={() => { logout(); navigate('home'); }}
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="admin-layout" style={{ display:'flex', width:'100%', maxWidth:'100%', minWidth:0, height:'100vh', overflow:'hidden', background:'#f0f4f8', fontFamily:'Inter,system-ui,sans-serif' }}>
      {/* Desktop Sidebar */}
      <aside style={{ width:210, flexShrink:0, display:'flex', flexDirection:'column', overflowY:'auto' }} className="hidden-mobile">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar */}
      {open && (
        <div style={{ position:'fixed', inset:0, zIndex:100 }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.55)' }} onClick={() => setOpen(false)} />
          <aside style={{ position:'absolute', left:0, top:0, height:'100%', width:'min(220px, 100vw)', overflowY:'auto' }}>
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, overflow:'hidden' }}>
        {/* Top Bar */}
        <header className="admin-topbar" style={{ display:'flex', alignItems:'center', gap:12, padding:'0 20px', height:58, background:'#fff', borderBottom:'1px solid #e2e8f0', flexShrink:0 }}>
          <button className="admin-topbar-hamburger" aria-label={open ? 'Close admin navigation' : 'Open admin navigation'} aria-expanded={open} onClick={() => setOpen(value => !value)} style={{ padding:6, borderRadius:8, background:'#f1f5f9', border:'none', cursor:'pointer', display:'flex', flexShrink:0 }}>
            <Menu size={18} color="#64748b" />
          </button>

          {/* Page title */}
          <div className="admin-topbar-heading">
            <div style={{ fontWeight:700, fontSize:15, color:'#0f172a' }}>
              {ALL_NAV.find(n => n.page === activePage)?.label || 'Admin'}
            </div>
            <div style={{ fontSize:11, color:'#94a3b8' }}>Shoppercart · Dropshipping Dashboard</div>
          </div>

          {/* Search */}
          <div className="admin-topbar-search" style={{ flex:1, maxWidth:360, margin:'0 16px', position:'relative' }}>
            <Search size={14} color="#94a3b8" style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)' }} />
            <input
              placeholder="Search orders, products, customers…"
              style={{ width:'100%', padding:'7px 12px 7px 32px', borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', fontSize:12, color:'#0f172a', outline:'none', boxSizing:'border-box' }}
            />
          </div>

          <div className="admin-topbar-actions" style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
            {/* Currency Selector */}
            <div className="admin-topbar-currency"><CurrencySelector theme="light" /></div>
            {/* Notifications */}
            <div style={{ position:'relative' }}>
              <button
                onClick={() => setNotifOpen(v => !v)}
                style={{ position:'relative', padding:7, borderRadius:8, background:'#f1f5f9', border:'none', cursor:'pointer', display:'flex' }}
              >
                <Bell size={17} color="#64748b" />
                {notifications.length > 0 && <span style={{ position:'absolute', top:4, right:4, width:7, height:7, borderRadius:'50%', background:'#ef4444', border:'2px solid #fff' }} />}
              </button>
              {notifOpen && (
                <div style={{ position:'absolute', right:0, top:44, width:300, background:'#fff', borderRadius:12, border:'1px solid #e2e8f0', boxShadow:'0 8px 30px rgba(0,0,0,0.12)', zIndex:50, overflow:'hidden' }}>
                  <div style={{ padding:'12px 16px', borderBottom:'1px solid #f1f5f9' }}><span style={{ fontWeight:700, fontSize:13, color:'#0f172a' }}>Store alerts</span></div>
                  {notifications.length ? notifications.map((n, i) => (
                    <div key={i} style={{ padding:'10px 16px', borderBottom:'1px solid #f8fafc', display:'flex', gap:10, alignItems:'flex-start' }}>
                      <div style={{ width:7, height:7, borderRadius:'50%', background:n.dot, marginTop:5, flexShrink:0 }} />
                      <div>
                        <div style={{ fontSize:12, color:'#374151', lineHeight:1.4 }}>{n.text}</div>
                      </div>
                    </div>
                  )) : <div style={{ padding:'14px 16px', fontSize:12, color:'#64748b' }}>No payment, fulfillment, or stock alerts.</div>}
                </div>
              )}
            </div>

            {/* Avatar */}
            <div className="admin-topbar-user" style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#2563eb,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:'#fff', fontSize:13 }}>
                {(user?.name || 'A')[0].toUpperCase()}
              </div>
              <div className="admin-topbar-user-copy" style={{ lineHeight:1.2 }}>
                <div style={{ fontSize:12, fontWeight:600, color:'#0f172a' }}>{user?.name || 'Admin'}</div>
                <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <span style={{ fontSize:9, fontWeight:700, padding:'1px 7px', borderRadius:20, background: roleMeta.bg, color: roleMeta.color }}>
                    {roleMeta.label}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="admin-page-content" style={{ flex:1, minWidth:0, overflowY:'auto', padding:'20px' }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .admin-topbar { min-width: 0; gap: 8px !important; padding: 0 10px !important; }
          .admin-topbar-search { display: none !important; }
          .admin-topbar-actions { gap: 6px !important; }
          .admin-topbar-user-copy { display: none !important; }
        }
        @media (max-width: 480px) {
          .admin-topbar-currency { display: none !important; }
        }
        @media (max-width: 340px) {
          .admin-topbar { padding: 0 6px !important; }
          .admin-topbar-heading > div:last-child { display: none; }
        }
      `}</style>
    </div>
  );
}
