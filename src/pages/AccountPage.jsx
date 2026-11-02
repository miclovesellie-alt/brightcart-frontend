import { useState, useEffect } from 'react';
import { User, Mail, Lock, LogOut, Package, ShieldAlert, Timer, Phone, Globe } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { isLockedOut } from '../utils/security';
import { useCurrency } from '../context/CurrencyContext';
import AirpodsAnimation from '../components/AirpodsAnimation';

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
  const { user, orders, login, logout, navigate, adminLogin } = useStore();
  const { format } = useCurrency();
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', country: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockCountdown, setLockCountdown] = useState(0);

  // Tick down the lockout countdown every second
  useEffect(() => {
    if (lockCountdown <= 0) return;
    const t = setTimeout(() => setLockCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [lockCountdown]);

  const handleLogin = async e => {
    e.preventDefault();
    if (!form.email || !form.password) { setError('Please fill all fields.'); return; }

    const lock = isLockedOut();
    if (lock.locked) {
      setLockCountdown(lock.secondsLeft);
      setError(`Too many failed attempts. Try again in ${lock.secondsLeft}s.`);
      return;
    }

    setLoading(true);
    setError('');

    const result = await adminLogin(form.email, form.password);
    if (result.success) {
      setLoading(false);
      navigate('admin');
      return;
    }

    if (result.locked) {
      setLockCountdown(result.secondsLeft);
      setError(`Too many failed attempts. Locked for ${result.secondsLeft}s.`);
      setLoading(false);
      return;
    }

    login({ name: form.email.split('@')[0], email: form.email });
    setError('');
    setLoading(false);
  };

  const handleRegister = e => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.phone || !form.country) {
      setError('Please fill all fields.'); return;
    }
    if (form.password.length < 6) { setError('Password must be 6+ characters.'); return; }
    if (!/^\+?[\d\s\-()\\.]{7,20}$/.test(form.phone)) { setError('Please enter a valid phone number.'); return; }
    login({ name: form.name, email: form.email, phone: form.phone, country: form.country });
    setError('');
  };

  const update = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const STATUS_COLORS = { Pending: '#f59e0b', Processing: '#3b82f6', Shipped: '#8b5cf6', Delivered: '#16a34a' };

  // ── Logged-in profile view ──────────────────────────────────────────────────
  if (user) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', paddingTop: '80px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 32px' }}>
          {/* Profile Card */}
          <div className="glass" style={{ borderRadius: '16px', padding: '24px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: '#4f8ef7',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '24px', fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <Package size={20} color="#4f8ef7" />
              <h3 style={{ fontWeight: 700, fontSize: '18px', color: '#fff' }}>Order History</h3>
            </div>

            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📦</div>
                <p style={{ fontWeight: 600, color: '#fff', marginBottom: '4px' }}>No orders yet</p>
                <p style={{ fontSize: '14px', color: '#8892a4', marginBottom: '20px' }}>Start shopping to see your orders here</p>
                <button onClick={() => navigate('products')} className="btn-primary">Shop Now</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {orders.map(order => (
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
                      {order.items.map(item => (
                        <div key={item.product.id} style={{
                          width: '40px', height: '40px',
                          background: '#111118',
                          borderRadius: '8px',
                          overflow: 'hidden',
                        }}>
                          <img src={item.product.image} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} onError={e => { e.target.style.display = 'none'; }} />
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                      <span style={{ color: '#8892a4' }}>{order.items.reduce((s,i) => s+i.qty, 0)} items</span>
                      <span style={{ fontWeight: 700, color: '#4f8ef7' }}>{format(order.total)}</span>
                    </div>
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
          {/* BrightCart branding above modal */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '100px',
              background: 'rgba(79,142,247,0.1)',
              border: '1px solid rgba(79,142,247,0.25)',
              marginBottom: '8px',
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4f8ef7', boxShadow: '0 0 6px #4f8ef7' }} />
              <span style={{ fontSize: '12px', color: '#4f8ef7', fontWeight: 600, letterSpacing: '0.08em' }}>BRIGHTCART STORE</span>
            </div>
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
                    background: tab === t ? '#4f8ef7' : 'transparent',
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
                {tab === 'login' ? 'Sign in to your BrightCart account' : 'Join thousands of happy shoppers'}
              </p>
            </div>

            {error && (
              <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: '14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldAlert size={15} style={{ flexShrink: 0 }} />
                <span>{lockCountdown > 0 ? `Account locked. Try again in ${lockCountdown}s.` : error}</span>
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
                style={{ justifyContent: 'center', marginTop: '8px', opacity: (loading || lockCountdown > 0) ? 0.7 : 1, cursor: (loading || lockCountdown > 0) ? 'not-allowed' : 'pointer' }}
                disabled={loading || lockCountdown > 0}
              >
                {lockCountdown > 0
                  ? <span style={{ display:'flex', alignItems:'center', gap:6 }}><Timer size={14} /> Locked ({lockCountdown}s)</span>
                  : loading ? 'Signing in…'
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
          <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>
            BrightCart.
          </h2>
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
