import { useState } from 'react';
import { Save, Store, Truck, CreditCard, Mail, Bell, Shield, Globe, ChevronRight } from 'lucide-react';

const TABS = [
  { id:'store',    label:'Store',    icon: Store },
  { id:'shipping', label:'Shipping', icon: Truck },
  { id:'payment',  label:'Payment',  icon: CreditCard },
  { id:'email',    label:'Email',    icon: Mail },
  { id:'notif',    label:'Notifications', icon: Bell },
];

export default function AdminSettings() {
  const [tab, setTab]     = useState('store');
  const [saved, setSaved] = useState(false);

  const [store, setStore] = useState({
    name:'Shoppercart Store', email:'admin@shoppercart.uhcacadamy.com', phone:'+1 (555) 000-1234',
    currency:'USD', language:'English', timezone:'UTC-5 (Eastern)',
    logo:'⚡', tagline:'Premium Tech Delivered', address:'123 Commerce St, New York, NY 10001',
  });

  const [shipping, setShipping] = useState({
    freeAbove:'75', flatRate:'4.99', expressFee:'14.99', intlFee:'24.99',
    processingDays:'1–2', carrier:'Auto (cheapest)', autoTracking:true,
    hideOriginCountry:true,
  });

  const [payment, setPayment] = useState({
    stripe:true, paypal:true, applePay:false, googlePay:false,
    stripeKey:'sk_live_*****', paypalEmail:'payments@shoppercart.uhcacadamy.com',
    taxRate:'8', autoInvoice:true,
  });

  const [email, setEmail] = useState({
    fromName:'Shoppercart', fromEmail:'hello@shoppercart.uhcacadamy.com',
    orderConfirm:true, shipNotify:true, deliveryConfirm:true,
    reviewRequest:true, abandonedCart:true,
    footerText:'Shoppercart Store · Premium Tech Delivered',
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const Toggle = ({ value, onChange }) => (
    <div onClick={onChange}
      style={{ width:40, height:22, borderRadius:11, cursor:'pointer', background: value ? '#2563eb':'#e2e8f0', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
      <div style={{ width:18, height:18, borderRadius:'50%', background:'#fff', position:'absolute', top:2, left: value ? 20:2, transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
    </div>
  );

  const Field = ({ label, hint, children }) => (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      <label style={{ fontSize:11, fontWeight:700, color:'#374151', letterSpacing:'0.04em' }}>{label}</label>
      {hint && <div style={{ fontSize:10, color:'#94a3b8', marginTop:-3, marginBottom:2 }}>{hint}</div>}
      {children}
    </div>
  );

  const Input = ({ value, onChange, placeholder, type='text', mono=false }) => (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      style={{ padding:'9px 12px', borderRadius:8, border:'1px solid #e2e8f0', fontSize:13, outline:'none', fontFamily: mono ? 'monospace':'inherit', color:'#0f172a' }} />
  );

  const inputStyle = { padding:'9px 12px', borderRadius:8, border:'1px solid #e2e8f0', fontSize:13, outline:'none', color:'#0f172a', background:'#fff' };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontWeight:800, fontSize:18, color:'#0f172a', margin:0 }}>Settings</h2>
          <p style={{ color:'#64748b', fontSize:12, margin:'2px 0 0' }}>Manage your store configuration</p>
        </div>
        <button onClick={handleSave}
          style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px', background: saved ? '#16a34a':'#2563eb', color:'#fff', border:'none', borderRadius:9, fontWeight:700, fontSize:13, cursor:'pointer', transition:'background 0.3s' }}>
          <Save size={14} /> {saved ? 'Saved ✓' : 'Save Changes'}
        </button>
      </div>

      <div style={{ display:'flex', gap:18, alignItems:'flex-start', flexWrap:'wrap' }}>
        {/* Sidebar tabs */}
        <div style={{ width:180, background:'#fff', borderRadius:14, border:'1px solid #e8edf3', padding:'8px', flexShrink:0 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:9, padding:'10px 12px', borderRadius:9, marginBottom:2,
                background: tab===t.id ? '#eff6ff':'transparent',
                color: tab===t.id ? '#2563eb':'#64748b',
                border:'none', cursor:'pointer', fontSize:13, fontWeight: tab===t.id ? 700:500, textAlign:'left' }}>
              <t.icon size={15} />
              {t.label}
              {tab===t.id && <ChevronRight size={12} style={{ marginLeft:'auto' }} />}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div style={{ flex:1, minWidth:300, background:'#fff', borderRadius:14, border:'1px solid #e8edf3', padding:'22px 24px' }}>

          {/* ── STORE ── */}
          {tab === 'store' && (
            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
              <div style={{ fontWeight:700, fontSize:14, color:'#0f172a', marginBottom:4 }}>Store Details</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <Field label="STORE NAME">
                  <input value={store.name} onChange={e=>setStore(s=>({...s,name:e.target.value}))} style={inputStyle} />
                </Field>
                <Field label="STORE EMAIL">
                  <input value={store.email} onChange={e=>setStore(s=>({...s,email:e.target.value}))} style={inputStyle} />
                </Field>
                <Field label="PHONE NUMBER">
                  <input value={store.phone} onChange={e=>setStore(s=>({...s,phone:e.target.value}))} style={inputStyle} />
                </Field>
                <Field label="CURRENCY">
                  <select value={store.currency} onChange={e=>setStore(s=>({...s,currency:e.target.value}))} style={inputStyle}>
                    {['USD','EUR','GBP','CAD','AUD','NGN'].map(c=><option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="LANGUAGE">
                  <select value={store.language} onChange={e=>setStore(s=>({...s,language:e.target.value}))} style={inputStyle}>
                    {['English','French','Spanish','German','Arabic'].map(l=><option key={l}>{l}</option>)}
                  </select>
                </Field>
                <Field label="TIMEZONE">
                  <select value={store.timezone} onChange={e=>setStore(s=>({...s,timezone:e.target.value}))} style={inputStyle}>
                    {['UTC-8 (Pacific)','UTC-7 (Mountain)','UTC-6 (Central)','UTC-5 (Eastern)','UTC+0 (London)','UTC+1 (Paris)'].map(t=><option key={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="TAGLINE" hint="Shown in the hero section">
                  <input value={store.tagline} onChange={e=>setStore(s=>({...s,tagline:e.target.value}))} style={{...inputStyle, gridColumn:'1/-1'}} />
                </Field>
                <div style={{ gridColumn:'1/-1' }}>
                  <Field label="BUSINESS ADDRESS">
                    <input value={store.address} onChange={e=>setStore(s=>({...s,address:e.target.value}))} style={inputStyle} />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {/* ── SHIPPING ── */}
          {tab === 'shipping' && (
            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
              <div style={{ fontWeight:700, fontSize:14, color:'#0f172a', marginBottom:4 }}>Shipping Settings</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <Field label="FREE SHIPPING ABOVE ($)" hint="Set 0 to disable">
                  <input type="number" value={shipping.freeAbove} onChange={e=>setShipping(s=>({...s,freeAbove:e.target.value}))} style={inputStyle} />
                </Field>
                <Field label="STANDARD FLAT RATE ($)">
                  <input type="number" value={shipping.flatRate} onChange={e=>setShipping(s=>({...s,flatRate:e.target.value}))} style={inputStyle} />
                </Field>
                <Field label="EXPRESS RATE ($)">
                  <input type="number" value={shipping.expressFee} onChange={e=>setShipping(s=>({...s,expressFee:e.target.value}))} style={inputStyle} />
                </Field>
                <Field label="INTERNATIONAL RATE ($)">
                  <input type="number" value={shipping.intlFee} onChange={e=>setShipping(s=>({...s,intlFee:e.target.value}))} style={inputStyle} />
                </Field>
                <Field label="PROCESSING TIME">
                  <input value={shipping.processingDays} onChange={e=>setShipping(s=>({...s,processingDays:e.target.value}))} style={inputStyle} />
                </Field>
                <Field label="PREFERRED CARRIER">
                  <select value={shipping.carrier} onChange={e=>setShipping(s=>({...s,carrier:e.target.value}))} style={inputStyle}>
                    {['Auto (cheapest)','DHL Express','FedEx','USPS','UPS'].map(c=><option key={c}>{c}</option>)}
                  </select>
                </Field>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10, paddingTop:8, borderTop:'1px solid #f1f5f9' }}>
                {[
                  { label:'Auto-add tracking to orders', key:'autoTracking' },
                  { label:'Hide supplier origin country', key:'hideOriginCountry' },
                ].map(item => (
                  <div key={item.key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:13, color:'#374151', fontWeight:500 }}>{item.label}</span>
                    <Toggle value={shipping[item.key]} onChange={() => setShipping(s=>({...s,[item.key]:!s[item.key]}))} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PAYMENT ── */}
          {tab === 'payment' && (
            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
              <div style={{ fontWeight:700, fontSize:14, color:'#0f172a', marginBottom:4 }}>Payment Gateways</div>
              {[
                { key:'stripe',    label:'Stripe',      icon:'💳', configKey:'stripeKey',    configLabel:'Stripe Secret Key', placeholder:'sk_live_...' },
                { key:'paypal',    label:'PayPal',      icon:'🅿️', configKey:'paypalEmail',  configLabel:'PayPal Email',       placeholder:'payments@...' },
              ].map(gw => (
                <div key={gw.key} style={{ border:'1px solid #e2e8f0', borderRadius:12, padding:'14px 16px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: payment[gw.key] ? 14:0 }}>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <span style={{ fontSize:20 }}>{gw.icon}</span>
                      <span style={{ fontWeight:700, fontSize:13, color:'#0f172a' }}>{gw.label}</span>
                    </div>
                    <Toggle value={payment[gw.key]} onChange={() => setPayment(s=>({...s,[gw.key]:!s[gw.key]}))} />
                  </div>
                  {payment[gw.key] && (
                    <Field label={gw.configLabel}>
                      <input defaultValue={payment[gw.configKey]} style={{...inputStyle, fontFamily:'monospace'}} placeholder={gw.placeholder} />
                    </Field>
                  )}
                </div>
              ))}

              <div style={{ display:'flex', gap:10 }}>
                {[{key:'applePay',label:'Apple Pay',icon:'🍎'},{key:'googlePay',label:'Google Pay',icon:'🇬'}].map(gw => (
                  <div key={gw.key} style={{ flex:1, border:'1px solid #e2e8f0', borderRadius:12, padding:'12px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ display:'flex', gap:7, alignItems:'center' }}>
                      <span style={{ fontSize:18 }}>{gw.icon}</span>
                      <span style={{ fontSize:12, fontWeight:600, color:'#374151' }}>{gw.label}</span>
                    </div>
                    <Toggle value={payment[gw.key]} onChange={() => setPayment(s=>({...s,[gw.key]:!s[gw.key]}))} />
                  </div>
                ))}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, paddingTop:8, borderTop:'1px solid #f1f5f9' }}>
                <Field label="TAX RATE (%)" hint="Applied at checkout">
                  <input type="number" value={payment.taxRate} onChange={e=>setPayment(s=>({...s,taxRate:e.target.value}))} style={inputStyle} />
                </Field>
                <div style={{ display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:13, color:'#374151', fontWeight:500 }}>Auto-generate invoices</span>
                    <Toggle value={payment.autoInvoice} onChange={() => setPayment(s=>({...s,autoInvoice:!s.autoInvoice}))} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── EMAIL ── */}
          {tab === 'email' && (
            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
              <div style={{ fontWeight:700, fontSize:14, color:'#0f172a', marginBottom:4 }}>Email Settings</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <Field label="FROM NAME">
                  <input value={email.fromName} onChange={e=>setEmail(s=>({...s,fromName:e.target.value}))} style={inputStyle} />
                </Field>
                <Field label="FROM EMAIL">
                  <input value={email.fromEmail} onChange={e=>setEmail(s=>({...s,fromEmail:e.target.value}))} style={inputStyle} />
                </Field>
              </div>

              <div style={{ paddingTop:8, borderTop:'1px solid #f1f5f9' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', marginBottom:12 }}>AUTOMATED EMAILS</div>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {[
                    { key:'orderConfirm',    label:'Order Confirmation',     desc:'Sent immediately after purchase' },
                    { key:'shipNotify',      label:'Shipping Notification',  desc:'Sent when order is shipped' },
                    { key:'deliveryConfirm', label:'Delivery Confirmation',  desc:'Sent when order is delivered' },
                    { key:'reviewRequest',   label:'Review Request',         desc:'Sent 3 days after delivery' },
                    { key:'abandonedCart',   label:'Abandoned Cart Recovery',desc:'Sent 1 hour after cart abandonment' },
                  ].map(item => (
                    <div key={item.key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px', borderRadius:9, background:'#f8fafc' }}>
                      <div>
                        <div style={{ fontSize:12, fontWeight:600, color:'#0f172a' }}>{item.label}</div>
                        <div style={{ fontSize:10, color:'#94a3b8', marginTop:1 }}>{item.desc}</div>
                      </div>
                      <Toggle value={email[item.key]} onChange={() => setEmail(s=>({...s,[item.key]:!s[item.key]}))} />
                    </div>
                  ))}
                </div>
              </div>

              <Field label="EMAIL FOOTER TEXT">
                <input value={email.footerText} onChange={e=>setEmail(s=>({...s,footerText:e.target.value}))} style={inputStyle} />
              </Field>
            </div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {tab === 'notif' && (
            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
              <div style={{ fontWeight:700, fontSize:14, color:'#0f172a', marginBottom:4 }}>Notification Preferences</div>
              {[
                { section:'ORDER ALERTS', items:[
                  { label:'New order placed',         desc:'Notify when a customer completes checkout' },
                  { label:'Order cancelled',          desc:'Notify when an order is cancelled' },
                  { label:'Refund requested',         desc:'Notify on refund/dispute requests' },
                ]},
                { section:'SUPPLIER ALERTS', items:[
                  { label:'Tracking updated',         desc:'When supplier updates tracking info' },
                  { label:'Out-of-stock warning',     desc:'When a product drops below 5 units' },
                  { label:'Supplier sync failure',    desc:'When API connection fails' },
                ]},
                { section:'BUSINESS ALERTS', items:[
                  { label:'Daily revenue summary',   desc:'Sent to your email every morning' },
                  { label:'Weekly analytics report', desc:'Every Monday at 9am' },
                ]},
              ].map(section => (
                <div key={section.section}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', marginBottom:10 }}>{section.section}</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {section.items.map((item, i) => (
                      <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px', borderRadius:9, background:'#f8fafc' }}>
                        <div>
                          <div style={{ fontSize:12, fontWeight:600, color:'#0f172a' }}>{item.label}</div>
                          <div style={{ fontSize:10, color:'#94a3b8', marginTop:1 }}>{item.desc}</div>
                        </div>
                        <Toggle value={true} onChange={() => {}} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
