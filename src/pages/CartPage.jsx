import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useCurrency } from '../context/CurrencyContext';

export default function CartPage() {
  const { cart, removeFromCart, updateQty, cartTotal, navigate } = useStore();
  const { format } = useCurrency();

  const shipping = cartTotal > 50 ? 0 : 4.99;
  const tax = cartTotal * 0.08;
  const total = cartTotal + shipping + tax;

  if (cart.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f', paddingTop: '80px' }}>
        <div style={{ textAlign: 'center' }}>
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
    <div style={{ minHeight: '100vh', background: '#0a0a0f', paddingTop: '80px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#fff', marginBottom: '32px', letterSpacing: '-0.02em' }}>
          Shopping Cart
          <span style={{ fontSize: '18px', fontWeight: 400, color: '#8892a4', marginLeft: '12px' }}>({cart.length} item{cart.length !== 1 ? 's' : ''})</span>
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '32px' }}>
          {/* Cart Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {cart.map(item => (
              <div key={item.product.id} className="glass" style={{
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}>
                <div style={{
                  width: '72px',
                  height: '72px',
                  background: '#111118',
                  borderRadius: '10px',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }}
                    onError={e => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = '<span style="font-size:28px">📦</span>'; }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product.name}</h3>
                  <p style={{ fontSize: '12px', color: '#8892a4', marginBottom: '8px', textTransform: 'capitalize' }}>{item.product.category.replace('-', ' ')}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, color: '#4f8ef7', fontSize: '16px' }}>{format(item.product.price)}</span>
                    {item.product.originalPrice > item.product.price && (
                      <span style={{ fontSize: '13px', textDecoration: 'line-through', color: '#4a5568' }}>{format(item.product.originalPrice)}</span>
                    )}
                  </div>
                </div>
                {/* Qty controls */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}>
                  <button onClick={() => updateQty(item.product.id, item.qty - 1)} style={{ width: '32px', height: '32px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '16px' }}>−</button>
                  <span style={{ width: '32px', textAlign: 'center', color: '#fff', fontWeight: 600, fontSize: '14px' }}>{item.qty}</span>
                  <button onClick={() => updateQty(item.product.id, item.qty + 1)} style={{ width: '32px', height: '32px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '16px' }}>+</button>
                </div>
                <div style={{ flexShrink: 0, textAlign: 'right', minWidth: '70px' }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#fff', marginBottom: '8px' }}>{format(item.product.price * item.qty)}</div>
                  <button onClick={() => removeFromCart(item.product.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div>
            <div className="glass" style={{ borderRadius: '16px', padding: '24px', position: 'sticky', top: '80px' }}>
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

      <style>{`
        @media (max-width: 900px) {
          div[style*="grid-template-columns: 1fr 360px"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
