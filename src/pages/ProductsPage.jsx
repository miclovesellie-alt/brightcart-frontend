import { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useCurrency } from '../context/CurrencyContext';
import { Search, Star, ShoppingCart, Filter, ChevronDown } from 'lucide-react';
import { formatCategory } from '../utils/catalog';

const SORT_OPTIONS = [
  { label: 'Featured', value: 'featured' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Highest Rated', value: 'rating' },
  { label: 'Most Reviews', value: 'reviews' },
];

function SkeletonCard() {
  return (
    <div className="glass store-product-card" style={{ borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div className="skeleton store-product-card__image" style={{ height: '200px', borderRadius: '8px' }} />
      <div className="skeleton" style={{ height: '16px', width: '60px', borderRadius: '100px' }} />
      <div className="skeleton" style={{ height: '18px', width: '80%' }} />
      <div className="skeleton" style={{ height: '14px', width: '40%' }} />
      <div className="skeleton" style={{ height: '24px', width: '50%' }} />
      <div className="skeleton" style={{ height: '40px' }} />
    </div>
  );
}

function ProductCard({ product, onClick }) {
  const { addToCart } = useStore();
  const [added, setAdded] = useState(false);

  const categoryColors = {
    phones: { bg: 'rgba(79,142,247,0.15)', color: '#4f8ef7' },
    'phone-accessories': { bg: 'rgba(168,85,247,0.15)', color: '#a855f7' },
    'laptop-accessories': { bg: 'rgba(168,85,247,0.15)', color: '#a855f7' },
    electrical: { bg: 'rgba(34,197,94,0.15)', color: '#22c55e' },
  };
  const colors = categoryColors[product.category] || categoryColors.phones;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div
      className="glass store-product-card"
      onClick={onClick}
      style={{
        borderRadius: '16px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(79,142,247,0.3)';
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div className="product-img-wrap store-product-card__image" style={{ background: '#111118', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {product.image && <img
          src={product.image}
          alt={product.name}
          style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '12px', transition: 'transform 0.4s ease' }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />}
      </div>

      {product.tag && (
        <span style={{
          alignSelf: 'flex-start',
          padding: '3px 10px',
          borderRadius: '100px',
          fontSize: '11px',
          fontWeight: 600,
          background: colors.bg,
          color: colors.color,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          {product.tag}
        </span>
      )}

      <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', lineHeight: 1.4 }}>{product.name}</h3>

      {Number(product.reviews) > 0 && Number(product.rating) > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ display: 'flex' }}>
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={12} fill={i < Math.floor(product.rating) ? '#f6c90e' : 'none'} color={i < Math.floor(product.rating) ? '#f6c90e' : '#4a5568'} />
            ))}
          </div>
          <span style={{ fontSize: '12px', color: '#8892a4' }}>({product.reviews})</span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>{format(product.price)}</span>
        {Number(product.originalPrice) > Number(product.price) && (
          <span style={{ fontSize: '13px', color: '#4a5568', textDecoration: 'line-through' }}>{format(product.originalPrice)}</span>
        )}
      </div>

      <button
        onClick={handleAddToCart}
        style={{
          width: '100%',
          padding: '10px',
          background: added ? 'rgba(34,197,94,0.2)' : '#4f8ef7',
          border: 'none',
          borderRadius: '8px',
          color: '#fff',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          if (!added) {
            e.currentTarget.style.background = '#3d7ef5';
            e.currentTarget.style.boxShadow = '0 0 25px rgba(79,142,247,0.4)';
          }
        }}
        onMouseLeave={(e) => {
          if (!added) {
            e.currentTarget.style.background = '#4f8ef7';
            e.currentTarget.style.boxShadow = 'none';
          }
        }}
      >
        <ShoppingCart size={14} />
        {added ? '✓ Added!' : 'Add to Cart'}
      </button>
    </div>
  );
}

export default function ProductsPage() {
  const { products, productsLoading, productsError, pageParams, navigate } = useStore();
  const { format } = useCurrency();
  const [activeCategory, setActiveCategory] = useState(pageParams.category || 'all');
  const [sortBy, setSortBy] = useState('featured');
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(12);
  const [sortOpen, setSortOpen] = useState(false);

  const categories = [
    { label: 'All', value: 'all' },
    ...[...new Set(products.map(product => product.category).filter(Boolean))]
      .sort()
      .map(category => ({ label: formatCategory(category), value: category })),
  ];

  const filtered = products
    .filter(p => {
      const matchCat = activeCategory === 'all' || p.category === activeCategory;
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-asc': return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        case 'rating': return b.rating - a.rating;
        case 'reviews': return b.reviews - a.reviews;
        default: return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      }
    });

  const visible = filtered.slice(0, visibleCount);

  return (
    <div className="products-page" style={{ background: '#0a0a0f', minHeight: '100vh', paddingTop: '80px' }}>
      <div className="products-page__content" style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 32px' }}>

        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: '8px' }}>
            All Products
          </h1>
          <p style={{ color: '#8892a4', fontSize: '15px' }}>
            {filtered.length} products found
          </p>
        </div>

        {/* Filter Bar */}
        <div style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: '40px',
          padding: '16px 20px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '12px',
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <Search size={15} color="#4a5568" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              style={{
                width: '100%',
                padding: '9px 14px 9px 36px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '13px',
                outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(79,142,247,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
          </div>

          {/* Category Pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button
                key={cat.value}
                onClick={() => { setActiveCategory(cat.value); setVisibleCount(12); }}
                style={{
                  padding: '7px 14px',
                  borderRadius: '100px',
                  border: '1px solid',
                  borderColor: activeCategory === cat.value ? '#4f8ef7' : 'rgba(255,255,255,0.1)',
                  background: activeCategory === cat.value ? 'rgba(79,142,247,0.15)' : 'transparent',
                  color: activeCategory === cat.value ? '#4f8ef7' : 'rgba(255,255,255,0.6)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div style={{ position: 'relative', marginLeft: 'auto' }}>
            <button
              onClick={() => setSortOpen(!sortOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 14px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: 'rgba(255,255,255,0.7)',
                fontSize: '13px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <Filter size={13} />
              {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
              <ChevronDown size={12} />
            </button>
            {sortOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                background: '#111118',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                padding: '8px',
                minWidth: '200px',
                zIndex: 100,
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              }}>
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setSortBy(opt.value); setSortOpen(false); }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '9px 14px',
                      background: sortBy === opt.value ? 'rgba(79,142,247,0.1)' : 'none',
                      border: 'none',
                      color: sortBy === opt.value ? '#4f8ef7' : 'rgba(255,255,255,0.7)',
                      fontSize: '13px',
                      cursor: 'pointer',
                      borderRadius: '6px',
                      textAlign: 'left',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Grid */}
        {productsLoading ? (
          <div className="store-product-grid" aria-busy="true">{[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}</div>
        ) : (
          <>
            {visible.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#8892a4' }}>
                <p style={{ fontSize: '16px' }}>
                  {productsError
                    ? 'The catalog is temporarily unavailable. Please try again shortly.'
                    : search || activeCategory !== 'all'
                      ? 'No products match these filters.'
                      : 'New products will appear here when they’re added to the store.'}
                </p>
              </div>
            ) : (
              <div className="store-product-grid">
                {visible.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => navigate('product-detail', { productId: product.id })}
                  />
                ))}
              </div>
            )}

            {/* Load More */}
            {visibleCount < filtered.length && (
              <div style={{ textAlign: 'center', marginTop: '48px' }}>
                <button
                  onClick={() => setVisibleCount(prev => prev + 12)}
                  className="btn-ghost"
                >
                  Load More ({filtered.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
