import { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useCurrency } from '../context/CurrencyContext';
import ProductImageGallery from '../components/ProductImageGallery';
import { Star, ShoppingCart, Heart, ArrowLeft, Shield, Truck, RefreshCw, Package } from 'lucide-react';

const TECH_SPECS = {
  phones: [
    { label: 'Display', value: '6.7" AMOLED' },
    { label: 'Processor', value: 'Snapdragon 8 Gen 3' },
    { label: 'Camera', value: '200MP Triple' },
    { label: 'Battery', value: '5000mAh' },
  ],
  'phone-accessories': [
    { label: 'Connectivity', value: 'Bluetooth 5.3' },
    { label: 'Battery', value: '36hr total' },
    { label: 'Driver', value: '10mm dynamic' },
    { label: 'Warranty', value: '1 year' },
  ],
  'laptop-accessories': [
    { label: 'Interface', value: 'USB-C 3.2' },
    { label: 'Output', value: '4K@60Hz' },
    { label: 'Power', value: '100W PD' },
    { label: 'Ports', value: '12-in-1' },
  ],
  electrical: [
    { label: 'Power', value: '2500W max' },
    { label: 'Surge', value: '1800J protect' },
    { label: 'Outlets', value: '4 AC + 4 USB' },
    { label: 'Warranty', value: '2 years' },
  ],
};

const GUARANTEES = [
  { icon: Shield, label: 'Secure Payment' },
  { icon: Truck, label: 'Fast Shipping' },
  { icon: RefreshCw, label: '30-Day Returns' },
  { icon: Package, label: 'Genuine Products' },
];

export default function ProductDetailPage() {
  const { products, pageParams, navigate, addToCart } = useStore();
  const { format } = useCurrency();
  const product = products.find(p => p.id === pageParams.productId) || products[0];
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  const related = product ? products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4) : [];

  const specs = product ? TECH_SPECS[product.category] || TECH_SPECS.phones : [];
  const discount = product?.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;

  const handleAddToCart = () => {
    addToCart(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (!product) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', background: '#0a0a0f', color: '#8892a4', padding: '100px 20px 40px', textAlign: 'center' }}>
        <h1 style={{ color: '#fff', fontSize: '24px' }}>Product unavailable</h1>
        <p>This product is no longer in the catalog.</p>
        <button onClick={() => navigate('products')} className="btn-primary">Browse Products</button>
      </div>
    );
  }

  return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh', paddingTop: '80px' }}>
      <div className="product-detail-page__content" style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 32px' }}>

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
        <div className="product-detail-layout" style={{
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
              <ProductImageGallery product={product} alt={product.name} style={{ width: '100%', height: 300, flex: '0 0 auto', borderRadius: 10 }} imageStyle={{ padding: 0 }} />
            </div>

            {/* Guarantees */}
            <div className="product-detail-guarantees" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
            }}>
              {GUARANTEES.map(({ icon: Icon, label }) => (
                <div key={label} className="glass" style={{
                  borderRadius: '10px',
                  padding: '12px 8px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <Icon size={16} color="#4f8ef7" />
                  <span style={{ fontSize: '11px', color: '#8892a4', fontWeight: 500 }}>{label}</span>
                </div>
              ))}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex' }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill={i < Math.floor(product.rating) ? '#f6c90e' : 'none'} color={i < Math.floor(product.rating) ? '#f6c90e' : '#4a5568'} />
                ))}
              </div>
              <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>{product.rating}</span>
              <span style={{ color: '#4a5568', fontSize: '14px' }}>({product.reviews} reviews)</span>
            </div>

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '36px', fontWeight: 900, color: '#fff' }}>{format(product.price)}</span>
              {product.originalPrice && (
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
            <p style={{ fontSize: '15px', color: '#8892a4', lineHeight: 1.8 }}>
              {product.description}
            </p>

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
            <div className="product-detail-actions" style={{ display: 'flex', gap: '12px' }}>
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

        {/* Tech Specs */}
        <div style={{ marginBottom: '80px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '24px' }}>Tech Specifications</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
          }}>
            {specs.map((spec) => (
              <div key={spec.label} className="glass" style={{ borderRadius: '12px', padding: '20px' }}>
                <div style={{ fontSize: '12px', color: '#4a5568', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>{spec.label}</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>{spec.value}</div>
              </div>
            ))}
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
                    <ProductImageGallery product={p} alt={p.name} showControls={false} style={{ width: '100%', height: '100%' }} imageStyle={{ padding: 4 }} />
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
