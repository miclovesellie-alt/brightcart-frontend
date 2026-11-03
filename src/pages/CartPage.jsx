import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useCurrency } from '../context/CurrencyContext';
import ProductImageGallery from '../components/ProductImageGallery';

export default function CartPage() {
  const { cart, removeFromCart, updateQty, cartTotal, navigate } = useStore();
  const { format } = useCurrency();

  const shipping = cartTotal > 50 ? 0 : 4.99;
  const tax = cartTotal * 0.08;
  const total = cartTotal + shipping + tax;

  if (cart.length === 0) {
    return (
      <div className="cart-page cart-page--empty" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f', paddingTop: '80px' }}>
        <div style={{ textAlign: 'center', padding: '0 20px' }}>
          <h1 className="cart-page__empty-title">Shopping Cart</h1>
          <div style={{ fontSize: '72px', marginBottom: '24px' }}>🛒</div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Your cart is empty</h2>
          <p style={{ color: '#8892a4', marginBottom: '24px' }}>Looks like you haven't added anything yet.</p>
          <button
            onClick={() => navigate('products')}
            className="btn-primary"
            style={{ margin: '0 auto' }}
          >
            <ShoppingBag size={18} /> Start Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page" style={{ minHeight: '100vh', background: '#0a0a0f', paddingTop: '80px' }}>
      <div className="cart-page__content" style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 32px' }}>
        <h1 className="cart-page__title" style={{ fontSize: '32px', fontWeight: 800, color: '#fff', marginBottom: '32px', letterSpacing: '-0.02em' }}>
          Shopping Cart
          <span style={{ fontSize: '18px', fontWeight: 400, color: '#8892a4', marginLeft: '12px' }}>({cart.length} item{cart.length !== 1 ? 's' : ''})</span>
        </h1>

        <div className="cart-page__layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '32px' }}>
          {/* Cart Items */}
          <div className="cart-page__items">
            {cart.map(item => (
              <div key={item.cartKey || item.product.id} className="glass cart-page__item-card">
                <ProductImageGallery
                  product={item.product}
                  alt={item.product.name}
                  showControls={false}
                  className="cart-page__item-image"
                  style={{ width: 72, height: 72, background: '#111118', borderRadius: 10, flex: '0 0 72px', overflow: 'hidden' }}
                  imageStyle={{ padding: 6 }}
                />
                <div className="cart-page__item-details">
                  <h3 className="cart-page__item-name">{item.product.name}</h3>
                  {item.variant?.color && <p className="cart-page__item-category">Color: {item.variant.color}</p>}
                  <p className="cart-page__item-category">{item.product.category.replace('-', ' ')}</p>
                  <div className="cart-page__item-pricing">
                    <span>{format(item.product.price)}</span>
                    {item.product.originalPrice > item.product.price && (
                      <span className="cart-page__item-original">{format(item.product.originalPrice)}</span>
                    )}
                  </div>
                </div>
                <div className="cart-page__item-actions">
                  <div className="cart-page__quantity" aria-label="Quantity controls">
                    <button type="button" aria-label={`Decrease ${item.product.name} quantity`} onClick={() => updateQty(item.cartKey || item.product.id, item.qty - 1)}>−</button>
                    <span>{item.qty}</span>
                    <button type="button" aria-label={`Increase ${item.product.name} quantity`} onClick={() => updateQty(item.cartKey || item.product.id, item.qty + 1)}>+</button>
                  </div>
                  <div className="cart-page__item-total">
                    <span>{format(item.product.price * item.qty)}</span>
                    <button type="button" aria-label={`Remove ${item.product.name} from cart`} onClick={() => removeFromCart(item.cartKey || item.product.id)}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div>
            <div className="glass cart-page__summary" style={{ borderRadius: '16px', padding: '24px', position: 'sticky', top: '80px' }}>
              <h2 style={{ fontWeight: 700, fontSize: '18px', color: '#fff', marginBottom: '20px' }}>Order Summary</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#8892a4' }}>
                  <span>Subtotal ({cart.reduce((s,i) => s+i.qty, 0)} items)</span>
                  <span>{format(cartTotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#8892a4' }}>
                  <span>Shipping</span>
                  <span style={{ color: shipping === 0 ? '#22c55e' : '#fff' }}>{shipping === 0 ? 'FREE' : format(shipping)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#8892a4' }}>
                  <span>Tax (8%)</span>
                  <span>{format(tax)}</span>
                </div>
                {shipping > 0 && (
                  <div style={{ padding: '10px 14px', background: 'rgba(79,142,247,0.08)', border: '1px solid rgba(79,142,247,0.2)', borderRadius: '8px', fontSize: '12px', color: '#4f8ef7' }}>
                    Add {format(50 - cartTotal)} more for free shipping!
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '16px', color: '#fff', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', marginBottom: '20px' }}>
                <span>Total</span>
                <span>{format(total)}</span>
              </div>
              <button
                onClick={() => navigate('checkout')}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Proceed to Checkout <ArrowRight size={16} />
              </button>
              <button
                onClick={() => navigate('products')}
                style={{ width: '100%', marginTop: '12px', padding: '10px', background: 'none', border: 'none', color: '#8892a4', fontSize: '14px', cursor: 'pointer' }}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
