import { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { ShoppingCart, User, Menu, X, ChevronDown, Zap } from 'lucide-react';
import CurrencySelector from './CurrencySelector';
import { formatCategory } from '../utils/catalog';

const NAV_LINKS = [
  { label: 'Home', page: 'home' },
  { label: 'Products', page: 'products' },
];

export default function Navbar() {
  const { navigate, cartCount, page, products } = useStore();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const categories = [...new Set(products.map(product => product.category).filter(Boolean))]
    .sort()
    .map(value => ({ value, label: formatCategory(value) }));
  const navLinks = categories.length
    ? [...NAV_LINKS, { label: 'Categories', page: null, dropdown: categories }]
    : NAV_LINKS;

  const handleCategoryNav = (cat) => {
    setDropdownOpen(false);
    setMobileOpen(false);
    navigate('products', { category: cat.value });
  };

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          height: '56px',
          background: scrolled
            ? 'rgba(10,10,15,0.95)'
            : 'rgba(10,10,15,0.7)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: scrolled
            ? '1px solid rgba(255,255,255,0.1)'
            : '1px solid rgba(255,255,255,0.06)',
          transition: 'border-color 0.3s ease, background 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          padding: '0 32px',
          gap: '32px',
        }}
      >
        {/* Logo */}
        <button
          onClick={() => navigate('home')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            flexShrink: 0,
          }}
        >
          <Zap size={18} color="#4f8ef7" fill="#4f8ef7" />
          <span style={{ color: '#fff', fontSize: '18px', fontWeight: 800, letterSpacing: '-0.5px' }}>
            BrightCart
          </span>
          <span style={{
            width: '6px', height: '6px',
            borderRadius: '50%',
            background: '#4f8ef7',
            display: 'inline-block',
            boxShadow: '0 0 8px rgba(79,142,247,0.8)',
          }} />
        </button>

        {/* Center Nav - Desktop */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '4px' }} className="hidden-mobile">
          {navLinks.map((link) => (
            link.dropdown ? (
              <div key={link.label} style={{ position: 'relative' }} ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'color 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                >
                  {link.label}
                  <ChevronDown size={12} />
                </button>
                {dropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginTop: '8px',
                    background: '#111118',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    padding: '8px',
                    minWidth: '180px',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                  }}>
                    {link.dropdown.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => handleCategoryNav(cat)}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '8px 14px',
                          background: 'none',
                          border: 'none',
                          color: 'rgba(255,255,255,0.7)',
                          fontSize: '13px',
                          cursor: 'pointer',
                          borderRadius: '6px',
                          textAlign: 'left',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#fff';
                          e.currentTarget.style.background = 'rgba(79,142,247,0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                          e.currentTarget.style.background = 'none';
                        }}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <button
                key={link.label}
                onClick={() => link.page && navigate(link.page)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: page === link.page ? '#fff' : 'rgba(255,255,255,0.6)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                onMouseLeave={(e) => {
                  if (page !== link.page) e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                }}
              >
                {link.label}
              </button>
            )
          ))}
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
          {/* Currency Selector */}
          <CurrencySelector theme="dark" />
          {/* Cart */}
          <button
            onClick={() => navigate('cart')}
            style={{
              position: 'relative',
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
          >
            <ShoppingCart size={18} />
            {cartCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                background: '#4f8ef7',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 700,
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
              }}>
                {cartCount}
              </span>
            )}
          </button>

          {/* Account */}
          <button
            onClick={() => navigate('account')}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
          >
            <User size={18} />
          </button>

          {/* CTA */}
          <button
            onClick={() => navigate('products')}
            className="hidden-mobile"
            style={{
              background: 'transparent',
              border: '1px solid #4f8ef7',
              color: '#4f8ef7',
              padding: '7px 18px',
              borderRadius: '7px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#4f8ef7';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#4f8ef7';
            }}
          >
            Shop Now
          </button>

          {/* Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="show-mobile"
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              padding: '8px',
              display: 'none',
            }}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div style={{
          position: 'fixed',
          top: '56px',
          right: 0,
          bottom: 0,
          width: '280px',
          background: '#111118',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          zIndex: 999,
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          {NAV_LINKS.map((link) => (
            <button
              key={link.label}
              onClick={() => {
                if (link.page) {
                  navigate(link.page);
                  setMobileOpen(false);
                }
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.8)',
                fontSize: '16px',
                fontWeight: 500,
                cursor: 'pointer',
                padding: '12px 0',
                textAlign: 'left',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                transition: 'color 0.2s',
              }}
            >
              {link.label}
            </button>
          ))}
          {categories.length > 0 && (
            <div style={{ padding: '14px 0 6px', color: '#94a3b8', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Categories
            </div>
          )}
          {categories.map(category => (
            <button
              key={category.value}
              onClick={() => handleCategoryNav(category)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontSize: 14, cursor: 'pointer', padding: '7px 0', textAlign: 'left' }}
            >
              {category.label}
            </button>
          ))}
          <button
            onClick={() => { navigate('products'); setMobileOpen(false); }}
            className="btn-primary"
            style={{ marginTop: '16px' }}
          >
            Shop Now
          </button>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
      `}</style>
    </>
  );
}
