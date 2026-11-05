import { useState } from 'react';
import {
  LayoutDashboard, Package, ShoppingBag, Users, BarChart2,
  Settings, LogOut, Menu, Truck, Search, Sparkles,
  ChevronRight, Store, UserCheck, ShieldCheck, Shield, Eye, Star,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import CurrencySelector from '../../components/CurrencySelector';
import PageBackButton from '../../components/PageBackButton';
import BrandLogo from '../../components/BrandLogo';
import NotificationBell from '../../components/NotificationBell';
import { isSampleProduct } from '../../utils/catalog';
import './admin-theme.css';

const ALL_NAV = [
  { label: 'Dashboard',  icon: LayoutDashboard, page: 'admin-dashboard',  badge: null,  roles: ['super_admin','admin','moderator'] },
  { label: 'Orders',     icon: ShoppingBag,     page: 'admin-orders',     badge: null,  roles: ['super_admin','admin','moderator'] },
  { label: 'Products',   icon: Package,         page: 'admin-products',   badge: null,  roles: ['super_admin','admin'] },
  { label: 'Reviews',    icon: Star,             page: 'admin-reviews',    badge: null,  roles: ['super_admin','admin','moderator'] },
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
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const userRole = user?.role || 'moderator';
  const NAV = ALL_NAV.filter(item => item.roles.includes(userRole));
  const roleMeta = ROLE_BADGE[userRole] || ROLE_BADGE.moderator;
  const awaitingPayment = orders.filter(order => order.paymentStatus === 'pending_verification').length;
  const awaitingFulfillment = orders.filter(order => ['pending', 'processing'].includes(String(order.status || '').toLowerCase())).length;
  const lowStock = adminProducts.filter(product => !isSampleProduct(product) && product.status !== 'Draft' && Number(product.stock ?? 0) < 5).length;
  const storeAlerts = [
    ...(awaitingPayment ? [{ text: `${awaitingPayment} order${awaitingPayment === 1 ? '' : 's'} need payment verification`, dot: '#f59e0b', page: 'admin-orders', params: { queue: 'payment' } }] : []),
    ...(awaitingFulfillment ? [{ text: `${awaitingFulfillment} order${awaitingFulfillment === 1 ? '' : 's'} awaiting fulfillment`, dot: '#3b82f6', page: 'admin-orders', params: { queue: 'process' } }] : []),
    ...(lowStock ? [{ text: `${lowStock} product${lowStock === 1 ? '' : 's'} below 5 units of stock`, dot: '#ef4444', page: 'admin-products', params: { stock: 'low' } }] : []),
  ];
  const orderBadge = awaitingPayment + awaitingFulfillment;
  const normalizedSearch = search.trim().toLowerCase();
  const canSearchProducts = NAV.some(item => item.page === 'admin-products');
  const searchResults = normalizedSearch ? [
    ...(canSearchProducts ? adminProducts.filter(product => !isSampleProduct(product)
      && `${product.name || ''} ${product.sku || ''} ${String(product.category || '').replace(/[-_]/g, ' ')}`.toLowerCase().includes(normalizedSearch))
      .slice(0, 4).map(product => ({ page: 'admin-products', label: product.name, detail: `Product · ${product.sku || product.category || 'Catalog'}` })) : []),
    ...orders.filter(order => `${order.id || ''} ${order.customer || ''} ${order.email || ''} ${order.phone || ''}`.toLowerCase().includes(normalizedSearch))
      .slice(0, 4).map(order => ({ page: 'admin-orders', label: order.id || 'Order', detail: `${order.customer || 'Customer'} · ${order.status || 'Pending'}` })),
    ...orders.filter(order => `${order.customer || ''} ${order.email || ''} ${order.phone || ''}`.toLowerCase().includes(normalizedSearch))
      .filter((order, index, list) => list.findIndex(item => String(item.email || item.customer).toLowerCase() === String(order.email || order.customer).toLowerCase()) === index)
      .slice(0, 3).map(order => ({ page: 'admin-customers', label: order.customer || order.email || 'Customer', detail: `Customer · ${order.email || order.phone || 'Order contact'}` })),
  ].slice(0, 8) : [];
  const goToSearchResult = result => {
    navigate(result.page, { search: search.trim() });
    setSearchOpen(false);
    setOpen(false);
  };

  const renderSidebar = () => (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#0a0a0f' }}>
      {/* Logo */}
      <div style={{ padding:'20px 20px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-start', gap:3 }}>
          <BrandLogo width={104} height={70} />
          <div style={{ fontSize:10, color:'#475569', letterSpacing:'0.06em' }}>ADMIN PANEL</div>
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
                background: active ? 'rgba(249,115,22,0.18)' : 'transparent',
                color: active ? '#fb923c' : '#64748b',
                border: active ? '1px solid rgba(249,115,22,0.28)' : '1px solid transparent',
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
    <div className="admin-layout" style={{ display:'flex', width:'100%', maxWidth:'100%', minWidth:0, height:'100vh', overflow:'hidden', background:'#0a0a0f', fontFamily:'Inter,system-ui,sans-serif' }}>
      {/* Desktop Sidebar */}
      <aside style={{ width:210, flexShrink:0, display:'flex', flexDirection:'column', overflowY:'auto' }} className="hidden-mobile">
        {renderSidebar()}
      </aside>

      {/* Mobile Sidebar */}
      {open && (
        <div style={{ position:'fixed', inset:0, zIndex:100 }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.55)' }} onClick={() => setOpen(false)} />
          <aside style={{ position:'absolute', left:0, top:0, height:'100%', width:'min(220px, 100vw)', overflowY:'auto' }}>
            {renderSidebar()}
          </aside>
        </div>
      )}

      {/* Main */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, overflow:'hidden' }}>
        {/* Top Bar */}
        <header className="admin-topbar" style={{ display:'flex', alignItems:'center', gap:12, padding:'0 20px', height:58, background:'#0a0a0f', borderBottom:'1px solid rgba(255,255,255,.08)', flexShrink:0 }}>
          <button className="admin-topbar-hamburger" aria-label={open ? 'Close admin navigation' : 'Open admin navigation'} aria-expanded={open} onClick={() => setOpen(value => !value)} style={{ padding:6, borderRadius:8, background:'#f1f5f9', border:'none', cursor:'pointer', display:'flex', flexShrink:0 }}>
            <Menu size={18} color="#64748b" />
          </button>
          <PageBackButton className="admin-topbar-back" />

          {/* Page title */}
          <div className="admin-topbar-heading">
            <div style={{ fontWeight:700, fontSize:15, color:'#f8fafc' }}>
              {ALL_NAV.find(n => n.page === activePage)?.label || 'Admin'}
            </div>
            <div style={{ fontSize:11, color:'#8892a4' }}>Store administration</div>
          </div>

          {/* Search */}
          <div className="admin-topbar-search" style={{ flex:1, maxWidth:360, margin:'0 16px', position:'relative' }}>
            <Search size={14} color="#94a3b8" style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)' }} />
            <input
              value={search}
              onFocus={() => setSearchOpen(true)}
              onChange={event => { setSearch(event.target.value); setSearchOpen(true); }}
              onKeyDown={event => {
                if (event.key === 'Escape') setSearchOpen(false);
                if (event.key === 'Enter' && searchResults[0]) goToSearchResult(searchResults[0]);
              }}
              placeholder="Search orders, products, customers…"
              style={{ width:'100%', padding:'7px 12px 7px 32px', borderRadius:8, border:'1px solid rgba(255,255,255,.1)', background:'rgba(255,255,255,.04)', fontSize:12, color:'#f8fafc', outline:'none', boxSizing:'border-box' }}
            />
            {searchOpen && normalizedSearch && <div className="admin-search-results" role="listbox">
              {searchResults.length ? searchResults.map((result, index) => <button key={`${result.page}-${result.label}-${index}`} type="button" role="option" aria-selected="false" onMouseDown={event => event.preventDefault()} onClick={() => goToSearchResult(result)}>
                <span>{result.label}</span><small>{result.detail}</small>
              </button>) : <div className="admin-search-empty">No matching products, orders, or customers.</div>}
            </div>}
          </div>

          <div className="admin-topbar-actions" style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
            {/* Currency Selector */}
            <div className="admin-topbar-currency"><CurrencySelector theme="dark" /></div>
            <NotificationBell className="admin" extraNotifications={storeAlerts} />

            {/* Avatar */}
            <div className="admin-topbar-user" style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#f97316,#c2410c)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:'#fff', fontSize:13 }}>
                {(user?.name || 'A')[0].toUpperCase()}
              </div>
              <div className="admin-topbar-user-copy" style={{ lineHeight:1.2 }}>
                <div style={{ fontSize:12, fontWeight:600, color:'#f8fafc' }}>{user?.name || 'Admin'}</div>
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
        <main className="admin-page-content" style={{ flex:1, minWidth:0, overflowY:'auto', padding:'20px', background:'#0a0a0f' }}>
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
