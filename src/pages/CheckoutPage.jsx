import { useState } from 'react';
import { CheckCircle, CreditCard, MapPin, ClipboardCheck, Smartphone, ShieldCheck, Zap } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useCurrency } from '../context/CurrencyContext';
import { payWithPaystack } from '../utils/paystack';
import ProductImageGallery from '../components/ProductImageGallery';

const STEPS = [
  { id: 1, label: 'Shipping', icon: MapPin },
  { id: 2, label: 'Payment', icon: CreditCard },
  { id: 3, label: 'Confirm', icon: ClipboardCheck },
];

const fieldStyle = {
  width: '100%',
  padding: '10px 14px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.2s ease',
  boxSizing: 'border-box',
};

export default function CheckoutPage() {
  const { cart, cartTotal, placeOrder, navigate, user } = useStore();
  const { format, currency, convert } = useCurrency();
  const [step, setStep] = useState(1);
  const [orderPlaced, setOrderPlaced] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('paystack'); // 'paystack' (MoMo/Card) or 'cash'

  const [shipping, setShipping] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    city: 'Accra',
    state: 'Greater Accra',
    country: user?.country || 'Ghana',
  });

  const shippingFee = cartTotal > 50 ? 0 : 4.99;
  const tax = cartTotal * 0.08;
  const totalUSD = cartTotal + shippingFee + tax;
  
  // Paystack currency & amount calculation
  const paystackCurrency = ['GHS', 'NGN', 'USD', 'ZAR', 'KES'].includes(currency) ? currency : 'GHS';
  const paystackAmount = convert(totalUSD, paystackCurrency);

  const updateShipping = e => setShipping(p => ({ ...p, [e.target.name]: e.target.value }));

  // Paystack Flow trigger
  const handlePaystackCheckout = () => {
    if (!shipping.name || !shipping.email || !shipping.address) {
      setCheckoutError('Please fill in your shipping details first.');
      setStep(1);
      return;
    }

    setProcessing(true);
    setCheckoutError('');

    payWithPaystack({
      email: shipping.email,
      amount: paystackAmount,
      currency: paystackCurrency,
      onSuccess: async (res) => {
        try {
          const order = await placeOrder({
            ...shipping,
            paymentMethod: 'Paystack (MoMo/Card)',
            paymentRef: res.reference,
          });
          setOrderPlaced(order);
        } catch (error) {
          setCheckoutError(`Payment callback received, but the order could not be saved. Keep reference ${res.reference} and contact support. ${error.message}`);
        } finally {
          setProcessing(false);
        }
      },
      onClose: () => {
        setProcessing(false);
      },
      onError: error => {
        setCheckoutError(error);
        setProcessing(false);
      },
    });
  };

  const handleManualOrder = async () => {
    setProcessing(true);
    setCheckoutError('');
    try {
      const order = await placeOrder({
        ...shipping,
        paymentMethod: 'Pay on Delivery / Bank Transfer',
      });
      setOrderPlaced(order);
    } catch (error) {
      setCheckoutError(error.message || 'Unable to place this order. Try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (orderPlaced) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f', paddingTop: '80px' }}>
        <div style={{ textAlign: 'center', maxWidth: '460px', padding: '0 24px' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'rgba(34,197,94,0.15)',
            border: '1px solid rgba(34,197,94,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <CheckCircle size={40} color="#22c55e" />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>Order received</h1>
          <p style={{ color: '#8892a4', marginBottom: '12px', fontSize: '15px' }}>
            {orderPlaced.paymentStatus === 'pending_verification'
              ? 'Paystack returned a reference. A super admin must verify it against Paystack before fulfillment.'
              : 'Your order is recorded as unpaid. We will confirm payment before fulfillment.'}
          </p>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '24px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: '#64748b', fontSize: '13px' }}>Order Reference:</span>
              <span style={{ fontFamily: 'monospace', color: '#4f8ef7', fontWeight: 700, fontSize: '13px' }}>{orderPlaced.id}</span>
            </div>
            {orderPlaced.paymentRef && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Paystack Reference:</span>
                <span style={{ fontFamily: 'monospace', color: '#22c55e', fontSize: '13px' }}>{orderPlaced.paymentRef}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: '#64748b', fontSize: '13px' }}>Payment status:</span>
              <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '13px', textTransform: 'capitalize' }}>{String(orderPlaced.paymentStatus || 'unpaid').replaceAll('_', ' ')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b', fontSize: '13px' }}>Total Amount:</span>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: '14px' }}>{format(totalUSD)}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button onClick={() => navigate('account')} className="btn-ghost">View Orders</button>
            <button onClick={() => navigate('products')} className="btn-primary">Continue Shopping</button>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="checkout-page checkout-page--empty" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f', paddingTop: '80px' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 className="checkout-page__empty-title">Checkout</h1>
          <p style={{ fontSize: '40px', marginBottom: '16px' }}>🛒</p>
          <h2 style={{ color: '#fff', fontWeight: 700, marginBottom: '8px' }}>Your cart is empty</h2>
          <p style={{ color: '#8892a4', marginBottom: '24px' }}>Add some premium items before checking out</p>
          <button onClick={() => navigate('products')} className="btn-primary">Browse Catalog</button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page" style={{ minHeight: '100vh', background: '#0a0a0f', paddingTop: '80px', paddingBottom: '80px' }}>
      <div className="checkout-page__content" style={{ maxWidth: '1080px', margin: '0 auto', padding: '0 24px' }}>
        <h1 className="checkout-page__title">Checkout</h1>
        
        {/* Progress Steps */}
        <div className="checkout-progress" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '32px', margin: '40px 0' }}>
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const isDone = step > s.id;
            const isActive = step === s.id;
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: isDone ? 'pointer' : 'default' }} onClick={() => isDone && setStep(s.id)}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: isDone ? '#22c55e' : isActive ? '#4f8ef7' : 'rgba(255,255,255,0.06)',
                    color: isDone || isActive ? '#fff' : '#64748b',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '13px',
                    transition: 'all 0.3s ease',
                  }}>
                    {isDone ? '✓' : s.id}
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: isActive ? '#fff' : '#64748b' }}>
                    {s.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div style={{ width: '40px', height: '1px', background: isDone ? '#22c55e' : 'rgba(255,255,255,0.1)' }} />
                )}
              </div>
            );
          })}
        </div>

        <div className="checkout-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '32px', alignItems: 'start' }}>

          {checkoutError && (
            <div role="alert" style={{ gridColumn: '1 / -1', padding: '12px 16px', borderRadius: 10, color: '#fecaca', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', fontSize: 13 }}>
              {checkoutError}
            </div>
          )}
          
          {/* Main Form Body */}
          <div className="glass checkout-page__form-card" style={{ borderRadius: '20px', padding: '32px' }}>
            
            {/* Step 1: Shipping Details */}
            {step === 1 && (
              <div>
                <h2 style={{ fontWeight: 800, fontSize: '20px', color: '#fff', marginBottom: '24px' }}>Delivery & Contact Information</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="checkout-fields--two" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#8892a4', marginBottom: '6px' }}>Full Name *</label>
                      <input type="text" name="name" value={shipping.name} onChange={updateShipping} placeholder="Kwame Mensah" style={fieldStyle} required />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#8892a4', marginBottom: '6px' }}>Email Address (for Receipt) *</label>
                      <input type="email" name="email" value={shipping.email} onChange={updateShipping} placeholder="kwame@example.com" style={fieldStyle} required />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#8892a4', marginBottom: '6px' }}>Mobile Phone (MoMo Number) *</label>
                    <input type="tel" name="phone" value={shipping.phone} onChange={updateShipping} placeholder="+233 24 123 4567" style={fieldStyle} required />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#8892a4', marginBottom: '6px' }}>Delivery Address (Street / Landmark) *</label>
                    <input type="text" name="address" value={shipping.address} onChange={updateShipping} placeholder="14 Independence Ave, Airport Residential" style={fieldStyle} required />
                  </div>

                  <div className="checkout-fields--three" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#8892a4', marginBottom: '6px' }}>City *</label>
                      <input type="text" name="city" value={shipping.city} onChange={updateShipping} placeholder="Accra" style={fieldStyle} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#8892a4', marginBottom: '6px' }}>Region / State</label>
                      <input type="text" name="state" value={shipping.state} onChange={updateShipping} placeholder="Greater Accra" style={fieldStyle} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#8892a4', marginBottom: '6px' }}>Country</label>
                      <input type="text" name="country" value={shipping.country} onChange={updateShipping} style={fieldStyle} />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (!shipping.name || !shipping.email || !shipping.address) {
                      alert('Please complete all required shipping fields.');
                      return;
                    }
                    setStep(2);
                  }}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '28px' }}
                >
                  Proceed to Payment →
                </button>
              </div>
            )}

            {/* Step 2: Payment Method */}
            {step === 2 && (
              <div>
                <h2 style={{ fontWeight: 800, fontSize: '20px', color: '#fff', marginBottom: '8px' }}>Select Payment Method</h2>
                <p style={{ color: '#8892a4', fontSize: '13px', marginBottom: '24px' }}>
                  Choose your preferred payment method. Mobile Money and Cards are processed securely by Paystack.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
                  
                  {/* Option A: Paystack (MoMo + Card) */}
                  <div
                    onClick={() => setPaymentMethod('paystack')}
                    style={{
                      padding: '18px 20px',
                      borderRadius: '14px',
                      background: paymentMethod === 'paystack' ? 'rgba(79, 142, 247, 0.12)' : 'rgba(255,255,255,0.03)',
                      border: paymentMethod === 'paystack' ? '1.5px solid #4f8ef7' : '1px solid rgba(255,255,255,0.08)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '12px',
                      background: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
                    }}>
                      <Smartphone size={22} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, color: '#fff', fontSize: '15px' }}>Mobile Money & Cards (Paystack)</span>
                        <span style={{ fontSize: '10px', background: '#22c55e22', color: '#4ade80', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>RECOMMENDED</span>
                      </div>
                      <p style={{ color: '#94a3b8', fontSize: '12px', margin: '4px 0 0' }}>
                        MTN MoMo, Telecel Cash, AT Money, Visa, Mastercard, Apple Pay
                      </p>
                    </div>
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '50%',
                      border: paymentMethod === 'paystack' ? '5px solid #4f8ef7' : '2px solid #475569',
                      background: '#fff'
                    }} />
                  </div>

                  {/* Option B: Pay on Delivery */}
                  <div
                    onClick={() => setPaymentMethod('cash')}
                    style={{
                      padding: '18px 20px',
                      borderRadius: '14px',
                      background: paymentMethod === 'cash' ? 'rgba(79, 142, 247, 0.12)' : 'rgba(255,255,255,0.03)',
                      border: paymentMethod === 'cash' ? '1.5px solid #4f8ef7' : '1px solid rgba(255,255,255,0.08)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '12px',
                      background: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
                    }}>
                      <CreditCard size={22} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 700, color: '#fff', fontSize: '15px' }}>Pay on Delivery / Bank Transfer</span>
                      <p style={{ color: '#94a3b8', fontSize: '12px', margin: '4px 0 0' }}>
                        Pay cash upon delivery or arrange manual bank payment with dispatch
                      </p>
                    </div>
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '50%',
                      border: paymentMethod === 'cash' ? '5px solid #4f8ef7' : '2px solid #475569',
                      background: '#fff'
                    }} />
                  </div>

                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setStep(1)} className="btn-ghost">← Back</button>
                  <button onClick={() => setStep(3)} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                    Review & Pay →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review & Pay */}
            {step === 3 && (
              <div>
                <h2 style={{ fontWeight: 800, fontSize: '20px', color: '#fff', marginBottom: '20px' }}>Order Confirmation</h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', fontSize: '13px' }}>
                    <p style={{ fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>📦 Shipping Details</p>
                    <p style={{ color: '#94a3b8', margin: 0 }}>
                      {shipping.name} ({shipping.phone})<br />
                      {shipping.address}, {shipping.city}, {shipping.country}
                    </p>
                  </div>

                  <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', fontSize: '13px' }}>
                    <p style={{ fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>💳 Payment Method</p>
                    <p style={{ color: '#94a3b8', margin: 0 }}>
                      {paymentMethod === 'paystack' ? 'Paystack (Mobile Money / Cards / Apple Pay)' : 'Pay on Delivery'}
                    </p>
                  </div>
                </div>

                {/* Items List */}
                <div style={{ marginBottom: '24px' }}>
                  {cart.map(item => (
                    <div key={item.cartKey || item.product.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <ProductImageGallery product={item.product} alt={item.product.name} showControls={false} style={{ width: 40, height: 40, background: '#111118', borderRadius: 8, flex: '0 0 40px' }} imageStyle={{ padding: 4 }} />
                      <div style={{ flex: 1, fontSize: '13px' }}>
                        <p style={{ fontWeight: 600, color: '#fff', margin: 0 }}>{item.product.name}</p>
                        <p style={{ color: '#8892a4', margin: '2px 0 0' }}>{item.variant?.color ? `Color: ${item.variant.color} · ` : ''}Qty: {item.qty}</p>
                      </div>
                      <span style={{ fontWeight: 700, color: '#4f8ef7', fontSize: '14px' }}>
                        {format(item.product.price * item.qty)}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setStep(2)} className="btn-ghost">← Back</button>
                  {paymentMethod === 'paystack' ? (
                    <button
                      onClick={handlePaystackCheckout}
                      disabled={processing}
                      style={{
                        flex: 1,
                        padding: '14px',
                        background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                        border: 'none',
                        borderRadius: '10px',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '15px',
                        cursor: processing ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 20px rgba(14,165,233,0.3)',
                      }}
                    >
                      <Zap size={18} fill="#fff" />
                      {processing ? 'Launching Paystack…' : `Pay with MoMo / Card (${paystackCurrency} ${paystackAmount.toFixed(2)})`}
                    </button>
                  ) : (
                    <button
                      onClick={handleManualOrder}
                      style={{
                        flex: 1,
                        padding: '14px',
                        background: '#22c55e',
                        border: 'none',
                        borderRadius: '10px',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '15px',
                        cursor: 'pointer',
                      }}
                    >
                      Confirm Order ({format(totalUSD)})
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Sidebar Summary */}
          <div>
            <div className="glass checkout-page__summary-card" style={{ borderRadius: '20px', padding: '24px', position: 'sticky', top: '100px' }}>
              <h3 style={{ fontWeight: 800, color: '#fff', fontSize: '16px', marginBottom: '16px' }}>Summary</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                  <span>Subtotal</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{format(cartTotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                  <span>Shipping</span>
                  <span style={{ color: shippingFee === 0 ? '#22c55e' : '#fff', fontWeight: 600 }}>
                    {shippingFee === 0 ? 'FREE' : format(shippingFee)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                  <span>Estimated Tax</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{format(tax)}</span>
                </div>
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800, color: '#fff' }}>
                  <span>Total</span>
                  <span style={{ color: '#4f8ef7' }}>{format(totalUSD)}</span>
                </div>
              </div>

              {/* Security Pill */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', fontSize: '11px', color: '#64748b' }}>
                <ShieldCheck size={16} color="#22c55e" />
                <span>256-bit Bank Grade SSL Security</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
