import { useState } from 'react';
import { CheckCircle, CreditCard, MapPin, ClipboardCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useCurrency } from '../context/CurrencyContext';

const STEPS = [
  { id: 1, label: 'Shipping', icon: MapPin },
  { id: 2, label: 'Payment', icon: CreditCard },
  { id: 3, label: 'Confirm', icon: ClipboardCheck },
];

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '14px',
  outline: 'none',
};

export default function CheckoutPage() {
  const { cart, cartTotal, placeOrder, navigate } = useStore();
  const { format } = useCurrency();
  const [step, setStep] = useState(1);
  const [orderPlaced, setOrderPlaced] = useState(null);

  const [shipping, setShipping] = useState({ name: '', email: '', address: '', city: '', state: '', zip: '', country: 'US' });
  const [payment, setPayment] = useState({ card: '', expiry: '', cvv: '' });

  const shippingFee = cartTotal > 50 ? 0 : 4.99;
  const tax = cartTotal * 0.08;
  const total = cartTotal + shippingFee + tax;

  const updateShipping = e => setShipping(p => ({ ...p, [e.target.name]: e.target.value }));
  const updatePayment = e => setPayment(p => ({ ...p, [e.target.name]: e.target.value }));

  const handlePlaceOrder = () => {
    const order = placeOrder({ ...shipping, paymentLast4: payment.card.slice(-4) });
    setOrderPlaced(order);
  };

  if (orderPlaced) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f', paddingTop: '80px' }}>
        <div style={{ textAlign: 'center', maxWidth: '440px', padding: '0 24px' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'rgba(34,197,94,0.15)',
            border: '1px solid rgba(34,197,94,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <CheckCircle size={40} color="#22c55e" />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>Order Placed! 🎉</h1>
          <p style={{ color: '#8892a4', marginBottom: '8px' }}>
            Order ID: <span style={{ fontFamily: 'monospace', color: '#4f8ef7' }}>{orderPlaced.id}</span>
          </p>
          <p style={{ color: '#8892a4', fontSize: '14px', marginBottom: '32px', lineHeight: 1.6 }}>
            Thank you, {orderPlaced.customer}! Your order will be shipped to {orderPlaced.address}, {orderPlaced.city}.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button onClick={() => navigate('account')} className="btn-ghost">View Orders</button>
            <button onClick={() => navigate('home')} className="btn-primary">Continue Shopping</button>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    navigate('cart');
    return null;
  }

  const fieldStyle = { ...inputStyle };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', paddingTop: '80px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#fff', marginBottom: '32px', letterSpacing: '-0.02em' }}>Checkout</h1>

        {/* Step Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px', maxWidth: '400px' }}>
          {STEPS.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 600, fontSize: '14px',
                  background: step >= s.id ? '#4f8ef7' : 'rgba(255,255,255,0.06)',
                  color: step >= s.id ? '#fff' : '#4a5568',
                  border: step >= s.id ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  transition: 'all 0.3s ease',
                }}>
                  {step > s.id ? <CheckCircle size={18} /> : <s.icon size={16} />}
                </div>
                <span style={{ fontSize: '11px', marginTop: '6px', fontWeight: 500, color: step >= s.id ? '#4f8ef7' : '#4a5568' }}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: '2px', marginBottom: '16px', background: step > s.id ? '#4f8ef7' : 'rgba(255,255,255,0.08)', transition: 'background 0.3s ease' }} />
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '32px' }}>
          {/* Form */}
          <div className="glass" style={{ borderRadius: '16px', padding: '28px' }}>
            {step === 1 && (
              <div>
                <h2 style={{ fontWeight: 700, fontSize: '20px', color: '#fff', marginBottom: '24px' }}>Shipping Information</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {[
                    { name: 'name', label: 'Full Name', type: 'text', col: 2 },
                    { name: 'email', label: 'Email Address', type: 'email', col: 2 },
                    { name: 'address', label: 'Street Address', type: 'text', col: 2 },
                    { name: 'city', label: 'City', type: 'text', col: 1 },
                    { name: 'state', label: 'State', type: 'text', col: 1 },
                    { name: 'zip', label: 'ZIP Code', type: 'text', col: 1 },
                    { name: 'country', label: 'Country', type: 'text', col: 1 },
                  ].map(field => (
                    <div key={field.name} style={{ gridColumn: field.col === 2 ? 'span 2' : 'span 1' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#8892a4', marginBottom: '6px' }}>{field.label}</label>
                      <input
                        type={field.type}
                        name={field.name}
                        value={shipping[field.name]}
                        onChange={updateShipping}
                        style={fieldStyle}
                        required
                        onFocus={e => e.target.style.borderColor = 'rgba(79,142,247,0.5)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => shipping.name && shipping.email && shipping.address && setStep(2)}
                  className="btn-primary"
                  style={{ marginTop: '24px', width: '100%', justifyContent: 'center' }}
                >
                  Continue to Payment →
                </button>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 style={{ fontWeight: 700, fontSize: '20px', color: '#fff', marginBottom: '24px' }}>Payment Details</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#8892a4', marginBottom: '6px' }}>Card Number</label>
                    <input type="text" name="card" value={payment.card} onChange={updatePayment} placeholder="1234 5678 9012 3456" maxLength={19} style={{ ...fieldStyle, fontFamily: 'monospace' }}
                      onFocus={e => e.target.style.borderColor = 'rgba(79,142,247,0.5)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#8892a4', marginBottom: '6px' }}>Expiry Date</label>
                      <input type="text" name="expiry" value={payment.expiry} onChange={updatePayment} placeholder="MM/YY" maxLength={5} style={{ ...fieldStyle, fontFamily: 'monospace' }}
                        onFocus={e => e.target.style.borderColor = 'rgba(79,142,247,0.5)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#8892a4', marginBottom: '6px' }}>CVV</label>
                      <input type="text" name="cvv" value={payment.cvv} onChange={updatePayment} placeholder="123" maxLength={4} style={{ ...fieldStyle, fontFamily: 'monospace' }}
                        onFocus={e => e.target.style.borderColor = 'rgba(79,142,247,0.5)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                      />
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button onClick={() => setStep(1)} className="btn-ghost">← Back</button>
                  <button onClick={() => payment.card && setStep(3)} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Review Order →</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 style={{ fontWeight: 700, fontSize: '20px', color: '#fff', marginBottom: '24px' }}>Confirm Order</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', fontSize: '14px' }}>
                    <p style={{ fontWeight: 600, color: '#fff', marginBottom: '4px' }}>📦 Shipping to:</p>
                    <p style={{ color: '#8892a4' }}>{shipping.name} — {shipping.address}, {shipping.city}, {shipping.state} {shipping.zip}</p>
                  </div>
                  <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', fontSize: '14px' }}>
                    <p style={{ fontWeight: 600, color: '#fff', marginBottom: '4px' }}>💳 Payment:</p>
                    <p style={{ color: '#8892a4' }}>Card ending in {payment.card.slice(-4) || '****'}</p>
                  </div>
                </div>
                {cart.map(item => (
                  <div key={item.product.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ width: '44px', height: '44px', background: '#111118', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                      <img src={item.product.image} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} onError={e => { e.target.style.display = 'none'; }} />
                    </div>
                    <div style={{ flex: 1, fontSize: '14px' }}>
                      <p style={{ fontWeight: 600, color: '#fff' }}>{item.product.name}</p>
                      <p style={{ color: '#8892a4' }}>Qty: {item.qty}</p>
                    </div>
                    <span style={{ fontWeight: 600, color: '#4f8ef7', fontSize: '14px' }}>{format(item.product.price * item.qty)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button onClick={() => setStep(2)} className="btn-ghost">← Back</button>
                  <button
                    onClick={handlePlaceOrder}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#22c55e',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 30px rgba(34,197,94,0.3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    ✓ Place Order — {format(total)}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Summary Sidebar */}
          <div>
            <div className="glass" style={{ borderRadius: '16px', padding: '20px', position: 'sticky', top: '80px' }}>
              <h3 style={{ fontWeight: 700, color: '#fff', marginBottom: '16px' }}>Order Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                {cart.map(item => (
                  <div key={item.product.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                    <div style={{ width: '36px', height: '36px', background: '#111118', borderRadius: '6px', flexShrink: 0, overflow: 'hidden' }}>
                      <img src={item.product.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '3px' }} onError={e => { e.target.style.display = 'none'; }} />
                    </div>
                    <span style={{ flex: 1, color: '#8892a4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product.name}</span>
                    <span style={{ color: '#8892a4' }}>×{item.qty}</span>
                    <span style={{ color: '#fff', fontWeight: 600 }}>{format(item.product.price * item.qty)}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#8892a4' }}>
                  <span>Subtotal</span><span>{format(cartTotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#8892a4' }}>
                  <span>Shipping</span>
                  <span style={{ color: shippingFee === 0 ? '#22c55e' : '#8892a4' }}>{shippingFee === 0 ? 'FREE' : format(shippingFee)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#8892a4' }}>
                  <span>Tax</span><span>{format(tax)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '16px', color: '#fff', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px', marginTop: '4px' }}>
                  <span>Total</span><span>{format(total)}</span>
                </div>
              </div>
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
