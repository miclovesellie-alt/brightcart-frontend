import { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { useCurrency } from '../context/CurrencyContext';
import ProductImageGallery from '../components/ProductImageGallery';
import { categoryLabel } from '../utils/productImages';
import { Search, Star } from 'lucide-react';

const CATEGORIES = [
  { label: 'All', value: 'all' },
  { label: 'Phones', value: 'phones' },
  { label: 'Phone Accessories', value: 'phone-accessories' },
  { label: 'Laptop Accessories', value: 'laptop-accessories' },
  { label: 'Electrical', value: 'electrical' },
];

const SORT_OPTIONS = [
  { label: 'Featured', value: 'featured' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Highest Rated', value: 'rating' },
  { label: 'Most Reviews', value: 'reviews' },
];

function SkeletonCard() {
  return (
    <div className="glass" style={{ borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div className="skeleton" style={{ height: '160px', borderRadius: '8px' }} />
      <div className="skeleton" style={{ height: '16px', width: '60px', borderRadius: '100px' }} />
      <div className="skeleton" style={{ height: '36px', width: '82%' }} />
      <div className="skeleton" style={{ height: '14px', width: '45%' }} />
      <div className="skeleton" style={{ height: '24px', width: '58%' }} />
    </div>
  );
}

function ProductCard({ product, onClick }) {
  const { format } = useCurrency();
  const nameWords = String(product.name || '').trim().split(/\s+/).filter(Boolean);
  const shortName = `${nameWords.slice(0, 4).join(' ')}${nameWords.length > 4 ? '…' : ''}`;
  const rating = Number(product.rating);
  const hasRating = Number.isFinite(rating) && rating > 0;
  const reviews = Number(product.reviews);

  const categoryColors = {
    phones: { bg: 'rgba(79,142,247,0.15)', color: '#4f8ef7' },
    'phone-accessories': { bg: 'rgba(168,85,247,0.15)', color: '#a855f7' },
    'laptop-accessories': { bg: 'rgba(168,85,247,0.15)', color: '#a855f7' },
    electrical: { bg: 'rgba(34,197,94,0.15)', color: '#22c55e' },
  };
  const colors = categoryColors[product.category] || categoryColors.phones;
  return (
    <div
      className="glass"
      role="link"
      tabIndex={0}
      aria-label={`View ${product.name} details`}
      onClick={onClick}
      onKeyDown={event => {
        if (event.key === 'Enter') {
          event.preventDefault();
          onClick?.();
        }
      }}
      style={{
        borderRadius: '16px',
        padding: '16px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        height: '100%',
        boxSizing: 'border-box',
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
      <ProductImageGallery product={product} alt={product.name} className="product-img-wrap" showControls={false} scrollable={false} swipeable={false} style={{ height: '160px', background: '#111118', borderRadius: '8px' }} imageStyle={{ padding: '10px', transition: 'transform 0.4s ease' }} />

      <span style={{
          alignSelf: 'flex-start',
          minHeight: '18px',
          padding: '3px 10px',
          borderRadius: '100px',
          fontSize: '11px',
          fontWeight: 600,
          background: colors.bg,
          color: colors.color,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {categoryLabel(product.category)}
      </span>

      <h3 className="product-card-title" style={{ fontSize: '15px', fontWeight: 600, color: '#fff', lineHeight: 1.35, margin: 0 }}>
        {shortName}
      </h3>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex' }}>
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={12} fill={hasRating && i < Math.floor(rating) ? '#f6c90e' : 'none'} color={hasRating && i < Math.floor(rating) ? '#f6c90e' : '#4a5568'} />
          ))}
        </div>
        <span style={{ fontSize: '12px', color: '#8892a4' }}>
          {hasRating ? rating.toFixed(1) : 'Not rated'}
          {Number.isFinite(reviews) && reviews > 0 ? ` (${reviews})` : ''}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>{format(product.price)}</span>
        {product.originalPrice && (
          <span style={{ fontSize: '13px', color: '#4a5568', textDecoration: 'line-through' }}>{format(product.originalPrice)}</span>
        )}
      </div>

    </div>
  );
}

export default function ProductsPage() {
  const { products, navigate } = useStore();
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(12);
  const categories = [
    ...CATEGORIES,
    ...[...new Set(products.map(product => product.category).filter(Boolean))]
      .filter(value => !CATEGORIES.some(category => category.value === value))
      .map(value => ({ label: categoryLabel(value), value })),
  ];

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

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
    <div style={{ background: '#0a0a0f', minHeight: '100vh', paddingTop: '80px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 32px' }}>

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

          <select
            aria-label="Filter products by category"
            value={activeCategory}
            onChange={event => { setActiveCategory(event.target.value); setVisibleCount(12); }}
            style={{ padding: '9px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '13px', cursor: 'pointer', minWidth: '160px' }}
          >
            {categories.map(cat => <option key={cat.value} value={cat.value} style={{ background: '#111118' }}>{cat.label}</option>)}
          </select>
          <select
            aria-label="Sort products"
            value={sortBy}
            onChange={event => setSortBy(event.target.value)}
            style={{ marginLeft: 'auto', padding: '9px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '13px', cursor: 'pointer', minWidth: '180px' }}
          >
            {SORT_OPTIONS.map(option => <option key={option.value} value={option.value} style={{ background: '#111118' }}>{option.label}</option>)}
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="products-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gridAutoRows: '1fr',
            alignItems: 'stretch',
            gap: '24px',
          }}>
            {[...Array(12)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <>
            {visible.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#8892a4' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                <p style={{ fontSize: '16px' }}>No products found matching your search.</p>
              </div>
            ) : (
              <div className="products-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gridAutoRows: '1fr',
                alignItems: 'stretch',
                gap: '24px',
              }}>
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
