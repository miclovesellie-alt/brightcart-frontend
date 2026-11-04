import { useState } from 'react';
import { User, Mail, Lock, LogOut, Package, ShieldAlert, Phone, Globe } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useCurrency } from '../context/CurrencyContext';
import AirpodsAnimation from '../components/AirpodsAnimation';
import ProductImageGallery from '../components/ProductImageGallery';
import BrandLogo from '../components/BrandLogo';

// ── Input style ───────────────────────────────────────────────────────────────
const inputStyle = {
  width: '100%',
  padding: '10px 14px 10px 36px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '14px',
  outline: 'none',
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function AccountPage() {
  const { user, orders = [], login, register, logout, navigate } = useStore();
  const { format } = useCurrency();
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', country: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderFilter, setOrderFilter] = useState('all');
  const [orderSort, setOrderSort] = useState('newest');
  const handleLogin = async e => {
    e.preventDefault();
    if (!form.email || !form.password) { setError('Please fill all fields.'); return; }
    setLoading(true);
    setError('');
    try {
      const signedIn = await login(form.email, form.password);
      setError('');
      if (['super_admin', 'admin', 'moderator'].includes(signedIn.role)) navigate('admin');
    } catch (err) {
      setError(err.message || 'Unable to sign in. Check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async e => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.phone || !form.country) {
      setError('Please fill all fields.'); return;
    }
    if (form.password.length < 10) { setError('Password must be at least 10 characters.'); return; }
    if (!/^\+?[\d\s\-()\\.]{7,20}$/.test(form.phone)) { setError('Please enter a valid phone number.'); return; }
    setLoading(true);
    setError('');
    try {
      await register({ name: form.name, email: form.email, password: form.password, phone: form.phone, country: form.country });
    } catch (err) {
      setError(err.message || 'Unable to create your account. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const update = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const STATUS_COLORS = { Pending: '#f59e0b', Processing: '#3b82f6', Shipped: '#8b5cf6', Delivered: '#16a34a' };
  const orderStatuses = [...new Set(orders.map(order => String(order.status || 'Pending')))].sort();
  const visibleAccountOrders = orders.filter(order => orderFilter === 'all' || String(order.status || 'Pending') === orderFilter).slice().sort((a, b) => {
    const dateA = new Date(a.createdAt || a.date || 0).getTime();
    const dateB = new Date(b.createdAt || b.date || 0).getTime();
    return orderSort === 'oldest' ? dateA - dateB : dateB - dateA;
  });

  // ── Logged-in profile view ──────────────────────────────────────────────────
  if (user) {
    return (
      <div className="account-page account-page--profile" style={{ minHeight: '100vh', background: '#0a0a0f', paddingTop: '80px' }}>
        <div className="account-page__content" style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 32px' }}>
          <h1 className="account-page__title">My Profile</h1>
          {/* Profile Card */}
          <div className="glass account-page__profile-card" style={{ borderRadius: '16px', padding: '24px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div className="account-page__avatar" style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: '#4f8ef7',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '24px', fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="account-page__profile-copy" style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{user.name}</h2>
              <p style={{ fontSize: '14px', color: '#8892a4' }}>{user.email}</p>
              {(user.phone || user.country) && (
                <p style={{ fontSize: '13px', color: '#6b7a92', marginTop: '2px' }}>
                  {user.phone}{user.phone && user.country ? ' · ' : ''}{user.country}
                </p>
              )}
            </div>
            <button
              onClick={logout}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 16px',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '8px',
                color: '#ef4444',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <LogOut size={15} /> Logout
            </button>
          </div>

          {/* Orders */}
          <div className="glass" style={{ borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Package size={20} color="#4f8ef7" /><h3 style={{ fontWeight: 700, fontSize: '18px', color: '#fff' }}>Order History</h3></div>
              {!!orders.length && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <select aria-label="Filter order history by status" value={orderFilter} onChange={event => setOrderFilter(event.target.value)} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,.12)', background: '#111118', color: '#fff', fontSize: 12 }}><option value="all">All statuses</option>{orderStatuses.map(status => <option key={status} value={status}>{status}</option>)}</select>
                <select aria-label="Sort order history" value={orderSort} onChange={event => setOrderSort(event.target.value)} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,.12)', background: '#111118', color: '#fff', fontSize: 12 }}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select>
              </div>}
            </div>

            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📦</div>
                <p style={{ fontWeight: 600, color: '#fff', marginBottom: '4px' }}>No orders yet</p>
                <p style={{ fontSize: '14px', color: '#8892a4', marginBottom: '20px' }}>Start shopping to see your orders here</p>
                <button onClick={() => navigate('products')} className="btn-primary">Shop Now</button>
              </div>
            ) : !visibleAccountOrders.length ? (
              <div style={{ textAlign: 'center', padding: '36px 0', color: '#8892a4', fontSize: 13 }}>No orders match this status.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {visibleAccountOrders.map(order => (
                  <div key={order.id} style={{
                    borderRadius: '12px',
                    padding: '16px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff', fontFamily: 'monospace' }}>{order.id}</p>
                        <p style={{ fontSize: '12px', color: '#8892a4' }}>{order.date}</p>
                      </div>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '100px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: (STATUS_COLORS[order.status] || '#4f8ef7') + '22',
                        color: STATUS_COLORS[order.status] || '#4f8ef7',
                      }}>
                        {order.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                      {order.items.map((item, index) => (
                        <div key={item.cartKey || `${item.product.id}:${item.variant?.id || item.variant?.color || index}`} className="account-page__order-thumb" style={{
                          width: '40px', height: '40px', minWidth: '40px', minHeight: '40px',
                          background: '#111118',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          flex: '0 0 40px',
                        }}>
                          <ProductImageGallery product={item.product} alt={item.product.name} showControls={false} className="account-page__order-gallery" style={{ width: '40px', height: '40px', maxWidth: '40px', maxHeight: '40px', borderRadius: 8, overflow: 'hidden' }} imageStyle={{ padding: 4 }} />
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12, fontSize: 12, color: '#8892a4' }}>
                      {order.items.map((item, index) => <span key={item.cartKey || `${item.product.id}:${item.variant?.id || item.variant?.color || index}`}>{item.product?.name || 'Product'}{item.variant?.color ? ` · ${item.variant.color}` : ''} × {item.qty || 1}</span>)}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                      <span style={{ color: '#8892a4' }}>{order.items.reduce((s,i) => s+i.qty, 0)} items</span>
                      <span style={{ fontWeight: 700, color: '#4f8ef7' }}>{format(order.total)}</span>
                    </div>
                    {(order.tracking || order.trackingUrl) && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 12, color: '#8892a4' }}><span>{order.tracking ? `Tracking: ${order.tracking}` : 'Tracking information'}</span>{order.trackingUrl && <a href={order.trackingUrl} target="_blank" rel="noreferrer" style={{ color: '#fb923c', fontWeight: 700, textDecoration: 'none' }}>Track shipment</a>}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Login / Register view with GSAP-animated product decorations ─────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse 80% 50% at 50% -10%, #0d1a3a 0%, #0a0a0f 55%)',
      paddingTop: '80px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes bgPulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @media (max-width: 1100px) { .shelf-col-hide-sm { display: none !important; } }
      `}</style>

      {/* Ambient glow orbs — left: blue (AirPods), right: purple (Headphones) */}
      <div style={{
        position: 'absolute', top: '15%', left: '5%',
        width: '320px', height: '320px', borderRadius: '50%',
        background: 'radial-gradient(circle, #4f8ef728 0%, transparent 70%)',
        pointerEvents: 'none',
        animation: 'bgPulse 5s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', top: '20%', right: '4%',
        width: '280px', height: '280px', borderRadius: '50%',
        background: 'radial-gradient(circle, #a78bfa22 0%, transparent 70%)',
        pointerEvents: 'none',
        animation: 'bgPulse 7s ease-in-out 1.5s infinite',
      }} />
      <div style={{
        position: 'absolute', bottom: '8%', left: '50%', transform: 'translateX(-50%)',
        width: '400px', height: '200px', borderRadius: '50%',
        background: 'radial-gradient(ellipse, #1a2a4a30 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Main 3-column layout: airpods | modal | headphones */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '60px',
        padding: '24px 16px 48px',
        minHeight: 'calc(100vh - 80px)',
      }}>

        {/* Left: AirPods animation */}
        <div className="shelf-col-hide-sm" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
          <AirpodsAnimation />
          <div style={{
            fontSize: '11px', color: 'rgba(79,142,247,0.7)',
            fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
            textAlign: 'center',
          }}>
            ProBuds X3 Wireless
          </div>
        </div>

        {/* Center: login/register modal */}
        <div style={{ width: '100%', maxWidth: '420px', flexShrink: 0 }}>
          {/* Store logo above sign-in */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <BrandLogo width={110} height={78} />
          </div>

          <div className="glass" style={{ borderRadius: '20px', padding: '36px' }}>
            {/* Tabs */}
            <div style={{
              display: 'flex',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: '10px',
              padding: '4px',
              marginBottom: '28px',
            }}>
              {['login', 'register'].map(t => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError(''); }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '7px',
                    fontSize: '14px',
                    fontWeight: 600,
                    background: tab === t ? '#f97316' : 'transparent',
                    color: tab === t ? '#fff' : '#8892a4',
                    border: 'none',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: 'rgba(79,142,247,0.15)',
                border: '1px solid rgba(79,142,247,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px',
              }}>
                <User size={22} color="#4f8ef7" />
              </div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>
                {tab === 'login' ? 'Welcome Back' : 'Create Account'}
              </h1>
              <p style={{ fontSize: '13px', color: '#8892a4', marginTop: '4px' }}>
                {tab === 'login' ? 'Sign in to your account' : 'Join thousands of happy shoppers'}
              </p>
            </div>

            {error && (
              <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: '14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldAlert size={15} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={tab === 'login' ? handleLogin : handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {tab === 'register' && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#8892a4', marginBottom: '6px' }}>Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={15} color="#4a5568" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input type="text" name="name" value={form.name} onChange={update} placeholder="John Doe" style={inputStyle}
                      onFocus={e => e.target.style.borderColor = 'rgba(79,142,247,0.5)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                  </div>
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#8892a4', marginBottom: '6px' }}>Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} color="#4a5568" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="email" name="email" value={form.email} onChange={update} placeholder="you@example.com" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'rgba(79,142,247,0.5)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#8892a4', marginBottom: '6px' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} color="#4a5568" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="password" name="password" value={form.password} onChange={update} placeholder="••••••" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'rgba(79,142,247,0.5)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>
              </div>
              {tab === 'register' && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#8892a4', marginBottom: '6px' }}>Phone Number</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={15} color="#4a5568" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input type="tel" name="phone" value={form.phone} onChange={update} placeholder="+1 234 567 8900" style={inputStyle}
                      onFocus={e => e.target.style.borderColor = 'rgba(79,142,247,0.5)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                  </div>
                </div>
              )}
              {tab === 'register' && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#8892a4', marginBottom: '6px' }}>Country</label>
                  <div style={{ position: 'relative' }}>
                    <Globe size={15} color="#4a5568" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <select name="country" value={form.country} onChange={update}
                      style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
                      onFocus={e => e.target.style.borderColor = 'rgba(79,142,247,0.5)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    >
                      <option value="">Select your country</option>
                      <option value="Ghana">Ghana</option>
                      <option value="Nigeria">Nigeria</option>
                      <option value="South Africa">South Africa</option>
                      <option value="Kenya">Kenya</option>
                      <option value="Ethiopia">Ethiopia</option>
                      <option value="Tanzania">Tanzania</option>
                      <option value="Egypt">Egypt</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Canada">Canada</option>
                      <option value="Australia">Australia</option>
                      <option value="Germany">Germany</option>
                      <option value="France">France</option>
                      <option value="Netherlands">Netherlands</option>
                      <option value="UAE">UAE</option>
                      <option value="Saudi Arabia">Saudi Arabia</option>
                      <option value="India">India</option>
                      <option value="China">China</option>
                      <option value="Japan">Japan</option>
                      <option value="Brazil">Brazil</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              )}
              <button
                type="submit"
                className="btn-primary"
                style={{ justifyContent: 'center', marginTop: '8px', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                disabled={loading}
              >
                {loading ? 'Please wait…'
                  : tab === 'login' ? 'Sign In' : 'Create Account'
                }
              </button>
            </form>
          </div>

          {/* Tagline below modal */}
          <p style={{ textAlign: 'center', fontSize: '12px', color: '#4a5568', marginTop: '16px' }}>
            Premium tech · Fast shipping · Secure checkout
          </p>
        </div>

        {/* Right: Clean, simple non-tiled tagline/description */}
        <div 
          className="shelf-col-hide-sm" 
          style={{ 
            maxWidth: '260px',
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center',
            gap: '12px',
          }}
        >
          <BrandLogo width={152} height={104} style={{ alignItems: 'flex-start' }} />
          <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#94a3b8', margin: 0 }}>
            Phones, laptops, accessories, and home tech delivered straight from verified makers.
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
            <span style={{ fontSize: '11px', color: '#60a5fa', background: 'rgba(59,130,246,0.1)', padding: '4px 10px', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.2)' }}>
              Live currency
            </span>
            <span style={{ fontSize: '11px', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '12px' }}>
              Worldwide delivery
            </span>
          </div>
        </div>
      </div>

      {/* Hide shelf columns on smaller screens */}
      <style>{`
        @media (max-width: 1100px) { .shelf-col-hide-sm { display: none !important; } }
      `}</style>
    </div>
  );
}
