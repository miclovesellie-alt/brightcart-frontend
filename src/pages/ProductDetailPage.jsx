import { useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../utils/api';
import ProductImageGallery from '../components/ProductImageGallery';
import { categoryLabel, categorySlug } from '../utils/productImages';
import { Star, ShoppingCart, Heart, ArrowLeft, Shield, Truck, RefreshCw, Package } from 'lucide-react';

const GUARANTEES = [
  { icon: Shield, label: 'Secure Payment' },
  { icon: Truck, label: 'Fast Shipping' },
  { icon: RefreshCw, label: '30-Day Returns' },
  { icon: Package, label: 'Genuine Products' },
];

export default function ProductDetailPage() {
  const { products, pageParams, navigate, addToCart, wishlistIds = [], toggleWishlist, user, orders = [] } = useStore();
  const { format } = useCurrency();
  const product = products.find(p => p.id === pageParams.productId) || products[0];
  const colorVariants = Array.isArray(product?.variants)
    ? product.variants.filter(variant => variant && (variant.color || variant.name))
    : [];
  const [selectedColorKey, setSelectedColorKey] = useState('');
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewBody, setReviewBody] = useState('');
  const [reviewOrderId, setReviewOrderId] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const wishlisted = wishlistIds.includes(String(product?.id));
  const variantKey = variant => String(variant?.id || variant?.color || variant?.name || '').trim().toLowerCase();
  const selectedVariant = colorVariants.find(variant => variantKey(variant) === selectedColorKey) || colorVariants[0] || null;
  const currentStock = Number(selectedVariant?.stock ?? product?.stock ?? 0);
  const galleryProduct = selectedVariant ? {
    ...product,
    image: selectedVariant.image || selectedVariant.imageUrl || product.image,
    images: Array.isArray(selectedVariant.images) && selectedVariant.images.length
      ? selectedVariant.images
      : [selectedVariant.image || selectedVariant.imageUrl, ...(product.images || [])].filter(Boolean),
  } : product;

  const productCategory = categorySlug(product?.category);
  const related = product && productCategory ? products
    .filter(p => categorySlug(p.category) === productCategory && String(p.id) !== String(product.id))
    .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || Number(b.rating || 0) - Number(a.rating || 0))
    .slice(0, 4) : [];

  const specs = Array.isArray(product?.specifications)
    ? product.specifications.filter(spec => spec && typeof spec.label === 'string' && typeof spec.value === 'string')
    : [];
  const currentPrice = selectedVariant?.price != null && Number(selectedVariant.price) > 0 ? Number(selectedVariant.price) : Number(product?.price || 0);
  const currentOriginalPrice = selectedVariant?.originalPrice != null ? Number(selectedVariant.originalPrice) : Number(product?.originalPrice || 0);
  const discount = currentOriginalPrice > currentPrice
    ? Math.round((1 - currentPrice / currentOriginalPrice) * 100)
    : null;

  const eligibleReviewOrders = orders.filter(order => order.paymentStatus === 'paid'
    && !['cancelled', 'canceled', 'refunded'].includes(String(order.status || '').toLowerCase())
    && (order.items || []).some(item => Number(item.product?.id ?? item.productId) === Number(product?.id)));

  useEffect(() => {
    if (!product?.id) return undefined;
    let active = true;
    setReviewsLoading(true);
    setReviewSubmitted(false);
    setReviewMessage('');
    api.getProductReviews(product.id)
      .then(result => { if (active) setReviews(Array.isArray(result.data) ? result.data : []); })
      .catch(() => { if (active) setReviews([]); })
      .finally(() => { if (active) setReviewsLoading(false); });
    if (user?.id && user.role === 'customer') {
      api.getAccountReviews(product.id).then(result => {
        if (!active) return;
        const existing = Array.isArray(result.data) ? result.data[0] : null;
        if (existing) {
          setReviewSubmitted(true);
          setReviewMessage(`Your review is ${existing.status} and cannot be submitted again.`);
        }
      }).catch(() => {});
    }
    return () => { active = false; };
  }, [product?.id, user?.id, user?.role]);

  async function submitReview(event) {
    event.preventDefault();
    setReviewSubmitting(true);
    setReviewError('');
    setReviewMessage('');
    try {
      const result = await api.createProductReview(product.id, {
        rating: reviewRating,
        title: reviewTitle,
        body: reviewBody,
        orderId: reviewOrderId || eligibleReviewOrders[0]?.id,
      });
      setReviewSubmitted(true);
      setReviewMessage(result.data?.message || 'Your verified review was sent for approval.');
      setReviewTitle('');
      setReviewBody('');
    } catch (error) {
      setReviewError(error.message || 'Could not submit this review.');
    } finally {
      setReviewSubmitting(false);
    }
  }

  const handleAddToCart = () => {
    addToCart(product, qty, selectedVariant);
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
            <div className="glass product-detail-image-frame" style={{
              borderRadius: '20px',
              padding: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '360px',
              overflow: 'hidden',
            }}>
              <ProductImageGallery product={galleryProduct} alt={product.name} className="product-detail-page__gallery" scrollable={false} swipeable style={{ width: '100%', height: 300, flex: '0 0 auto', borderRadius: 10, overflow: 'hidden' }} imageStyle={{ padding: 0, maxWidth: '86%', maxHeight: '86%' }} />
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
            <h1 className="product-detail-page__title" style={{
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
            <div className="product-detail-page__price" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '36px', fontWeight: 900, color: '#fff' }}>{format(currentPrice)}</span>
                  {currentOriginalPrice > currentPrice && (
                <>
                  <span style={{ fontSize: '20px', color: '#4a5568', textDecoration: 'line-through' }}>{format(currentOriginalPrice)}</span>
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

            {colorVariants.length > 0 && (
              <fieldset className="product-detail-page__colors" style={{ border: 0, padding: 0, margin: 0 }}>
                <legend style={{ color: '#8892a4', fontSize: '14px', fontWeight: 600, marginBottom: 10 }}>
                  Option{selectedVariant?.name || selectedVariant?.color ? `: ${selectedVariant.name || selectedVariant.color}` : ''}
                </legend>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {colorVariants.map(variant => {
                    const key = variantKey(variant);
                    const label = String(variant.name || variant.color);
                    const active = variantKey(selectedVariant) === key;
                    return (
                      <button
                        type="button"
                        key={key}
                        aria-label={`Choose ${label}`}
                        aria-pressed={active}
                        onClick={() => { setSelectedColorKey(key); setQty(1); }}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                          borderRadius: 999, border: `1px solid ${active ? '#f97316' : 'rgba(255,255,255,.14)'}`,
                          background: active ? 'rgba(249,115,22,.14)' : 'rgba(255,255,255,.04)',
                          color: '#fff', cursor: 'pointer', fontSize: 13,
                        }}
                      >
                        <span aria-hidden="true" style={{
                          width: 14, height: 14, borderRadius: '50%', border: '1px solid rgba(255,255,255,.35)',
                          background: variant.hexColor || variant.colorHex || variant.color || '#334155',
                        }} />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}

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
                  onClick={() => setQty(Math.min(currentStock, qty + 1))}
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
              <span style={{ color: '#4a5568', fontSize: '13px' }}>{currentStock} in stock</span>
            </div>

            {/* CTA buttons */}
            <div className="product-detail-actions" style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleAddToCart}
                className="btn-primary"
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  background: added ? 'rgba(34,197,94,0.3)' : '#f97316',
                  boxShadow: added ? 'none' : undefined,
                }}
              >
                <ShoppingCart size={16} />
                {added ? '✓ Added to Cart!' : 'Add to Cart'}
              </button>
              <button
                onClick={() => toggleWishlist(product.id)}
                aria-label={wishlisted ? 'Remove from saved items' : 'Save item for later'}
                title={wishlisted ? 'Remove from saved items' : 'Save item for later'}
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

        {specs.length > 0 && (
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
        )}

        <section aria-labelledby="product-reviews-heading" style={{ marginBottom: '68px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
            <h2 id="product-reviews-heading" style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: 0 }}>Customer reviews</h2>
            <span style={{ color: '#8892a4', fontSize: 13 }}>{reviews.length} verified review{reviews.length === 1 ? '' : 's'}</span>
          </div>
          <div className="glass" style={{ borderRadius: 14, padding: 18, marginBottom: 14 }}>
            {!user ? <p style={{ color: '#aeb8c8', fontSize: 13, margin: 0 }}>Sign in after purchasing this item to leave a verified review. <button onClick={() => navigate('account')} style={{ border: 0, padding: 0, background: 'none', color: '#fb923c', cursor: 'pointer', fontWeight: 700 }}>Sign in</button></p>
              : user.role !== 'customer' ? <p style={{ color: '#8892a4', fontSize: 13, margin: 0 }}>Reviews are submitted by customer accounts after a paid purchase.</p>
                : reviewSubmitted ? <p role="status" style={{ color: '#86efac', fontSize: 13, margin: 0 }}>{reviewMessage}</p>
                  : eligibleReviewOrders.length ? <form onSubmit={submitReview} style={{ display: 'grid', gap: 11 }}>
                    <strong style={{ color: '#fff', fontSize: 14 }}>Share your experience as a verified buyer</strong>
                    <label style={{ display: 'grid', gap: 5, color: '#aeb8c8', fontSize: 12 }}>Purchase
                      <select value={reviewOrderId || eligibleReviewOrders[0].id} onChange={event => setReviewOrderId(event.target.value)} style={{ width: '100%', maxWidth: 420, padding: '9px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,.12)', background: '#111118', color: '#fff' }}>
                        {eligibleReviewOrders.map(order => <option key={order.id} value={order.id}>Order {order.id}</option>)}
                      </select>
                    </label>
                    <div role="radiogroup" aria-label="Review rating" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {[1, 2, 3, 4, 5].map(value => <button key={value} type="button" role="radio" aria-checked={reviewRating === value} aria-label={`${value} star${value === 1 ? '' : 's'}`} onClick={() => setReviewRating(value)} style={{ border: 0, padding: 3, background: 'transparent', cursor: 'pointer' }}><Star size={20} fill={value <= reviewRating ? '#f6c90e' : 'none'} color={value <= reviewRating ? '#f6c90e' : '#4a5568'} /></button>)}
                      <span style={{ color: '#8892a4', fontSize: 12, marginLeft: 6 }}>{reviewRating} out of 5</span>
                    </div>
                    <input required maxLength="100" value={reviewTitle} onChange={event => setReviewTitle(event.target.value)} placeholder="Short review title" style={{ width: '100%', maxWidth: 620, boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.04)', color: '#fff' }} />
                    <textarea required minLength="10" maxLength="1500" rows="4" value={reviewBody} onChange={event => setReviewBody(event.target.value)} placeholder="What should other shoppers know about this item?" style={{ width: '100%', maxWidth: 620, boxSizing: 'border-box', resize: 'vertical', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.04)', color: '#fff', font: 'inherit' }} />
                    <button type="submit" className="btn-primary" disabled={reviewSubmitting} style={{ justifySelf: 'start', background: '#f97316' }}>{reviewSubmitting ? 'Sending review…' : 'Submit review'}</button>
                    <small style={{ color: '#8892a4' }}>A store admin checks reviews before they appear publicly.</small>
                  </form>
                  : <p style={{ color: '#8892a4', fontSize: 13, margin: 0 }}>A verified purchase is required before you can review this item.</p>}
            {reviewError && <p role="alert" style={{ color: '#fca5a5', fontSize: 12, margin: '10px 0 0' }}>{reviewError}</p>}
          </div>
          {reviewsLoading ? <p style={{ color: '#8892a4', fontSize: 13 }}>Loading reviews…</p>
            : reviews.length ? <div style={{ display: 'grid', gap: 10 }}>{reviews.map(review => <article key={review._id || review.id} className="glass" style={{ borderRadius: 12, padding: 15 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}><strong style={{ color: '#fff', fontSize: 14 }}>{review.title}</strong><span aria-label={`${review.rating} out of 5 stars`} style={{ color: '#f6c90e', letterSpacing: 2 }}>{'★'.repeat(Number(review.rating) || 0)}{'☆'.repeat(5 - (Number(review.rating) || 0))}</span></div>
              <p style={{ color: '#aeb8c8', fontSize: 13, lineHeight: 1.65, margin: '8px 0' }}>{review.body}</p>
              <small style={{ color: '#758096' }}>Verified purchase · {review.customerName}{review.createdAt ? ` · ${new Date(review.createdAt).toLocaleDateString()}` : ''}</small>
            </article>)}</div>
              : <p style={{ color: '#8892a4', fontSize: 13 }}>No customer reviews yet.</p>}
        </section>

        {/* Related Products */}
        {related.length > 0 && (
          <section className="product-recommendations" aria-labelledby="product-recommendations-heading">
            <div className="product-recommendations__heading">
              <div>
                <span className="product-recommendations__eyebrow">MORE IN {categoryLabel(product.category)}</span>
                <h2 id="product-recommendations-heading">You may also like</h2>
              </div>
              <button type="button" onClick={() => navigate('products', { category: productCategory })} className="product-recommendations__browse">Browse this category <ArrowLeft size={14} /></button>
            </div>
            <div className="product-recommendations-grid">
              {related.map(item => {
                const rating = Number(item.rating);
                const hasRating = Number.isFinite(rating) && rating > 0;
                const words = String(item.name || '').trim().split(/\s+/).filter(Boolean);
                const shortName = `${words.slice(0, 4).join(' ')}${words.length > 4 ? '…' : ''}`;
                return <button
                  key={item.id}
                  type="button"
                  className="glass product-recommendation-card"
                  onClick={() => navigate('product-detail', { productId: item.id })}
                  aria-label={`View ${item.name} product details`}
                >
                  <ProductImageGallery product={item} alt={item.name} className="product-recommendation-image" showControls={false} scrollable={false} swipeable={false} style={{ width: '100%', height: 150, background: '#111118', borderRadius: 9, overflow: 'hidden' }} imageStyle={{ padding: 8 }} />
                  <span className="product-recommendation-category">{categoryLabel(item.category)}</span>
                  <span className="product-recommendation-title" title={item.name}>{shortName}</span>
                  <span className="product-recommendation-rating"><span aria-hidden="true">{[...Array(5)].map((_, index) => <Star key={index} size={11} fill={hasRating && index < Math.floor(rating) ? '#f6c90e' : 'none'} color={hasRating && index < Math.floor(rating) ? '#f6c90e' : '#4a5568'} />)}</span><small>{hasRating ? rating.toFixed(1) : 'Not rated'}{Number(item.reviews) > 0 ? ` · ${item.reviews} reviews` : ''}</small></span>
                  <span className="product-recommendation-prices"><strong>{format(item.price)}</strong>{item.originalPrice > item.price && <del>{format(item.originalPrice)}</del>}</span>
                </button>;
              })}
            </div>
          </section>
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
