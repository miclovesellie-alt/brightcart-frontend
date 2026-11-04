import { useRef, useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useCurrency } from '../context/CurrencyContext';
import { formatCategory, isStorefrontProduct } from '../utils/catalog';
import HeroAssembler from '../components/HeroAssembler';
import ImageAssembler from '../components/ImageAssembler';
import ProductImageGallery from '../components/ProductImageGallery';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronDown, Star, ArrowRight, Package, Truck, Shield, Headphones } from 'lucide-react';
import './HomePage.css';

gsap.registerPlugin(ScrollTrigger);

// ─── Section: Hero ────────────────────────────────────────────────────────────
function HeroSection() {
  const { navigate } = useStore();
  const textRef = useRef(null);

  useEffect(() => {
    if (textRef.current) {
      gsap.fromTo(
        textRef.current.children,
        { opacity: 0, y: 48 },
        {
          opacity: 1, y: 0, stagger: 0.13,
          duration: 1.0, ease: 'power3.out', delay: 0.25,
          clearProps: 'transform',
        }
      );
    }
  }, []);

  return (
    <section className="home-hero" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
      background: '#0a0a0f',
      paddingTop: '56px',
    }}>
      {/* Static glow orbs */}
      <div style={{
        position: 'absolute', top: '5%', left: '-12%',
        width: '720px', height: '720px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(79,142,247,0.12) 0%, transparent 65%)',
        filter: 'blur(90px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '0', right: '-8%',
        width: '520px', height: '520px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(168,85,247,0.09) 0%, transparent 65%)',
        filter: 'blur(100px)', pointerEvents: 'none',
      }} />

      {/* 2-column grid */}
      <div className="home-hero__grid" style={{
        maxWidth: '1280px', margin: '0 auto', padding: '0 40px',
        display: 'grid',
        gridTemplateColumns: '42fr 58fr',
        gap: '40px',
        alignItems: 'center',
        width: '100%',
        minHeight: '100vh',
        boxSizing: 'border-box',
      }}>

      {/* LEFT: Copy */}
        <div ref={textRef} className="home-hero__copy">
          <h1 style={{
            fontSize: 'clamp(36px, 5vw, 76px)',
            fontWeight: 900, lineHeight: 1.04,
            letterSpacing: '-0.03em',
            marginBottom: '20px', color: '#fff', textAlign: 'center',
          }}>
            The Future of<br />
            <span className="text-gradient">Tech Delivered</span>
          </h1>

          <p style={{
            fontSize: '16px', color: '#b0bac8',
            lineHeight: 1.75, maxWidth: '390px', marginBottom: '36px',
            opacity: 1,
          }}>
            Premium phones, accessories and appliances, engineered
            for the modern world. Watch each device
            assemble before your eyes.
          </p>

          <div className="home-hero__actions" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '40px' }}>
            <button className="btn-primary" onClick={() => navigate('products')}>
              Explore Collection <ArrowRight size={16} />
            </button>
            <button className="btn-ghost">Watch Demo</button>
          </div>

          {/* Trust row */}
          <div className="home-hero__trust" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              {[...Array(5)].map((_, i) => <Star key={i} size={13} fill="#f6c90e" color="#f6c90e" />)}
              <span style={{ color: '#8892a4', fontSize: '12px', marginLeft: '4px' }}>4.9 / 5</span>
            </div>
            <span style={{ color: '#2d3748' }}>·</span>
            <span style={{ color: '#8892a4', fontSize: '12px' }}>2,500+ happy orders</span>
            <span style={{ color: '#2d3748' }}>·</span>
            <span style={{ color: '#8892a4', fontSize: '12px' }}>Free shipping</span>
          </div>

          {/* Live indicator */}
          <div className="home-hero__live" style={{ marginTop: '32px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: '#22c55e', boxShadow: '0 0 10px #22c55e',
              animation: 'pulseDot 1.6s ease-in-out infinite',
            }} />
            <span style={{ fontSize: '10px', color: '#4a5568', letterSpacing: '0.07em' }}>
              AUTO CYCLING · FIVE DEVICES · MOVE TO ROTATE
            </span>
          </div>
        </div>

        {/* RIGHT: 3D Hero Assembler */}
        <div className="home-hero__visual" style={{
          position: 'relative',
          height: '600px',
          minHeight: '420px',
          borderRadius: '20px',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.015)',
        }}>
          <HeroAssembler />

          {/* Top-left badge */}
          <div style={{
            position: 'absolute', top: '14px', left: '16px',
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '4px 10px',
            background: 'rgba(10,10,15,0.72)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '6px',
            backdropFilter: 'blur(8px)',
            pointerEvents: 'none', zIndex: 20,
          }}>
            <div style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: '#22c55e', boxShadow: '0 0 6px #22c55e',
            }} />
            <span style={{ fontSize: '9px', color: '#6b7280', letterSpacing: '0.09em', fontFamily: 'Inter,sans-serif' }}>
              LIVE 3D ASSEMBLY
            </span>
          </div>

          {/* Top-right hint */}
          <div style={{
            position: 'absolute', top: '14px', right: '16px',
            padding: '4px 10px',
            background: 'rgba(10,10,15,0.72)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '6px',
            backdropFilter: 'blur(8px)',
            pointerEvents: 'none', zIndex: 20,
          }}>
            <span style={{ fontSize: '9px', color: '#6b7280', letterSpacing: '0.07em', fontFamily: 'Inter,sans-serif' }}>
              INTERACTIVE · HOVER TO ROTATE
            </span>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div style={{
        position: 'absolute', bottom: '26px', left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
        opacity: 0.4,
      }}>
        <span style={{ fontSize: '9px', color: '#8892a4', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Scroll</span>
        <ChevronDown size={14} color="#8892a4" className="bounce-y" />
      </div>

      <style>{`
        @keyframes pulseDot {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.4; transform:scale(1.6); }
        }
        @media (max-width: 960px) {
          .hero-cols { grid-template-columns: 1fr !important; }
          .hero-3d   { display: none !important; }
        }
      `}</style>
    </section>
  );
}

// ─── Marquee Ticker ───────────────────────────────────────────────────────────
function MarqueeTicker() {
  const { products } = useStore();
  const items = products.filter(isStorefrontProduct).map(product => product.name).join(' · ');
  if (!items) return null;
  return (
    <div style={{
      background: '#0a0a0f',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      overflow: 'hidden', padding: '18px 0',
    }}>
      <div className="marquee-track">
        <span style={{ color: '#4a5568', fontSize: '13px', letterSpacing: '0.05em', paddingRight: '40px' }}>{items}</span>
        <span style={{ color: '#4a5568', fontSize: '13px', letterSpacing: '0.05em', paddingRight: '40px' }}>{items}</span>
      </div>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product, onClick }) {
  const { format } = useCurrency();
  const nameWords = String(product.name || '').trim().split(/\s+/).filter(Boolean);
  const shortName = `${nameWords.slice(0, 4).join(' ')}${nameWords.length > 4 ? '…' : ''}`;
  const rating = Number(product.rating);
  const hasRating = Number.isFinite(rating) && rating > 0;
  const reviews = Number(product.reviews);

  const catColors = {
    phones:              { bg: 'rgba(79,142,247,0.15)', color: '#4f8ef7' },
    'phone-accessories': { bg: 'rgba(168,85,247,0.15)', color: '#a855f7' },
    'laptop-accessories':{ bg: 'rgba(168,85,247,0.15)', color: '#a855f7' },
    electrical:          { bg: 'rgba(34,197,94,0.15)',  color: '#22c55e' },
  };
  const c = catColors[product.category] || catColors.phones;

  return (
    <div
      className="glass home-product-card"
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
        borderRadius: '16px', padding: '16px', cursor: 'pointer',
        transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column', gap: '10px', height: '100%', boxSizing: 'border-box',
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
      <ProductImageGallery product={product} alt={product.name} className="product-img-wrap" showControls={false} scrollable={false} swipeable={false} style={{ height: '160px', background: '#111118', borderRadius: '8px' }} imageStyle={{ padding: '10px' }} />
      <span style={{ alignSelf: 'flex-start', padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 600, background: c.bg, color: c.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {formatCategory(product.category)}
      </span>
      <h3 className="product-card-title" style={{ fontSize: '15px', fontWeight: 600, color: '#fff', lineHeight: 1.35, margin: 0 }}>
        {shortName}
      </h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex' }}>
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={12}
              fill={hasRating && i < Math.floor(rating) ? '#f6c90e' : 'none'}
              color={hasRating && i < Math.floor(rating) ? '#f6c90e' : '#4a5568'}
            />
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
          <span style={{ fontSize: '14px', color: '#4a5568', textDecoration: 'line-through' }}>{format(product.originalPrice)}</span>
        )}
      </div>
    </div>
  );
}

// ─── Featured Products ────────────────────────────────────────────────────────
function FeaturedProducts() {
  const { products, navigate } = useStore();
  const cardRefs = useRef([]);
  const featured = products.filter(p => isStorefrontProduct(p) && p.featured).slice(0, 6);

  const featuredIds = featured.map(product => product.id).join('|');

  useEffect(() => {
    const observers = [];
    const revealTimeouts = [];

    cardRefs.current.filter(Boolean).forEach((card, i) => {
      if (!('IntersectionObserver' in window)) {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
        return;
      }

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const timeout = window.setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, i * 100);
          revealTimeouts.push(timeout);
          observer.disconnect();
        });
      }, { threshold: 0.1 });
      observers.push(observer);
      observer.observe(card);
    });

    return () => {
      observers.forEach(observer => observer.disconnect());
      revealTimeouts.forEach(timeout => window.clearTimeout(timeout));
    };
  }, [featuredIds]);

  if (featured.length === 0) return null;

  return (
    <section className="home-section" style={{ background: '#0a0a0f', padding: '100px 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px' }}>
        <div className="home-section-heading" style={{ marginBottom: '56px' }}>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Featured Products</h2>
        </div>
        <div className="home-featured-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gridAutoRows: '1fr', alignItems: 'stretch', gap: '24px' }}>
          {featured.map((product, i) => (
            <div
              key={product.id}
              ref={(el) => { cardRefs.current[i] = el; }}
              style={{ opacity: 0, transform: 'translateY(40px)', transition: 'opacity 0.6s ease, transform 0.6s ease', height: '100%' }}
            >
              <ProductCard product={product} onClick={() => navigate('product-detail', { productId: product.id })} />
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '48px' }}>
          <button className="btn-ghost" onClick={() => navigate('products')}>
            View All Products <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { num: '01', title: 'Browse',  desc: 'Explore our selection of premium tech products chosen for quality and performance.', img: '/earbuds.jpg' },
    { num: '02', title: 'Order',   desc: 'Secure checkout in seconds. Multiple payment options, fully encrypted transactions.',               img: '/charger.jpg' },
    { num: '03', title: 'Receive', desc: 'Fast, tracked delivery to your door. Premium packaging, genuine products guaranteed.',             img: '/laptop2.jpg' },
  ];
  return (
    <section style={{ background: '#0a0a0f', padding: '100px 0' }}>
      <div className="section-divider" style={{ marginBottom: '100px' }} />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '72px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ height: '1px', width: '40px', background: '#4f8ef7' }} />
            <span style={{ fontSize: '12px', color: '#4f8ef7', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>The Process</span>
            <div style={{ height: '1px', width: '40px', background: '#4f8ef7' }} />
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Assembled. Perfected. Delivered.</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px' }}>
          {steps.map((step) => (
            <div key={step.num} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '80px', fontWeight: 900, color: 'rgba(255,255,255,0.04)', lineHeight: 1, marginBottom: '-20px' }}>{step.num}</div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                <ImageAssembler src={step.img} width={260} height={180} trigger="scroll" />
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>{step.title}</h3>
              <p style={{ fontSize: '14px', color: '#8892a4', lineHeight: 1.7, maxWidth: '280px', margin: '0 auto' }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Categories ───────────────────────────────────────────────────────────────
function CategoriesSection() {
  const { navigate, products } = useStore();
  const categoryStyle = {
    phones: { icon: '📱', color: '#4f8ef7' },
    'phone-accessories': { icon: '🎧', color: '#a855f7' },
    'laptop-accessories': { icon: '⌨️', color: '#06b6d4' },
    electrical: { icon: '⚡', color: '#22c55e' },
  };
  const categoryMap = new Map();
  products.filter(isStorefrontProduct).forEach(product => {
    const key = String(product.category || '').trim();
    if (!key) return;
    const category = categoryMap.get(key) || {
      name: formatCategory(key), icon: categoryStyle[key]?.icon || '▦',
      count: 0, image: product.image, color: categoryStyle[key]?.color || '#4f8ef7',
    };
    category.count += 1;
    if (!category.image && product.image) category.image = product.image;
    categoryMap.set(key, category);
  });
  const categories = [...categoryMap.values()].map(category => ({
    ...category,
    count: `${category.count} ${category.count === 1 ? 'product' : 'products'}`,
  }));
  if (categories.length === 0) return null;
  return (
    <section className="home-section" style={{ background: '#111118', padding: '100px 0' }}>
      <div className="section-divider" style={{ marginBottom: '100px' }} />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px' }}>
        <div className="home-section-heading" style={{ marginBottom: '56px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ height: '1px', width: '40px', background: '#4f8ef7' }} />
            <span style={{ fontSize: '12px', color: '#4f8ef7', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Browse By</span>
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Categories</h2>
        </div>
        <div className="home-category-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          {categories.map((cat) => (
            <button
              key={cat.name}
              className="category-card glass home-category-card"
              onClick={() => navigate('products')}
              style={{ padding: '32px 24px', textAlign: 'left', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', borderRadius: '16px' }}
            >
              <div className="bg-image" style={{ backgroundImage: `url(${cat.image})` }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>{cat.icon}</div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>{cat.name}</h3>
                <p style={{ fontSize: '13px', color: '#8892a4' }}>{cat.count}</p>
                <div style={{ marginTop: '20px', display: 'inline-flex', alignItems: 'center', gap: '6px', color: cat.color, fontSize: '13px', fontWeight: 600 }}>
                  Explore <ArrowRight size={14} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────
function StatsSection() {
  const { products } = useStore();
  const stats = [
    { value: String(products.filter(isStorefrontProduct).length), label: 'Products', icon: Package },
    { value: '2,500+', label: 'Happy Orders',icon: Truck     },
    { value: '4.9★',   label: 'Avg Rating',  icon: Star      },
    { value: '24/7',   label: 'Support',     icon: Headphones},
  ];
  const refs = useRef([]);

  useEffect(() => {
    refs.current.filter(Boolean).forEach((item, i) => {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            gsap.fromTo(item, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, delay: i * 0.1, ease: 'power3.out' });
            obs.disconnect();
          }
        });
      }, { threshold: 0.3 });
      obs.observe(item);
    });
  }, []);

  return (
    <section className="dot-grid home-section" style={{ background: '#0a0a0f', padding: '100px 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px' }}>
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} ref={(el) => { refs.current[i] = el; }} className="glass"
                style={{ borderRadius: '16px', padding: '32px 24px', textAlign: 'center', opacity: 0 }}>
                <Icon size={24} color="#4f8ef7" style={{ marginBottom: '12px' }} />
                <div style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: '14px', color: '#8892a4', marginTop: '8px' }}>{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
function TestimonialsSection() {
  const testimonials = [
    { initials:'AK', name:'Alex K.',   location:'New York, US', color:'#4f8ef7', rating:5, text:'Absolutely love my ProBuds X3! The sound quality is excellent and the ANC is impressive. Delivery was super fast too.' },
    { initials:'SR', name:'Sarah R.',  location:'London, UK',   color:'#a855f7', rating:5, text:'The UltraHub Pro is a game changer for my desk setup. 12 ports, all working flawlessly. Amazing build quality.' },
    { initials:'MJ', name:'Marcus J.', location:'Berlin, DE',   color:'#22c55e', rating:5, text:'Ordered the BrightPhone Pro 15. The camera is stunning. It arrived in two days, perfectly packaged. Will order again!' },
  ];
  return (
    <section className="home-section" style={{ background: '#111118', padding: '100px 0' }}>
      <div className="section-divider" style={{ marginBottom: '100px' }} />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ height: '1px', width: '40px', background: '#4f8ef7' }} />
            <span style={{ fontSize: '12px', color: '#4f8ef7', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Social Proof</span>
            <div style={{ height: '1px', width: '40px', background: '#4f8ef7' }} />
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>What Customers Say</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {testimonials.map((t) => (
            <div key={t.name} className="glass" style={{ borderRadius: '16px', padding: '28px' }}>
              <div style={{ display: 'flex', gap: '3px', marginBottom: '16px' }}>
                {[...Array(t.rating)].map((_, i) => <Star key={i} size={14} fill="#f6c90e" color="#f6c90e" />)}
              </div>
              <p style={{ fontSize: '14px', color: '#8892a4', lineHeight: 1.7, marginBottom: '24px' }}>"{t.text}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:t.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:700, color:'#fff', flexShrink:0 }}>
                  {t.initials}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{t.name}</div>
                  <div style={{ fontSize: '12px', color: '#4a5568' }}>{t.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Newsletter ───────────────────────────────────────────────────────────────
function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  return (
    <section className="home-section" style={{ background: '#0a0a0f', padding: '100px 0', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: '800px', height: '400px',
        background: 'radial-gradient(ellipse, rgba(79,142,247,0.1) 0%, transparent 70%)',
        filter: 'blur(40px)', pointerEvents: 'none',
      }} />
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 32px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <span style={{ fontSize: '12px', color: '#4f8ef7', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: '16px' }}>Newsletter</span>
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, marginBottom: '16px', letterSpacing: '-0.02em' }}>
          <span className="text-gradient">Stay in the loop</span>
        </h2>
        <p style={{ fontSize: '16px', color: '#8892a4', marginBottom: '36px', lineHeight: 1.6 }}>
          Get exclusive deals, new arrivals, and tech news sent straight to your inbox.
        </p>
        {subscribed ? (
          <div className="glass" style={{ padding: '20px 32px', borderRadius: '12px', color: '#22c55e', fontWeight: 600 }}>
            ✓ You're in! Welcome to the Shoppercart community.
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); if (email) setSubscribed(true); }}
            style={{ display: 'flex', gap: '12px', maxWidth: '440px', margin: '0 auto' }}>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email" required
              style={{ flex: 1, padding: '12px 18px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none', backdropFilter: 'blur(12px)' }}
              onFocus={(e) => e.target.style.borderColor='rgba(79,142,247,0.5)'}
              onBlur={(e) =>  e.target.style.borderColor='rgba(255,255,255,0.1)'}
            />
            <button type="submit" className="btn-primary" style={{ flexShrink: 0 }}>Subscribe</button>
          </form>
        )}
      </div>
    </section>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div className="home-page" style={{ background: '#0a0a0f' }}>
      <HeroSection />
      <MarqueeTicker />
      <FeaturedProducts />
      <HowItWorks />
      <CategoriesSection />
      <StatsSection />
      <TestimonialsSection />
      <NewsletterSection />
    </div>
  );
}
