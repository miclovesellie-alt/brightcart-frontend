import { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useCurrency } from '../context/CurrencyContext';
import { Star, ShoppingCart, Heart, ArrowLeft } from 'lucide-react';

export default function ProductDetailPage() {
  const { products, productsLoading, productsError, pageParams, navigate, addToCart } = useStore();
  const { format } = useCurrency();
  const product = products.find(p => String(p.id) === String(pageParams.productId));
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  const related = product ? products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4) : [];

  const discount = product && Number(product.originalPrice) > Number(product.price)
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (!product) {
    return (
      <div style={{ background: '#0a0a0f', minHeight: '70vh', padding: '128px 24px 64px', textAlign: 'center', color: '#fff' }}>
        <p style={{ color: '#aab2bd', marginBottom: 20 }}>
          {productsLoading ? 'Loading product…' : productsError ? 'The catalog is temporarily unavailable.' : 'This product is no longer available.'}
        </p>
        <button onClick={() => navigate('products')} className="btn-primary">Back to products</button>
      </div>
    );
  }

  return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh', paddingTop: '80px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 32px' }}>

        {/* Back button */}
        <button
          onClick={() => navigate('products')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            color: '#8892a4',
            fontSize: '14px',
            cursor: 'pointer',
            marginBottom: '40px',
            padding: 0,
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = '#8892a4'}
        >
          <ArrowLeft size={16} /> Back to Products
        </button>

        {/* Main Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '64px',
          marginBottom: '80px',
        }}>
          {/* LEFT: Image */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass" style={{
              borderRadius: '20px',
              padding: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '360px',
              overflow: 'hidden',
            }}>
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  style={{ display: 'block', width: '100%', maxHeight: '420px', objectFit: 'contain' }}
                  onError={event => { event.currentTarget.style.display = 'none'; }}
                />
              ) : <p style={{ color: '#8892a4', fontSize: 14 }}>No product photo has been added yet.</p>}
            </div>
          </div>

          {/* RIGHT: Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Category badge */}
            <span style={{
              alignSelf: 'flex-start',
              padding: '4px 12px',
              borderRadius: '100px',
              fontSize: '11px',
              fontWeight: 600,
              background: 'rgba(79,142,247,0.15)',
              color: '#4f8ef7',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>
              {product.category.replace('-', ' ')}
            </span>

            {/* Name */}
            <h1 style={{
              fontSize: 'clamp(24px, 3vw, 40px)',
              fontWeight: 800,
              color: '#fff',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}>
              {product.name}
            </h1>

            {/* Rating */}
            {Number(product.reviews) > 0 && Number(product.rating) > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex' }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill={i < Math.floor(product.rating) ? '#f6c90e' : 'none'} color={i < Math.floor(product.rating) ? '#f6c90e' : '#4a5568'} />
                ))}
              </div>
              <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>{product.rating}</span>
              <span style={{ color: '#4a5568', fontSize: '14px' }}>({product.reviews} reviews)</span>
            </div>}

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '36px', fontWeight: 900, color: '#fff' }}>{format(product.price)}</span>
              {Number(product.originalPrice) > Number(product.price) && (
                <>
                  <span style={{ fontSize: '20px', color: '#4a5568', textDecoration: 'line-through' }}>{format(product.originalPrice)}</span>
                  <span style={{
                    padding: '4px 10px',
                    background: 'rgba(34,197,94,0.15)',
                    color: '#22c55e',
                    borderRadius: '100px',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}>
                    -{discount}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            {product.description && <p style={{ fontSize: '15px', color: '#8892a4', lineHeight: 1.8 }}>
              {product.description}
            </p>}

            {/* Quantity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ color: '#8892a4', fontSize: '14px', fontWeight: 500 }}>Quantity</span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                overflow: 'hidden',
              }}>
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  style={{
                    width: '40px',
                    height: '40px',
                    background: 'none',
                    border: 'none',
                    color: '#fff',
                    fontSize: '18px',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  −
                </button>
                <span style={{ width: '50px', textAlign: 'center', color: '#fff', fontWeight: 600 }}>{qty}</span>
                <button
                  onClick={() => setQty(Math.min(product.stock, qty + 1))}
                  style={{
                    width: '40px',
                    height: '40px',
                    background: 'none',
                    border: 'none',
                    color: '#fff',
                    fontSize: '18px',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  +
                </button>
              </div>
              <span style={{ color: '#4a5568', fontSize: '13px' }}>{product.stock} in stock</span>
            </div>

            {/* CTA buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleAddToCart}
                className="btn-primary"
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  background: added ? 'rgba(34,197,94,0.3)' : '#4f8ef7',
                  boxShadow: added ? 'none' : undefined,
                }}
              >
                <ShoppingCart size={16} />
                {added ? '✓ Added to Cart!' : 'Add to Cart'}
              </button>
              <button
                onClick={() => setWishlisted(!wishlisted)}
                style={{
                  padding: '12px 16px',
                  background: wishlisted ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)',
                  border: '1px solid',
                  borderColor: wishlisted ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: wishlisted ? '#ef4444' : 'rgba(255,255,255,0.6)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.3s ease',
                }}
              >
                <Heart size={18} fill={wishlisted ? '#ef4444' : 'none'} />
              </button>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '24px' }}>Related Products</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '20px',
            }}>
              {related.map((p) => (
                <div
                  key={p.id}
                  className="glass"
                  onClick={() => navigate('product-detail', { productId: p.id })}
                  style={{
                    borderRadius: '12px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(79,142,247,0.3)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{
                    width: '64px',
                    height: '64px',
                    background: '#111118',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}>
                    <img
                      src={p.image}
                      alt={p.name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff', lineHeight: 1.3, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#4f8ef7' }}>{format(p.price)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 900px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
