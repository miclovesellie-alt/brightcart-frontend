import { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useCurrency } from '../context/CurrencyContext';
import { ArrowRight, ShoppingCart, Star } from 'lucide-react';
import { formatCategory } from '../utils/catalog';
import './HomePage.css';

function ProductCard({ product, onClick }) {
  const { addToCart } = useStore();
  const { format } = useCurrency();
  const [added, setAdded] = useState(false);
  const hasReviews = Number(product.reviews) > 0 && Number(product.rating) > 0;
  const originalPrice = Number(product.originalPrice);

  const handleAdd = (event) => {
    event.stopPropagation();
    addToCart(product, 1);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  };

  return (
    <article className="home-product-card">
      <button
        type="button"
        className="home-product-card__media"
        onClick={onClick}
        aria-label={`View ${product.name}`}
      >
        {product.image && (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            onError={(event) => { event.currentTarget.style.display = 'none'; }}
          />
        )}
      </button>
      <div className="home-product-card__details">
        <span className="home-product-card__category">{formatCategory(product.category)}</span>
        <button type="button" className="home-product-card__name" onClick={onClick}>
          {product.name}
        </button>
        {hasReviews && (
          <span className="home-product-card__rating" aria-label={`${product.rating} out of 5 from ${product.reviews} reviews`}>
            <Star size={13} fill="currentColor" /> {Number(product.rating).toFixed(1)} <span>({product.reviews})</span>
          </span>
        )}
        <div className="home-product-card__price-row">
          <strong>{format(product.price)}</strong>
          {originalPrice > Number(product.price) && <del>{format(originalPrice)}</del>}
        </div>
        <button type="button" className="home-product-card__add" onClick={handleAdd}>
          <ShoppingCart size={15} /> {added ? 'Added to cart' : 'Add to cart'}
        </button>
      </div>
    </article>
  );
}

function HeroSection({ products }) {
  const { navigate } = useStore();
  const { format } = useCurrency();
  const heroProduct = products.find(product => product.featured && product.image)
    || products.find(product => product.image);

  return (
    <section className="home-hero">
      <div className={`home-hero__layout${heroProduct ? ' home-hero__layout--with-image' : ''}`}>
        <div className="home-hero__copy">
          <span className="home-hero__eyebrow">BrightCart · Tech for everyday life</span>
          <h1>The future of tech <span>delivered.</span></h1>
          <p>Explore useful devices and accessories, with clear product details and prices before you order.</p>
          <button type="button" className="home-button" onClick={() => navigate('products')}>
            Shop the collection <ArrowRight size={17} />
          </button>
          <p className="home-hero__note">Browse the items currently available in the store.</p>
        </div>

        {heroProduct && (
          <button
            type="button"
            className="home-hero__product"
            onClick={() => navigate('product-detail', { productId: heroProduct.id })}
            aria-label={`View ${heroProduct.name}`}
          >
            <span className="home-hero__product-image">
              <img src={heroProduct.image} alt={heroProduct.name} fetchPriority="high" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
            </span>
            <span className="home-hero__product-caption">
              <span><small>Available now</small><strong>{heroProduct.name}</strong></span>
              <strong>{format(heroProduct.price)}</strong>
            </span>
          </button>
        )}
      </div>
    </section>
  );
}

function FeaturedProducts({ products, loading, error }) {
  const { navigate } = useStore();
  const featured = products.filter(product => product.featured);
  const featuredIds = new Set(featured.map(product => product.id));
  const displayProducts = [
    ...featured,
    ...products.filter(product => !featuredIds.has(product.id)),
  ].slice(0, 4);

  return (
    <section className="home-section" aria-labelledby="home-products-title">
      <div className="home-section__heading">
        <div>
          <span className="home-section__eyebrow">The current collection</span>
          <h2 id="home-products-title">Shop what’s available</h2>
        </div>
        {products.length > 0 && (
          <button type="button" className="home-link-button" onClick={() => navigate('products')}>
            View all products <ArrowRight size={16} />
          </button>
        )}
      </div>

      {loading ? (
        <p className="home-catalog-message" role="status">Loading products…</p>
      ) : error ? (
        <p className="home-catalog-message" role="status">The catalog is temporarily unavailable. Please try again shortly.</p>
      ) : displayProducts.length === 0 ? (
        <p className="home-catalog-message">New products will appear here when they’re added to the store.</p>
      ) : (
        <div className="home-product-grid">
          {displayProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => navigate('product-detail', { productId: product.id })}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function CategoriesSection({ products }) {
  const { navigate } = useStore();
  const categories = [...products.reduce((result, product) => {
    const key = product.category || 'other';
    if (!result.has(key)) result.set(key, { key, products: [] });
    result.get(key).products.push(product);
    return result;
  }, new Map()).values()];

  if (!categories.length) return null;

  return (
    <section className="home-section home-section--categories" aria-labelledby="home-categories-title">
      <div className="home-section__heading">
        <div>
          <span className="home-section__eyebrow">Browse the store</span>
          <h2 id="home-categories-title">Shop by category</h2>
        </div>
      </div>
      <div className="home-category-grid">
        {categories.map(category => {
          const image = category.products.find(product => product.image)?.image;
          return (
            <button
              type="button"
              key={category.key}
              className="home-category-card"
              onClick={() => navigate('products', { category: category.key })}
            >
              {image && <img src={image} alt="" loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none'; }} />}
              <span className="home-category-card__copy">
                <strong>{formatCategory(category.key)}</strong>
                <span>{category.products.length} {category.products.length === 1 ? 'item' : 'items'}</span>
              </span>
              <ArrowRight size={17} aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function HomePage() {
  const { products, productsLoading, productsError } = useStore();

  return (
    <div className="home-page">
      <HeroSection products={products} />
      <FeaturedProducts products={products} loading={productsLoading} error={productsError} />
      <CategoriesSection products={products} />
    </div>
  );
}
